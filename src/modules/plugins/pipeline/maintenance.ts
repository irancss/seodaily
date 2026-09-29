import { and, eq, lt, sql } from "drizzle-orm";

import { db, schema } from "@/db";

import type { PipelineConfig } from "./config";
import { pruneJobs } from "./jobs";
import { deletableObjects } from "./releases";
import { cleanTemp, removeObject } from "./storage";

// Idempotent housekeeping, run by the worker every hour: temp files past
// their TTL, bytes of rejected/retired/withdrawn releases once no grant or
// transfer can still need them (shared SHA-256 files stay), old
// observations, finished jobs and expired OTP/grant rows. Release rows and
// the download ledger are kept for history.

export async function runMaintenance(cfg: PipelineConfig, log: (line: string) => void) {
  const temp = await cleanTemp(cfg.filesDir, cfg.tmpTtlMs);
  if (temp) log(`${temp} فایل موقت منقضی حذف شد.`);

  const due = await deletableObjects();
  for (const r of due) {
    if (!r.shared) await removeObject(cfg.filesDir, r.key);
    await db.update(schema.pluginReleases).set({ fileDeletedAt: new Date() }).where(eq(schema.pluginReleases.id, r.id));
  }
  if (due.length) log(`فایل ${due.length} نسخه خارج از دسترس پاک شد.`);

  // Keep the last 50 observations per source.
  await db.execute(sql`
    delete from plugin_source_observations o using (
      select id, row_number() over (partition by source_id order by observed_at desc, id desc) as rn from plugin_source_observations
    ) r where o.id = r.id and r.rn > 50`);
  await pruneJobs(30);
  // OTP challenges are useless after expiry; a day keeps them for abuse counters.
  await db.delete(schema.otpChallenges).where(lt(schema.otpChallenges.expiresAt, new Date(Date.now() - 86400_000)));
  await db.delete(schema.downloadSessions).where(lt(schema.downloadSessions.expiresAt, new Date(Date.now() - 7 * 86400_000)));
  // Grants never used are noise after a day; used ones stay (they are the logical downloads).
  await db.delete(schema.downloadGrants).where(and(lt(schema.downloadGrants.expiresAt, new Date(Date.now() - 86400_000)), sql`${schema.downloadGrants.startedAt} is null`));
  await db.delete(schema.workerHeartbeats).where(lt(schema.workerHeartbeats.seenAt, new Date(Date.now() - 7 * 86400_000)));
}
