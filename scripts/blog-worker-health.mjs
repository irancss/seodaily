// Read-only deployment proof: the deployed worker has successfully polled blog schedules.
import postgres from "postgres";
const db = postgres(process.env.DATABASE_URL, { max: 1 });
try {
  let ready = false;
  for (let i = 0; i < 12; i++) {
    const rows = await db`select version from worker_heartbeats where version=${process.env.APP_VERSION || "dev"} and seen_at > now() - interval '2 minutes' and (health->>'blogSchedulerAt')::timestamptz > now() - interval '2 minutes' limit 1`;
    if (rows.length) { ready = true; break; }
    await new Promise((r) => setTimeout(r, 5000));
  }
  if (!ready) throw new Error("No current blog scheduler heartbeat for the deployed version");
  console.log("Blog scheduler: current-version heartbeat verified (read-only)");
} finally { await db.end(); }
