import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

import { and, eq, gt, isNull, sql } from "drizzle-orm";

import { db, schema } from "@/db";

import { downloadConfig, hmac, otpSecret } from "./config";
import { latinDigits, normalizeIranMobile } from "./phone";
import type { SmsProvider } from "./sms";

// Phone verification for downloads. A 4-digit code is the product's choice:
// it is a download gate, not strong authentication (NIST asks for at least 6
// digits for out-of-band secrets; this residual risk is documented). The code
// exists in plaintext only in memory and in the SMS; the database keeps an
// HMAC bound to challenge id, purpose and phone, with a secret outside the DB.

const { otpChallenges, downloadUsers, downloadSessions } = schema;
const PURPOSE = "download";

export class OtpError extends Error {
  readonly retryAfterS: number;
  readonly status: number;
  constructor(message: string, status = 400, retryAfterS = 0) {
    super(message);
    this.status = status;
    this.retryAfterS = retryAfterS;
  }
}

function digestOf(secret: string, id: string, phone: string, code: string) {
  return hmac(secret, "otp", id, PURPOSE, phone, code);
}

function requireSecret() {
  const secret = otpSecret();
  if (!secret) throw new OtpError("دریافت فایل موقتاً در دسترس نیست.", 503);
  return secret;
}

export type OtpRequest = { challengeId: string; expiresAt: Date; resendAt: Date; sent: "sent" | "unknown" };

/**
 * Creates a challenge and sends the code. Resend, per-phone, per-IP and
 * system caps are checked under a per-phone lock, so parallel requests
 * cannot overshoot them; a resend never resets the failure counters.
 */
