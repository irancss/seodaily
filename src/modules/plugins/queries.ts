import "server-only";

import { and, asc, count, desc, eq, inArray, sql, type SQL } from "drizzle-orm";

import { db, schema } from "@/db";
import type { GalleryImage } from "@/db/plugins-schema";
import { cached } from "@/lib/cache";
import type { BlockDocument } from "@/modules/blocks/schema";
import { entityLinks } from "@/modules/blocks/text";
import { resolveSlug } from "@/modules/slugs/registry";

import { autoRelated } from "./catalog";
import { publicDownloadCount } from "./labels";

// Public reads of the plugin library. Only published plugins, published
// categories and downloadable releases leave this module; drafts, sources,
// checks and warnings never do. Results are cached under the content tag and
// JSON-serialised, so dates come back as ISO strings.

const { plugins, pluginCategories, pluginCategoryLinks, pluginReleases, pluginGlobalBlocks, downloadEvents } = schema;

export const PUBLIC_PAGE_SIZE = 12;
export const HOME_PLUGIN_COUNT = 6;

export type PluginCard = {
  id: number;
  slug: string;
  name: string;
  excerpt: string;
  iconUrl: string;
  category: { slug: string; title: string } | null;
  version: string;
  updatedAt: string | null;
  downloads: number;
};

const published = eq(plugins.status, "published");

const cardColumns = {
  id: plugins.id,
  slug: plugins.slug,
  name: plugins.name,
  excerpt: plugins.excerpt,
  iconUrl: plugins.iconUrl,
  categorySlug: pluginCategories.slug,
  categoryTitle: pluginCategories.title,
  categoryPublished: pluginCategories.published,
  version: pluginReleases.sourceVersion,
  packageUpdatedAt: plugins.packageUpdatedAt,
  baseDownloadCount: plugins.baseDownloadCount,
  measuredDownloadCount: plugins.measuredDownloadCount,
};

type CardRow = {
  id: number;
  slug: string;
  name: string;
  excerpt: string;
  iconUrl: string;
  categorySlug: string | null;
  categoryTitle: string | null;
  categoryPublished: boolean | null;
  version: string | null;
  packageUpdatedAt: Date | null;
  baseDownloadCount: number;
  measuredDownloadCount: number;
};

function toCard(r: CardRow): PluginCard {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    excerpt: r.excerpt,
    iconUrl: r.iconUrl,
    category: r.categorySlug && r.categoryPublished ? { slug: r.categorySlug, title: r.categoryTitle ?? "" } : null,
    version: r.version ?? "",
    updatedAt: r.packageUpdatedAt ? new Date(r.packageUpdatedAt).toISOString() : null,
    downloads: publicDownloadCount(r),
  };
}

function cardQuery() {
  return db
    .select(cardColumns)
    .from(plugins)
    .leftJoin(pluginCategories, eq(pluginCategories.id, plugins.primaryCategoryId))
    .leftJoin(pluginReleases, and(eq(pluginReleases.id, plugins.currentReleaseId), eq(pluginReleases.downloadable, true)));
}

const recentOrder = [sql`${plugins.packageUpdatedAt} desc nulls last`, desc(plugins.publishedAt), desc(plugins.id)];

