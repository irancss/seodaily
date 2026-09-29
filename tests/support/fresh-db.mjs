// A migrated throwaway database for integration tests, created next to
// DATABASE_URL and dropped when the test file ends. Must run before the app
// modules are imported: src/db reads DATABASE_URL once, at import.
import { execFileSync } from "node:child_process";
import { after } from "node:test";

import postgres from "postgres";

export async function freshDatabase(prefix) {
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error("Set DATABASE_URL (a disposable server; test databases are created next to it).");
  const admin = postgres(base, { max: 1, onnotice: () => {} });
  const name = `${prefix}_${Date.now().toString(36)}_${process.pid}`;
  await admin.unsafe(`create database ${name}`);
  const url = new URL(base);
  url.pathname = `/${name}`;
  execFileSync("node", ["scripts/migrate.mjs"], { env: { ...process.env, DATABASE_URL: url.toString() }, stdio: "pipe" });
  process.env.DATABASE_URL = url.toString();
  const sql = postgres(url.toString(), { max: 4, onnotice: () => {} });
  after(async () => {
    await sql.end();
    // Let the app pool go first, then drop (retrying past autovacuum on a non-superuser role).
    for (let attempt = 1; ; attempt++) {
      try {
        await admin.unsafe(`drop database if exists ${name} with (force)`);
        break;
      } catch (error) {
        if (error.code !== "42501" || attempt >= 10) throw error;
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    await admin.end();
  });
  return sql;
}
