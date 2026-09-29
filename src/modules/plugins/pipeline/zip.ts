import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { open, type FileHandle } from "node:fs/promises";
import { createInflateRaw, crc32, inflateRawSync } from "node:zlib";

import type { PluginHeader } from "@/db/plugins-schema";

import { isThemeStylesheet, parsePluginHeader, parseReadme, type Readme } from "./header";

// A small, strict ZIP reader for plugin packages. It never writes entries to
// disk: it walks the central directory, rejects anything unsafe (encryption,
// traversal, absolute/device paths, symlinks, duplicates, bombs), inflates
// every entry once in memory-bounded streams to check sizes and CRCs, and
// reads only the few text files it needs (main PHP header, readme.txt).

export class ZipError extends Error {}

export type ZipEntry = {
  name: string;
  method: number;
  flags: number;
  crc: number;
  compressedSize: number;
  size: number;
  offset: number;
  isDir: boolean;
  unixMode: number;
};

export type ZipLimits = { maxEntries: number; maxUnpackedBytes: number; maxRatio: number; timeoutMs?: number };

const RISKY_BINARY = /\.(exe|dll|so|dylib|bin|phar|sh|bat|cmd|com|msi|jar|elf)$/i;

async function readAt(fh: FileHandle, position: number, length: number) {
  const buf = Buffer.alloc(length);
  const { bytesRead } = await fh.read(buf, 0, length, position);
  if (bytesRead !== length) throw new ZipError("آرشیو ناقص است.");
  return buf;
}

/** Central-directory entries of a ZIP file (ZIP64 aware). */
export async function listEntries(file: string, fileSize: number, maxEntries: number): Promise<ZipEntry[]> {
  if (fileSize < 22) throw new ZipError("فایل ZIP نیست.");
  const fh = await open(file, "r");
  try {
    const tailLen = Math.min(fileSize, 65557);
    const tail = await readAt(fh, fileSize - tailLen, tailLen);
    let eocd = -1;
    for (let i = tail.length - 22; i >= 0; i--) {
      if (tail.readUInt32LE(i) === 0x06054b50) {
        eocd = i;
        break;
      }
    }
    if (eocd < 0) throw new ZipError("فایل ZIP معتبر نیست (پایان آرشیو پیدا نشد).");
    if (tail.readUInt16LE(eocd + 4) !== 0 || tail.readUInt16LE(eocd + 6) !== 0) throw new ZipError("آرشیو چندبخشی پشتیبانی نمی‌شود.");
    let count = tail.readUInt16LE(eocd + 10);
    let cdSize = tail.readUInt32LE(eocd + 12);
    let cdOffset = tail.readUInt32LE(eocd + 16);
    const eocdPos = fileSize - tailLen + eocd;
    if (count === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) {
      const locPos = eocdPos - 20;
      if (locPos < 0) throw new ZipError("ساختار ZIP64 نامعتبر است.");
      const loc = await readAt(fh, locPos, 20);
      if (loc.readUInt32LE(0) !== 0x07064b50) throw new ZipError("ساختار ZIP64 نامعتبر است.");
      const recPos = Number(loc.readBigUInt64LE(8));
      const rec = await readAt(fh, recPos, 56);
      if (rec.readUInt32LE(0) !== 0x06064b50) throw new ZipError("ساختار ZIP64 نامعتبر است.");
      count = Number(rec.readBigUInt64LE(32));
      cdSize = Number(rec.readBigUInt64LE(40));
      cdOffset = Number(rec.readBigUInt64LE(48));
    }
    if (count > maxEntries) throw new ZipError(`تعداد فایل‌های آرشیو (${count}) بیش از سقف مجاز است.`);
    if (cdOffset + cdSize > fileSize || cdSize > 64 * 1024 * 1024) throw new ZipError("فهرست آرشیو خراب است.");
    const cd = await readAt(fh, cdOffset, cdSize);
    const entries: ZipEntry[] = [];
    let p = 0;
    for (let i = 0; i < count; i++) {
      if (p + 46 > cd.length || cd.readUInt32LE(p) !== 0x02014b50) throw new ZipError("فهرست آرشیو خراب است.");
      const madeBy = cd.readUInt16LE(p + 4);
      const flags = cd.readUInt16LE(p + 8);
      const method = cd.readUInt16LE(p + 10);
      const crc = cd.readUInt32LE(p + 16);
      let compressedSize = cd.readUInt32LE(p + 20);
      let size = cd.readUInt32LE(p + 24);
      const nameLen = cd.readUInt16LE(p + 28);
      const extraLen = cd.readUInt16LE(p + 30);
      const commentLen = cd.readUInt16LE(p + 32);
      const external = cd.readUInt32LE(p + 38);
      let offset = cd.readUInt32LE(p + 42);
      const nameBuf = cd.subarray(p + 46, p + 46 + nameLen);
      const name = flags & 0x800 ? nameBuf.toString("utf8") : nameBuf.toString("latin1");
      // ZIP64 extra field carries the real sizes/offset when the 32-bit ones are saturated.
      let x = p + 46 + nameLen;
      const xEnd = x + extraLen;
      while (x + 4 <= xEnd) {
        const id = cd.readUInt16LE(x);
        const len = cd.readUInt16LE(x + 2);
        if (id === 0x0001) {
          let q = x + 4;
          if (size === 0xffffffff) {
            size = Number(cd.readBigUInt64LE(q));
            q += 8;
          }
          if (compressedSize === 0xffffffff) {
            compressedSize = Number(cd.readBigUInt64LE(q));
            q += 8;
          }
          if (offset === 0xffffffff) offset = Number(cd.readBigUInt64LE(q));
        }
        x += 4 + len;
      }
      const unixMode = madeBy >> 8 === 3 ? external >>> 16 : 0;
      entries.push({ name, method, flags, crc, compressedSize, size, offset, isDir: name.endsWith("/"), unixMode });
      p += 46 + nameLen + extraLen + commentLen;
    }
    return entries;
  } finally {
    await fh.close();
  }
}

