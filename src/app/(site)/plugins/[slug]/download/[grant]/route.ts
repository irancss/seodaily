import { open } from "node:fs/promises";

import { clientIp } from "@/lib/rate-limit";
import { ipHash } from "@/modules/downloads/config";
import { downloadConfig } from "@/modules/downloads/config";
import { authorizeFile, GrantError, markFailed, markServed, type Authorized } from "@/modules/downloads/grants";
import { getDownloadSession } from "@/modules/downloads/session";
import { pipelineConfig } from "@/modules/plugins/pipeline/config";
import { objectPath } from "@/modules/plugins/pipeline/storage";

export const dynamic = "force-dynamic";

// Controlled file delivery. The package path is never in the URL; the grant
// id is useless without the session cookie it belongs to. Files are streamed
// from the private store with backpressure (never read whole into memory),
// with single-range resume. HEAD never starts or counts a download.

const BOT = /bot|crawler|spider|monitor|uptime|headless|lighthouse|preview/i;

const PRIVATE_HEADERS = {
  "cache-control": "private, no-store",
  "x-robots-tag": "noindex, nofollow",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
};

function errorResponse(error: unknown) {
  if (error instanceof GrantError) {
    return new Response(error.message, {
      status: error.status,
      headers: { ...PRIVATE_HEADERS, "content-type": "text/plain; charset=utf-8", ...(error.retryAfterS ? { "retry-after": String(error.retryAfterS) } : {}) },
    });
  }
  throw error;
}

function fileName(a: Authorized) {
  const base = (a.release.header.folder || a.pluginSlug).replace(/[^A-Za-z0-9._-]/g, "") || "plugin";
  const version = a.release.sourceVersion.replace(/[^A-Za-z0-9._-]/g, "");
  return `${base}${version ? `-${version}` : ""}.zip`;
}

function parseRange(header: string | null, size: number): { start: number; end: number } | "invalid" | null {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (!m[1] && !m[2])) return "invalid";
  let start: number;
  let end: number;
  if (!m[1]) {
    start = Math.max(0, size - Number(m[2]));
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  }
  return start > end || start >= size ? "invalid" : { start, end };
}

async function handle(request: Request, params: Promise<{ grant: string }>, head: boolean) {
  const { grant } = await params;
  const session = await getDownloadSession();
  if (!session) return new Response("برای دانلود ابتدا شماره موبایل را در صفحه افزونه تأیید کنید.", { status: 403, headers: { ...PRIVATE_HEADERS, "content-type": "text/plain; charset=utf-8" } });
  let a: Authorized;
  try {
    a = await authorizeFile({ grantId: grant, sessionId: session.sessionId, ipHash: ipHash(await clientIp()), start: !head });
  } catch (error) {
    return errorResponse(error);
  }
  const path = objectPath(pipelineConfig().filesDir, a.release.storageKey);
  let fh;
  try {
    fh = await open(path, "r");
  } catch {
    await markFailed(a, 0, "file missing");
    return new Response("فایل این نسخه روی سرور پیدا نشد. به مدیر سایت اطلاع داده شد.", { status: 503, headers: { ...PRIVATE_HEADERS, "content-type": "text/plain; charset=utf-8" } });
  }
  const size = (await fh.stat()).size;
  const range = parseRange(request.headers.get("range"), size);
  const name = fileName(a);
  const common = {
    ...PRIVATE_HEADERS,
    "content-type": "application/zip",
    "content-disposition": `attachment; filename="${name}"`,
    "accept-ranges": "bytes",
    etag: `"${a.release.sha256}"`,
    "x-accel-buffering": "no",
  };
  if (range === "invalid") {
    await fh.close();
    return new Response(null, { status: 416, headers: { ...common, "content-range": `bytes */${size}` } });
  }
  // A resume must be of the same file (If-Range with our ETag, when sent).
  const ifRange = request.headers.get("if-range");
  const r = range && (!ifRange || ifRange === `"${a.release.sha256}"`) ? range : null;
  const start = r?.start ?? 0;
  const end = r?.end ?? size - 1;
  const headers = { ...common, "content-length": String(end - start + 1), ...(r ? { "content-range": `bytes ${start}-${end}/${size}` } : {}) };
  if (head) {
    await fh.close();
    return new Response(null, { status: r ? 206 : 200, headers });
  }

  const ua = request.headers.get("user-agent") ?? "";
  const notCounted = downloadConfig().testPhones.includes(session.phone) ? "test number" : BOT.test(ua) ? "automated client" : undefined;
  let position = start;
  let sent = 0;
  const chunk = 64 * 1024;
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const length = Math.min(chunk, end - position + 1);
        if (length <= 0) {
          await fh.close();
          controller.close();
          // The last byte of the file left the server with this response.
          if (end === size - 1) await markServed(a, sent, { notCounted });
          return;
        }
        const buf = Buffer.alloc(length);
        const { bytesRead } = await fh.read(buf, 0, length, position);
        if (bytesRead === 0) throw new Error("unexpected end of file");
        position += bytesRead;
        sent += bytesRead;
        controller.enqueue(new Uint8Array(buf.buffer, buf.byteOffset, bytesRead));
      } catch (error) {
        await fh.close().catch(() => {});
        await markFailed(a, sent, (error as Error).message).catch(() => {});
        controller.error(error);
      }
    },
    async cancel() {
      // The visitor stopped or lost the connection: not a completed download.
      await fh.close().catch(() => {});
      await markFailed(a, sent, "connection closed before the end").catch(() => {});
    },
  }, { highWaterMark: 0 });
  return new Response(stream, { status: r ? 206 : 200, headers });
}

type Ctx = { params: Promise<{ slug: string; grant: string }> };

export async function GET(request: Request, { params }: Ctx) {
  return handle(request, params, false);
}

export async function HEAD(request: Request, { params }: Ctx) {
  return handle(request, params, true);
}
