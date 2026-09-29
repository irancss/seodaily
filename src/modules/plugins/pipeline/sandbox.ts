import type { ReleaseCheck } from "@/db/plugins-schema";

// Isolated WordPress smoke test (install, activate, one request, fatal/log
// check) runs only in a hardened runner outside this host: a separate VM or
// sandbox with no secrets, no site volumes, no Docker socket and no network.
// Unknown PHP is never executed on the web/worker host as a fallback.
//
// Contract with a runner (PLUGIN_SANDBOX_URL): not implemented on this
// server, so the check reports UNAVAILABLE and auto-publish stays closed.

export type SandboxResult = "installed_activated_no_fatal" | "install_failed" | "activation_fatal" | "requires_dependency" | "not_testable" | "timeout";

export interface SandboxRunner {
  readonly available: boolean;
  run(input: { artifactPath: string; sha256: string; mainFile: string; wpVersion: string; phpVersion: string }): Promise<ReleaseCheck>;
}

export class UnavailableSandbox implements SandboxRunner {
  readonly available = false;
  private readonly reason: string;
  constructor(reason: string) {
    this.reason = reason;
  }
  async run(): Promise<ReleaseCheck> {
    return { status: "UNAVAILABLE", detail: this.reason, at: new Date().toISOString() };
  }
}

export function sandboxRunner(url: string): SandboxRunner {
  if (!url) {
    return new UnavailableSandbox("محیط ایزوله آزمون WordPress (VM/sandbox جدا از سرور) راه‌اندازی نشده است؛ کد PHP ناشناخته روی این سرور اجرا نمی‌شود.");
  }
  // A configured URL alone is not a hardened runner; until one exists and is
  // verified, the check stays UNAVAILABLE instead of trusting an endpoint.
  return new UnavailableSandbox("نشانی runner تنظیم شده ولی قرارداد runner ایزوله روی این نسخه پیاده/تأیید نشده است.");
}
