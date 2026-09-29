import "server-only";

import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";

import { db, schema } from "@/db";

import { lastScheduleRun, nextSlot } from "./pipeline/schedule";

// Admin reads for sources, releases, jobs and the Update Monitor. Never
// cached: this is live operational state.

const { pluginSources, pluginReleases, pluginJobs, workerHeartbeats, plugins, pluginSourceObservations } = schema;

export async function sourcesFor(pluginId: number) {
  return db.select().from(pluginSources).where(eq(pluginSources.pluginId, pluginId)).orderBy(pluginSources.priority, pluginSources.id);
}

export async function recentObservations(sourceIds: number[]) {
  if (!sourceIds.length) return [];
  return db
    .select()
    .from(pluginSourceObservations)
    .where(inArray(pluginSourceObservations.sourceId, sourceIds))
    .orderBy(desc(pluginSourceObservations.observedAt))
    .limit(30);
}

export async function releasesFor(pluginId: number) {
  return db.select().from(pluginReleases).where(eq(pluginReleases.pluginId, pluginId)).orderBy(desc(pluginReleases.id)).limit(50);
}

export async function jobsFor(pluginId: number, limit = 10) {
  return db.select().from(pluginJobs).where(eq(pluginJobs.pluginId, pluginId)).orderBy(desc(pluginJobs.id)).limit(limit);
}

export type Health = {
  scanner?: { available: boolean; engine: string; signatures: string; ageHours: number | null; error: string };
  sandbox?: { available: boolean; detail?: string; profile?: string };
  freeBytes?: number;
  minFreeBytes?: number;
  autoUpdate?: boolean;
};

export async function monitorData() {
  const now = new Date();
  const [workers, run, queue, failed24, review, pluginRows] = await Promise.all([
    db.select().from(workerHeartbeats).orderBy(desc(workerHeartbeats.seenAt)).limit(5),
    lastScheduleRun(),
    db
      .select({ state: pluginJobs.state, n: sql<number>`count(*)::int` })
      .from(pluginJobs)
      .where(inArray(pluginJobs.state, ["queued", "running"]))
      .groupBy(pluginJobs.state),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(pluginJobs)
      .where(and(eq(pluginJobs.state, "failed"), gt(pluginJobs.finishedAt, new Date(now.getTime() - 86400_000)))),
    db
      .select({ id: pluginReleases.id, pluginId: pluginReleases.pluginId, version: pluginReleases.sourceVersion, name: plugins.name, createdAt: pluginReleases.createdAt })
      .from(pluginReleases)
      .innerJoin(plugins, eq(plugins.id, pluginReleases.pluginId))
      .where(inArray(pluginReleases.state, ["candidate", "review"]))
      .orderBy(desc(pluginReleases.id))
      .limit(50),
    db.execute<{
      id: number;
      name: string;
      status: string;
      last_checked_at: string | null;
      sources: number;
      failing: number;
      max_failures: number;
      job_state: string | null;
      job_result: string | null;
      job_error: string | null;
      job_finished: string | null;
    }>(sql`
      select p.id, p.name, p.status, p.last_checked_at,
        (select count(*)::int from plugin_sources s where s.plugin_id = p.id and s.enabled) as sources,
        (select count(*)::int from plugin_sources s where s.plugin_id = p.id and s.enabled and s.last_status in ('error', 'manual_setup_required')) as failing,
        (select coalesce(max(consecutive_failures), 0)::int from plugin_sources s where s.plugin_id = p.id and s.enabled) as max_failures,
        j.state as job_state, j.result->>'status' as job_result, j.error as job_error, j.finished_at as job_finished
      from plugins p
      left join lateral (select * from plugin_jobs j where j.plugin_id = p.id and j.kind = 'check_plugin' order by j.id desc limit 1) j on true
      where p.status <> 'archived'
      order by p.name`),
  ]);
  const alive = workers.find((w) => now.getTime() >= w.seenAt.getTime() && now.getTime() - w.seenAt.getTime() < 120_000);
  return {
    now,
    workers,
    alive: Boolean(alive),
    health: alive?.health as Health | undefined,
    lastRun: run,
    nextRun: nextSlot(now),
    queued: queue.find((q) => q.state === "queued")?.n ?? 0,
    running: queue.find((q) => q.state === "running")?.n ?? 0,
    failed24: failed24[0]?.n ?? 0,
    review,
    plugins: [...pluginRows],
  };
}
