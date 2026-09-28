import "server-only";

import { and, desc, eq, gt } from "drizzle-orm";

import { db, schema } from "@/db";

/** A resubmitted form (double click, retry after a slow response, back + resend) within this window is the same request. */
const WINDOW_MS = 10 * 60 * 1000;

type LeadKey = { name: string; phone: string; service: string; description: string; total?: number };

/** True when the same request was already saved moments ago, so it is not stored twice. */
export async function isDuplicateLead(lead: LeadKey) {
  const [last] = await db
    .select({ estimate: schema.leads.estimate })
    .from(schema.leads)
    .where(
      and(
        eq(schema.leads.phone, lead.phone),
        eq(schema.leads.name, lead.name),
        eq(schema.leads.service, lead.service as typeof schema.leads.$inferSelect.service),
        eq(schema.leads.description, lead.description),
        gt(schema.leads.createdAt, new Date(Date.now() - WINDOW_MS)),
      ),
    )
    .orderBy(desc(schema.leads.createdAt))
    .limit(1);
  if (!last) return false;
  // Calculator requests only match when the quoted total is the same.
  return lead.total === undefined ? !last.estimate : last.estimate?.total === lead.total;
}
