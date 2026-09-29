// Plugin worker: a separate long-running process (compose service "worker",
// same image, `entrypoint.sh worker`). It never runs inside an HTTP request
// and is not a per-replica timer of the web app. Several workers may run:
// the queue (SKIP LOCKED + leases + fencing) and the per-day schedule row
// keep every job and nightly run single.
import { randomBytes } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { hostname } from "node:os";

import { sql } from "drizzle-orm";

import { db, schema } from "@/db";
import { checkPlugin } from "@/modules/plugins/pipeline/check";
import { pipelineConfig } from "@/modules/plugins/pipeline/config";
import { appendLog, cancelledJob, claimJob, enqueueMaintenance, failJob, finishJob, heartbeat, recoverExpired, type Job } from "@/modules/plugins/pipeline/jobs";
import { runMaintenance } from "@/modules/plugins/pipeline/maintenance";
import { sandboxRunner } from "@/modules/plugins/pipeline/sandbox";
import { scanFile, scannerHealth } from "@/modules/plugins/pipeline/scan";
import { runScheduleTick } from "@/modules/plugins/pipeline/schedule";
import { freeBytes } from "@/modules/plugins/pipeline/storage";

const cfg = pipelineConfig();
const workerId = `${hostname()}-${process.pid}-${randomBytes(3).toString("hex")}`;
const version = process.env.APP_VERSION ?? "dev";
const sandbox = sandboxRunner(cfg.sandboxUrl);
const running = new Set<Promise<void>>();
let stopping = false;

const say = (msg: string) => console.log(`[worker ${new Date().toISOString()}] ${msg}`);

async function invalidate() {
  if (!cfg.appInternalUrl || !cfg.internalSecret) return;
  try {
    await fetch(new URL("/api/internal/revalidate", cfg.appInternalUrl), {
      method: "POST",
      headers: { "x-internal-secret": cfg.internalSecret },
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    say(`cache invalidation failed (pages refresh within the hour): ${(error as Error).message}`);
  }
}

async function beat() {
  const [scanner, free] = await Promise.all([scannerHealth(cfg.clamdHost, cfg.clamdPort, cfg.clamMaxSignatureAgeH), freeBytes(cfg.filesDir).catch(() => -1)]);
  const health = { scanner, sandbox: { available: sandbox.available }, freeBytes: free, minFreeBytes: cfg.minFreeBytes, autoUpdate: cfg.autoUpdate, concurrency: cfg.workerConcurrency };
  await db
    .insert(schema.workerHeartbeats)
    .values({ workerId, version, health })
    .onConflictDoUpdate({ target: schema.workerHeartbeats.workerId, set: { seenAt: new Date(), health, version } });
}

async function runJob(job: Job) {
  const lines: string[] = [];
  const log = (line: string) => lines.push(line);
  const flush = async () => {
    const batch = lines.splice(0);
    await appendLog(job, batch);
  };
  const timer = setInterval(() => {
    void heartbeat(job, workerId).then(flush).catch(() => {});
  }, 30_000);
  try {
    if (job.kind === "cleanup") {
      await runMaintenance(cfg, log);
      await flush();
      await finishJob(job, { ok: true });
      return;
    }
    if (!job.pluginId) throw new Error("job without plugin");
    const outcome = await checkPlugin(job.pluginId, {
      cfg,
      scan: (file, sha) => scanFile(file, sha, { host: cfg.clamdHost, port: cfg.clamdPort, timeoutMs: cfg.clamdTimeoutMs, maxAgeH: cfg.clamMaxSignatureAgeH }),
      sandbox,
      log,
      stillOwned: () => (stopping ? Promise.resolve(false) : heartbeat(job, workerId)),
      invalidate,
    });
    await flush();
    if (outcome.status === "cancelled") {
      await cancelledJob(job);
      return;
    }
    await finishJob(job, outcome as unknown as Record<string, unknown>);
    say(`job ${job.id} plugin ${job.pluginId}: ${outcome.status}`);
  } catch (error) {
    log(`خطا: ${(error as Error).message}`);
    await flush().catch(() => {});
    await failJob(job, (error as Error).message);
    say(`job ${job.id} failed: ${(error as Error).message}`);
  } finally {
    clearInterval(timer);
  }
}

async function loop() {
  let lastBeat = 0;
  let lastSchedule = 0;
  let lastMaintenance = 0;
  while (!stopping) {
    const now = Date.now();
    try {
      if (now - lastBeat > 30_000) {
        await beat();
        await recoverExpired();
        lastBeat = now;
      }
      if (now - lastSchedule > 60_000) {
        const slot = await runScheduleTick(new Date());
        if (slot) say(`nightly run ${slot} queued`);
        lastSchedule = now;
      }
      if (now - lastMaintenance > 3600_000) {
        await enqueueMaintenance(`cleanup:${new Date().toISOString().slice(0, 13)}`);
        lastMaintenance = now;
      }
      while (running.size < cfg.workerConcurrency && !stopping) {
        const job = await claimJob(workerId);
        if (!job) break;
        const p = runJob(job).finally(() => running.delete(p));
        running.add(p);
      }
    } catch (error) {
      say(`loop error: ${(error as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
}

async function main() {
  await mkdir(cfg.tmpDir, { recursive: true, mode: 0o700 });
  await mkdir(cfg.objectsDir, { recursive: true, mode: 0o700 });
  // Wait for the web app's migrations (it migrates on start).
  for (let i = 0; ; i++) {
    try {
      await db.execute(sql`select 1 from plugin_jobs limit 1`);
      break;
    } catch (error) {
      if (i > 60) throw error;
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
  say(`started ${workerId} (version ${version}, concurrency ${cfg.workerConcurrency}, scanner ${cfg.clamdHost ? "configured" : "not configured"}, sandbox ${sandbox.available ? "available" : "unavailable"})`);
  const shutdown = async (signal: string) => {
    if (stopping) return;
    stopping = true;
    say(`${signal}: finishing ${running.size} job(s)`);
    // Unfinished jobs keep their lease and are retried after it expires.
    await Promise.race([Promise.allSettled([...running]), new Promise((r) => setTimeout(r, 25_000))]);
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
  await loop();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
