import "server-only";

import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

import { cached } from "@/lib/cache";

import { DEFAULT_CONTACT, DEFAULT_GENERAL, DEFAULT_PAGES } from "./defaults";
import { PAGE_KEYS, type PageKey, type PageText } from "./types";

async function readSetting<T extends object>(key: string, defaults: T): Promise<T> {
  // No try/catch: a failed read must not be cached as "defaults".
  const row = await db.query.settings.findFirst({ where: eq(schema.settings.key, key) });
  if (!row) return defaults;
  const merged = { ...defaults } as Record<string, unknown>;
  for (const [field, value] of Object.entries(row.value as Record<string, unknown>)) {
    // A text field emptied in the admin falls back to the default, as page texts do.
    if (typeof value === "string" && !value.trim() && typeof merged[field] === "string") continue;
    merged[field] = value;
  }
  return merged as T;
}

export async function writeSetting(key: string, value: unknown) {
  await db
    .insert(schema.settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value, updatedAt: new Date() } });
}

export const getGeneral = cached(() => readSetting("general", DEFAULT_GENERAL), "settings:general");
export const getContact = cached(() => readSetting("contact", DEFAULT_CONTACT), "settings:contact");

export const getPageTexts = cached(async () => {
  const stored = await readSetting<Partial<Record<PageKey, Partial<PageText>>>>("pages", {});
  const result = {} as Record<PageKey, PageText>;
  for (const key of PAGE_KEYS) {
    const merged = { ...DEFAULT_PAGES[key] };
    for (const [field, value] of Object.entries(stored[key] ?? {})) {
      // An emptied field in the admin falls back to the design's text.
      if (typeof value === "string" && value.trim()) merged[field as keyof PageText] = value;
    }
    result[key] = merged;
  }
  return result;
}, "settings:pages");

export async function getPageText(key: PageKey) {
  return (await getPageTexts())[key];
}
