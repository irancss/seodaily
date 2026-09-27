import "server-only";

import { db, schema } from "@/db";

const DEFAULT_TYPES = ["طراحی سایت", "فروشگاهی", "شرکتی", "خدماتی"];

export async function projectTypes() {
  const rows = await db.selectDistinct({ t: schema.projects.projectType }).from(schema.projects);
  return [...new Set([...DEFAULT_TYPES, ...rows.map((r) => r.t).filter(Boolean)])];
}
