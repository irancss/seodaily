"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import type { GalleryImage } from "@/db/plugins-schema";
import { CONTENT_TAG } from "@/lib/cache";
import { bool, failed, int, saved, str } from "@/lib/form-actions";
import { requireAdmin } from "@/modules/auth/session";
import { isSafeImageSrc } from "@/modules/blocks/schema";
import { SlugError } from "@/modules/slugs/registry";

import {
  CatalogError,
  createPlugin,
  deleteCategory,
  deleteGlobalBlock,
  deletePlugin,
  publishPlugin,
  saveCategory,
  saveGlobalBlock,
  setBaseDownloadCount,
  setPluginStatus,
  updatePlugin,
} from "./catalog";
import { META_FIELDS, type MetaField } from "./labels";

export type FormState = { status: "idle" | "ok" | "error"; message?: string; revision?: number; problems?: string[]; at?: number };

function ids(form: FormData, key: string): number[] {
  return form
    .getAll(key)
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);
}

function json(form: FormData, key: string, max = 1_000_000): unknown {
  try {
    return JSON.parse(String(form.get(key) ?? "").slice(0, max));
  } catch {
    return null;
  }
}

function image(form: FormData, key: string) {
  const v = str(form, key, 200);
  return isSafeImageSrc(v) ? v : "";
}

function gallery(form: FormData): GalleryImage[] {
  const raw = json(form, "gallery", 50_000);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((g): g is GalleryImage => Boolean(g) && typeof g === "object" && isSafeImageSrc(String((g as GalleryImage).url)))
    .map((g) => ({
      url: String(g.url),
      alt: String(g.alt ?? "").trim().slice(0, 250),
      width: Number.isInteger(g.width) ? g.width : undefined,
      height: Number.isInteger(g.height) ? g.height : undefined,
    }));
}

function failure(error: unknown, revision?: number): FormState {
  if (error instanceof CatalogError || error instanceof SlugError) return { status: "error", message: error.message, revision, at: Date.now() };
  throw error;
}

export async function createPluginAction(form: FormData) {
  await requireAdmin();
  let id: number;
  try {
    ({ id } = await createPlugin(str(form, "name", 150), str(form, "slug", 120)));
  } catch (error) {
    if (error instanceof CatalogError || error instanceof SlugError) failed("/admin/plugins/new", error.message);
    throw error;
  }
  redirect(`/admin/plugins/${id}?ok=${encodeURIComponent("پیش‌نویس افزونه ساخته شد. متن، دسته و منبع را تکمیل کنید.")}`);
}

export async function savePluginAction(prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireAdmin();
  const id = int(form, "id");
  const meta = Object.fromEntries(META_FIELDS.map((f) => [f, str(form, f, 300)])) as Record<MetaField, string>;
  try {
    const result = await updatePlugin(
      id,
      int(form, "revision"),
      {
        name: str(form, "name", 150),
        slug: str(form, "slug", 120),
        originalName: meta.originalName,
        excerpt: str(form, "excerpt", 400),
        content: json(form, "content"),
        categoryIds: ids(form, "categoryIds"),
        primaryCategoryId: int(form, "primaryCategoryId") || null,
        iconUrl: image(form, "iconUrl"),
        gallery: gallery(form),
        meta,
        seoTitle: str(form, "seoTitle", 120),
        seoDescription: str(form, "seoDescription", 300),
        seoH1: str(form, "seoH1", 150),
        canonicalUrl: str(form, "canonicalUrl", 300),
        noindex: bool(form, "noindex"),
        ogImage: image(form, "ogImage"),
        autoUpdate: bool(form, "autoUpdate"),
        allowPrerelease: bool(form, "allowPrerelease"),
        discontinued: bool(form, "discontinued"),
        discontinuedNote: str(form, "discontinuedNote", 500),
        relatedIds: ids(form, "relatedIds"),
      },
      user.id,
    );
    // The public page shows the published snapshot, but lists and aliases may change with the slug.
    updateTag(CONTENT_TAG);
    return {
      status: "ok",
      message: "پیش‌نویس ذخیره شد. برای نمایش در سایت «انتشار تغییرات» را بزنید.",
      revision: result.revision,
      problems: result.problems,
      at: Date.now(),
    };
  } catch (error) {
    // Keep the revision of the last successful save, so the next attempt is checked against it.
    return failure(error, prev.revision);
  }
}

