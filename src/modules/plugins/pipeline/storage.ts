import { randomBytes } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readdir, rename, rm, stat, statfs } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

// Private, persistent package storage (never under public/ or in Git):
//   <root>/tmp/<random>.part      downloads in progress (temp TTL cleanup)
//   <root>/objects/<aa>/<sha>.zip immutable, content-addressed packages
// A package is only ever served when its release row says so; the files
// themselves carry no state.

export function objectKey(sha256: string) {
  if (!/^[a-f0-9]{64}$/.test(sha256)) throw new Error("invalid sha256");
  return `objects/${sha256.slice(0, 2)}/${sha256}.zip`;
}

/** Absolute path of a storage key, refusing anything that is not an object key. */
export function objectPath(root: string, key: string) {
  if (!/^objects\/[a-f0-9]{2}\/[a-f0-9]{64}\.zip$/.test(key)) throw new Error("invalid storage key");
  return path.join(root, key);
}

export async function tempPath(root: string) {
  const dir = path.join(root, "tmp");
  await mkdir(dir, { recursive: true, mode: 0o700 });
  return path.join(dir, `${Date.now().toString(36)}-${randomBytes(8).toString("hex")}.part`);
}

/** Moves a verified temp file into the object store (atomic rename on the same volume). */
export async function commitObject(root: string, temp: string, sha256: string) {
  const key = objectKey(sha256);
  const dest = objectPath(root, key);
  await mkdir(path.dirname(dest), { recursive: true, mode: 0o700 });
  try {
    await stat(dest);
    await rm(temp, { force: true }); // identical bytes already stored
  } catch {
    await rename(temp, dest);
  }
  return key;
}

export async function sha256File(file: string) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk as Buffer);
  return hash.digest("hex");
}

export async function freeBytes(root: string) {
  await mkdir(root, { recursive: true, mode: 0o700 });
  const s = await statfs(root);
  return Number(s.bavail) * Number(s.bsize);
}

/** Removes temp files older than the TTL; returns how many were removed. */
export async function cleanTemp(root: string, ttlMs: number) {
  const dir = path.join(root, "tmp");
  let removed = 0;
  let names: string[] = [];
  try {
    names = await readdir(dir);
  } catch {
    return 0;
  }
  for (const name of names) {
    const file = path.join(dir, name);
    try {
      if (Date.now() - (await stat(file)).mtimeMs > ttlMs) {
        await rm(file, { force: true });
        removed++;
      }
    } catch {
      /* vanished meanwhile */
    }
  }
  return removed;
}

export async function removeObject(root: string, key: string) {
  await rm(objectPath(root, key), { force: true });
}
