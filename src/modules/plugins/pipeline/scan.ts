import { createReadStream } from "node:fs";
import net from "node:net";

import type { ReleaseCheck } from "@/db/plugins-schema";

// ClamAV through clamd's INSTREAM protocol (a separate, optional service).
// Anything short of a complete, fresh scan is not a PASS: no engine, stale
// signatures, a timeout or a size-limit error are UNAVAILABLE, a detection
// is FAIL. Files never go to a public scanning service.

export type ScannerHealth = { available: boolean; engine: string; signatures: string; signatureDate: string; ageHours: number | null; error: string };

function command(host: string, port: number, timeoutMs: number, write: (s: net.Socket) => Promise<void> | void): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    const chunks: Buffer[] = [];
    const timer = setTimeout(() => socket.destroy(new Error("timeout")), timeoutMs);
    socket.on("connect", () => {
      Promise.resolve(write(socket)).catch((e) => socket.destroy(e));
    });
    socket.on("data", (d) => chunks.push(d));
    socket.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    socket.on("close", () => {
      clearTimeout(timer);
      resolve(Buffer.concat(chunks).toString("utf8").replace(/\0/g, "").trim());
    });
  });
}

/** "ClamAV 1.3.1/27410/Mon Sep 28 08:24:02 2026" → engine, signature version and age. */
export async function scannerHealth(host: string, port: number, maxAgeH: number): Promise<ScannerHealth> {
  const none: ScannerHealth = { available: false, engine: "", signatures: "", signatureDate: "", ageHours: null, error: "" };
  if (!host) return { ...none, error: "اسکنر ClamAV پیکربندی نشده است (CLAMD_HOST)." };
  try {
    const reply = await command(host, port, 5000, (s) => void s.end("zVERSION\0"));
    const [engine = "", signatures = "", date = ""] = reply.split("/");
    const at = Date.parse(date);
    const ageHours = Number.isFinite(at) ? Math.round((Date.now() - at) / 3600_000) : null;
    const health = { available: true, engine, signatures, signatureDate: Number.isFinite(at) ? new Date(at).toISOString() : "", ageHours, error: "" };
    if (ageHours === null) return { ...health, available: false, error: "تاریخ امضاهای ClamAV خوانده نشد." };
    if (ageHours > maxAgeH) return { ...health, available: false, error: `امضاهای ClamAV ${ageHours} ساعت قدیمی است (سقف ${maxAgeH}).` };
    return health;
  } catch (error) {
    return { ...none, error: `اتصال به clamd برقرار نشد: ${(error as Error).message}` };
  }
}

export async function scanFile(file: string, sha256: string, opts: { host: string; port: number; timeoutMs: number; maxAgeH: number }): Promise<ReleaseCheck> {
  const at = new Date().toISOString();
  const health = await scannerHealth(opts.host, opts.port, opts.maxAgeH);
  if (!health.available) return { status: "UNAVAILABLE", detail: health.error, at };
  let reply: string;
  try {
    reply = await command(opts.host, opts.port, opts.timeoutMs, async (s) => {
      s.write("zINSTREAM\0");
      for await (const chunk of createReadStream(file, { highWaterMark: 64 * 1024 })) {
        const len = Buffer.alloc(4);
        len.writeUInt32BE((chunk as Buffer).length);
        if (!s.write(Buffer.concat([len, chunk as Buffer]))) await new Promise<void>((r) => s.once("drain", () => r()));
      }
      s.end(Buffer.alloc(4));
    });
  } catch (error) {
    return { status: "UNAVAILABLE", detail: `اسکن کامل نشد: ${(error as Error).message}`, at };
  }
  const engine = `${health.engine} / امضا ${health.signatures} (${health.ageHours} ساعت پیش)`;
  if (/^stream: OK$/.test(reply)) return { status: "PASS", detail: `بدون یافته در ${engine}؛ SHA-256 ${sha256.slice(0, 16)}…. این نتیجه گواهی امنیت کامل نیست.`, at };
  const found = /^stream: (.+) FOUND$/.exec(reply);
  if (found) {
    // Heuristics.Limits.Exceeded means clamd skipped content: not a clean result.
    if (/Limits?\.Exceeded|Heuristics\.Limits/i.test(found[1])) return { status: "UNAVAILABLE", detail: `اسکن ناقص (سقف clamd): ${found[1]}`, at };
    return { status: "FAIL", detail: `ClamAV یافته گزارش کرد: ${found[1].slice(0, 200)} (${engine})`, at };
  }
  return { status: "UNAVAILABLE", detail: `پاسخ نامعلوم clamd: ${reply.slice(0, 200)}`, at };
}
