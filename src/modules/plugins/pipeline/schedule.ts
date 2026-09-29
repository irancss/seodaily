import { and, eq, ne, sql } from "drizzle-orm";

import { db, schema } from "@/db";

import { enqueueCheck } from "./jobs";
import { latestSlot } from "./schedule-time";

export { latestSlot, nextSlot, slotInstant, SCHEDULE_HOUR, SCHEDULE_ZONE } from "./schedule-time";

/**
 * Queues the nightly checks once per slot. Returns the slot date when this
 * call created the run, null when it already existed.
 */
export async function runScheduleTick(now = new Date()): Promise<string | null> {
  const slot = latestSlot(now);
  const [created] = await db.insert(schema.pluginScheduleRuns).values({ runDate: slot }).onConflictDoNothing().returning({ d: schema.pluginScheduleRuns.runDate });
  if (!created) return null;
  const targets = await db
    .selectDistinct({ id: schema.plugins.id })
    .from(schema.plugins)
    .innerJoin(schema.pluginSources, and(eq(schema.pluginSources.pluginId, schema.plugins.id), eq(schema.pluginSources.enabled, true)))
    .where(ne(schema.plugins.status, "archived"));
  let queued = 0;
  for (const t of targets) {
    const r = await enqueueCheck(t.id, "schedule", `nightly:${slot}:${t.id}`);
    if (r.created) queued++;
  }
  await db.update(schema.pluginScheduleRuns).set({ pluginsQueued: queued }).where(eq(schema.pluginScheduleRuns.runDate, slot));
  return slot;
}

export async function lastScheduleRun() {
  const [row] = await db.select().from(schema.pluginScheduleRuns).orderBy(sql`${schema.pluginScheduleRuns.runDate} desc`).limit(1);
  return row ?? null;
}
