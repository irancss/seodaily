"use server";
import { readdir } from "node:fs/promises";
import { requireAdmin } from "@/modules/auth/session";
import { isSafeImageSrc } from "@/modules/blocks/schema";
import { UPLOAD_DIR } from "./storage";
import { storedImageSize } from "./metadata";
export async function listMedia(page = 1) {
  await requireAdmin(); const n = Math.max(1, Math.min(1000, Number(page) || 1));
  const files = (await readdir(UPLOAD_DIR).catch(() => [] as string[])).filter((f) => isSafeImageSrc(`/uploads/${f}`)).sort().reverse();
  return { images: files.slice((n - 1) * 12, n * 12).map((f) => `/uploads/${f}`), more: n * 12 < files.length };
}
export async function selectMedia(src: string) { await requireAdmin(); return { src, ...await storedImageSize(src) }; }
