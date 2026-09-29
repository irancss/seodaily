import "server-only";

import { and, eq, inArray, ne, sql } from "drizzle-orm";

import { db, schema } from "@/db";
import type { GalleryImage } from "@/db/plugins-schema";
import type { BlockDocument } from "@/modules/blocks/schema";
import { documentText } from "@/modules/blocks/text";
import { validateBlockDocument } from "@/modules/blocks/validate";
import { claimSlug, releaseSlugs, reservePluginSlug, SlugError, type Tx } from "@/modules/slugs/registry";

import { audit } from "./audit";
import { editorialSnapshot } from "./draft";
import { META_FIELDS, type MetaField } from "./labels";

const P = schema.plugins;

export class CatalogError extends Error {}

export type PluginInput = {
  name: string;
  slug: string;
  originalName: string;
  excerpt: string;
  content: unknown;
  categoryIds: number[];
  primaryCategoryId: number | null;
  iconUrl: string;
  gallery: GalleryImage[];
  meta: Record<MetaField, string>;
  seoTitle: string;
  seoDescription: string;
  seoH1: string;
  canonicalUrl: string;
  noindex: boolean;
  ogImage: string;
  autoUpdate: boolean;
  allowPrerelease: boolean;
  discontinued: boolean;
  discontinuedNote: string;
  relatedIds: number[];
};

export type SaveResult = { id: number; revision: number; slug: string; problems: string[] };

/** A new draft with just a name (and slug); everything else is edited afterwards. */
export async function createPlugin(name: string, slug: string): Promise<{ id: number; slug: string }> {
  const cleanName = name.trim().slice(0, 150);
  if (!cleanName) throw new CatalogError("نام افزونه را وارد کنید.");
  return db.transaction(async (tx) => {
    const [row] = await tx.insert(P).values({ slug: `pending-${Date.now()}`, name: cleanName }).returning({ id: P.id });
    const finalSlug = await claimSlug(tx, "plugins", slug || cleanName, "plugin", row.id, false);
    await tx.update(P).set({ slug: finalSlug }).where(eq(P.id, row.id));
    return { id: row.id, slug: finalSlug };
  });
}

async function checkCategories(tx: Tx, ids: number[]) {
  if (!ids.length) return [];
  const rows = await tx.select({ id: schema.pluginCategories.id }).from(schema.pluginCategories).where(inArray(schema.pluginCategories.id, ids));
  return rows.map((r) => r.id);
}

/**
 * Saves the working revision. `expectedRevision` is the revision the editor
 * loaded; a save from a stale tab (or another admin) is refused instead of
 * silently overwriting, and the caller keeps the unsaved text in the browser.
 * The public page does not change until publishPlugin.
 */
