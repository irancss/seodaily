import { sql } from "drizzle-orm";

import { db } from "@/db";

export const dynamic = "force-dynamic";

const version = process.env.APP_VERSION || "dev";

/** Liveness + database check for the container healthcheck; `version` is the deployed commit. */
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ status: "ok", version }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "error", database: "unreachable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
