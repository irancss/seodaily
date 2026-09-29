"use server";
import { and, eq, sql } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { CONTENT_TAG } from "@/lib/cache";
import { requireAdmin } from "@/modules/auth/session";
import { claimSlug } from "@/modules/slugs/registry";
import { isSafeImageSrc } from "@/modules/blocks/schema";
import { canonicalInput, cleanText, tehranSchedule } from "./content";
import { createArticle, mutateArticle } from "./publication";
import { emptyCategory, type BlogOptions } from "./types";

export async function newArticle() { const user = await requireAdmin(); const row = await createArticle(user.id); redirect(`/admin/blog/${row.id}`); }
export async function saveArticleAction(id: number, version: number, operation: string, draft: unknown, schedule = "") {
  const user = await requireAdmin();
  try {
    const row = await mutateArticle(id, version, operation, draft, user.id, operation === "schedule" ? tehranSchedule(schedule) : undefined);
    if (operation !== "save") updateTag(CONTENT_TAG);
    return { ok: true as const, version: row.version, status: row.status, scheduledFor: row.scheduledFor?.toISOString() ?? null };
  } catch (error) { return { ok: false as const, error: (error as Error).message }; }
}
export async function saveBlogCategory(form: FormData) {
  await requireAdmin();
  try {
    const id = Number(form.get("id")), version = Number(form.get("version"));
    const data = emptyCategory();
    for (const key of ["h1", "description", "imageAlt", "seoTitle", "seoDescription", "ogTitle", "ogDescription"] as const) data[key] = cleanText(form.get(key), key === "description" ? 4000 : 500);
    data.canonicalUrl = canonicalInput(form.get("canonicalUrl")); data.noindex = form.get("noindex") === "on";
    for (const key of ["image", "ogImage"] as const) { data[key] = String(form.get(key) ?? ""); if (data[key] && !isSafeImageSrc(data[key])) throw new Error("تصویر معتبر نیست."); }
    const title = cleanText(form.get("title")); if (!title) throw new Error("نام دسته الزامی است.");
    await db.transaction(async (tx) => {
      const t = schema.blogCategories;
      const [old] = id ? await tx.select().from(t).where(eq(t.id, id)).for("update") : [];
      if (id && (!old || old.version !== version)) throw new Error("دسته در تب دیگری تغییر کرده؛ صفحه را تازه کنید.");
      const archived = form.get("operation") === "archive";
      if (archived || form.get("enabled") !== "on") {
        const used = await tx.select({ id: schema.articles.id }).from(schema.articles).where(sql`${schema.articles.draft}->>'categoryId' = ${String(id)} or ${schema.articles.categoryId} = ${id}`).limit(1);
        if (used.length) throw new Error("این دسته در مقاله‌ها استفاده شده؛ ابتدا دسته آن مقاله‌ها و نسخه منتشرشده را تغییر دهید.");
      }
      const [row] = old ? [old] : await tx.insert(t).values({ title, slug: `pending-${crypto.randomUUID()}`, data }).returning();
      const slug = await claimSlug(tx, "blog", String(form.get("slug") ?? ""), "blog_category", row.id, !!old);
      await tx.update(t).set({ title, slug, data, archived, enabled: form.get("enabled") === "on", sortOrder: Math.max(0, Math.min(10000, Number(form.get("sortOrder")) || 0)), version: row.version + 1, updatedAt: new Date() }).where(eq(t.id, row.id));
    });
    updateTag(CONTENT_TAG);
  } catch (error) { return { ok: false as const, error: (error as Error).message }; }
  return { ok: true as const };
}
export async function saveBlogOptions(form: FormData) {
  await requireAdmin();
  const range = (key: string, min: number, max: number) => Math.max(min, Math.min(max, Number(form.get(key)) || min));
  const featuredId = Number(form.get("featuredId")) || null;
  if (featuredId) { const [row] = await db.select().from(schema.articles).where(and(eq(schema.articles.id, featuredId), eq(schema.articles.status, "published"))); if (!row) return { ok: false as const, error: "مقاله ویژه باید منتشرشده باشد." }; }
  const value: BlogOptions = { pageSize: range("pageSize", 4, 48), autoplayMs: range("autoplayMs", 3000, 20000), wordsPerMinute: range("wordsPerMinute", 50, 500), relatedCount: range("relatedCount", 1, 8), featuredId };
  await db.insert(schema.settings).values({ key: "blog", value }).onConflictDoUpdate({ target: schema.settings.key, set: { value, updatedAt: new Date() } });
  updateTag(CONTENT_TAG); return { ok: true as const };
}
