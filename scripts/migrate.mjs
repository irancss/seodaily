// Applies the SQL migrations in ./drizzle. Runs on every container start;
// already-applied migrations are skipped.
import path from "node:path";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sql = postgres(url, { max: 1, onnotice: () => {} });

// The database container may still be starting when the app boots.
for (let attempt = 1; ; attempt++) {
  try {
    await sql`select 1`;
    break;
  } catch (error) {
    if (attempt >= 30) throw error;
    console.log(`waiting for database (${attempt})...`);
    await new Promise((r) => setTimeout(r, 2000));
  }
}

await migrate(drizzle(sql), { migrationsFolder: path.join(root, "drizzle") });
console.log("migrations applied");
await sql.end();
