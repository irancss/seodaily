import "server-only";

import { and, desc, eq, ilike, isNull, sql } from "drizzle-orm";

import { db, schema } from "@/db";
import { audit } from "@/modules/plugins/audit";

import { latinDigits, normalizeIranMobile } from "./phone";

// Admin views of download users and statistics. Only measured events count
// (never the base count); days are Tehran calendar days.

const { downloadUsers, downloadSessions, downloadGrants, downloadEvents, otpChallenges, plugins, pluginReleases } = schema;
export const USERS_PAGE_SIZE = 30;

type StatCounts = {
  users: number;
  users7: number;
  otp_sent7: number;
  otp_failed7: number;
  otp_verified7: number;
  served_today: number;
  served7: number;
  served30: number;
  started30: number;
  failed7: number;
};

const TEHRAN_DAY = sql`date_trunc('day', now() at time zone 'Asia/Tehran') at time zone 'Asia/Tehran'`;

export async function downloadStats() {
  const [[counts], top, daily] = await Promise.all([
    db.execute<StatCounts>(sql`
      select
        (select count(*) from download_users where anonymized_at is null)::int as users,
        (select count(*) from download_users where verified_at > now() - interval '7 days')::int as users7,
        (select count(*) from otp_challenges where created_at > now() - interval '7 days' and send_state = 'sent')::int as otp_sent7,
        (select count(*) from otp_challenges where created_at > now() - interval '7 days' and send_state in ('failed', 'unknown'))::int as otp_failed7,
        (select count(*) from otp_challenges where created_at > now() - interval '7 days' and consumed_at is not null)::int as otp_verified7,
        (select count(*) from download_events where kind = 'served' and created_at >= ${TEHRAN_DAY})::int as served_today,
        (select count(*) from download_events where kind = 'served' and created_at >= ${TEHRAN_DAY} - interval '6 days')::int as served7,
        (select count(*) from download_events where kind = 'served' and created_at >= ${TEHRAN_DAY} - interval '29 days')::int as served30,
        (select count(*) from download_events where kind = 'started' and created_at >= ${TEHRAN_DAY} - interval '29 days')::int as started30,
        (select count(*) from download_events where kind = 'failed' and created_at >= ${TEHRAN_DAY} - interval '6 days')::int as failed7`),
    db
      .select({ id: plugins.id, name: plugins.name, n: sql<number>`count(*)::int` })
      .from(downloadEvents)
      .innerJoin(plugins, eq(plugins.id, downloadEvents.pluginId))
      .where(and(eq(downloadEvents.kind, "served"), sql`${downloadEvents.createdAt} >= ${TEHRAN_DAY} - interval '29 days'`))
      .groupBy(plugins.id)
      .orderBy(sql`count(*) desc`)
      .limit(10),
    db.execute<{ day: string; served: number; started: number }>(sql`
      select to_char(d, 'YYYY-MM-DD') as day,
        (select count(*) from download_events e where e.kind = 'served' and (e.created_at at time zone 'Asia/Tehran')::date = d)::int as served,
        (select count(*) from download_events e where e.kind = 'started' and (e.created_at at time zone 'Asia/Tehran')::date = d)::int as started
      from generate_series((now() at time zone 'Asia/Tehran')::date - 13, (now() at time zone 'Asia/Tehran')::date, interval '1 day') d
      order by d desc`),
  ]);
  return { ...counts, top, daily: [...daily] };
}

