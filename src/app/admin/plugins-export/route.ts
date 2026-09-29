import { and, asc, eq, gt, gte, lt, sql } from "drizzle-orm";

import { db, schema } from "@/db";
import { getCurrentUser } from "@/modules/auth/session";
import { csvRow } from "@/modules/downloads/csv";
import { audit } from "@/modules/plugins/audit";

export const dynamic = "force-dynamic";

// Admin-only CSV export (verified numbers, or download history), streamed in
// batches so large tables never sit in memory, UTF-8 with BOM for Excel,
// formula-injection-safe cells, and an audit entry per export. Nothing is
// written to disk or under uploads.

const BATCH = 1000;
const { downloadUsers, downloadEvents, plugins, pluginReleases } = schema;

function day(value: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export async function GET(request: Request) {
  const admin = await getCurrentUser();
  if (!admin) return new Response(null, { status: 404 });
  const url = new URL(request.url);
  const type = url.searchParams.get("type") === "downloads" ? "downloads" : "users";
  const from = day(url.searchParams.get("from"));
  const to = day(url.searchParams.get("to"));
  // Tehran calendar days → UTC instants.
  const fromAt = from ? sql`(${from}::date)::timestamp at time zone 'Asia/Tehran'` : null;
  const toAt = to ? sql`((${to}::date) + 1)::timestamp at time zone 'Asia/Tehran'` : null;
  await audit(admin.id, `export.${type}`, { type: "export", id: type }, { from, to });

  const encoder = new TextEncoder();
  let lastId = 0;
  let header = true;
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (header) {
        header = false;
        controller.enqueue(encoder.encode("﻿"));
        controller.enqueue(
          encoder.encode(
            type === "users"
              ? csvRow(["شناسه", "موبایل", "تاریخ تأیید (UTC)", "آخرین فعالیت (UTC)", "آخرین دانلود (UTC)", "دانلود کامل", "محدود"])
              : csvRow(["زمان (UTC)", "رویداد", "موبایل", "افزونه", "نسخه", "حجم ارسال‌شده (بایت)", "توضیح"]),
          ),
        );
        return;
      }
      if (type === "users") {
        const rows = await db
          .select({
            id: downloadUsers.id,
            phone: downloadUsers.phone,
            verifiedAt: downloadUsers.verifiedAt,
            lastSeenAt: downloadUsers.lastSeenAt,
            lastDownloadAt: downloadUsers.lastDownloadAt,
            blocked: downloadUsers.blocked,
            served: sql<number>`(select count(*) from download_events e where e.user_id = "download_users"."id" and e.kind = 'served')::int`,
          })
          .from(downloadUsers)
          .where(
            and(
              gt(downloadUsers.id, lastId),
              sql`${downloadUsers.anonymizedAt} is null`,
              fromAt ? gte(downloadUsers.verifiedAt, fromAt) : undefined,
              toAt ? lt(downloadUsers.verifiedAt, toAt) : undefined,
            ),
          )
          .orderBy(asc(downloadUsers.id))
          .limit(BATCH);
        if (!rows.length) return controller.close();
        lastId = rows.at(-1)!.id;
        controller.enqueue(encoder.encode(rows.map((r) => csvRow([r.id, r.phone, r.verifiedAt, r.lastSeenAt, r.lastDownloadAt, r.served, r.blocked ? "بله" : "خیر"])).join("")));
        return;
      }
      const rows = await db
        .select({
          id: downloadEvents.id,
          at: downloadEvents.createdAt,
          kind: downloadEvents.kind,
          phone: downloadUsers.phone,
          plugin: plugins.name,
          version: pluginReleases.sourceVersion,
          bytes: downloadEvents.bytes,
          detail: downloadEvents.detail,
        })
        .from(downloadEvents)
        .leftJoin(downloadUsers, eq(downloadUsers.id, downloadEvents.userId))
        .leftJoin(plugins, eq(plugins.id, downloadEvents.pluginId))
        .leftJoin(pluginReleases, eq(pluginReleases.id, downloadEvents.releaseId))
        .where(
          and(
            gt(downloadEvents.id, lastId),
            sql`${downloadEvents.kind} in ('started', 'served', 'failed', 'unknown')`,
            fromAt ? gte(downloadEvents.createdAt, fromAt) : undefined,
            toAt ? lt(downloadEvents.createdAt, toAt) : undefined,
          ),
        )
        .orderBy(asc(downloadEvents.id))
        .limit(BATCH);
      if (!rows.length) return controller.close();
      lastId = rows.at(-1)!.id;
      controller.enqueue(encoder.encode(rows.map((r) => csvRow([r.at, r.kind, r.phone, r.plugin, r.version, r.bytes, r.detail])).join("")));
    },
  });
  const name = `seodaily-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(stream, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${name}"`,
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