export async function updatePlugin(id: number, expectedRevision: number, input: PluginInput, userId: number | null): Promise<SaveResult> {
  const { document, problems } = validateBlockDocument(input.content);
  return db.transaction(async (tx) => {
    const [current] = await tx.select().from(P).where(eq(P.id, id)).for("update");
    if (!current) throw new CatalogError("افزونه پیدا نشد.");
    if (current.revision !== expectedRevision) {
      throw new CatalogError("این افزونه در این فاصله در تب دیگری یا توسط مدیر دیگری ذخیره شده است. متن شما در همین صفحه باقی مانده؛ آن را کپی کنید، صفحه را تازه کنید و تغییرات را دوباره اعمال کنید.");
    }
    const name = input.name.trim().slice(0, 150);
    if (!name) throw new CatalogError("نام افزونه را وارد کنید.");

    const slug = current.publishedAt
      ? await reservePluginSlug(tx, input.slug || name, id)
      : await claimSlug(tx, "plugins", input.slug || name, "plugin", id, false);
    const categoryIds = await checkCategories(tx, [...new Set(input.categoryIds)].slice(0, 20));
    let primary: number | null = input.primaryCategoryId && categoryIds.includes(input.primaryCategoryId) ? input.primaryCategoryId : (categoryIds[0] ?? null);
    if (!categoryIds.length) primary = null;

    // A field typed by the admin stays theirs; clearing it hands it back to the sources.
    const working = editorialSnapshot(current);
    const manual = new Set(working.manualFields);
    const meta = {} as Record<MetaField, string>;
    for (const field of META_FIELDS) {
      const value = (input.meta[field] ?? "").trim().slice(0, 300);
      const before = String(working[field] ?? "");
      if (!value) manual.delete(field);
      else if (value !== before) manual.add(field);
      meta[field] = value;
    }

    const related = [...new Set(input.relatedIds)].filter((r) => r !== id).slice(0, 12);
    const revision = current.revision + 1;
    const draftData = {
      name,
      slug,
      excerpt: input.excerpt.trim().slice(0, 400),
      categoryIds,
      primaryCategoryId: primary,
      iconUrl: input.iconUrl,
      iconSource: input.iconUrl && input.iconUrl !== working.iconUrl ? "manual" : working.iconSource,
      gallery: input.gallery.slice(0, 20),
      ...meta,
      manualFields: [...manual],
      seoTitle: input.seoTitle.trim().slice(0, 120),
      seoDescription: input.seoDescription.trim().slice(0, 300),
      seoH1: input.seoH1.trim().slice(0, 150),
      canonicalUrl: input.canonicalUrl.trim().slice(0, 300),
      noindex: input.noindex,
      ogImage: input.ogImage,
      autoUpdate: input.autoUpdate,
      allowPrerelease: input.allowPrerelease,
      discontinued: input.discontinued,
      discontinuedNote: input.discontinuedNote.trim().slice(0, 500),
      relatedIds: related,
    };
    await tx.update(P).set({
      // First drafts have no public snapshot; metadata remains available to the pipeline.
      ...(!current.publishedAt ? draftData : {}),
      draftData, contentDraft: document, revision, updatedAt: new Date(),
      autoUpdate: input.autoUpdate, allowPrerelease: input.allowPrerelease,
    })
      .where(and(eq(P.id, id), eq(P.revision, expectedRevision)));

    if (!current.publishedAt) {
      await tx.delete(schema.pluginCategoryLinks).where(eq(schema.pluginCategoryLinks.pluginId, id));
      if (categoryIds.length) await tx.insert(schema.pluginCategoryLinks).values(categoryIds.map((categoryId) => ({ pluginId: id, categoryId })));
    }
    if (current.discontinued !== input.discontinued) await audit(userId, input.discontinued ? "plugin.discontinued" : "plugin.continued", { type: "plugin", id }, {}, tx);
    return { id, revision, slug, problems };
  });
}

/** What still stops a plugin from going public (empty list = ready). */
export async function publishBlockers(id: number, tx: Tx | typeof db = db): Promise<string[]> {
  const [row] = await tx.select().from(P).where(eq(P.id, id));
  if (!row) return ["افزونه پیدا نشد."];
  const plugin = editorialSnapshot(row);
  const blockers: string[] = [];
  if (!plugin.name.trim()) blockers.push("نام افزونه خالی است.");
  if (!plugin.primaryCategoryId) blockers.push("حداقل یک دسته (و دسته اصلی) انتخاب کنید.");
  if (documentText(plugin.contentDraft as BlockDocument | null).length < 100) blockers.push("متن معرفی کامل نیست (کمتر از ۱۰۰ نویسه).");
  if (!plugin.excerpt.trim()) blockers.push("خلاصه کوتاه (excerpt) خالی است.");
  const [release] = plugin.currentReleaseId
    ? await tx
        .select({ state: schema.pluginReleases.state, downloadable: schema.pluginReleases.downloadable })
        .from(schema.pluginReleases)
        .where(eq(schema.pluginReleases.id, plugin.currentReleaseId))
    : [];
  if (!release || release.state !== "published" || !release.downloadable) blockers.push("هنوز هیچ نسخه تأییدشده‌ای از فایل افزونه آماده دانلود نیست (بخش منابع و نسخه‌ها).");
  return blockers;
}

/**
 * Makes the working revision public. The first publication needs complete
 * content and an approved file; later publications commit all editorial fields.
 */
