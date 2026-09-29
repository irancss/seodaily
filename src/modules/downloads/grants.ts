import { randomBytes } from "node:crypto";

import { and, eq, gt, isNull, sql } from "drizzle-orm";

import { db, schema } from "@/db";

import { downloadConfig } from "./config";
import { mergeRanges } from "./ranges";

// Download links: a grant is a random id bound to a user, a session, one
// release and its SHA-256, valid for 10 minutes. The file URL alone is not
// enough: every request also needs the session cookie the grant belongs to.
//
// A "logical download" is one user getting one release: the first file
// request of a grant starts it and takes one unit of the hourly quota (20
// per number, 40 per address); resumes, retries and a fresh link for the
// same release within the hour do not take another. Issuing a link takes no
// quota. HEAD requests are answered but never start or count anything.

const { downloadGrants, downloadEvents, pluginReleases, plugins, downloadUsers } = schema;

export class GrantError extends Error {
  readonly status: number;
  readonly retryAfterS: number;
  constructor(message: string, status = 400, retryAfterS = 0) {
    super(message);
    this.status = status;
    this.retryAfterS = retryAfterS;
  }
}

async function downloadableRelease(releaseId: number) {
  const [row] = await db
    .select({ release: pluginReleases, plugin: { id: plugins.id, slug: plugins.slug, status: plugins.status } })
    .from(pluginReleases)
    .innerJoin(plugins, eq(plugins.id, pluginReleases.pluginId))
    .where(eq(pluginReleases.id, releaseId))
    .limit(1);
  if (!row || !row.release.downloadable || row.release.state !== "published" || row.release.fileDeletedAt || row.plugin.status !== "published") return null;
  return row;
}

export async function issueGrant(input: { sessionId: number; userId: number; releaseId: number; ipHash: string; now?: Date }) {
  const cfg = downloadConfig();
  if (!cfg.enabled) throw new GrantError("دانلود موقتاً غیرفعال است؛ کمی بعد دوباره تلاش کنید.", 503, 60);
  const now = input.now ?? new Date();
  const found = await downloadableRelease(input.releaseId);
  if (!found) throw new GrantError("این نسخه دیگر برای دانلود در دسترس نیست.", 404);
  const [reuse] = await db
    .select({ id: downloadGrants.id, expiresAt: downloadGrants.expiresAt })
    .from(downloadGrants)
    .where(
      and(
        eq(downloadGrants.sessionId, input.sessionId),
        eq(downloadGrants.releaseId, input.releaseId),
        isNull(downloadGrants.startedAt),
        gt(downloadGrants.expiresAt, new Date(now.getTime() + 60_000)),
      ),
    )
    .limit(1);
  if (reuse) return { grantId: reuse.id, expiresAt: reuse.expiresAt, pluginSlug: found.plugin.slug };
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(downloadGrants)
    .where(and(eq(downloadGrants.userId, input.userId), gt(downloadGrants.createdAt, new Date(now.getTime() - 3600_000))));
  if (n >= cfg.grantsPerUserHour) throw new GrantError("درخواست لینک بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.", 429, 600);
  const id = randomBytes(24).toString("base64url");
  const expiresAt = new Date(now.getTime() + cfg.grantTtlMs);
  await db.insert(downloadGrants).values({ id, userId: input.userId, sessionId: input.sessionId, releaseId: input.releaseId, sha256: found.release.sha256, ipHash: input.ipHash, createdAt: now, expiresAt });
  await db.insert(downloadEvents).values({ kind: "grant_issued", grantId: id, pluginId: found.plugin.id, releaseId: input.releaseId, userId: input.userId });
  return { grantId: id, expiresAt, pluginSlug: found.plugin.slug };
}

export type Authorized = {
  grantId: string;
  userId: number;
  pluginId: number;
  pluginSlug: string;
  release: typeof pluginReleases.$inferSelect;
};

/**
 * Checks a file request. `start` (GET) begins the logical download and
 * takes quota under per-user and per-address locks; HEAD passes start=false.
 */
