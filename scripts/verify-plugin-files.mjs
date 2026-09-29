import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { lstat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

/** Check restored metadata against restored bytes, never against production. */
export async function verifyFiles(rows, root) {
  for (const r of rows) {
    if (!/^objects\/[a-f0-9]{2}\/[a-f0-9]{64}\.zip$/.test(r.storage_key) || !r.storage_key.endsWith(`${r.sha256}.zip`)) throw new Error(`Invalid storage key for release ${r.id}`);
    const file = path.join(root, r.storage_key);
    const meta = await lstat(file);
    if (!meta.isFile() || meta.size !== Number(r.bytes)) throw new Error(`Missing/invalid bytes for release ${r.id}`);
    const hash = createHash("sha256");
    for await (const chunk of createReadStream(file)) hash.update(chunk);
    if (hash.digest("hex") !== r.sha256) throw new Error(`Hash mismatch for release ${r.id}`);
  }
  return rows.length;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const url = new URL(process.env.DATABASE_URL);
  if (process.env.CHECK_DATABASE) url.pathname = `/${process.env.CHECK_DATABASE}`;
  const sql = postgres(url.href, { max: 1 });
  try {
    const rows = await sql`select id,storage_key,sha256,bytes from plugin_releases where file_deleted_at is null and state in ('candidate','review','published','retired')`;
    const n = await verifyFiles(rows, process.env.CHECK_FILES_DIR || process.env.PLUGIN_FILES_DIR || "/app/plugin-files");
    console.log(`Verified ${n} retained plugin files against database hashes`);
  } finally { await sql.end(); }
}