export async function publishPlugin(id: number, userId: number | null, expectedRevision?: number) {
  await db.transaction(async (tx) => {
    const [current] = await tx.select().from(P).where(eq(P.id, id)).for("update");
    if (!current) throw new CatalogError("افزونه پیدا نشد.");
    if (expectedRevision !== undefined && current.revision !== expectedRevision) throw new CatalogError("پیش‌نویس تغییر کرده است؛ صفحه را تازه کنید و نسخهٔ جدید را پیش از انتشار بررسی کنید.");
    const blockers = await publishBlockers(id, tx);
    if (blockers.length) throw new CatalogError(blockers.join(" "));
    const draft = current.draftData;
    if (draft) {
      await claimSlug(tx, "plugins", draft.slug, "plugin", id, current.publishedAt !== null);
      const ids = await checkCategories(tx, draft.categoryIds);
      if (ids.length !== draft.categoryIds.length) throw new CatalogError("یکی از دسته‌های پیش‌نویس حذف شده است؛ دسته‌ها را دوباره انتخاب کنید.");
      await tx.delete(schema.pluginCategoryLinks).where(eq(schema.pluginCategoryLinks.pluginId, id));
      if (ids.length) await tx.insert(schema.pluginCategoryLinks).values(ids.map((categoryId) => ({ pluginId: id, categoryId })));
    }
    const now = new Date();
    const textChanged = Boolean(draft) || JSON.stringify(current.contentPublished) !== JSON.stringify(current.contentDraft);
    await tx
      .update(P)
      .set({
        ...draft,
        // Preserve metadata discovered since editing unless the editor owns the field.
        ...Object.fromEntries(META_FIELDS.filter((k) => draft && !draft.manualFields.includes(k)).map((k) => [k, current[k]])),
        ...(!draft?.iconUrl && current.iconSource === "auto" ? { iconUrl: current.iconUrl, iconSource: current.iconSource } : {}),
        draftData: null,
        revision: current.revision + 1,
        status: "published",
        contentPublished: current.contentDraft,
        publishedAt: current.publishedAt ?? now,
        contentUpdatedAt: textChanged || !current.contentUpdatedAt ? now : current.contentUpdatedAt,
        updatedAt: now,
      })
      .where(eq(P.id, id));
    await audit(userId, current.status === "published" ? "plugin.republished" : "plugin.published", { type: "plugin", id }, {}, tx);
  });
}

export async function setPluginStatus(id: number, status: "archived" | "draft", userId: number | null) {
  const [row] = await db.update(P).set({ status, updatedAt: new Date() }).where(eq(P.id, id)).returning({ id: P.id });
  if (!row) throw new CatalogError("افزونه پیدا نشد.");
  await audit(userId, status === "archived" ? "plugin.archived" : "plugin.restored", { type: "plugin", id });
}

/** Deletes a plugin that is not public. Download history stays (its rows lose the link, not the facts). */
export async function deletePlugin(id: number, userId: number | null) {
  await db.transaction(async (tx) => {
    const [current] = await tx.select({ status: P.status, name: P.name }).from(P).where(eq(P.id, id)).for("update");
    if (!current) throw new CatalogError("افزونه پیدا نشد.");
    if (current.status === "published") throw new CatalogError("افزونه منتشرشده را ابتدا بایگانی کنید، سپس حذف کنید.");
    await tx
      .update(schema.downloadEvents)
      .set({ detail: sql`case when ${schema.downloadEvents.detail} = '' then ${`plugin:${current.name}`} else ${schema.downloadEvents.detail} end` })
      .where(eq(schema.downloadEvents.pluginId, id));
    await releaseSlugs(tx, "plugins", "plugin", id);
    await tx.delete(P).where(eq(P.id, id));
    await audit(userId, "plugin.deleted", { type: "plugin", id }, { name: current.name }, tx);
  });
}

/** Imported download count shown publicly on top of measured downloads; every change is audited. */
export async function setBaseDownloadCount(id: number, value: number, reason: string, userId: number | null) {
  if (!Number.isInteger(value) || value < 0 || value > 100_000_000) throw new CatalogError("عدد پایه دانلود باید عدد صحیح نامنفی باشد.");
  if (!reason.trim()) throw new CatalogError("دلیل تغییر عدد پایه را بنویسید (مثلاً: آمار سایت قبلی تا تاریخ …).");
  await db.transaction(async (tx) => {
    const [current] = await tx.select({ base: P.baseDownloadCount }).from(P).where(eq(P.id, id)).for("update");
    if (!current) throw new CatalogError("افزونه پیدا نشد.");
    if (current.base === value) return;
    await tx.update(P).set({ baseDownloadCount: value }).where(eq(P.id, id));
    await audit(userId, "plugin.base_count", { type: "plugin", id }, { from: current.base, to: value, reason: reason.trim().slice(0, 300) }, tx);
  });
}

export type CategoryInput = {
  title: string;
  slug: string;
  h1: string;
  description: unknown;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl?: string;
  noindex?: boolean;
  imageUrl: string;
  sortOrder: number;
  published: boolean;
};

