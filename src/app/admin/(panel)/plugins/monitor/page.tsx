import Link from "next/link";

import { Card, PageHeader } from "@/components/molecules";
import { PluginsSubnav } from "@/components/organisms/admin/plugins/plugins-subnav";
import { formatBytes, JOB_STATE_LABEL, OUTCOME_LABEL, PLUGIN_STATUS_LABEL } from "@/modules/plugins/labels";
import { monitorData } from "@/modules/plugins/monitor-queries";

export const metadata = { title: "پایش به‌روزرسانی افزونه‌ها" };

const when = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleString("fa-IR", { timeZone: "Asia/Tehran", dateStyle: "medium", timeStyle: "short" }) : "—";

function Stat({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg bg-page p-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`mt-1 text-lg font-bold ${tone}`}>{value}</dd>
    </div>
  );
}

export default async function PluginMonitor() {
  const m = await monitorData();
  const h = m.health;
  const lowDisk = h?.freeBytes !== undefined && h.minFreeBytes !== undefined && h.freeBytes >= 0 && h.freeBytes < h.minFreeBytes;

  return (
    <>
      <PageHeader title="پایش به‌روزرسانی" back={{ href: "/admin/plugins", label: "افزونه‌ها" }} />
      <PluginsSubnav />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="وضعیت پردازشگر (worker)" description="فرایند جدا از سایت که منابع را بررسی و فایل‌ها را کنترل می‌کند.">
          <dl className="grid gap-3 sm:grid-cols-3">
            <Stat label="پردازشگر" value={m.alive ? "فعال" : m.workers.length ? "بی‌پاسخ" : "راه‌اندازی نشده"} tone={m.alive ? "text-success" : "text-error"} />
            <Stat label="در صف / در حال اجرا" value={`${m.queued.toLocaleString("fa-IR")} / ${m.running.toLocaleString("fa-IR")}`} />
            <Stat label="ناموفق در ۲۴ ساعت" value={m.failed24.toLocaleString("fa-IR")} tone={m.failed24 ? "text-error" : ""} />
          </dl>
          <ul className="mt-4 flex flex-col gap-1.5 text-sm leading-[1.9]">
            <li>آخرین علامت حیات: {when(m.workers[0]?.seenAt)}{m.workers[0]?.version ? ` · نسخه ${m.workers[0].version}` : ""}</li>
            <li>
              اسکنر بدافزار:{" "}
              {h?.scanner?.available ? (
                <span className="text-success">
                  {h.scanner.engine} · امضا {h.scanner.signatures} ({(h.scanner.ageHours ?? 0).toLocaleString("fa-IR")} ساعت پیش)
                </span>
              ) : (
                <span className="text-error">{h?.scanner?.error || "نامعلوم"} — انتشار خودکار بسته است.</span>
              )}
            </li>
            <li>
              آزمون ایزوله وردپرس:{" "}
              {h?.sandbox?.available ? <span className="text-success">در دسترس</span> : <span className="text-error">در دسترس نیست — انتشار خودکار بسته است و نسخه‌ها منتظر بررسی شما می‌مانند.</span>}
            </li>
            <li className={lowDisk ? "text-error" : undefined}>
              فضای آزاد فایل‌ها: {h?.freeBytes !== undefined && h.freeBytes >= 0 ? formatBytes(h.freeBytes) : "—"}
              {lowDisk && " — کمتر از حد امن؛ دریافت فایل جدید متوقف است."}
            </li>
            {h?.autoUpdate === false && <li className="text-warning">انتشار خودکار در تنظیمات سرور خاموش است.</li>}
          </ul>
        </Card>
        <Card title="زمان‌بندی" description="هر شب ساعت ۰۳:۰۰ به وقت تهران همه افزونه‌های دارای منبع فعال بررسی می‌شوند.">
          <ul className="flex flex-col gap-1.5 text-sm leading-[1.9]">
            <li>آخرین اجرای شبانه: {m.lastRun ? `${when(m.lastRun.startedAt)} (${m.lastRun.pluginsQueued.toLocaleString("fa-IR")} افزونه)` : "هنوز اجرا نشده"}</li>
            <li>اجرای بعدی: {when(m.nextRun)}</li>
          </ul>
          {m.review.length > 0 && (
            <div className="mt-4">
              <p className="font-semibold">نسخه‌های منتظر بررسی ({m.review.length.toLocaleString("fa-IR")})</p>
              <ul className="mt-2 flex flex-col gap-1 text-sm">
                {m.review.map((r) => (
                  <li key={r.id}>
                    <Link href={`/admin/plugins/${r.pluginId}/sources#release-${r.id}`}>
                      {r.name} <span dir="ltr">{r.version}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <Card title="افزونه‌ها" description="«به‌روز است» فقط یعنی همه منابع فعال خوانده شدند و نسخه معتبر جدیدتری نبود. خطای بخشی از منابع «ناقص» نمایش داده می‌شود.">
          {m.plugins.length === 0 ? (
            <p className="text-sm text-muted">افزونه‌ای ثبت نشده است.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-line text-start text-xs text-muted">
                    <th scope="col" className="py-2 text-start font-medium">افزونه</th>
                    <th scope="col" className="py-2 text-start font-medium">منابع</th>
                    <th scope="col" className="py-2 text-start font-medium">آخرین بررسی</th>
                    <th scope="col" className="py-2 text-start font-medium">نتیجه</th>
                  </tr>
                </thead>
                <tbody>
                  {m.plugins.map((p) => {
                    const outcome = p.job_state === "done" ? (OUTCOME_LABEL[p.job_result ?? ""] ?? p.job_result) : p.job_state ? JOB_STATE_LABEL[p.job_state] : "—";
                    return (
                      <tr key={p.id} className="border-b border-line last:border-b-0">
                        <td className="py-2.5">
                          <Link href={`/admin/plugins/${p.id}/sources`}>{p.name}</Link>
                          <span className="ms-2 text-xs text-muted">{PLUGIN_STATUS_LABEL[p.status]}</span>
                        </td>
                        <td className="py-2.5">
                          {Number(p.sources).toLocaleString("fa-IR")}
                          {Number(p.failing) > 0 && <span className="ms-2 text-xs text-error">{Number(p.failing).toLocaleString("fa-IR")} با خطا ({Number(p.max_failures).toLocaleString("fa-IR")} شکست پیاپی)</span>}
                        </td>
                        <td className="py-2.5">{when(p.last_checked_at)}</td>
                        <td className={`py-2.5 ${p.job_state === "failed" ? "text-error" : ""}`}>
                          {outcome}
                          {p.job_error && <span className="block text-xs text-error">{p.job_error}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
