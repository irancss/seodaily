import "server-only";

import { and, asc, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";

import { db, schema } from "@/db";
import { editorialSnapshot } from "./draft";

const P = schema.plugins;
const R = schema.pluginReleases;
const S = schema.pluginSources;
export const ADMIN_PAGE_SIZE = 25;

export type PluginListFilters = { q?: string; status?: string; category?: number; attention?: boolean; page?: number };

function likeTerm(q: string) {
  return `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
}

export async function listPluginsAdmin(filters: PluginListFilters) {
  const where: SQL[] = [];
  const q = filters.q?.trim().slice(0, 80);
  if (q) where.push(or(ilike(P.name, likeTerm(q)), ilike(P.originalName, likeTerm(q)), ilike(P.slug, likeTerm(q)))!);
  if (filters.status && ["draft", "published", "archived"].includes(filters.status)) where.push(eq(P.status, filters.status));
  if (filters.category) {
    where.push(sql`exists (select 1 from plugin_category_links l where l.plugin_id = ${P.id} and l.category_id = ${filters.category})`);
  }
  if (filters.attention) {
    where.push(
      sql`(exists (select 1 from plugin_releases r where r.plugin_id = ${P.id} and r.state = 'review') or exists (select 1 from plugin_sources s where s.plugin_id = ${P.id} and s.enabled and s.last_status in ('error', 'manual_setup_required')))`,
    );
  }
  const page = Math.max(1, filters.page ?? 1);
  const cond = where.length ? and(...where) : undefined;
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: P.id,
        name: P.name,
        slug: P.slug,
        status: P.status,
        iconUrl: P.iconUrl,
        autoUpdate: P.autoUpdate,
        discontinued: P.discontinued,
        lastCheckedAt: P.lastCheckedAt,
        packageUpdatedAt: P.packageUpdatedAt,
        updatedAt: P.updatedAt,
        baseDownloadCount: P.baseDownloadCount,
        measuredDownloadCount: P.measuredDownloadCount,
        currentVersion: sql<string | null>`(select r.source_version from plugin_releases r where r.id = ${P.currentReleaseId})`,
        reviewCount: sql<number>`(select count(*)::int from plugin_releases r where r.plugin_id = ${P.id} and r.state = 'review')`,
        failingSources: sql<number>`(select count(*)::int from plugin_sources s where s.plugin_id = ${P.id} and s.enabled and s.last_status in ('error', 'manual_setup_required'))`,
        sourceCount: sql<number>`(select count(*)::int from plugin_sources s where s.plugin_id = ${P.id})`,
      })
      .from(P)
      .where(cond)
      .orderBy(desc(P.updatedAt), desc(P.id))
      .limit(ADMIN_PAGE_SIZE)
      .offset((page - 1) * ADMIN_PAGE_SIZE),
    db.select({ total: count() }).from(P).where(cond),
  ]);
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

export async function getPluginAdmin(id: number) {
  const plugin = await db.query.plugins.findFirst({ where: eq(P.id, id) });
  if (!plugin) return null;
  const [links, sources, releases, jobs] = await Promise.all([
    db.select({ categoryId: schema.pluginCategoryLinks.categoryId }).from(schema.pluginCategoryLinks).where(eq(schema.pluginCategoryLinks.pluginId, id)),
    db.select().from(S).where(eq(S.pluginId, id)).orderBy(asc(S.priority), asc(S.id)),
    db.select().from(R).where(eq(R.pluginId, id)).orderBy(desc(R.createdAt)).limit(30),
    db.select().from(schema.pluginJobs).where(eq(schema.pluginJobs.pluginId, id)).orderBy(desc(schema.pluginJobs.createdAt)).limit(10),
  ]);
  return { plugin: editorialSnapshot(plugin), categoryIds: plugin.draftData?.categoryIds ?? links.map((l) => l.categoryId), sources, releases, jobs };
}

export type AdminPlugin = NonNullable<Awaited<ReturnType<typeof getPluginAdmin>>>;

export async function listCategoriesAdmin() {
  const C = schema.pluginCategories;
  return db
    .select({
      id: C.id,
      slug: C.slug,
      title: C.title,
      sortOrder: C.sortOrder,
      published: C.published,
      pluginCount: sql<number>`(select count(*)::int from plugin_category_links l where l.category_id = ${C.id})`,
    })
    .from(C)
    .orderBy(asc(C.sortOrder), asc(C.title));
}

export async function getCategoryAdmin(id: number) {
  return (await db.query.pluginCategories.findFirst({ where: eq(schema.pluginCategories.id, id) })) ?? null;
}

export async function pluginOptions(excludeId?: number) {
  const rows = await db.select({ id: P.id, name: P.name, status: P.status }).from(P).orderBy(asc(P.name));
  return rows.filter((r) => r.id !== excludeId);
}

export async function listGlobalBlocks() {
  const B = schema.pluginGlobalBlocks;
  return db.select().from(B).orderBy(asc(B.position), asc(B.sortOrder), asc(B.id));
}

export async function getGlobalBlock(id: number) {
  return (await db.query.pluginGlobalBlocks.findFirst({ where: eq(schema.pluginGlobalBlocks.id, id) })) ?? null;
}

/** Names of plugins by id, for showing include/exclude lists. */
export async function pluginNames(ids: number[]) {
  if (!ids.length) return new Map<number, string>();
  const rows = await db.select({ id: P.id, name: P.name }).from(P).where(inArray(P.id, ids));
  return new Map(rows.map((r) => [r.id, r.name]));
}
