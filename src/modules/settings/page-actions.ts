"use server";

import { eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { failed, saved, str } from "@/lib/form-actions";
import { requireAdmin } from "@/modules/auth/session";
import { PAGE_KEYS, type PageKey, type PageText, writeSetting } from "@/modules/settings/queries";

const FIELDS: (keyof PageText)[] = ["badge", "title", "subtitle", "ctaTitle", "ctaText", "metaTitle", "metaDescription"];

export async function savePage(form: FormData) {
  await requireAdmin();
  const key = str(form, "page") as PageKey;
  if (!PAGE_KEYS.includes(key)) failed("/admin/pages", "صفحه نامعتبر است.");

  const row = await db.query.settings.findFirst({ where: eq(schema.settings.key, "pages") });
  const all = (row?.value ?? {}) as Partial<Record<PageKey, Partial<PageText>>>;
  all[key] = Object.fromEntries(FIELDS.map((f) => [f, str(form, f, 1000)]));
  await writeSetting("pages", all);
  saved(`/admin/pages?open=${key}#${key}`);
}
