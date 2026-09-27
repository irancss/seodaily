import "server-only";

import { asc, desc, eq } from "drizzle-orm";

import { db, schema } from "@/db";

/** Every project, drafts included, in site order (featured first). */
export async function listProjects() {
  return db
    .select()
    .from(schema.projects)
    .orderBy(desc(schema.projects.featured), asc(schema.projects.sortOrder), desc(schema.projects.id));
}

export async function getProject(id: number) {
  return db.query.projects.findFirst({ where: eq(schema.projects.id, id) });
}
