import { timingSafeEqual } from "node:crypto";

import { revalidateTag } from "next/cache";

import { CONTENT_TAG } from "@/lib/cache";

export const dynamic = "force-dynamic";

// Lets the plugin worker (a separate process) expire the page cache after it
// publishes a release. The secret travels in a header, never in the URL, and
// the endpoint is refused entirely when no secret is configured.
export async function POST(request: Request) {
  const secret = process.env.INTERNAL_API_SECRET ?? "";
  const given = request.headers.get("x-internal-secret") ?? "";
  const ok = secret.length >= 32 && given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret));
  if (!ok) return new Response(null, { status: 404 });
  revalidateTag(CONTENT_TAG, { expire: 0 });
  return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