export async function saveCategory(id: number | null, input: CategoryInput) {
  const title = input.title.trim().slice(0, 120);
  if (!title) throw new CatalogError("عنوان دسته را وارد کنید.");
  const { document, problems } = validateBlockDocument(input.description);
  const C = schema.pluginCategories;
  const values = {
    title,
    h1: input.h1.trim().slice(0, 150),
    description: document,
    seoTitle: input.seoTitle.trim().slice(0, 120),
    seoDescription: input.seoDescription.trim().slice(0, 300),
    canonicalUrl: (input.canonicalUrl ?? "").trim().slice(0, 300),
    noindex: input.noindex ?? false,
    imageUrl: input.imageUrl,
    sortOrder: Math.max(-1000, Math.min(1000, Math.trunc(input.sortOrder) || 0)),
    published: input.published,
    updatedAt: new Date(),
  };
  const saved = await db.transaction(async (tx) => {
    let categoryId = id;
    let wasPublic = false;
    if (categoryId) {
      const [current] = await tx.select({ published: C.published }).from(C).where(eq(C.id, categoryId)).for("update");
      if (!current) throw new CatalogError("دسته پیدا نشد.");
      wasPublic = current.published;
      await tx.update(C).set(values).where(eq(C.id, categoryId));
    } else {
      const [row] = await tx.insert(C).values({ ...values, slug: `pending-${Date.now()}` }).returning({ id: C.id });
      categoryId = row.id;
    }
    const slug = await claimSlug(tx, "plugins", input.slug || title, "plugin_category", categoryId, wasPublic);
    await tx.update(C).set({ slug }).where(eq(C.id, categoryId));
    return { id: categoryId, slug };
  });
  return { ...saved, problems };
}

/** A category with plugins cannot be deleted: move the plugins first (no destructive cascade). */
export async function deleteCategory(id: number) {
  await db.transaction(async (tx) => {
    const [{ n }] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.pluginCategoryLinks)
      .where(eq(schema.pluginCategoryLinks.categoryId, id));
    if (n > 0) throw new CatalogError(`این دسته ${n.toLocaleString("fa-IR")} افزونه دارد؛ ابتدا افزونه‌ها را به دسته دیگری منتقل کنید.`);
    await releaseSlugs(tx, "plugins", "plugin_category", id);
    await tx.delete(schema.pluginCategories).where(eq(schema.pluginCategories.id, id));
  });
}

export type GlobalBlockInput = {
  name: string;
  title: string;
  content: unknown;
  position: string;
  sortOrder: number;
  enabled: boolean;
  appliesToAll: boolean;
  includeIds: number[];
  excludeIds: number[];
};

export async function saveGlobalBlock(id: number | null, input: GlobalBlockInput) {
  const name = input.name.trim().slice(0, 100);
  if (!name) throw new CatalogError("نام داخلی بلوک را وارد کنید.");
  const { document, problems } = validateBlockDocument(input.content);
  const B = schema.pluginGlobalBlocks;
  const exclude = [...new Set(input.excludeIds)].slice(0, 500);
  const values = {
    name,
    title: input.title.trim().slice(0, 150),
    content: document,
    position: ["before_download", "after_download", "page_end"].includes(input.position) ? input.position : "page_end",
    sortOrder: Math.max(-1000, Math.min(1000, Math.trunc(input.sortOrder) || 0)),
    enabled: input.enabled,
    appliesToAll: input.appliesToAll,
    includeIds: input.appliesToAll ? [] : [...new Set(input.includeIds)].filter((x) => !exclude.includes(x)).slice(0, 500),
    excludeIds: exclude,
    updatedAt: new Date(),
  };
  if (id) {
    const [row] = await db.update(B).set(values).where(eq(B.id, id)).returning({ id: B.id });
    if (!row) throw new CatalogError("بلوک پیدا نشد.");
    return { id, problems };
  }
  const [row] = await db.insert(B).values(values).returning({ id: B.id });
  return { id: row.id, problems };
}

export async function deleteGlobalBlock(id: number) {
  await db.delete(schema.pluginGlobalBlocks).where(eq(schema.pluginGlobalBlocks.id, id));
}

export { SlugError };

/** Other published plugins sharing a category, for "related plugins" when the admin picked none. */
export async function autoRelated(id: number, limit = 6) {
  const rows = await db.execute<{ id: number }>(sql`
    select p.id from plugins p
    join plugin_category_links l on l.plugin_id = p.id
    where p.status = 'published' and p.id <> ${id}
      and l.category_id in (select category_id from plugin_category_links where plugin_id = ${id})
    group by p.id, p.package_updated_at
    order by count(*) desc, p.package_updated_at desc nulls last, p.id desc
    limit ${limit}`);
  return rows.map((r) => Number(r.id));
}

/** Whether another plugin already uses a name (a hint in the panel, not a rule). */
export async function nameTaken(name: string, exceptId: number) {
  const [row] = await db.select({ id: P.id }).from(P).where(and(eq(P.name, name), ne(P.id, exceptId))).limit(1);
  return Boolean(row);
}
