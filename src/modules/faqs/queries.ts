import "server-only";

import { asc, eq } from "drizzle-orm";
import { cached } from "@/lib/cache";

import { db, schema } from "@/db";
import type { FaqPage } from "@/db/schema";

const { faqs } = schema;

export const getFaqs = cached(
  (page: FaqPage) =>
    db.select().from(faqs).where(eq(faqs.page, page)).orderBy(asc(faqs.sortOrder), asc(faqs.id)),
  "data:faqs",
);
