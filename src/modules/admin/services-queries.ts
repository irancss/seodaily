import "server-only";

import { asc, eq } from "drizzle-orm";

import { db, schema } from "@/db";

export async function listCategories() {
  return db.select().from(schema.categories).orderBy(asc(schema.categories.sortOrder));
}

/** Every service, drafts included. */
export async function listServices() {
  return db.select().from(schema.services).orderBy(asc(schema.services.sortOrder), asc(schema.services.id));
}

/** Slug/title pairs for the related-services picker. */
export async function listServiceOptions() {
  return db.select({ slug: schema.services.slug, title: schema.services.title }).from(schema.services);
}

export async function getService(id: number) {
  return db.query.services.findFirst({ where: eq(schema.services.id, id) });
}
