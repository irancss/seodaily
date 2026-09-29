import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { looseSlugFromPath } from "@/modules/slugs/normalize";
import { resolveSlug } from "@/modules/slugs/registry";
export async function blogRoute(segment: string) {
  const slug = looseSlugFromPath(segment); if (!slug) return null;
  const route = await resolveSlug("blog", slug); if (!route) return null;
  const current = route.kind === "alias" ? route.currentSlug : route.slug;
  if (route.entityType === "article") {
    const [row] = await db.select({ id: schema.articles.id }).from(schema.articles).innerJoin(schema.blogCategories, eq(schema.articles.categoryId, schema.blogCategories.id)).where(and(eq(schema.articles.id, route.entityId), eq(schema.articles.status, "published"), eq(schema.blogCategories.enabled, true), eq(schema.blogCategories.archived, false)));
    if (!row) return null;
  } else if (route.entityType === "blog_category") {
    const [row] = await db.select({ id: schema.blogCategories.id }).from(schema.blogCategories).where(and(eq(schema.blogCategories.id, route.entityId), eq(schema.blogCategories.enabled, true), eq(schema.blogCategories.archived, false)));
    if (!row) return null;
  } else return null;
  return { id: route.entityId, type: route.entityType, slug: current, redirect: route.kind === "alias" || segment !== current };
}
