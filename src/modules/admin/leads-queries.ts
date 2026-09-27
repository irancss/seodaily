import "server-only";

import { count, desc, eq } from "drizzle-orm";

import { db, schema } from "@/db";
import type { LeadStatus } from "@/db/schema";

const PAGE_SIZE = 30;

/** One page of leads (newest first), optionally filtered by status. */
export async function listLeads(status: LeadStatus | undefined, page: number) {
  const where = status ? eq(schema.leads.status, status) : undefined;
  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select()
      .from(schema.leads)
      .where(where)
      .orderBy(desc(schema.leads.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ value: count() }).from(schema.leads).where(where),
  ]);
  return { rows, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getLead(id: number) {
  return db.query.leads.findFirst({ where: eq(schema.leads.id, id) });
}