export async function listDownloadUsers({ q = "", page = 1 }: { q?: string; page?: number }) {
  const term = latinDigits(q).replace(/\D/g, "");
  const exact = normalizeIranMobile(q);
  const where = exact ? eq(downloadUsers.phone, exact) : term.length >= 3 ? ilike(downloadUsers.phone, `%${term.replace(/^0/, "")}%`) : undefined;
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(downloadUsers).where(where);
  const rows = await db
    .select({
      id: downloadUsers.id,
      phone: downloadUsers.phone,
      verifiedAt: downloadUsers.verifiedAt,
      lastSeenAt: downloadUsers.lastSeenAt,
      lastDownloadAt: downloadUsers.lastDownloadAt,
      blocked: downloadUsers.blocked,
      anonymizedAt: downloadUsers.anonymizedAt,
      served: sql<number>`(select count(*) from download_events e where e.user_id = "download_users"."id" and e.kind = 'served')::int`,
    })
    .from(downloadUsers)
    .where(where)
    .orderBy(desc(downloadUsers.verifiedAt))
    .limit(USERS_PAGE_SIZE)
    .offset((Math.max(1, page) - 1) * USERS_PAGE_SIZE);
  return { rows, total, pages: Math.max(1, Math.ceil(total / USERS_PAGE_SIZE)) };
}

export async function downloadUser(id: number) {
  const [user] = await db.select().from(downloadUsers).where(eq(downloadUsers.id, id)).limit(1);
  if (!user) return null;
  const [history, sessions] = await Promise.all([
    db
      .select({
        at: downloadEvents.createdAt,
        kind: downloadEvents.kind,
        detail: downloadEvents.detail,
        plugin: plugins.name,
        pluginId: plugins.id,
        version: pluginReleases.sourceVersion,
      })
      .from(downloadEvents)
      .leftJoin(plugins, eq(plugins.id, downloadEvents.pluginId))
      .leftJoin(pluginReleases, eq(pluginReleases.id, downloadEvents.releaseId))
      .where(and(eq(downloadEvents.userId, id), sql`${downloadEvents.kind} in ('started', 'served', 'failed', 'unknown')`))
      .orderBy(desc(downloadEvents.createdAt))
      .limit(200),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(downloadSessions)
      .where(and(eq(downloadSessions.userId, id), isNull(downloadSessions.revokedAt), sql`${downloadSessions.expiresAt} > now()`)),
  ]);
  return { user, history, activeSessions: sessions[0]?.n ?? 0 };
}

async function endAccess(userId: number, tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) {
  await tx.update(downloadSessions).set({ revokedAt: new Date() }).where(and(eq(downloadSessions.userId, userId), isNull(downloadSessions.revokedAt)));
  await tx.update(downloadGrants).set({ expiresAt: new Date() }).where(and(eq(downloadGrants.userId, userId), sql`${downloadGrants.expiresAt} > now()`));
}

export async function setUserBlocked(userId: number, blocked: boolean, reason: string, adminId: number) {
  await db.transaction(async (tx) => {
    await tx.update(downloadUsers).set({ blocked, blockedReason: blocked ? reason.slice(0, 300) : "" }).where(eq(downloadUsers.id, userId));
    if (blocked) await endAccess(userId, tx);
    await audit(adminId, blocked ? "download_user.block" : "download_user.unblock", { type: "download_user", id: userId }, { reason: reason.slice(0, 300) }, tx);
  });
}

export async function revokeUserSessions(userId: number, adminId: number) {
  await db.transaction(async (tx) => {
    await endAccess(userId, tx);
    await audit(adminId, "download_user.revoke_sessions", { type: "download_user", id: userId }, {}, tx);
  });
}

/**
 * Removes the person's number (the owner's deletion request): sessions end,
 * pending codes go, the row keeps only an anonymous id so aggregate counts
 * and the download ledger stay correct.
 */
export async function anonymizeUser(userId: number, adminId: number) {
  await db.transaction(async (tx) => {
    const [u] = await tx.select({ phone: downloadUsers.phone }).from(downloadUsers).where(eq(downloadUsers.id, userId)).for("update");
    if (!u) return;
    await endAccess(userId, tx);
    await tx.delete(otpChallenges).where(eq(otpChallenges.phone, u.phone));
    await tx.update(downloadUsers).set({ phone: `anon-${userId}`, anonymizedAt: new Date(), blocked: true, blockedReason: "anonymized" }).where(eq(downloadUsers.id, userId));
    await tx.update(downloadGrants).set({ ipHash: "" }).where(eq(downloadGrants.userId, userId));
    await audit(adminId, "download_user.anonymize", { type: "download_user", id: userId }, {}, tx);
  });
}