/** Rejects names that could escape an extraction root or confuse tools. */
export function unsafeName(name: string): string | null {
  if (!name || name.length > 400) return "نام فایل نامعتبر";
  if (/[\u0000-\u001f]/.test(name)) return "کاراکتر کنترلی در نام فایل";
  if (name.includes("\\")) return "بک‌اسلش در مسیر";
  if (name.startsWith("/")) return "مسیر مطلق";
  if (/^[a-zA-Z]:/.test(name)) return "مسیر درایو ویندوز";
  const parts = name.replace(/\/$/, "").split("/");
  if (parts.some((s) => s === ".." || s === "." || s === "")) return "مسیر خارج از پوشه (traversal)";
  if (parts.some((s) => /^(con|prn|aux|nul|com\d|lpt\d)(\..*)?$/i.test(s))) return "نام دستگاه ویندوز";
  return null;
}

async function dataStart(fh: FileHandle, e: ZipEntry) {
  const h = await readAt(fh, e.offset, 30);
  if (h.readUInt32LE(0) !== 0x04034b50) throw new ZipError(`سرآیند فایل «${e.name}» خراب است.`);
  return e.offset + 30 + h.readUInt16LE(26) + h.readUInt16LE(28);
}

/** Inflates one entry as a stream: checks the real size against the declared one and the CRC. */
async function verifyEntry(file: string, fh: FileHandle, e: ZipEntry, budget: { left: number }, deadline: number): Promise<string> {
  const start = await dataStart(fh, e);
  const hash = createHash("sha256");
  if (e.compressedSize === 0 && e.size === 0) {
    if (e.crc !== 0) throw new ZipError(`CRC فایل «${e.name}» نادرست است.`);
    return hash.digest("hex");
  }
  const raw = createReadStream(file, { start, end: start + e.compressedSize - 1 });
  const stream = e.method === 8 ? raw.pipe(createInflateRaw()) : raw;
  let size = 0;
  let crc = 0;
  try {
    for await (const chunk of stream) {
      const buf = chunk as Buffer;
      size += buf.length;
      budget.left -= buf.length;
      if (size > e.size) throw new ZipError(`حجم واقعی «${e.name}» بیشتر از مقدار اعلام‌شده است (ZIP bomb).`);
      if (budget.left < 0) throw new ZipError("حجم بازشده آرشیو بیش از سقف مجاز است.");
      if (Date.now() > deadline) throw new ZipError("بررسی آرشیو بیش از زمان مجاز طول کشید.");
      crc = crc32(buf, crc);
      hash.update(buf);
    }
  } catch (error) {
    raw.destroy();
    if (error instanceof ZipError) throw error;
    throw new ZipError(`فایل «${e.name}» باز نشد: ${(error as Error).message}`);
  }
  if (size !== e.size) throw new ZipError(`حجم فایل «${e.name}» با فهرست آرشیو نمی‌خواند.`);
  if (crc >>> 0 !== e.crc >>> 0) throw new ZipError(`CRC فایل «${e.name}» نادرست است.`);
  return hash.digest("hex");
}

