import "server-only";

import { asc, eq } from "drizzle-orm";

import { db, schema } from "@/db";
import type { FaqPage } from "@/db/schema";

export async function listFaqs(page: FaqPage) {
  return db.select().from(schema.faqs).where(eq(schema.faqs.page, page)).orderBy(asc(schema.faqs.sortOrder), asc(schema.faqs.id));
}
