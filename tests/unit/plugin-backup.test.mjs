import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { verifyFiles } from "../../scripts/verify-plugin-files.mjs";

test("restored plugin bytes must exist and match both length and SHA-256", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "plugin-restore-"));
  const bytes = Buffer.from("original fixture"), sha256 = createHash("sha256").update(bytes).digest("hex");
  const storage_key = `objects/${sha256.slice(0, 2)}/${sha256}.zip`;
  const rows = [{ id: 1, storage_key, sha256, bytes: bytes.length }];
  try {
    await mkdir(path.dirname(path.join(root, storage_key)), { recursive: true });
    await assert.rejects(verifyFiles(rows, root), /ENOENT/);
    await writeFile(path.join(root, storage_key), bytes);
    assert.equal(await verifyFiles(rows, root), 1);
    await writeFile(path.join(root, storage_key), Buffer.alloc(bytes.length));
    await assert.rejects(verifyFiles(rows, root), /Hash mismatch/);
    await assert.rejects(verifyFiles([{ ...rows[0], storage_key: "../other.zip" }], root), /Invalid storage key/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
