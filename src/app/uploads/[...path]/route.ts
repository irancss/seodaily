import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { contentTypeFor, UPLOAD_DIR } from "@/modules/uploads/storage";

// Serves files from the uploads volume. Names are random and never reused, so
// responses are cached for a year.
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const segments = (await params).path;
  if (segments.length !== 1) return new Response("Not found", { status: 404 });
  const name = segments[0];
  if (!/^[a-z0-9-]+\.[a-z0-9]+$/i.test(name)) return new Response("Not found", { status: 404 });

  const type = contentTypeFor(name);
  if (!type) return new Response("Not found", { status: 404 });

  const file = path.join(UPLOAD_DIR, name);
  try {
    const info = await stat(file);
    const body = await readFile(file);
    return new Response(body, {
      headers: {
        "Content-Type": type,
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