async function readSmall(fh: FileHandle, e: ZipEntry, max = 1024 * 1024): Promise<Buffer> {
  if (e.size > max) return Buffer.alloc(0);
  const start = await dataStart(fh, e);
  const data = await readAt(fh, start, e.compressedSize);
  if (e.method === 0) return data;
  return inflateRawSync(data, { maxOutputLength: Math.max(1, e.size) });
}

export type PackageReport = {
  folder: string;
  mainFile: string;
  header: PluginHeader;
  readme: Readme | null;
  fileCount: number;
  unpackedBytes: number;
  /** Plugin-relative path → SHA-256, for comparing with official checksums. */
  fileHashes: Record<string, string>;
  riskyBinaries: string[];
  warnings: string[];
};

/**
 * Validates a downloaded package and reads its plugin identity. Throws
 * ZipError (with a Persian reason) for anything that must not go further.
 */
export async function inspectPackage(file: string, fileSize: number, limits: ZipLimits): Promise<PackageReport> {
  const head = Buffer.alloc(4);
  {
    const fh = await open(file, "r");
    try {
      await fh.read(head, 0, 4, 0);
    } finally {
      await fh.close();
    }
  }
  if (head.readUInt32LE(0) !== 0x04034b50) {
    const text = head.toString("latin1").toLowerCase();
    throw new ZipError(text.startsWith("<") || text.startsWith("\ufeff<") ? "به‌جای ZIP یک صفحه HTML دریافت شد." : "فایل دریافتی ZIP نیست.");
  }
  const entries = await listEntries(file, fileSize, limits.maxEntries);
  if (entries.length === 0) throw new ZipError("آرشیو خالی است.");

  const seen = new Set<string>();
  let declared = 0;
  for (const e of entries) {
    const bad = unsafeName(e.name);
    if (bad) throw new ZipError(`مسیر ناامن در آرشیو (${bad}): ${e.name.slice(0, 120)}`);
    if (e.flags & 0x1) throw new ZipError("آرشیو رمزدار است و پذیرفته نمی‌شود.");
    const type = e.unixMode & 0o170000;
    if (type === 0o120000) throw new ZipError(`لینک نمادین (symlink) در آرشیو: ${e.name.slice(0, 120)}`);
    if (type && type !== 0o100000 && type !== 0o040000) throw new ZipError(`فایل ویژه/دستگاه در آرشیو: ${e.name.slice(0, 120)}`);
    if (!e.isDir && e.method !== 0 && e.method !== 8) throw new ZipError(`روش فشرده‌سازی ناشناخته در «${e.name.slice(0, 120)}».`);
    const key = e.name.replace(/\/$/, "").normalize("NFC").toLowerCase();
    if (seen.has(key)) throw new ZipError(`نام تکراری در آرشیو: ${e.name.slice(0, 120)}`);
    seen.add(key);
    declared += e.size;
    if (e.size > 1024 * 1024 && e.compressedSize > 0 && e.size / e.compressedSize > limits.maxRatio) {
      throw new ZipError(`نسبت فشرده‌سازی «${e.name.slice(0, 120)}» غیرعادی است (ZIP bomb).`);
    }
  }
  if (declared > limits.maxUnpackedBytes) throw new ZipError("حجم بازشده آرشیو بیش از سقف مجاز است.");
  if (declared > 10 * 1024 * 1024 && declared / Math.max(1, fileSize) > limits.maxRatio) throw new ZipError("نسبت فشرده‌سازی کل آرشیو غیرعادی است (ZIP bomb).");

  // A plugin package is one folder: folder/main-file.php (+ everything else inside it).
  const tops = new Set(entries.map((e) => e.name.split("/")[0]));
  const files = entries.filter((e) => !e.isDir);
  if (tops.size !== 1 || files.some((e) => !e.name.includes("/"))) {
    const zips = files.filter((e) => /\.zip$/i.test(e.name));
    if (zips.length > 0) throw new ZipError("بسته شامل ZIP تودرتو است؛ لینک مستقیم خود فایل افزونه را در منبع تنظیم کنید.");
    throw new ZipError("ساختار بسته افزونه نیست (همه فایل‌ها باید داخل یک پوشه باشند).");
  }
  const folder = [...tops][0];

  const fh = await open(file, "r");
  const report: PackageReport = {
    folder,
    mainFile: "",
    header: {},
    readme: null,
    fileCount: files.length,
    unpackedBytes: declared,
    fileHashes: {},
    riskyBinaries: [],
    warnings: [],
  };
  try {
    const deadline = Date.now() + (limits.timeoutMs ?? 120_000);
    const budget = { left: limits.maxUnpackedBytes };
    for (const e of files) {
      const sha = await verifyEntry(file, fh, e, budget, deadline);
      report.fileHashes[e.name.slice(folder.length + 1)] = sha;
      if (RISKY_BINARY.test(e.name)) report.riskyBinaries.push(e.name.slice(folder.length + 1));
    }

    const rootPhp = files.filter((e) => /^[^/]+\/[^/]+\.php$/i.test(e.name)).slice(0, 60);
    const withHeader: { e: ZipEntry; header: PluginHeader }[] = [];
    for (const e of rootPhp) {
      const header = parsePluginHeader((await readSmall(fh, e, 2 * 1024 * 1024)).subarray(0, 8192).toString("utf8"));
      if (header.pluginName) withHeader.push({ e, header });
    }
    if (withHeader.length === 0) {
      const style = files.find((e) => e.name === `${folder}/style.css`);
      if (style && isThemeStylesheet((await readSmall(fh, style)).toString("utf8"))) throw new ZipError("این بسته قالب وردپرس است، نه افزونه.");
      throw new ZipError("فایل اصلی افزونه (سرآیند Plugin Name) پیدا نشد.");
    }
    const main = withHeader.find((w) => w.e.name === `${folder}/${folder}.php`) ?? withHeader.sort((a, b) => a.e.name.localeCompare(b.e.name))[0];
    if (withHeader.length > 1) report.warnings.push(`چند فایل سرآیند افزونه در ریشه بسته هست؛ «${main.e.name}» فایل اصلی فرض شد.`);
    report.mainFile = main.e.name.slice(folder.length + 1);
    report.header = { ...main.header, mainFile: report.mainFile, folder };

    const readme = files.find((e) => e.name.toLowerCase() === `${folder.toLowerCase()}/readme.txt`);
    if (readme) report.readme = parseReadme((await readSmall(fh, readme)).toString("utf8"));
  } finally {
    await fh.close();
  }
  return report;
}
