import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";

import type { ReleaseCheck } from "@/db/plugins-schema";

export type SandboxResult = "installed_activated_no_fatal" | "install_failed" | "activation_fatal" | "requires_dependency" | "not_testable" | "timeout";
export type SandboxHealth = { available: boolean; detail: string; profile?: string };
export interface SandboxRunner {
  readonly available: boolean;
  health?(): Promise<SandboxHealth>;
  run(input: { artifactPath: string; sha256: string; mainFile: string; wpVersion: string; phpVersion: string; requiresPlugins?: string }): Promise<ReleaseCheck>;
}

export class UnavailableSandbox implements SandboxRunner {
  readonly available = false;
  private readonly reason: string;
  constructor(reason: string) { this.reason = reason; }
  async health(): Promise<SandboxHealth> { return { available: false, detail: this.reason }; }
  async run(): Promise<ReleaseCheck> { return { status: "UNAVAILABLE", detail: this.reason, at: new Date().toISOString() }; }
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  if (!response.ok || !response.body) throw new Error(`runner HTTP ${response.status}`);
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = response.body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 16_384) throw new Error("runner response too large");
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

/** Authenticated protocol to a trusted orchestrator on a separate VM.
 * Only ZIP bytes cross the boundary, never a host path or a command.
 */
export function sandboxRunner(url: string, token = "", timeoutMs = 240_000): SandboxRunner {
  const unavailable = (why: string) => new UnavailableSandbox(why);
  if (!url) return unavailable("محیط جداگانهٔ آزمون وردپرس هنوز راه‌اندازی نشده است.");
  if (token.length < 32) return unavailable("کلید اتصال آزمون وردپرس تنظیم نشده است (PLUGIN_SANDBOX_TOKEN).");
  let base: URL;
  try {
    base = new URL(url);
    const localTest = process.env.NODE_ENV !== "production" && ["127.0.0.1", "[::1]"].includes(base.hostname);
    if ((base.protocol !== "https:" && !(localTest && base.protocol === "http:")) || base.username || base.password || base.search || base.hash) throw new Error();
  } catch { return unavailable("نشانی آزمون وردپرس باید HTTPS و بدون نام کاربری، query یا fragment باشد."); }
  const headers = { authorization: `Bearer ${token}` };
  return {
    available: true,
    async health() {
      try {
        const data = await readJson(await fetch(new URL("/v1/health", base), { headers, redirect: "error", signal: AbortSignal.timeout(5000) }));
        if (data.protocol !== 1 || data.ready !== true || typeof data.profile !== "string") throw new Error("runner not ready");
        return { available: true, detail: "اتصال و پروفایل آزمون آماده است.", profile: data.profile.slice(0, 120) };
      } catch { return { available: false, detail: "اتصال یا پروفایل آزمون آماده نیست؛ سرویس runner و کلید اتصال را بررسی کنید." }; }
    },
    async run(input) {
      const at = new Date().toISOString();
      const requestId = randomUUID();
      let body: ReturnType<typeof createReadStream> | undefined;
      try {
        const size = (await stat(input.artifactPath)).size;
        if (!/^[a-f0-9]{64}$/.test(input.sha256) || size <= 0 || size > 100 * 1024 * 1024) throw new Error("invalid artifact");
        body = createReadStream(input.artifactPath);
        const data = await readJson(await fetch(new URL("/v1/check", base), {
          method: "POST", redirect: "error", signal: AbortSignal.timeout(timeoutMs),
          headers: { ...headers, "content-type": "application/zip", "content-length": String(size), "x-request-id": requestId, "x-artifact-sha256": input.sha256, "x-main-file": encodeURIComponent(input.mainFile), "x-requires-plugins": encodeURIComponent(input.requiresPlugins ?? "") },
          body: body as unknown as BodyInit, duplex: "half",
        } as RequestInit));
        if (data.protocol !== 1 || data.requestId !== requestId || data.sha256 !== input.sha256 || data.mainFile !== input.mainFile) throw new Error("runner result mismatch");
        const profile = typeof data.profile === "string" ? data.profile.slice(0, 120) : "";
        const stages = data.stages as Record<string, unknown> | undefined;
        if (data.result === "installed_activated_no_fatal" && profile && stages?.installed === true && stages?.activated === true && stages?.request === true && stages?.noFatal === true) {
          return { status: "PASS", detail: `نصب، فعال‌سازی و درخواست وردپرس بدون fatal در پروفایل ${profile}؛ این نتیجه تضمین سازگاری با همه سایت‌ها نیست.`, at };
        }
        if (data.result === "install_failed" || data.result === "activation_fatal") return { status: "FAIL", detail: `آزمون وردپرس ناموفق: ${data.result} (${profile})`, at };
        if (data.result === "requires_dependency" || data.result === "not_testable") return { status: "WARNING", detail: `آزمون کامل ممکن نبود: ${data.result} (${profile})؛ وابستگی، مجوز یا سرویس خارجی را بررسی کنید.`, at };
        throw new Error("incomplete runner result");
      } catch {
        return { status: "UNAVAILABLE", detail: "آزمون ایزوله نتیجهٔ کامل و معتبر نداد (اتصال، مهلت اجرا یا قرارداد پاسخ).", at };
      } finally { body?.destroy(); }
    },
  };
}
