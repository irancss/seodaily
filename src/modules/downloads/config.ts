import { createHmac } from "node:crypto";

// Download-access settings. The product values (4 digits, 120 s, 5 attempts,
// resend after 60 s, 30-day session, 10-minute link, 20/h per phone, 40/h per
// IP) are the defaults; the send caps are engineering additions and can be
// tuned without code changes (docs/plugins/OPERATIONS-RUNBOOK.md).

function num(name: string, fallback: number, min = 1) {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v >= min ? v : fallback;
}

export function downloadConfig() {
  return {
    enabled: (process.env.PLUGINS_DOWNLOADS_ENABLED ?? "true") !== "false",
    otpLength: num("OTP_LENGTH", 4, 4),
    otpTtlMs: num("OTP_TTL_S", 120, 30) * 1000,
    otpMaxAttempts: num("OTP_MAX_ATTEMPTS", 5),
    otpResendMs: num("OTP_RESEND_S", 60, 10) * 1000,
    otpSendsPerPhoneHour: num("OTP_SENDS_PER_PHONE_HOUR", 5),
    otpSendsPerIpHour: num("OTP_SENDS_PER_IP_HOUR", 20),
    otpSendsPerDay: num("OTP_DAILY_BUDGET", 500),
    otpFailuresPerPhoneHour: num("OTP_FAILURES_PER_PHONE_HOUR", 15),
    otpFailuresPerIpHour: num("OTP_FAILURES_PER_IP_HOUR", 40),
    sessionTtlMs: num("DOWNLOAD_SESSION_DAYS", 30) * 86400_000,
    grantTtlMs: num("DOWNLOAD_GRANT_MIN", 10) * 60_000,
    downloadsPerPhoneHour: num("DOWNLOADS_PER_PHONE_HOUR", 20),
    downloadsPerIpHour: num("DOWNLOADS_PER_IP_HOUR", 40),
    grantsPerUserHour: num("DOWNLOAD_GRANTS_PER_USER_HOUR", 120),
    /** Numbers whose downloads are tests, never counted publicly (comma-separated E.164). */
    testPhones: (process.env.DOWNLOAD_TEST_PHONES ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    cookieSecure: (process.env.COOKIE_SECURE ?? (process.env.NODE_ENV === "production" ? "true" : "false")) !== "false",
  };
}

/** Secret for OTP digests and IP hashes, kept outside the database. Null = OTP disabled (fail closed). */
export function otpSecret(): string | null {
  const s = process.env.OTP_HMAC_SECRET ?? "";
  return s.length >= 32 ? s : null;
}

export function hmac(secret: string, label: string, ...parts: string[]) {
  return createHmac("sha256", secret).update([label, ...parts].join("\u0000")).digest("hex");
}

/** The visitor address is only kept as a keyed hash (quota and abuse counters). */
export function ipHash(ip: string) {
  const secret = otpSecret();
  return secret ? hmac(secret, "ip", ip).slice(0, 32) : "";
}
