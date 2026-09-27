import "server-only";

import { count, desc, eq } from "drizzle-orm";

import { db, schema } from "@/db";

async function total(table: typeof schema.services | typeof schema.projects | typeof schema.leads) {
  const [{ value }] = await db.select({ value: count() }).from(table);
  return value;
}

/** Number of leads still in the "new" status (sidebar badge + dashboard). */
export async function countNewLeads() {
  const [{ value }] = await db
    .select({ value: count() })
    .from(schema.leads)
    .where(eq(schema.leads.status, "new"));
  return value;
}

export async function getDashboardData() {
  const [services, projects, leads, newLeads, latest] = await Promise.all([
    total(schema.services),
    total(schema.projects),
    total(schema.leads),
    countNewLeads(),
    db.select().from(schema.leads).orderBy(desc(schema.leads.createdAt)).limit(6),
  ]);
  return { counts: { services, projects, leads, newLeads }, latest };
}
