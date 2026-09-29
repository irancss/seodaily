import { and, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { access } from "node:fs/promises";

import { db, schema } from "@/db";
import type { PluginHeader, ReleaseCheck, ReleaseChecks } from "@/db/plugins-schema";
import { audit } from "@/modules/plugins/audit";

import { pipelineConfig } from "./config";
import { objectPath, sha256File } from "./storage";
import { compareVersions, isNewer } from "./versions";

// Release states: candidate → review | rejected | published → retired |
// withdrawn. "downloadable" is true only for published releases, and at most
// three per plugin (the current one plus up to two older). Publishing is
// bound to the exact SHA-256 that was checked: the stored file is re-hashed
// inside the publish, and a mismatch refuses it.

const { plugins, pluginReleases } = schema;

export const MAX_DOWNLOADABLE = 3;
/** Checks that must be PASS for an automatic publish. */
export const REQUIRED_CHECKS = ["validation", "identity", "scan", "sandbox"] as const;

export class ReleaseError extends Error {}

type Row = typeof pluginReleases.$inferSelect;

/** Why a candidate cannot be published automatically; empty when it can. */
export function gateBlockers(checks: ReleaseChecks, opts: { newerThanCurrent: boolean; sameVersionOtherFile: boolean; autoUpdate: boolean }): string[] {
  const out: string[] = [];
  for (const k of REQUIRED_CHECKS) {
    const c = checks[k];
    if (!c || c.status !== "PASS") out.push(`${k}: ${c ? c.status : "انجام نشده"}${c?.detail ? ` — ${c.detail}` : ""}`);
  }
  if (checks.checksum?.status === "FAIL") out.push(`checksum: FAIL — ${checks.checksum.detail}`);
  if (checks.version?.status === "FAIL") out.push(`version: FAIL — ${checks.version.detail}`);
  if (!opts.newerThanCurrent) out.push("نسخه از نسخه جاری جدیدتر نیست (به‌روزرسانی خودکار فقط رو به جلو است).");
  if (opts.sameVersionOtherFile) out.push("همین نسخه قبلاً با فایل دیگری ثبت شده است؛ بررسی مدیر لازم است.");
  if (!opts.autoUpdate) out.push("به‌روزرسانی خودکار برای این افزونه یا کل سایت خاموش است.");
  return out;
}

/** A check that proves something is wrong (not merely unavailable). */
export function hardFailure(checks: ReleaseChecks): string | null {
  for (const k of ["validation", "identity", "scan", "checksum"] as const) {
    if (checks[k]?.status === "FAIL") return `${k}: ${checks[k]!.detail}`;
  }
  return null;
}

/** Metadata the package/readme/source can fill, unless the admin set it by hand. */
function metaFromRelease(header: PluginHeader, manual: string[], version: string) {
  const values: Record<string, string> = {
    originalName: header.pluginName ?? "",
    authorName: header.author ?? "",
    authorUrl: header.authorUri ?? "",
    officialUrl: header.pluginUri ?? "",
    license: header.license ?? "",
    requiresWp: header.requiresAtLeast ?? "",
    requiresPhp: header.requiresPhp ?? "",
    testedUpTo: header.testedUpTo ?? "",
  };
  const set: Record<string, string> = {};
  const provenance: Record<string, string> = {};
  for (const [k, v] of Object.entries(values)) {
    if (!v || manual.includes(k)) continue;
    if ((k === "authorUrl" || k === "officialUrl") && !/^https?:\/\//i.test(v)) continue;
    set[k] = v.slice(0, 300);
    provenance[k] = k === "testedUpTo" ? `readme ${version}` : `header ${version}`;
  }
  return { set, provenance };
}

async function fileMatches(row: Row) {
  const file = objectPath(pipelineConfig().filesDir, row.storageKey);
  try {
    await access(file);
  } catch {
    return "فایل این نسخه روی دیسک پیدا نشد.";
  }
  const actual = await sha256File(file);
  return actual === row.sha256 ? null : "هش فایل ذخیره‌شده با هش بررسی‌شده یکی نیست؛ انتشار متوقف شد.";
}

/**
 * Makes a checked release downloadable in one transaction: current release,
 * package date, source metadata and the three-file retention change
 * together, or not at all. `override` records an admin approving a release
 * whose checks did not all pass (audited, with a reason).
 */
export async function publishRelease(releaseId: number, by: { userId: number | null; override?: string; source: "auto" | "admin" }) {
  const [pre] = await db.select().from(pluginReleases).where(eq(pluginReleases.id, releaseId)).limit(1);
  if (!pre) throw new ReleaseError("نسخه پیدا نشد.");
  const bad = await fileMatches(pre);
  if (bad) throw new ReleaseError(bad);

  const result = await db.transaction(async (tx) => {
    const [plugin] = await tx.select().from(plugins).where(eq(plugins.id, pre.pluginId)).for("update");
    const [rel] = await tx.select().from(pluginReleases).where(eq(pluginReleases.id, releaseId)).for("update");
    if (!plugin || !rel) throw new ReleaseError("نسخه یا افزونه پیدا نشد.");
    if (rel.sha256 !== pre.sha256) throw new ReleaseError("فایل نسخه در حین انتشار تغییر کرد.");
    if (rel.state !== "candidate" && rel.state !== "review") throw new ReleaseError("فقط نسخه در انتظار بررسی قابل انتشار است.");
    const fail = hardFailure(rel.checks);
    if (fail) throw new ReleaseError(`این نسخه کنترل ناموفق دارد و منتشر نمی‌شود (${fail}).`);
    if (by.source === "admin" && !by.override?.trim()) {
      const missing = REQUIRED_CHECKS.filter((k) => rel.checks[k]?.status !== "PASS");
      if (missing.length) throw new ReleaseError(`کنترل‌های ${missing.join("، ")} PASS نیستند؛ برای انتشار دستی دلیل بنویسید.`);
    }

    const now = new Date();
    await tx
      .update(pluginReleases)
      .set({
        state: "published",
        downloadable: true,
        publishedAt: now,
        ...(by.override ? { overrideBy: by.userId, overrideReason: by.override.trim().slice(0, 500) } : {}),
      })
      .where(eq(pluginReleases.id, rel.id));

    const current = plugin.currentReleaseId
      ? (await tx.select().from(pluginReleases).where(eq(pluginReleases.id, plugin.currentReleaseId)).limit(1))[0]
      : undefined;
    const becomesCurrent = !current || !current.downloadable || isNewer(rel.sourceVersion, current.sourceVersion) || compareVersions(rel.sourceVersion, current.sourceVersion) === 0;
    const pluginSet: Record<string, unknown> = { updatedAt: now };
    if (becomesCurrent) {
      const meta = metaFromRelease(rel.header, plugin.manualFields, rel.sourceVersion);
      Object.assign(pluginSet, meta.set, {
        currentReleaseId: rel.id,
        packageUpdatedAt: now,
        provenance: { ...plugin.provenance, ...meta.provenance },
      });
    }
    await tx.update(plugins).set(pluginSet).where(eq(plugins.id, plugin.id));

    // Retention: the three highest versions stay downloadable, the rest retire.
    const live = await tx
      .select()
      .from(pluginReleases)
      .where(and(eq(pluginReleases.pluginId, plugin.id), eq(pluginReleases.downloadable, true)));
    const keepCurrent = becomesCurrent ? rel.id : plugin.currentReleaseId;
    live.sort((a, b) => (a.id === keepCurrent ? -1 : b.id === keepCurrent ? 1 : (compareVersions(b.sourceVersion, a.sourceVersion) ?? 0) || b.id - a.id));
    const retire = live.slice(MAX_DOWNLOADABLE).map((r) => r.id);
    if (retire.length) {
      await tx.update(pluginReleases).set({ state: "retired", downloadable: false, retiredAt: now }).where(inArray(pluginReleases.id, retire));
    }
    await audit(by.userId, by.override ? "release.publish_override" : `release.publish_${by.source}`, { type: "release", id: rel.id }, {
      pluginId: plugin.id,
      version: rel.sourceVersion,
      sha256: rel.sha256,
      becameCurrent: becomesCurrent,
      retired: retire,
      ...(by.override ? { reason: by.override.trim().slice(0, 500) } : {}),
    }, tx);
    return { pluginId: plugin.id, becameCurrent: becomesCurrent, retired: retire };
  });
  return result;
}

export async function rejectRelease(releaseId: number, userId: number | null, reason: string) {
  const rows = await db
    .update(pluginReleases)
    .set({ state: "rejected", downloadable: false, warnings: sql`${pluginReleases.warnings} || ${JSON.stringify([`رد شد: ${reason.slice(0, 300)}`])}::jsonb` })
    .where(and(eq(pluginReleases.id, releaseId), inArray(pluginReleases.state, ["candidate", "review"])))
    .returning({ id: pluginReleases.id, pluginId: pluginReleases.pluginId });
  if (!rows.length) throw new ReleaseError("فقط نسخه در انتظار بررسی قابل رد است.");
  await audit(userId, "release.reject", { type: "release", id: releaseId }, { reason: reason.slice(0, 300) });
}

/**
 * Takes a published file out of circulation at once (suspicious/withdrawn):
 * no new grants, no file requests even with an old link. The newest other
 * downloadable release becomes current.
 */
export async function withdrawRelease(releaseId: number, userId: number | null, reason: string) {
  if (!reason.trim()) throw new ReleaseError("دلیل برداشتن فایل را بنویسید.");
  return db.transaction(async (tx) => {
    const [rel] = await tx.select().from(pluginReleases).where(eq(pluginReleases.id, releaseId)).for("update");
    if (!rel || (rel.state !== "published" && rel.state !== "retired")) throw new ReleaseError("فقط نسخه منتشرشده قابل برداشتن است.");
    const [plugin] = await tx.select().from(plugins).where(eq(plugins.id, rel.pluginId)).for("update");
    await tx.update(pluginReleases).set({ state: "withdrawn", downloadable: false, retiredAt: new Date() }).where(eq(pluginReleases.id, rel.id));
    if (plugin.currentReleaseId === rel.id) {
      const rest = await tx
        .select()
        .from(pluginReleases)
        .where(and(eq(pluginReleases.pluginId, plugin.id), eq(pluginReleases.downloadable, true), ne(pluginReleases.id, rel.id)));
      rest.sort((a, b) => (compareVersions(b.sourceVersion, a.sourceVersion) ?? 0) || b.id - a.id);
      await tx.update(plugins).set({ currentReleaseId: rest[0]?.id ?? null, updatedAt: new Date() }).where(eq(plugins.id, plugin.id));
    }
    await audit(userId, "release.withdraw", { type: "release", id: rel.id }, { pluginId: plugin.id, version: rel.sourceVersion, reason: reason.slice(0, 300) }, tx);
    return { pluginId: plugin.id };
  });
}

/** Releases whose bytes may be deleted now (reference-aware: a SHA shared by another kept release stays). */
export async function deletableObjects(now = Date.now()) {
  const cfg = pipelineConfig();
  const rows = await db
    .select()
    .from(pluginReleases)
    .where(and(isNull(pluginReleases.fileDeletedAt), inArray(pluginReleases.state, ["rejected", "retired", "withdrawn"])))
    .orderBy(desc(pluginReleases.id));
  const due = rows.filter((r) => {
    if (r.state === "rejected") return now - r.createdAt.getTime() > cfg.rejectedTtlMs;
    return r.retiredAt !== null && now - r.retiredAt.getTime() > cfg.retiredGraceMs;
  });
  if (!due.length) return [];
  const keys = [...new Set(due.map((r) => r.storageKey))];
  const kept = await db
    .select({ key: pluginReleases.storageKey })
    .from(pluginReleases)
    .where(
      and(
        inArray(pluginReleases.storageKey, keys),
        isNull(pluginReleases.fileDeletedAt),
        inArray(pluginReleases.state, ["candidate", "review", "published"]),
      ),
    );
  // A grant still inside its 10 minutes (or a transfer that started within the grace) keeps the file.
  const busy = await db.execute<{ release_id: number }>(sql`
    select distinct release_id from download_grants
    where release_id in (${sql.join(due.map((r) => sql`${r.id}`), sql`, `)})
      and (expires_at > now() or (started_at is not null and served_at is null and started_at > now() - interval '2 hours'))`);
  const keptKeys = new Set(kept.map((k) => k.key));
  const busyIds = new Set(busy.map((b) => Number(b.release_id)));
  return due.filter((r) => !busyIds.has(r.id)).map((r) => ({ id: r.id, key: r.storageKey, shared: keptKeys.has(r.storageKey) }));
}

export type { ReleaseCheck };
