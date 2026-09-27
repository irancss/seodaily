import "server-only";

import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// A runtime volume, not part of the build: keep the bundler from tracing it.
export const UPLOAD_DIR = path.resolve(
  /*turbopackIgnore: true*/ process.env.UPLOAD_DIR ?? path.join(/*turbopackIgnore: true*/ process.cwd(), "uploads"),
);
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
};

// Magic numbers, so a renamed file cannot pass as an image.
function sniff(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (buf.toString("ascii", 4, 12) === "ftypavif") return "image/avif";
  if (buf.toString("ascii", 0, 3) === "GIF") return "image/gif";
  return null;
}

export class UploadError extends Error {}

/** Saves an uploaded image and returns its public URL (/uploads/…), or null when no file was chosen. */
export async function saveImage(file: FormDataEntryValue | null): Promise<string | null> {
  if (!file || typeof file === "string" || file.size === 0) return null;
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("حجم تصویر باید کمتر از ۵ مگابایت باشد.");
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type) throw new UploadError("فقط تصاویر JPG، PNG، WebP، AVIF یا GIF پذیرفته می‌شوند.");

  // Random, never-reused names let the files be cached as immutable.
  const name = `${Date.now().toString(36)}-${randomBytes(8).toString("hex")}${TYPES[type]}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), buf);
  return `/uploads/${name}`;
}

export async function deleteImage(url: string | null | undefined) {
  if (!url?.startsWith("/uploads/")) return;
  const name = path.basename(url);
  await unlink(path.join(UPLOAD_DIR, name)).catch(() => {});
}

export function contentTypeFor(file: string) {
  const ext = path.extname(file).toLowerCase();
  return Object.entries(TYPES).find(([, e]) => e === ext)?.[0] ?? (ext === ".jpeg" ? "image/jpeg" : null);
}