export async function publishPluginAction(form: FormData) {
  const user = await requireAdmin();
  const id = int(form, "id");
  try {
    await publishPlugin(id, user.id, int(form, "revision"));
  } catch (error) {
    if (error instanceof CatalogError || error instanceof SlugError) failed(`/admin/plugins/${id}`, error.message);
    throw error;
  }
  saved(`/admin/plugins/${id}`, "افزونه در سایت منتشر شد.");
}

export async function archivePluginAction(form: FormData) {
  const user = await requireAdmin();
  const id = int(form, "id");
  await setPluginStatus(id, "archived", user.id);
  saved(`/admin/plugins/${id}`, "افزونه بایگانی شد و از سایت برداشته شد.");
}

export async function restorePluginAction(form: FormData) {
  const user = await requireAdmin();
  const id = int(form, "id");
  await setPluginStatus(id, "draft", user.id);
  saved(`/admin/plugins/${id}`, "افزونه به پیش‌نویس برگشت.");
}

export async function deletePluginAction(form: FormData) {
  const user = await requireAdmin();
  const id = int(form, "id");
  try {
    await deletePlugin(id, user.id);
  } catch (error) {
    if (error instanceof CatalogError) failed(`/admin/plugins/${id}`, error.message);
    throw error;
  }
  saved("/admin/plugins", "افزونه حذف شد.");
}

export async function setBaseCountAction(form: FormData) {
  const user = await requireAdmin();
  const id = int(form, "id");
  try {
    await setBaseDownloadCount(id, Number(str(form, "baseDownloadCount", 12).replace(/[,٬\s]/g, "")), str(form, "reason", 300), user.id);
  } catch (error) {
    if (error instanceof CatalogError) failed(`/admin/plugins/${id}#stats`, error.message);
    throw error;
  }
  saved(`/admin/plugins/${id}#stats`, "عدد پایه دانلود ثبت شد.");
}

export async function saveCategoryAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = int(form, "id") || null;
  try {
    const result = await saveCategory(id, {
      title: str(form, "title", 120),
      slug: str(form, "slug", 120),
      h1: str(form, "h1", 150),
      description: json(form, "description"),
      seoTitle: str(form, "seoTitle", 120),
      seoDescription: str(form, "seoDescription", 300),
      canonicalUrl: str(form, "canonicalUrl", 300),
      noindex: bool(form, "noindex"),
      imageUrl: image(form, "imageUrl"),
      sortOrder: int(form, "sortOrder"),
      published: bool(form, "published"),
    });
    updateTag(CONTENT_TAG);
    if (!id) redirect(`/admin/plugins/categories/${result.id}?ok=${encodeURIComponent("دسته ساخته شد.")}`);
    return { status: "ok", message: "دسته ذخیره شد.", problems: result.problems, at: Date.now() };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteCategoryAction(form: FormData) {
  await requireAdmin();
  const id = int(form, "id");
  try {
    await deleteCategory(id);
  } catch (error) {
    if (error instanceof CatalogError) failed(`/admin/plugins/categories/${id}`, error.message);
    throw error;
  }
  saved("/admin/plugins/categories", "دسته حذف شد.");
}

export async function saveGlobalBlockAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = int(form, "id") || null;
  try {
    const result = await saveGlobalBlock(id, {
      name: str(form, "name", 100),
      title: str(form, "title", 150),
      content: json(form, "content"),
      position: str(form, "position", 30),
      sortOrder: int(form, "sortOrder"),
      enabled: bool(form, "enabled"),
      appliesToAll: str(form, "scope", 10) !== "selected",
      includeIds: ids(form, "includeIds"),
      excludeIds: ids(form, "excludeIds"),
    });
    updateTag(CONTENT_TAG);
    if (!id) redirect(`/admin/plugins/blocks/${result.id}?ok=${encodeURIComponent("بلوک ساخته شد.")}`);
    return { status: "ok", message: "بلوک ذخیره شد و در همه صفحات مربوط اعمال شد.", problems: result.problems, at: Date.now() };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteGlobalBlockAction(form: FormData) {
  await requireAdmin();
  await deleteGlobalBlock(int(form, "id"));
  saved("/admin/plugins/blocks", "بلوک حذف شد.");
}