export async function authorizeFile(input: { grantId: string; sessionId: number; ipHash: string; start: boolean; now?: Date }): Promise<Authorized> {
  const cfg = downloadConfig();
  if (!cfg.enabled) throw new GrantError("دانلود موقتاً غیرفعال است؛ کمی بعد دوباره تلاش کنید.", 503, 60);
  const now = input.now ?? new Date();
  if (!/^[A-Za-z0-9_-]{30,40}$/.test(input.grantId)) throw new GrantError("لینک دانلود نامعتبر است.", 404);
  const [grant] = await db.select().from(downloadGrants).where(eq(downloadGrants.id, input.grantId)).limit(1);
  // Someone else's link, or no session: same answer as a missing one.
  if (!grant || grant.sessionId !== input.sessionId) throw new GrantError("لینک دانلود نامعتبر است یا متعلق به این مرورگر نیست.", 404);
  if (grant.expiresAt.getTime() <= now.getTime()) throw new GrantError("مهلت این لینک تمام شده است؛ از صفحه افزونه لینک تازه بگیرید.", 410);
  const found = await downloadableRelease(grant.releaseId);
  if (!found || found.release.sha256 !== grant.sha256) throw new GrantError("این نسخه دیگر برای دانلود در دسترس نیست.", 410);
  const [user] = await db.select({ blocked: downloadUsers.blocked }).from(downloadUsers).where(eq(downloadUsers.id, grant.userId)).limit(1);
  if (!user || user.blocked) throw new GrantError("امکان دریافت فایل با این شماره فعال نیست.", 403);
  const result: Authorized = { grantId: grant.id, userId: grant.userId, pluginId: found.plugin.id, pluginSlug: found.plugin.slug, release: found.release };
  if (!input.start || grant.startedAt) return result;

  await db.transaction(async (tx) => {
    // Locks in a fixed order (user, then address) so two tabs cannot both pass the last free unit.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`dl-user:${grant.userId}`}))`);
    if (input.ipHash) await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`dl-ip:${input.ipHash}`}))`);
    const [fresh] = await tx.select({ startedAt: downloadGrants.startedAt }).from(downloadGrants).where(eq(downloadGrants.id, grant.id)).for("update");
    if (fresh?.startedAt) return;
    const hourAgo = new Date(now.getTime() - 3600_000);
    const [q] = await tx.execute<{ same: number; user_n: number; ip_n: number; oldest_user: string | null; oldest_ip: string | null }>(sql`
      select
        count(*) filter (where user_id = ${grant.userId} and release_id = ${grant.releaseId})::int as same,
        count(distinct release_id) filter (where user_id = ${grant.userId})::int as user_n,
        count(distinct (user_id, release_id)) filter (where ip_hash = ${input.ipHash} and ${input.ipHash} <> '')::int as ip_n,
        min(started_at) filter (where user_id = ${grant.userId}) as oldest_user,
        min(started_at) filter (where ip_hash = ${input.ipHash}) as oldest_ip
      from download_grants where started_at > ${hourAgo.toISOString()}::timestamptz`);
    if (q.same === 0) {
      const wait = (oldest: string | null) => (oldest ? Math.max(60, Math.ceil((new Date(oldest).getTime() + 3600_000 - now.getTime()) / 1000)) : 3600);
      if (q.user_n >= cfg.downloadsPerPhoneHour) {
        throw new GrantError(`سقف ${cfg.downloadsPerPhoneHour.toLocaleString("fa-IR")} دانلود در ساعت برای این شماره پر شده است.`, 429, wait(q.oldest_user));
      }
      if (input.ipHash && q.ip_n >= cfg.downloadsPerIpHour) {
        throw new GrantError(`سقف ${cfg.downloadsPerIpHour.toLocaleString("fa-IR")} دانلود در ساعت از این اتصال پر شده است.`, 429, wait(q.oldest_ip));
      }
    }
    await tx.update(downloadGrants).set({ startedAt: now, ipHash: input.ipHash || grant.ipHash }).where(eq(downloadGrants.id, grant.id));
    await tx
      .insert(downloadEvents)
      .values({ kind: "started", grantId: grant.id, pluginId: found.plugin.id, releaseId: grant.releaseId, userId: grant.userId, dedupeKey: `started:${grant.id}` })
      .onConflictDoNothing();
    await tx.update(downloadUsers).set({ lastSeenAt: now }).where(eq(downloadUsers.id, grant.userId));
  });
  return result;
}

/**
 * The server handed the last byte of the file to the connection. That is as
 * far as the server can see: it cannot prove the file was saved on the
 * visitor's computer. Counted once per grant; tests and bots are recorded
 * but never counted publicly.
 */
export async function markServed(a: Authorized, bytes: number, opts: { notCounted?: string; start?: number } = {}) {
  if (bytes <= 0) return;
  const start = opts.start ?? 0;
  await db.transaction(async (tx) => {
    const [grant] = await tx.select().from(downloadGrants).where(eq(downloadGrants.id, a.grantId)).for("update");
    if (!grant || grant.servedAt) return;
    const ranges = mergeRanges(grant.servedRanges, start, start + bytes - 1, a.release.bytes);
    await tx.update(downloadGrants).set({ servedRanges: ranges }).where(eq(downloadGrants.id, a.grantId));
    if (ranges.length !== 1 || ranges[0][0] !== 0 || ranges[0][1] !== a.release.bytes - 1) return;
    const [row] = await tx
      .insert(downloadEvents)
      .values({
        kind: opts.notCounted ? "unknown" : "served",
        grantId: a.grantId,
        pluginId: a.pluginId,
        releaseId: a.release.id,
        userId: a.userId,
        dedupeKey: `served:${a.grantId}`,
        bytes: a.release.bytes,
        detail: opts.notCounted ?? "",
      })
      .onConflictDoNothing()
      .returning({ id: downloadEvents.id });
    if (!row) return;
    await tx.update(downloadGrants).set({ servedAt: new Date() }).where(eq(downloadGrants.id, a.grantId));
    if (!opts.notCounted) {
      await tx.update(plugins).set({ measuredDownloadCount: sql`${plugins.measuredDownloadCount} + 1` }).where(eq(plugins.id, a.pluginId));
      await tx.update(downloadUsers).set({ lastDownloadAt: new Date() }).where(eq(downloadUsers.id, a.userId));
    }
  });
}

export async function markFailed(a: Authorized, bytes: number, reason: string) {
  await db
    .insert(downloadEvents)
    .values({ kind: "failed", grantId: a.grantId, pluginId: a.pluginId, releaseId: a.release.id, userId: a.userId, dedupeKey: `failed:${a.grantId}`, bytes, detail: reason.slice(0, 200) })
    .onConflictDoNothing();
}
