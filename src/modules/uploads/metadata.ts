import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { isSafeImageSrc } from "@/modules/blocks/schema";
import { UPLOAD_DIR, UploadError } from "./storage";
export async function storedImageSize(src: string) {
  if (!isSafeImageSrc(src)) throw new UploadError("تصویر معتبر نیست.");
  try {
    const buffer = await readFile(path.join(UPLOAD_DIR, path.basename(src)));
    const metadata = await sharp(buffer, { limitInputPixels: 40_000_000 }).metadata();
    if (!metadata.width || !metadata.height) throw new Error();
    const rotated = [5, 6, 7, 8].includes(metadata.orientation ?? 1);
    return { width: rotated ? metadata.height : metadata.width, height: rotated ? metadata.width : metadata.height };
  } catch { throw new UploadError("تصویر وجود ندارد یا قابل خواندن نیست؛ دوباره بارگذاری کنید."); }
}