export async function requestOtp(input: { phone: string; ipHash: string; provider: SmsProvider; templateId: string; now?: Date }): Promise<OtpRequest> {
  const secret = requireSecret();
  const cfg = downloadConfig();
  const phone = normalizeIranMobile(input.phone);
  if (!phone) throw new OtpError("شماره موبایل ایران را درست وارد کنید (مثل ۰۹۱۲۱۲۳۴۵۶۷).");
  const now = input.now ?? new Date();
  const hourAgo = new Date(now.getTime() - 3600_000).toISOString();
  const nowIso = now.toISOString();
  const dayAgo = new Date(now.getTime() - 86400_000).toISOString();

  const created = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`otp:${phone}`}))`);
    const [user] = await tx.select({ blocked: downloadUsers.blocked }).from(downloadUsers).where(eq(downloadUsers.phone, phone)).limit(1);
    if (user?.blocked) throw new OtpError("امکان دریافت فایل با این شماره فعال نیست.", 403);

    const [last] = await tx
      .select({ createdAt: otpChallenges.createdAt })
      .from(otpChallenges)
      .where(and(eq(otpChallenges.phone, phone), eq(otpChallenges.purpose, PURPOSE)))
      .orderBy(sql`${otpChallenges.createdAt} desc`)
      .limit(1);
    if (last) {
      const wait = last.createdAt.getTime() + cfg.otpResendMs - now.getTime();
      if (wait > 0) throw new OtpError(`ارسال دوباره کد تا ${Math.ceil(wait / 1000)} ثانیه دیگر ممکن است.`, 429, Math.ceil(wait / 1000));
    }
    const [counts] = await tx.execute<{ phone_sends: number; ip_sends: number; day_sends: number; phone_fails: number; ip_fails: number }>(sql`
      select
        count(*) filter (where phone = ${phone} and created_at > ${hourAgo}::timestamptz)::int as phone_sends,
        count(*) filter (where ip_hash = ${input.ipHash} and ${input.ipHash} <> '' and created_at > ${hourAgo}::timestamptz)::int as ip_sends,
        count(*) filter (where created_at > date_trunc('day', ${nowIso}::timestamptz at time zone 'Asia/Tehran') at time zone 'Asia/Tehran')::int as day_sends,
        coalesce(sum(attempts) filter (where phone = ${phone} and created_at > ${hourAgo}::timestamptz and consumed_at is null), 0)::int as phone_fails,
        coalesce(sum(attempts) filter (where ip_hash = ${input.ipHash} and ${input.ipHash} <> '' and created_at > ${hourAgo}::timestamptz and consumed_at is null), 0)::int as ip_fails
      from otp_challenges where created_at > ${dayAgo}::timestamptz`);
    if (counts.phone_sends >= cfg.otpSendsPerPhoneHour || counts.phone_fails >= cfg.otpFailuresPerPhoneHour) {
      throw new OtpError("برای این شماره در یک ساعت گذشته کد زیادی درخواست شده است. کمی بعد دوباره تلاش کنید.", 429, 3600);
    }
    if (counts.ip_sends >= cfg.otpSendsPerIpHour || counts.ip_fails >= cfg.otpFailuresPerIpHour) {
      throw new OtpError("درخواست‌های زیادی از این اتصال ارسال شده است. کمی بعد دوباره تلاش کنید.", 429, 3600);
    }
    if (counts.day_sends >= cfg.otpSendsPerDay) throw new OtpError("ارسال کد موقتاً متوقف است. بعداً دوباره تلاش کنید.", 503);

    // A new code replaces the previous one.
    await tx
      .update(otpChallenges)
      .set({ invalidatedAt: now })
      .where(and(eq(otpChallenges.phone, phone), eq(otpChallenges.purpose, PURPOSE), isNull(otpChallenges.consumedAt), isNull(otpChallenges.invalidatedAt)));
    const id = randomBytes(18).toString("base64url");
    const code = String(randomInt(0, 10 ** cfg.otpLength)).padStart(cfg.otpLength, "0");
    const expiresAt = new Date(now.getTime() + cfg.otpTtlMs);
    await tx.insert(otpChallenges).values({ id, purpose: PURPOSE, phone, digest: digestOf(secret, id, phone, code), expiresAt, ipHash: input.ipHash, createdAt: now });
    return { id, code, expiresAt };
  });

  const result = await input.provider.sendVerification({ to: phone, code: created.code, templateId: input.templateId, requestId: created.id });
  await db
    .update(otpChallenges)
    .set({ sendState: result.state, sendError: result.error.slice(0, 300), providerRef: result.ref.slice(0, 100) })
    .where(eq(otpChallenges.id, created.id));
  if (result.state === "failed") {
    await db.update(otpChallenges).set({ invalidatedAt: new Date() }).where(eq(otpChallenges.id, created.id));
    throw new OtpError("ارسال پیامک ناموفق بود. یک دقیقه دیگر دوباره تلاش کنید.", 502);
  }
  return { challengeId: created.id, expiresAt: created.expiresAt, resendAt: new Date(now.getTime() + cfg.otpResendMs), sent: result.state };
}

export type Verified = { userId: number; sessionToken: string; sessionId: number; expiresAt: Date };

/**
 * Checks a code: attempts are counted before comparing, under a row lock, so
 * five parallel guesses cannot become more than five. Success consumes the
 * challenge and opens a download session for the (one) user of that number.
 */
export async function verifyOtp(input: { challengeId: string; phone: string; code: string; ipHash: string; now?: Date }): Promise<Verified> {
  const secret = requireSecret();
  const cfg = downloadConfig();
  const phone = normalizeIranMobile(input.phone);
  const code = latinDigits(input.code).trim();
  const now = input.now ?? new Date();
  if (!phone || !/^[A-Za-z0-9_-]{10,64}$/.test(input.challengeId)) throw new OtpError("درخواست نامعتبر است. کد را دوباره بگیرید.");
  if (!new RegExp(`^\\d{${cfg.otpLength}}$`).test(code)) throw new OtpError(`کد ${cfg.otpLength.toLocaleString("fa-IR")} رقمی را کامل وارد کنید.`);

  return db.transaction(async (tx) => {
    const [ch] = await tx.select().from(otpChallenges).where(eq(otpChallenges.id, input.challengeId)).for("update");
    // Same answer for a missing challenge and one of another number/purpose: no enumeration.
    if (!ch || ch.phone !== phone || ch.purpose !== PURPOSE) throw new OtpError("کد نادرست یا منقضی است. کد جدید بگیرید.");
    if (ch.consumedAt || ch.invalidatedAt) throw new OtpError("این کد دیگر معتبر نیست. کد جدید بگیرید.");
    if (now.getTime() >= ch.expiresAt.getTime()) throw new OtpError("مهلت کد تمام شده است. کد جدید بگیرید.");
    if (ch.attempts >= cfg.otpMaxAttempts) throw new OtpError("تعداد تلاش‌ها تمام شده است. کد جدید بگیرید.", 429);
    await tx.update(otpChallenges).set({ attempts: sql`${otpChallenges.attempts} + 1` }).where(eq(otpChallenges.id, ch.id));
    const expected = Buffer.from(ch.digest, "hex");
    const actual = Buffer.from(digestOf(secret, ch.id, phone, code), "hex");
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      const left = cfg.otpMaxAttempts - ch.attempts - 1;
      // The attempt must stay counted: return, not throw (a throw would roll it back).
      return { error: left > 0 ? `کد نادرست است. ${left.toLocaleString("fa-IR")} تلاش دیگر دارید.` : "کد نادرست است و تلاش‌ها تمام شد. کد جدید بگیرید." } as const;
    }
    await tx.update(otpChallenges).set({ consumedAt: now }).where(eq(otpChallenges.id, ch.id));
    const [user] = await tx
      .insert(downloadUsers)
      .values({ phone, verifiedAt: now, lastSeenAt: now })
      .onConflictDoUpdate({ target: downloadUsers.phone, set: { verifiedAt: now, lastSeenAt: now } })
      .returning({ id: downloadUsers.id, blocked: downloadUsers.blocked });
    if (user.blocked) return { error: "امکان دریافت فایل با این شماره فعال نیست." } as const;
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(now.getTime() + cfg.sessionTtlMs);
    const [session] = await tx
      .insert(downloadSessions)
      .values({ tokenDigest: tokenDigest(token), userId: user.id, createdAt: now, expiresAt })
      .returning({ id: downloadSessions.id });
    return { userId: user.id, sessionToken: token, sessionId: session.id, expiresAt };
  }).then((r) => {
    if ("error" in r) throw new OtpError(r.error as string, 400);
    return r;
  });
}

export function tokenDigest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export type DownloadSession = { sessionId: number; userId: number; phone: string; expiresAt: Date };

/** A valid, unrevoked, unexpired session of an unblocked user; null otherwise. */
export async function sessionFromToken(token: string | undefined, now = new Date()): Promise<DownloadSession | null> {
  if (!token || !/^[A-Za-z0-9_-]{40,60}$/.test(token)) return null;
  const [row] = await db
    .select({ sessionId: downloadSessions.id, userId: downloadSessions.userId, expiresAt: downloadSessions.expiresAt, phone: downloadUsers.phone, blocked: downloadUsers.blocked })
    .from(downloadSessions)
    .innerJoin(downloadUsers, eq(downloadUsers.id, downloadSessions.userId))
    .where(and(eq(downloadSessions.tokenDigest, tokenDigest(token)), isNull(downloadSessions.revokedAt), gt(downloadSessions.expiresAt, now)))
    .limit(1);
  if (!row || row.blocked) return null;
  return { sessionId: row.sessionId, userId: row.userId, phone: row.phone, expiresAt: row.expiresAt };
}

export async function revokeSession(sessionId: number) {
  await db.update(downloadSessions).set({ revokedAt: new Date() }).where(and(eq(downloadSessions.id, sessionId), isNull(downloadSessions.revokedAt)));
}
