import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";
import { cached } from "@/lib/cache";

import { db, schema } from "@/db";

const { services, categories } = schema;

export const getCategories = cached(
  () => db.select().from(categories).orderBy(asc(categories.sortOrder)),
  "data:categories",
);

export async function getCategory(slug: string) {
  return (await getCategories()).find((c) => c.slug === slug) ?? null;
}

export const getServicesByCategory = cached(
  (category: string) =>
    db
      .select()
      .from(services)
      .where(and(eq(services.category, category), eq(services.published, true)))
      .orderBy(asc(services.sortOrder), asc(services.id)),
  "data:services-by-category",
);

export const getServiceBySlug = cached(async (slug: string) => {
  const [row] = await db
    .select()
    .from(services)
    .where(and(eq(services.slug, slug), eq(services.published, true)))
    .limit(1);
  return row ?? null;
}, "data:service");

export const getServicesBySlugs = cached(async (slugs: string[]) => {
  if (slugs.length === 0) return [];
  const rows = await db
    .select()
    .from(services)
    .where(and(inArray(services.slug, slugs), eq(services.published, true)));
  return slugs.map((s) => rows.find((r) => r.slug === s)).filter((r) => r !== undefined);
}, "data:services-by-slugs");

export const getAllPublishedServices = cached(
  () =>
    db
      .select({ slug: services.slug, updatedAt: services.updatedAt })
      .from(services)
      .where(eq(services.published, true)),
  "data:all-services",
);
