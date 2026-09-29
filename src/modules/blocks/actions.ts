"use server";

import { asc, ilike, or } from "drizzle-orm";

import { db, schema } from "@/db";
import { requireAdmin } from "@/modules/auth/session";
import { saveImage, UploadError } from "@/modules/uploads/storage";

import { SITE_PAGES } from "./schema";

export type LinkTarget = { label: string; href: string; kind: string };

/** Uploads an image for the block editor; the browser sends the dimensions it measured. */
export async function uploadBlockImage(form: FormData): Promise<{ ok: true; src: string; width?: number; height?: number } | { ok: false; error: string }> {
  await requireAdmin();
  try {
    const src = await saveImage(form.get("file"));
    if (!src) return { ok: false, error: "فایلی انتخاب نشده است." };
    const dim = (key: string) => {
      const n = Number(form.get(key));
      return Number.isInteger(n) && n > 0 && n <= 10_000 ? n : undefined;
    };
    return { ok: true, src, width: dim("width"), height: dim("height") };
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
  const [plugins, categories] = await Promise.all([
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
  ]);
  return [
    ...pages,
    ...plugins.map((p) => ({ label: p.status === "published" ? p.name : `${p.name} (منتشرنشده)`, href: `entity:plugin:${p.id}`, kind: "افزونه" })),
    ...categories.map((c) => ({ label: c.title, href: `entity:plugin_category:${c.id}`, kind: "دسته افزونه" })),
  ];
}
