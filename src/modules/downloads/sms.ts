import { appendFile } from "node:fs/promises";

import { localPhone } from "./phone";

// SMS behind a narrow contract so the provider can change. Only operational
// OTP messages are sent. "sent" means the provider accepted the message;
// delivery to the handset and verification are separate facts. An ambiguous
// outcome (timeout) is "unknown" and is never retried automatically, to
// avoid double sends and cost.

export type SendResult = { state: "sent" | "failed" | "unknown"; ref: string; error: string };

export interface SmsProvider {
  readonly name: string;
  sendVerification(input: { to: string; code: string; templateId: string; requestId: string }): Promise<SendResult>;
}

/** Melipayamak shared service line with an approved pattern (BaseServiceNumber). */
export class MelipayamakProvider implements SmsProvider {
  readonly name = "melipayamak";
  private readonly username: string;
  private readonly password: string;
  private readonly endpoint: string;
  constructor(username: string, password: string, endpoint = "https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber") {
    this.username = username;
    this.password = password;
    this.endpoint = endpoint;
  }

  async sendVerification({ to, code, templateId }: { to: string; code: string; templateId: string; requestId: string }): Promise<SendResult> {
    const body = new URLSearchParams({ username: this.username, password: this.password, text: code, to: localPhone(to), bodyId: templateId });
    let res: Response;
    try {
      res = await fetch(this.endpoint, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
        body,
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      const timeout = (error as Error).name === "TimeoutError" || (error as Error).name === "AbortError";
      return { state: timeout ? "unknown" : "failed", ref: "", error: timeout ? "پاسخ سرویس پیامک دیر رسید (وضعیت ارسال نامعلوم)." : "اتصال به سرویس پیامک برقرار نشد." };
    }
    if (!res.ok) return { state: "failed", ref: "", error: `سرویس پیامک پاسخ HTTP ${res.status} داد.` };
    let data: { Value?: unknown; RetStatus?: unknown; StrRetStatus?: unknown };
    try {
      data = await res.json();
    } catch {
      return { state: "unknown", ref: "", error: "پاسخ سرویس پیامک قابل خواندن نبود." };
    }
    return interpretMelipayamak(data);
  }
}

/**
 * HTTP 200 is not success: the body carries the business result. Success is
 * RetStatus 1 with a message id (a long number) in Value.
 */
export function interpretMelipayamak(data: { Value?: unknown; RetStatus?: unknown; StrRetStatus?: unknown }): SendResult {
  const value = String(data?.Value ?? "");
  const status = Number(data?.RetStatus);
  if (status === 1 && /^\d{6,}$/.test(value)) return { state: "sent", ref: value, error: "" };
  const known: Record<string, string> = {
    "0": "نام کاربری یا رمز سرویس پیامک نادرست است.",
    "2": "اعتبار حساب پیامک کافی نیست.",
    "3": "محدودیت ارسال روزانه سرویس پیامک.",
    "4": "محدودیت حجم ارسال سرویس پیامک.",
    "5": "شماره فرستنده معتبر نیست.",
    "6": "سامانه پیامک در حال به‌روزرسانی است.",
    "7": "متن شامل کلمه فیلترشده است.",
    "10": "کاربر سرویس پیامک فعال نیست.",
    "11": "ارسال نشد.",
    "12": "مدارک حساب پیامک کامل نیست.",
    "16": "شماره گیرنده یافت نشد.",
    "17": "متن پیامک خالی است.",
    "35": "شماره در لیست سیاه مخابرات است.",
  };
  const code = value || String(data?.RetStatus ?? "");
  return { state: "failed", ref: "", error: known[code] ?? `سرویس پیامک ارسال را نپذیرفت (${String(data?.StrRetStatus ?? code).slice(0, 80)}).` };
}

/** Test/local only: writes codes to a file instead of sending. Refused in production. */
export class OutboxProvider implements SmsProvider {
  readonly name = "outbox";
  private readonly file: string;
  constructor(file: string) {
    this.file = file;
  }
  async sendVerification({ to, code, requestId }: { to: string; code: string; templateId: string; requestId: string }): Promise<SendResult> {
    await appendFile(this.file, `${JSON.stringify({ to, code, requestId, at: new Date().toISOString() })}\n`, { mode: 0o600 });
    return { state: "sent", ref: `outbox-${requestId.slice(0, 8)}`, error: "" };
  }
}

export type ProviderSetup = { provider: SmsProvider | null; templateId: string; blocked: string };

/** The configured provider, or null with the reason (the download flow then stays closed). */
export function smsProvider(): ProviderSetup {
  const outbox = process.env.SMS_TEST_OUTBOX;
  if (outbox) {
    if (process.env.NODE_ENV === "production" && process.env.CI !== "true") return { provider: null, templateId: "", blocked: "صندوق آزمایشی پیامک در محیط اصلی مجاز نیست." };
    return { provider: new OutboxProvider(outbox), templateId: "test", blocked: "" };
  }
  const username = process.env.MELIPAYAMAK_USERNAME ?? "";
  const password = process.env.MELIPAYAMAK_PASSWORD ?? "";
  const bodyId = process.env.MELIPAYAMAK_OTP_BODY_ID ?? "";
  if (!username || !password || !/^\d+$/.test(bodyId)) {
    return { provider: null, templateId: "", blocked: "سرویس پیامک (ملی‌پیامک: نام کاربری، رمز و کد الگو) تنظیم نشده است." };
  }
  return { provider: new MelipayamakProvider(username, password), templateId: bodyId, blocked: "" };
}
