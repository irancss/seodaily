"use server";

import { clientIp } from "@/lib/rate-limit";

import { downloadConfig, ipHash, otpSecret } from "./config";
import { GrantError, issueGrant } from "./grants";
import { OtpError, requestOtp, revokeSession, verifyOtp } from "./otp";
import { maskPhone } from "./phone";
import { clearDownloadCookie, getDownloadSession, setDownloadCookie } from "./session";
import { smsProvider } from "./sms";

// Download flow actions. Server Actions carry Next's Origin check (CSRF); no
// phone number, code or token is ever logged or sent to analytics.

type Fail = { ok: false; message: string; retryAfterS?: number };

function fail(error: unknown): Fail {
  if (error instanceof OtpError || error instanceof GrantError) return { ok: false, message: error.message, retryAfterS: error.retryAfterS || undefined };
  console.error("download flow error", (error as Error).name);
  return { ok: false, message: "خطای غیرمنتظره رخ داد. دوباره تلاش کنید." };
}

/** Whether the download flow can run at all (fail closed without secret/SMS). */
async function unavailable(): Promise<Fail | null> {
  if (!downloadConfig().enabled || !otpSecret() || !smsProvider().provider) return { ok: false, message: "دریافت فایل موقتاً در دسترس نیست. کمی بعد دوباره سر بزنید." };
  return null;
}

export async function requestOtpAction(input: { phone: string; website?: string }) {
  const closed = await unavailable();
  if (closed) return closed;
  // Honeypot: a field people never see. Filled = automated; answer like a success without sending.
  if (input.website) return { ok: true as const, challengeId: "x".repeat(24), expiresInS: 120, resendInS: 60, phoneMasked: "" };
  const { provider, templateId } = smsProvider();
  try {
    const r = await requestOtp({ phone: String(input.phone ?? "").slice(0, 40), ipHash: ipHash(await clientIp()), provider: provider!, templateId });
    const now = Date.now();
    return {
      ok: true as const,
      challengeId: r.challengeId,
      expiresInS: Math.round((r.expiresAt.getTime() - now) / 1000),
      resendInS: Math.round((r.resendAt.getTime() - now) / 1000),
      phoneMasked: "",
    };
  } catch (error) {
    return fail(error);
  }
}

export async function verifyOtpAction(input: { challengeId: string; phone: string; code: string }) {
  const closed = await unavailable();
  if (closed) return closed;
  try {
    const v = await verifyOtp({ challengeId: String(input.challengeId ?? "").slice(0, 80), phone: String(input.phone ?? "").slice(0, 40), code: String(input.code ?? "").slice(0, 10), ipHash: ipHash(await clientIp()) });
    await setDownloadCookie(v.sessionToken, v.expiresAt);
    return { ok: true as const };
  } catch (error) {
    return fail(error);
  }
}

export async function requestGrantAction(input: { releaseId: number }) {
  const session = await getDownloadSession();
  if (!session) return { ok: false as const, message: "برای دانلود ابتدا شماره موبایل را تأیید کنید.", needsVerification: true };
  try {
    const g = await issueGrant({ sessionId: session.sessionId, userId: session.userId, releaseId: Number(input.releaseId), ipHash: ipHash(await clientIp()) });
    return { ok: true as const, url: `/plugins/${encodeURIComponent(g.pluginSlug)}/download/${g.grantId}`, expiresAt: g.expiresAt.toISOString() };
  } catch (error) {
    return fail(error);
  }
}

export async function downloadStatusAction() {
  const session = await getDownloadSession();
  return session ? { verified: true, phoneMasked: maskPhone(session.phone) } : { verified: false, phoneMasked: "" };
}

export async function logoutDownloadAction() {
  const session = await getDownloadSession();
  if (session) await revokeSession(session.sessionId);
  await clearDownloadCookie();
  return { ok: true as const };
}
