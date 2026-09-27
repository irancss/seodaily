import "server-only";

import { asc } from "drizzle-orm";

import { db, schema } from "@/db";

/** Every team member, hidden ones included. */
export async function listTeamMembers() {
  return db.select().from(schema.teamMembers).orderBy(asc(schema.teamMembers.sortOrder), asc(schema.teamMembers.id));
}