/** `%`, `_` and `\` typed by a visitor are matched literally. */
function likePattern(q: string) {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export const LIST_SORTS = { updated: "تازه‌ترین به‌روزرسانی", popular: "پردانلودترین (۳۰ روز)", name: "نام" } as const;
export type ListSort = keyof typeof LIST_SORTS;
export const LIST_SINCE = { 7: "۷ روز اخیر", 30: "۳۰ روز اخیر", 365: "یک سال اخیر" } as const;

export type PluginListQuery = { q?: string; categoryId?: number; sinceDays?: number; sort?: ListSort; page?: number };

const served30 = sql`(select count(*) from ${downloadEvents} e where e.plugin_id = ${plugins.id} and e.kind = 'served' and e.created_at > now() - interval '30 days')`;

export const listPublishedPlugins = cached(async ({ q = "", categoryId, sinceDays, sort = "updated", page = 1 }: PluginListQuery) => {
  const where: SQL[] = [published];
  const term = q.trim().slice(0, 80);
  if (term) {
    const p = likePattern(term);
    where.push(
      sql`(${plugins.name} ilike ${p} or ${plugins.originalName} ilike ${p} or ${plugins.excerpt} ilike ${p} or ${plugins.slug} ilike ${p})`,
    );
  }
  if (categoryId) {
    where.push(
      sql`exists (select 1 from ${pluginCategoryLinks} l where l.plugin_id = ${plugins.id} and l.category_id = ${categoryId})`,
    );
  }
  if (sinceDays && sinceDays in LIST_SINCE) {
    where.push(sql`${plugins.packageUpdatedAt} > now() - make_interval(days => ${sinceDays})`);
  }
  const condition = and(...where);
  const order = sort === "name" ? [asc(plugins.name), asc(plugins.id)] : sort === "popular" ? [sql`${served30} desc`, ...recentOrder] : recentOrder;
  const [{ total }] = await db.select({ total: count() }).from(plugins).where(condition);
  const pages = Math.max(1, Math.ceil(total / PUBLIC_PAGE_SIZE));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  const rows = await cardQuery()
    .where(condition)
    .orderBy(...order)
    .limit(PUBLIC_PAGE_SIZE)
    .offset((current - 1) * PUBLIC_PAGE_SIZE);
  return { items: rows.map(toCard), total, page: current, pages };
}, "plugins:list");

export const latestPlugins = cached(async (limit: number = HOME_PLUGIN_COUNT) => {
  const rows = await cardQuery()
    .where(and(published, sql`${plugins.packageUpdatedAt} is not null`))
    .orderBy(...recentOrder)
    .limit(limit);
  return rows.map(toCard);
}, "plugins:latest");

/** Popular = most completed (served) downloads in the last 30 days; nothing is shown without real downloads. */
export const popularPlugins = cached(async (limit: number = HOME_PLUGIN_COUNT) => {
  const served = db
    .select({ pluginId: downloadEvents.pluginId, n: count().as("n") })
    .from(downloadEvents)
    .where(and(eq(downloadEvents.kind, "served"), sql`${downloadEvents.createdAt} > now() - interval '30 days'`))
    .groupBy(downloadEvents.pluginId)
    .as("served");
  const rows = await db
    .select(cardColumns)
    .from(served)
    .innerJoin(plugins, eq(plugins.id, served.pluginId))
    .leftJoin(pluginCategories, eq(pluginCategories.id, plugins.primaryCategoryId))
    .leftJoin(pluginReleases, and(eq(pluginReleases.id, plugins.currentReleaseId), eq(pluginReleases.downloadable, true)))
    .where(published)
    .orderBy(desc(served.n), ...recentOrder)
    .limit(limit);
  return rows.map(toCard);
}, "plugins:popular");

export type PublicCategory = { id: number; slug: string; title: string; count: number; updatedAt: string | null };

/** Published categories that hold at least one published plugin. */
export const publishedCategories = cached(async (): Promise<PublicCategory[]> => {
  const rows = await db
    .select({
      id: pluginCategories.id,
      slug: pluginCategories.slug,
      title: pluginCategories.title,
      count: count(plugins.id),
      updatedAt: sql<string | null>`max(coalesce(${plugins.packageUpdatedAt}, ${plugins.contentUpdatedAt}, ${plugins.publishedAt}))`,
    })
    .from(pluginCategories)
    .innerJoin(pluginCategoryLinks, eq(pluginCategoryLinks.categoryId, pluginCategories.id))
    .innerJoin(plugins, and(eq(plugins.id, pluginCategoryLinks.pluginId), published))
    .where(eq(pluginCategories.published, true))
    .groupBy(pluginCategories.id)
    .orderBy(asc(pluginCategories.sortOrder), asc(pluginCategories.title));
  return rows.map((r) => ({ ...r, count: Number(r.count), updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : null }));
}, "plugins:categories");

export const getPublishedCategory = cached(async (id: number) => {
  const [row] = await db
    .select({
      id: pluginCategories.id,
      slug: pluginCategories.slug,
      title: pluginCategories.title,
      h1: pluginCategories.h1,
      description: pluginCategories.description,
      seoTitle: pluginCategories.seoTitle,
      seoDescription: pluginCategories.seoDescription,
      imageUrl: pluginCategories.imageUrl,
    })
    .from(pluginCategories)
    .where(and(eq(pluginCategories.id, id), eq(pluginCategories.published, true)))
    .limit(1);
  return row ? { ...row, description: row.description as BlockDocument | null } : null;
}, "plugins:category");

/** What a /plugins/{slug} path points at: a plugin, a category, an old slug (301) or nothing. */
export const resolvePluginPath = cached((slug: string) => resolveSlug("plugins", slug), "plugins:resolve");

export type PublicRelease = {
  id: number;
  version: string;
  bytes: number;
  sha256: string;
  publishedAt: string | null;
  changelog: string;
  prerelease: boolean;
  current: boolean;
};

export type PublicBlock = { id: number; title: string; content: BlockDocument | null; position: string };

/**
 * A published plugin with everything its page shows. `preview` reads the
 * draft of any plugin instead (admin preview only — never cached).
 */
async function loadPlugin(id: number, preview: boolean) {
  const [p] = await db
    .select()
    .from(plugins)
    .where(preview ? eq(plugins.id, id) : and(eq(plugins.id, id), published))
    .limit(1);
  if (!p) return null;

  const [categoryRows, releases, blocks] = await Promise.all([
    db
      .select({ id: pluginCategories.id, slug: pluginCategories.slug, title: pluginCategories.title })
      .from(pluginCategoryLinks)
      .innerJoin(pluginCategories, eq(pluginCategories.id, pluginCategoryLinks.categoryId))
      .where(and(eq(pluginCategoryLinks.pluginId, id), eq(pluginCategories.published, true)))
      .orderBy(asc(pluginCategories.sortOrder), asc(pluginCategories.title)),
    db
      .select()
      .from(pluginReleases)
      .where(and(eq(pluginReleases.pluginId, id), eq(pluginReleases.downloadable, true)))
      .orderBy(sql`${pluginReleases.publishedAt} desc nulls last`, desc(pluginReleases.id))
      .limit(3),
    db
      .select()
      .from(pluginGlobalBlocks)
      .where(eq(pluginGlobalBlocks.enabled, true))
      .orderBy(asc(pluginGlobalBlocks.sortOrder), asc(pluginGlobalBlocks.id)),
  ]);

  const relatedIds = p.relatedIds.length > 0 ? p.relatedIds : await autoRelated(id);
  const relatedRows = relatedIds.length
    ? await cardQuery().where(and(published, inArray(plugins.id, relatedIds)))
    : [];
  const related = relatedIds
    .map((rid) => relatedRows.find((r) => r.id === rid))
    .filter((r): r is CardRow => Boolean(r))
    .slice(0, 6)
    .map(toCard);

  const applicable: PublicBlock[] = blocks
    .filter((b) => !b.excludeIds.includes(id) && (b.appliesToAll || b.includeIds.includes(id)))
    .map((b) => ({ id: b.id, title: b.title, content: b.content as BlockDocument | null, position: b.position }));

  const content = (preview ? p.contentDraft : p.contentPublished) as BlockDocument | null;
  const primary = categoryRows.find((c) => c.id === p.primaryCategoryId) ?? null;
  const iso = (d: Date | null) => (d ? d.toISOString() : null);

  return {
    id: p.id,
    slug: p.slug,
    status: p.status,
    name: p.name,
    originalName: p.originalName,
    excerpt: p.excerpt,
    content,
    iconUrl: p.iconUrl,
    gallery: p.gallery as GalleryImage[],
    authorName: p.authorName,
    authorUrl: p.authorUrl,
    officialUrl: p.officialUrl,
    license: p.license,
    requiresWp: p.requiresWp,
    requiresPhp: p.requiresPhp,
    testedUpTo: p.testedUpTo,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    seoH1: p.seoH1,
    canonicalUrl: p.canonicalUrl,
    noindex: p.noindex,
    ogImage: p.ogImage,
    discontinued: p.discontinued,
    discontinuedNote: p.discontinuedNote,
    downloads: publicDownloadCount(p),
    publishedAt: iso(p.publishedAt),
    contentUpdatedAt: iso(p.contentUpdatedAt),
    packageUpdatedAt: iso(p.packageUpdatedAt),
    lastCheckedAt: iso(p.lastCheckedAt),
    primaryCategory: primary,
    categories: categoryRows,
    releases: releases.map(
      (r): PublicRelease => ({
        id: r.id,
        version: r.sourceVersion,
        bytes: r.bytes,
        sha256: r.sha256,
        publishedAt: iso(r.publishedAt),
        changelog: r.changelog,
        prerelease: r.prerelease,
        current: r.id === p.currentReleaseId,
      }),
    ),
    related,
    blocks: applicable,
  };
}

export type PublicPlugin = NonNullable<Awaited<ReturnType<typeof loadPlugin>>>;

export const getPublishedPlugin = cached((id: number) => loadPlugin(id, false), "plugins:detail");

/** Admin preview of the draft (uncached; the caller must have checked the admin session). */
export function getPluginPreview(id: number) {
  return loadPlugin(id, true);
}

/**
 * Current URLs of the entities linked from these documents. Unpublished or
 * deleted targets map to null and render as plain text.
 */
export async function entityHrefs(docs: (BlockDocument | null | undefined)[]) {
  const links = docs.flatMap((d) => entityLinks(d));
  const pluginIds = [...new Set(links.filter((l) => l.type === "plugin").map((l) => Number(l.id)))].filter(Number.isInteger);
  const categoryIds = [...new Set(links.filter((l) => l.type === "plugin_category").map((l) => Number(l.id)))].filter(Number.isInteger);
  const [pluginRows, categoryRows] = await Promise.all([
    pluginIds.length
      ? db.select({ id: plugins.id, slug: plugins.slug }).from(plugins).where(and(published, inArray(plugins.id, pluginIds)))
      : [],
    categoryIds.length
      ? db
          .select({ id: pluginCategories.id, slug: pluginCategories.slug })
          .from(pluginCategories)
          .where(and(eq(pluginCategories.published, true), inArray(pluginCategories.id, categoryIds)))
      : [],
  ]);
  const map: Record<string, string | null> = {};
  for (const l of links) map[`entity:${l.type}:${l.id}`] = null;
  for (const r of pluginRows) map[`entity:plugin:${r.id}`] = `/plugins/${r.slug}`;
  for (const r of categoryRows) map[`entity:plugin_category:${r.id}`] = `/plugins/${r.slug}`;
  return map;
}

/** Published, indexable plugins and their last real change, for the sitemap. */
export const sitemapPlugins = cached(async () => {
  const rows = await db
    .select({
      slug: plugins.slug,
      canonicalUrl: plugins.canonicalUrl,
      updatedAt: sql<string>`greatest(${plugins.publishedAt}, coalesce(${plugins.contentUpdatedAt}, ${plugins.publishedAt}), coalesce(${plugins.packageUpdatedAt}, ${plugins.publishedAt}))`,
    })
    .from(plugins)
    .where(and(published, eq(plugins.noindex, false)))
    .orderBy(desc(plugins.id));
  // A page canonicalised to another URL is not listed.
  return rows
    .filter((r) => !r.canonicalUrl || r.canonicalUrl.replace(/\/+$/, "").endsWith(`/plugins/${r.slug}`))
    .map((r) => ({ slug: r.slug, updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : null }));
}, "plugins:sitemap");
