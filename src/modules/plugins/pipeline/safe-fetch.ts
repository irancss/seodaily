import { createHash } from "node:crypto";
import { lookup } from "node:dns";
import { createWriteStream } from "node:fs";
import { rm } from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import net, { BlockList } from "node:net";

// Outbound requests to admin-entered (untrusted) URLs: source pages, ZIPs,
// icons, changelogs. Only http(s) to public addresses; every DNS answer is
// checked and the socket connects to the checked address (no rebinding
// between check and connect); every redirect hop is checked again; time and
// size are capped. No cookies or credentials are ever sent.

export type FetchErrorCode = "blocked" | "invalid_url" | "timeout" | "too_large" | "http" | "redirects" | "network";

export class FetchError extends Error {
  readonly code: FetchErrorCode;
  readonly status: number;
  readonly retryAfterMs: number;
  constructor(message: string, code: FetchErrorCode, status = 0, retryAfterMs = 0) {
    super(message);
    this.code = code;
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

const denied = new BlockList();
for (const [net4, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15],
  ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) denied.addSubnet(net4, prefix, "ipv4");
for (const [net6, prefix] of [
  ["::", 128], ["::1", 128], ["100::", 64], ["2001::", 32], ["2001:db8::", 32], ["2002::", 16],
  ["fc00::", 7], ["fe80::", 10], ["fec0::", 10], ["ff00::", 8],
] as const) denied.addSubnet(net6, prefix, "ipv6");

/** Test-only exceptions (CIDR list); ignored in production unless running in CI. */
function testAllowList(): BlockList | null {
  const raw = process.env.PLUGIN_FETCH_ALLOW_PRIVATE_FOR_TESTS;
  if (!raw) return null;
  if (process.env.NODE_ENV === "production" && process.env.CI !== "true") return null;
  const list = new BlockList();
  for (const cidr of raw.split(",").map((s) => s.trim()).filter(Boolean)) {
    const [addr, bits] = cidr.split("/");
    const type = net.isIPv6(addr) ? "ipv6" : "ipv4";
    list.addSubnet(addr, Number(bits ?? (type === "ipv6" ? 128 : 32)), type);
  }
  return list;
}

/** IPv4-mapped / NAT64 IPv6 addresses carry an IPv4 address that is checked as such. */
function embeddedIPv4(ip: string): string | null {
  const m = /^(?:::ffff:|64:ff9b::)(\d+\.\d+\.\d+\.\d+)$/i.exec(ip);
  if (m) return m[1];
  const hex = /^(?:::ffff:|64:ff9b::)([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(ip);
  if (hex) {
    const a = parseInt(hex[1], 16);
    const b = parseInt(hex[2], 16);
    return `${a >> 8}.${a & 255}.${b >> 8}.${b & 255}`;
  }
  return null;
}

export function isPublicAddress(ip: string): boolean {
  const allow = testAllowList();
  const v4 = net.isIPv4(ip) ? ip : embeddedIPv4(ip);
  if (v4) return Boolean(allow?.check(v4, "ipv4")) || !denied.check(v4, "ipv4");
  if (!net.isIPv6(ip)) return false;
  if (/^(?:::ffff:|64:ff9b::)/i.test(ip)) return false; // mapped form we could not decode
  return Boolean(allow?.check(ip, "ipv6")) || !denied.check(ip, "ipv6");
}

type LookupCb = (err: NodeJS.ErrnoException | null, address: string | { address: string; family: number }[], family?: number) => void;

/** DNS lookup that refuses hostnames resolving to any non-public address. */
export function safeLookup(hostname: string, options: { all?: boolean }, cb: LookupCb) {
  lookup(hostname, { all: true }, (err, addresses) => {
    if (err) return cb(err, "");
    const list = addresses as { address: string; family: number }[];
    const bad = list.find((a) => !isPublicAddress(a.address));
    if (bad || list.length === 0) {
      const e = new Error(`blocked: ${hostname} resolves to a non-public address`) as NodeJS.ErrnoException;
      e.code = "EBLOCKED";
      return cb(e, "");
    }
    if (options?.all) return cb(null, list);
    cb(null, list[0].address, list[0].family);
  });
}

export function checkUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new FetchError("نشانی معتبر نیست.", "invalid_url");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new FetchError("فقط نشانی http یا https پذیرفته می‌شود.", "invalid_url");
  if (url.username || url.password) throw new FetchError("نشانی نباید نام کاربری یا رمز داشته باشد.", "invalid_url");
  const host = url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (net.isIP(host) && !isPublicAddress(host)) throw new FetchError("مقصد در شبکه خصوصی یا محلی است و مسدود شد.", "blocked");
  if (/^(localhost|.*\.localhost|.*\.local|.*\.internal|metadata\.google\.internal)$/i.test(host)) {
    throw new FetchError("مقصد محلی است و مسدود شد.", "blocked");
  }
  return url;
}

type Hop = { res: http.IncomingMessage; url: URL; abort: () => void };

async function open(raw: string, opts: { timeoutMs: number; headers?: Record<string, string>; maxRedirects: number; userAgent: string }): Promise<Hop> {
  let url = checkUrl(raw);
  const deadline = Date.now() + opts.timeoutMs;
  for (let hop = 0; ; hop++) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new FetchError("زمان درخواست تمام شد.", "timeout");
    const res = await new Promise<Hop>((resolve, reject) => {
      const mod = url.protocol === "https:" ? https : http;
      const req = mod.request(
        url,
        {
          method: "GET",
          agent: false,
          lookup: safeLookup as never,
          timeout: Math.min(remaining, 20_000),
          headers: { "user-agent": opts.userAgent, accept: "*/*", "accept-encoding": "identity", ...opts.headers },
        },
        (r) => resolve({ res: r, url, abort: () => req.destroy() }),
      );
      const timer = setTimeout(() => req.destroy(new FetchError("زمان درخواست تمام شد.", "timeout")), remaining);
      req.on("close", () => clearTimeout(timer));
      req.on("timeout", () => req.destroy(new FetchError("پاسخ مقصد دیر رسید.", "timeout")));
      req.on("error", (e: NodeJS.ErrnoException) => {
        clearTimeout(timer);
        if (e instanceof FetchError) reject(e);
        else if (e.code === "EBLOCKED") reject(new FetchError("مقصد به نشانی خصوصی/محلی resolve می‌شود و مسدود شد.", "blocked"));
        else reject(new FetchError(`خطای شبکه: ${e.code ?? e.message}`, "network"));
      });
      req.end();
    });
    const status = res.res.statusCode ?? 0;
    if (status >= 300 && status < 400 && status !== 304 && res.res.headers.location) {
      res.res.resume();
      res.abort();
      if (hop >= opts.maxRedirects) throw new FetchError("تعداد تغییر مسیرها بیش از حد است.", "redirects");
      url = checkUrl(new URL(res.res.headers.location, url).href);
      continue;
    }
    return res;
  }
}

function retryAfter(res: http.IncomingMessage) {
  const h = res.headers["retry-after"];
  if (!h) return 0;
  const s = Number(h);
  if (Number.isFinite(s)) return Math.min(s, 86400) * 1000;
  const d = Date.parse(String(h));
  return Number.isFinite(d) ? Math.max(0, Math.min(d - Date.now(), 86400_000)) : 0;
}

function httpError(res: http.IncomingMessage): FetchError {
  const status = res.statusCode ?? 0;
  const why =
    status === 401 || status === 403
      ? "دسترسی به این نشانی مجاز نیست (ورود/مجوز لازم است؛ دور زده نمی‌شود)."
      : status === 404
        ? "صفحه یا فایل پیدا نشد (۴۰۴)."
        : status === 429
          ? "مقصد تعداد درخواست را محدود کرده است (۴۲۹)."
          : `پاسخ HTTP ${status}.`;
  return new FetchError(why, "http", status, retryAfter(res));
}

export type TextResult = {
  status: number;
  url: string;
  text: string;
  contentType: string;
  etag: string;
  lastModified: string;
  notModified: boolean;
};

/** A page or JSON document, size-capped, with optional conditional headers. */
export async function fetchText(
  raw: string,
  opts: { timeoutMs: number; maxBytes: number; userAgent: string; etag?: string; lastModified?: string; accept?: string },
): Promise<TextResult> {
  const headers: Record<string, string> = {};
  if (opts.etag) headers["if-none-match"] = opts.etag;
  if (opts.lastModified) headers["if-modified-since"] = opts.lastModified;
  if (opts.accept) headers.accept = opts.accept;
  const { res, url, abort } = await open(raw, { timeoutMs: opts.timeoutMs, headers, maxRedirects: 5, userAgent: opts.userAgent });
  const meta = {
    status: res.statusCode ?? 0,
    url: url.href,
    contentType: String(res.headers["content-type"] ?? ""),
    etag: String(res.headers.etag ?? ""),
    lastModified: String(res.headers["last-modified"] ?? ""),
  };
  if (meta.status === 304) {
    res.resume();
    return { ...meta, text: "", notModified: true };
  }
  if (meta.status < 200 || meta.status >= 300) {
    res.resume();
    abort();
    throw httpError(res);
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of res) {
    size += (chunk as Buffer).length;
    if (size > opts.maxBytes) {
      abort();
      throw new FetchError("حجم پاسخ بیش از حد مجاز است.", "too_large");
    }
    chunks.push(chunk as Buffer);
  }
  return { ...meta, text: Buffer.concat(chunks).toString("utf8"), notModified: false };
}

export type FileResult = { url: string; bytes: number; sha256: string; contentType: string; head: Buffer };

/**
 * Streams a download into `dest` (a private temp path), hashing on the way.
 * On any failure the partial file is removed, so a crash-free half file never
 * survives; a crash leaves only a *.part file for the temp cleanup.
 */
export async function fetchToFile(raw: string, dest: string, opts: { timeoutMs: number; maxBytes: number; userAgent: string }): Promise<FileResult> {
  const { res, url, abort } = await open(raw, { timeoutMs: opts.timeoutMs, maxRedirects: 5, userAgent: opts.userAgent });
  const status = res.statusCode ?? 0;
  if (status < 200 || status >= 300) {
    res.resume();
    abort();
    throw httpError(res);
  }
  const declared = Number(res.headers["content-length"] ?? 0);
  if (declared > opts.maxBytes) {
    abort();
    throw new FetchError("حجم فایل بیش از سقف مجاز است.", "too_large");
  }
  const hash = createHash("sha256");
  const out = createWriteStream(dest, { flags: "wx", mode: 0o600 });
  let bytes = 0;
  const head: Buffer[] = [];
  let headLen = 0;
  const deadline = setTimeout(() => res.destroy(new FetchError("زمان دریافت فایل تمام شد.", "timeout")), opts.timeoutMs);
  try {
    for await (const chunk of res) {
      const buf = chunk as Buffer;
      bytes += buf.length;
      if (bytes > opts.maxBytes) throw new FetchError("حجم فایل بیش از سقف مجاز است.", "too_large");
      if (headLen < 512) {
        head.push(buf.subarray(0, 512 - headLen));
        headLen += Math.min(buf.length, 512 - headLen);
      }
      hash.update(buf);
      if (!out.write(buf)) await new Promise<void>((r) => out.once("drain", () => r()));
    }
    await new Promise<void>((resolve, reject) => out.end((e?: Error | null) => (e ? reject(e) : resolve())));
  } catch (error) {
    abort();
    out.destroy();
    await rm(dest, { force: true });
    if (error instanceof FetchError) throw error;
    throw new FetchError(`دریافت فایل قطع شد: ${(error as Error).message}`, "network");
  } finally {
    clearTimeout(deadline);
  }
  return { url: url.href, bytes, sha256: hash.digest("hex"), contentType: String(res.headers["content-type"] ?? ""), head: Buffer.concat(head) };
}

/** URL without query string and fragment, for logs (source URLs may carry tokens). */
export function redactUrl(raw: string): string {
  try {
    const u = new URL(raw);
    return `${u.origin}${u.pathname}${u.search ? "?…" : ""}`;
  } catch {
    return "(invalid url)";
  }
}
