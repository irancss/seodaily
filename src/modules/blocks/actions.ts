"use server";

import { and, asc, eq, ilike, or, sql } from "drizzle-orm";

import { db, schema } from "@/db";
import { requireAdmin } from "@/modules/auth/session";
import { deleteImage, saveImage, UploadError } from "@/modules/uploads/storage";
import { storedImageSize } from "@/modules/uploads/metadata";

import { SITE_PAGES } from "./schema";

export type LinkTarget = { label: string; href: string; kind: string };

/** Uploads an image; dimensions are verified from the stored bytes on the server. */
export async function uploadBlockImage(form: FormData): Promise<{ ok: true; src: string; width?: number; height?: number } | { ok: false; error: string }> {
  await requireAdmin();
  try {
    const src = await saveImage(form.get("file"));
    if (!src) return { ok: false, error: "فایلی انتخاب نشده است." };
    try { return { ok: true, src, ...await storedImageSize(src) }; }
    catch (error) { await deleteImage(src); throw error; }
  } catch (error) {
    if (error instanceof UploadError) return { ok: false, error: error.message };
    throw error;
  }
}

/** Internal link targets for the editor's link picker: fixed site pages, plugins and categories. */
export async function searchLinkTargets(query: string): Promise<LinkTarget[]> {
  await requireAdmin();
  const q = String(query ?? "").trim().slice(0, 80);
  const like = `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
  const pages = Object.entries(SITE_PAGES)
    .filter(([, p]) => !q || p.label.includes(q) || p.href.includes(q))
    .map(([key, p]) => ({ label: p.label, href: `entity:page:${key}`, kind: "صفحه سایت" }));
  const [plugins, categories, articles, services] = await Promise.all([
    db
      .select({ id: schema.plugins.id, name: schema.plugins.name, status: schema.plugins.status })
      .from(schema.plugins)
      .where(q ? or(ilike(schema.plugins.name, like), ilike(schema.plugins.slug, like), ilike(schema.plugins.originalName, like)) : undefined)
      .orderBy(asc(schema.plugins.name))
      .limit(10),
    db
      .select({ id: schema.pluginCategories.id, title: schema.pluginCategories.title })
      .from(schema.pluginCategories)
      .where(q ? or(ilike(schema.pluginCategories.title, like), ilike(schema.pluginCategories.slug, like)) : undefined)
      .orderBy(asc(schema.pluginCategories.title))
      .limit(10),
    db.select({ id: schema.articles.id, title: sql<string>`${schema.articles.published}->>'title'` }).from(schema.articles).where(and(eq(schema.articles.status, "published"), sql`${schema.articles.published}->>'title' ilike ${like}`)).limit(10),
    db.select({ id: schema.services.id, title: schema.services.title }).from(schema.services).where(and(eq(schema.services.published, true), ilike(schema.services.title, like))).limit(10),
  ]);
  return [
    ...pages,
    ...articles.map((a) => ({ label: a.title, href: `entity:article:${a.id}`, kind: "مقاله" })),
    ...services.map((s) => ({ label: s.title, href: `entity:service:${s.id}`, kind: "خدمت" })),
    ...plugins.map((p) => ({ label: p.status === "published" ? p.name : `${p.name} (منتشرنشده)`, href: `entity:plugin:${p.id}`, kind: "افزونه" })),
    ...categories.map((c) => ({ label: c.title, href: `entity:plugin_category:${c.id}`, kind: "دسته افزونه" })),
  ];
}
