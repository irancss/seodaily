import "server-only";
import { cache } from "react";
import { and, asc, count, desc, eq, inArray, ne, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { normalizeSearch } from "./content";
import { BLOG_DEFAULTS, type ArticleDraft, type BlogOptions } from "./types";

const a = schema.articles, c = schema.blogCategories;
export const publicArticle = and(eq(a.status, "published"), sql`${a.published} is not null`, eq(c.enabled, true), eq(c.archived, false));
const columns = { id: a.id, slug: a.slug, data: sql<ArticleDraft>`${a.published} - 'content'`, publishedAt: a.publishedAt, modifiedAt: a.contentModifiedAt, categoryId: c.id, categorySlug: c.slug, categoryTitle: c.title };
export type ArticleCard = Awaited<ReturnType<typeof latestArticles>>[number];
export async function blogOptions(): Promise<BlogOptions> {
  const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, "blog"));
  const raw = (row?.value ?? {}) as Partial<BlogOptions>;
  const bounded = (key: keyof typeof BLOG_DEFAULTS, min: number, max: number) => Number.isInteger(raw[key]) && Number(raw[key]) >= min && Number(raw[key]) <= max ? Number(raw[key]) : BLOG_DEFAULTS[key];
  return { pageSize: bounded("pageSize", 4, 48), autoplayMs: bounded("autoplayMs", 3000, 20000), wordsPerMinute: bounded("wordsPerMinute", 50, 500), relatedCount: bounded("relatedCount", 1, 8), featuredId: Number.isSafeInteger(raw.featuredId) && Number(raw.featuredId) > 0 ? Number(raw.featuredId) : null };
}
export async function latestArticles(limit = 8) {
  return db.select(columns).from(a).innerJoin(c, eq(a.categoryId, c.id)).where(publicArticle).orderBy(desc(a.publishedAt), desc(a.id)).limit(limit);
}
export async function publicCategories() {
  return db.select({ id: c.id, slug: c.slug, title: c.title, data: c.data, updatedAt: c.updatedAt, total: sql<number>`(select count(*)::int from blog_articles ba where ba.category_id = ${c.id} and ba.status = 'published' and ba.published is not null)` }).from(c).where(and(eq(c.enabled, true), eq(c.archived, false))).orderBy(asc(c.sortOrder), asc(c.id));
}
export const articleById = cache(async (id: number) => {
  const [row] = await db.select({ ...columns, data: a.published }).from(a).innerJoin(c, eq(a.categoryId, c.id)).where(and(publicArticle, eq(a.id, id))).limit(1);
  return row?.data ? { ...row, data: row.data } : null;
});
export async function listArticles({ page = 1, query = "", categoryId }: { page?: number; query?: string; categoryId?: number } = {}) {
  const options = await blogOptions();
  const conditions: (SQL | undefined)[] = [publicArticle];
  if (categoryId) conditions.push(eq(c.id, categoryId));
  const q = normalizeSearch(query).slice(0, 100);
  if (q) conditions.push(sql`${a.searchText} like ${`%${q.replace(/[%_\\]/g, (v) => `\\${v}`)}%`}`);
  const where = and(...conditions);
  const [{ total }] = await db.select({ total: count() }).from(a).innerJoin(c, eq(a.categoryId, c.id)).where(where);
  let pinned: Awaited<ReturnType<typeof latestArticles>>[number] | null = null;
  if (!q && !categoryId && total) {
    if (options.featuredId) [pinned] = await db.select(columns).from(a).innerJoin(c, eq(a.categoryId, c.id)).where(and(where, eq(a.id, options.featuredId))).limit(1);
    if (!pinned) [pinned] = await latestArticles(1);
  }
  const items = await db.select(columns).from(a).innerJoin(c, eq(a.categoryId, c.id)).where(and(where, pinned ? ne(a.id, pinned.id) : undefined)).orderBy(desc(a.publishedAt), desc(a.id)).limit(options.pageSize - (pinned && page === 1 ? 1 : 0)).offset(Math.max(0, (page - 1) * options.pageSize - (pinned && page > 1 ? 1 : 0)));
  const featured = page === 1 ? pinned : null;
  if (featured) items.unshift(featured);
  return { items, featured, total, pages: Math.max(1, Math.ceil(total / options.pageSize)), options };
}
export async function relatedArticles(article: NonNullable<Awaited<ReturnType<typeof articleById>>>, limit: number) {
  const ids = article.data.relatedIds.filter((id) => id !== article.id);
  if (article.data.relatedMode === "manual" && !ids.length) return [];
  const rows = await db.select(columns).from(a).innerJoin(c, eq(a.categoryId, c.id)).where(and(publicArticle, ne(a.id, article.id), sql`coalesce((${a.published}->>'noindex')::boolean,false) = false`, article.data.relatedMode === "manual" ? inArray(a.id, ids) : sql`(${c.id} = ${article.categoryId} or (${a.published}->>'primaryServiceId')::int = ${article.data.primaryServiceId})`)).orderBy(desc(a.publishedAt), desc(a.id)).limit(article.data.relatedMode === "manual" ? 20 : limit);
  return (article.data.relatedMode === "manual" ? rows.sort((x, y) => ids.indexOf(x.id) - ids.indexOf(y.id)) : rows).slice(0, limit);
}
export async function blogSitemapRows() {
  return db.select({ slug: a.slug, modifiedAt: a.contentModifiedAt, canonicalUrl: sql<string>`${a.published}->>'canonicalUrl'` }).from(a).innerJoin(c, eq(a.categoryId, c.id)).where(and(publicArticle, sql`coalesce((${a.published}->>'noindex')::boolean,false) = false`)).orderBy(a.id);
}
