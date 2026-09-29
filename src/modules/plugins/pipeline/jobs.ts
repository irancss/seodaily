import { and, eq, inArray, lt, sql } from "drizzle-orm";

import { db, schema } from "@/db";

// A small durable queue on PostgreSQL. Jobs are claimed with SKIP LOCKED and
// held by a lease the worker renews; every claim bumps a fencing number, so a
// worker that lost its lease (crash, pause) can no longer write results.
// One queued/running check per plugin (partial unique index): a manual click
// during the nightly run joins the running job instead of adding one.

const { pluginJobs } = schema;
export type Job = typeof pluginJobs.$inferSelect;

export const LEASE_MS = 120_000;

export async function enqueueCheck(pluginId: number, requestedBy: "schedule" | "admin" | "system", key: string, runAfter = new Date()) {
  const [row] = await db
    .insert(pluginJobs)
    .values({ kind: "check_plugin", pluginId, idempotencyKey: key, requestedBy, runAfter })
    .onConflictDoNothing()
    .returning({ id: pluginJobs.id });
  if (row) return { id: row.id, created: true };
  const [active] = await db
    .select({ id: pluginJobs.id })
    .from(pluginJobs)
    .where(and(eq(pluginJobs.pluginId, pluginId), eq(pluginJobs.kind, "check_plugin"), inArray(pluginJobs.state, ["queued", "running"])))
    .limit(1);
  const [same] = active ? [active] : await db.select({ id: pluginJobs.id }).from(pluginJobs).where(eq(pluginJobs.idempotencyKey, key)).limit(1);
  return { id: same?.id ?? null, created: false };
}

export async function enqueueMaintenance(key: string) {
  await db.insert(pluginJobs).values({ kind: "cleanup", idempotencyKey: key, requestedBy: "system" }).onConflictDoNothing();
}

/** Expired leases go back to the queue (or fail after the last attempt). */
export async function recoverExpired() {
  await db.execute(sql`
    update plugin_jobs set
      state = case when attempts >= max_attempts then 'failed' else 'queued' end,
      error = case when attempts >= max_attempts then 'اجرای کار قطع شد و تلاش‌ها تمام شد.' else error end,
      finished_at = case when attempts >= max_attempts then now() else null end,
      lease_owner = '', lease_until = null
    where state = 'running' and lease_until < now()`);
}

export async function claimJob(workerId: string): Promise<Job | null> {
  const rows = await db.execute<Record<string, unknown>>(sql`
    update plugin_jobs set
      state = 'running', lease_owner = ${workerId}, lease_until = now() + ${`${LEASE_MS} milliseconds`}::interval,
      fencing = fencing + 1, attempts = attempts + 1, started_at = coalesce(started_at, now())
    where id = (
      select id from plugin_jobs
      where state = 'queued' and run_after <= now() and not cancel_requested
      order by case requested_by when 'admin' then 0 else 1 end, run_after, id
      for update skip locked limit 1)
    returning id`);
  const id = rows[0]?.id;
  if (!id) return null;
  const [job] = await db.select().from(pluginJobs).where(eq(pluginJobs.id, Number(id))).limit(1);
  return job ?? null;
}

/** Renews the lease; false when the job was taken over or cancellation was requested. */
export async function heartbeat(job: Job, workerId: string): Promise<boolean> {
  const rows = await db
    .update(pluginJobs)
    .set({ leaseUntil: sql`now() + ${`${LEASE_MS} milliseconds`}::interval` })
    .where(and(eq(pluginJobs.id, job.id), eq(pluginJobs.fencing, job.fencing), eq(pluginJobs.leaseOwner, workerId), eq(pluginJobs.state, "running")))
    .returning({ cancel: pluginJobs.cancelRequested });
  return rows.length === 1 && !rows[0].cancel;
}

/** Strips query strings and obvious secrets from log lines. */
export function redact(line: string) {
  return line
    .replace(/(https?:\/\/[^\s?#]+)\?[^\s]*/g, "$1?…")
    .replace(/((?:token|key|secret|password|signature|sig|auth)[=:]\s*)[^\s&]+/gi, "$1***")
    .slice(0, 500);
}

export async function appendLog(job: Job, lines: string[]) {
  if (!lines.length) return;
  // Only the lease holder writes (fencing); the log keeps the last 200 lines.
  const [row] = await db.select({ log: pluginJobs.log }).from(pluginJobs).where(eq(pluginJobs.id, job.id)).limit(1);
  if (!row) return;
  const log = [...row.log, ...lines.map(redact)].slice(-200);
  await db.update(pluginJobs).set({ log }).where(and(eq(pluginJobs.id, job.id), eq(pluginJobs.fencing, job.fencing)));
}

export async function finishJob(job: Job, result: Record<string, unknown>) {
  const rows = await db
    .update(pluginJobs)
    .set({ state: "done", result, finishedAt: new Date(), leaseOwner: "", leaseUntil: null })
    .where(and(eq(pluginJobs.id, job.id), eq(pluginJobs.fencing, job.fencing), eq(pluginJobs.state, "running")))
    .returning({ id: pluginJobs.id });
  return rows.length === 1;
}

export async function cancelledJob(job: Job) {
  await db
    .update(pluginJobs)
    .set({ state: "cancelled", finishedAt: new Date(), leaseOwner: "", leaseUntil: null })
    .where(and(eq(pluginJobs.id, job.id), eq(pluginJobs.fencing, job.fencing)));
}

/** Retries with exponential backoff (2, 4, 8 … minutes) until max_attempts, then fails. */
export async function failJob(job: Job, error: string, retryAfterMs = 0) {
  const last = job.attempts >= job.maxAttempts;
  const delay = Math.max(retryAfterMs, 2 ** job.attempts * 60_000);
  await db
    .update(pluginJobs)
    .set(
      last
        ? { state: "failed", error: redact(error), finishedAt: new Date(), leaseOwner: "", leaseUntil: null }
        : { state: "queued", error: redact(error), runAfter: new Date(Date.now() + delay), leaseOwner: "", leaseUntil: null },
    )
    .where(and(eq(pluginJobs.id, job.id), eq(pluginJobs.fencing, job.fencing)));
}

/** Admin cancel: a queued job stops at once; a running one stops at its next checkpoint, before any publish. */
export async function requestCancel(jobId: number) {
  const [row] = await db
    .update(pluginJobs)
    .set({ cancelRequested: true })
    .where(and(eq(pluginJobs.id, jobId), inArray(pluginJobs.state, ["queued", "running"])))
    .returning({ state: pluginJobs.state });
  if (row?.state === "queued") {
    await db.update(pluginJobs).set({ state: "cancelled", finishedAt: new Date() }).where(and(eq(pluginJobs.id, jobId), eq(pluginJobs.state, "queued")));
  }
  return Boolean(row);
}

/** Old finished jobs are removed; the monitor needs recent history only. */
export async function pruneJobs(days = 30) {
  await db.delete(pluginJobs).where(and(inArray(pluginJobs.state, ["done", "failed", "cancelled"]), lt(pluginJobs.finishedAt, new Date(Date.now() - days * 86400_000))));
}
