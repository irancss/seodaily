import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";
import { cached } from "@/lib/cache";

import { db, schema } from "@/db";

const { projects } = schema;

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
