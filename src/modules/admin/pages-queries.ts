import "server-only";

import { eq } from "drizzle-orm";

import { db, schema } from "@/db";
import type { PageKey, PageText } from "@/modules/settings/types";

/** The raw stored page texts (uncached, without defaults merged in). */
export async function getStoredPageTexts() {
  const row = await db.query.settings.findFirst({ where: eq(schema.settings.key, "pages") });
  return (row?.value ?? {}) as Partial<Record<PageKey, Partial<PageText>>>;
}
