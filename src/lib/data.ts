import "server-only";

import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { db, schema } from "@/db";
import type { FaqPage } from "@/db/schema";

import { cached } from "./cache";

const { services, projects, faqs, categories, teamMembers } = schema;

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

export const getPublishedProjects = cached(
  () =>
    db
      .select()
      .from(projects)
      .where(eq(projects.published, true))
      .orderBy(desc(projects.featured), asc(projects.sortOrder), desc(projects.id)),
  "data:projects",
);

export const getProjectBySlug = cached(async (slug: string) => {
  const [row] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.slug, slug), eq(projects.published, true)))
    .limit(1);
  return row ?? null;
}, "data:project");

export const getFaqs = cached(
  (page: FaqPage) =>
    db.select().from(faqs).where(eq(faqs.page, page)).orderBy(asc(faqs.sortOrder), asc(faqs.id)),
  "data:faqs",
);

export const getTeam = cached(
  () =>
    db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.published, true))
      .orderBy(asc(teamMembers.sortOrder), asc(teamMembers.id)),
  "data:team",
);

export function serviceHref(slug: string) {
  return `/services/${encodeURIComponent(slug)}`;
}

export function projectHref(slug: string) {
  return `/portfolio/${encodeURIComponent(slug)}`;
}

/** Route params arrive percent-encoded for non-ASCII (e.g. Persian) slugs. */
export function decodeSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}
