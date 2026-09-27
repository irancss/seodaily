import "server-only";

import { asc, eq } from "drizzle-orm";
import { cached } from "@/lib/cache";

import { db, schema } from "@/db";

const { teamMembers } = schema;

export const getTeam = cached(
  () =>
    db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.published, true))
      .orderBy(asc(teamMembers.sortOrder), asc(teamMembers.id)),
  "data:team",
);
