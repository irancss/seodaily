"use server";
import { and, desc, eq, ne, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/modules/auth/session";
import { contentLinks, normalizeSearch, parseArticle } from "./content";
export type LinkSuggestion = { href: string; label: string; reason: string };
export async function suggestArticleLinks(id: number, raw: unknown): Promise<LinkSuggestion[]> {
  await requireAdmin(); const draft = parseArticle(raw);
  const linked = new Set(contentLinks(draft.content).map((l) => l.href));
  const token = normalizeSearch(draft.title).split(" ").find((s) => s.length >= 3) || "";
  const a = schema.articles, c = schema.blogCategories;
  const rows = await db.select({ id: a.id, data: a.published }).from(a).innerJoin(c, eq(a.categoryId, c.id)).where(and(eq(a.status, "published"), eq(c.enabled, true), eq(c.archived, false), ne(a.id, id), sql`coalesce((${a.published}->>'noindex')::boolean,false) = false`, or(eq(a.categoryId, draft.categoryId ?? -1), sql`(${a.published}->>'primaryServiceId')::int = ${draft.primaryServiceId}`, token ? sql`${a.searchText} like ${`%${token.replace(/[%_\\]/g, (v) => `\\${v}`)}%`}` : undefined))).orderBy(desc(a.publishedAt), desc(a.id)).limit(10);
  const results: LinkSuggestion[] = rows.filter((r) => r.data && !linked.has(`entity:article:${r.id}`)).map((r) => ({ href: `entity:article:${r.id}`, label: r.data!.title, reason: r.data!.categoryId === draft.categoryId ? "دسته اصلی مشترک" : r.data!.primaryServiceId === draft.primaryServiceId && draft.primaryServiceId ? "خدمت اصلی مشترک" : `واژه مشترک در عنوان/متن: ${token}` }));
  if (draft.primaryServiceId && !linked.has(`entity:service:${draft.primaryServiceId}`)) {
    const [s] = await db.select().from(schema.services).where(and(eq(schema.services.id, draft.primaryServiceId), eq(schema.services.published, true)));
    if (s) results.unshift({ href: `entity:service:${s.id}`, label: s.title, reason: "خدمت اصلی انتخاب‌شده توسط مدیر" });
  }
  return results;
}
