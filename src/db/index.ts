import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";

const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };

function client() {
  // postgres() connects lazily, so a missing URL only fails on the first query —
  // which keeps `next build` working without a database.
  // A short connect timeout makes pages fail fast (and show the error page)
  // instead of hanging for the driver's default 30 s when the DB is down.
  return postgres(process.env.DATABASE_URL ?? "postgres://localhost:5432/seodaily", { max: 10, connect_timeout: 5 });
}

// Reuse one pool across hot reloads in development.
const sql = globalForDb.sql ?? client();
if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;

export const db = drizzle(sql, { schema });
export { schema };
