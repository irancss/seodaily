import Link from "next/link";
import { notFound } from "next/navigation";

import { SubmitButton, ConfirmButton } from "@/components/atoms";
import { Card, PageHeader } from "@/components/molecules";
import { PluginsSubnav } from "@/components/organisms/admin/plugins/plugins-subnav";
import { SourceForm } from "@/components/organisms/admin/plugins/source-form";
import { getPluginAdmin } from "@/modules/plugins/admin-queries";
import {
  ADAPTER_LABEL,
  CHECK_LABEL,
  CHECK_STATUS_LABEL,
  CHECK_STATUS_TONE,
  JOB_STATE_LABEL,
  OUTCOME_LABEL,
  RELEASE_STATE_LABEL,
  SOURCE_STATUS_LABEL,
  formatBytes,
} from "@/modules/plugins/labels";
import { jobsFor, recentObservations, releasesFor, sourcesFor } from "@/modules/plugins/monitor-queries";
import { REQUIRED_CHECKS } from "@/modules/plugins/pipeline/releases";
import {
  cancelJobAction,
  checkNowAction,
  deleteSourceAction,
  publishReleaseAction,
  rejectReleaseAction,
  withdrawReleaseAction,
} from "@/modules/plugins/source-actions";

export const metadata = { title: "منابع و نسخه‌های افزونه" };

type Props = { params: Promise<{ id: string }> };

const when = (d: Date | string | null) =>
  d ? new Date(d).toLocaleString("fa-IR", { timeZone: "Asia/Tehran", dateStyle: "medium", timeStyle: "short" }) : "—";

export default async function PluginSources({ params }: Props) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const data = await getPluginAdmin(id);
  if (!data) notFound();
  const { plugin } = data;
  const [sources, releases, jobs] = await Promise.all([sourcesFor(id), releasesFor(id), jobsFor(id)]);
  const observations = await recentObservations(sources.map((s) => s.id));
  const active = jobs.find((j) => j.state === "queued" || j.state === "running");

  return (
    <>
      <PageHeader
        title={`منابع و نسخه‌ها: ${plugin.name}`}
        back={{ href: `/admin/plugins/${id}`, label: "ویرایش افزونه" }}
        action={
          <form action={checkNowAction}>
            <input type="hidden" name="pluginId" value={id} />
            <SubmitButton>{active ? "بررسی در صف است" : "بررسی همین الان"}</SubmitButton>
          </form>
        }
      />
      <PluginsSubnav />

      <p className="mb-6 rounded-lg bg-page p-4 text-sm leading-[1.9] text-ink-2">
        فقط بسته‌ای را وارد کنید که مجاز به میزبانی و بازنشر آن هستید. فایل ZIP دست‌نخورده میزبانی می‌شود؛ ورود، پرداخت، CAPTCHA یا محدودیت لایسنس دور زده
        نمی‌شود. نسخه عمومی = نسخه اعلام‌شده منبع. {plugin.autoUpdate ? "به‌روزرسانی خودکار روشن است: نسخه جدید فقط وقتی همه کنترل‌های اجباری موفق باشند منتشر می‌شود." : "به‌روزرسانی خودکار خاموش است: همه نسخه‌ها منتظر تأیید شما می‌مانند."}
      </p>

      <div id="sources" className="grid gap-6 lg:grid-cols-2">
        {sources.map((s) => (
          <Card key={s.id} title={`منبع #${s.id} · ${ADAPTER_LABEL[s.adapter] ?? s.adapter}`} className="scroll-mt-24">
            <div id={`source-${s.id}`} className="mb-4 grid gap-1 rounded-lg bg-page p-3 text-sm">
              <p>
                وضعیت: <strong>{SOURCE_STATUS_LABEL[s.lastStatus] ?? s.lastStatus}</strong>
                {s.lastVersion && (
                  <>
                    {" "}
                    · نسخه اعلام‌شده <span dir="ltr">{s.lastVersion}</span>
                  </>
                )}
                {!s.enabled && " · غیرفعال"}
              </p>
              <p className="text-muted">آخرین بررسی: {when(s.lastCheckedAt)}</p>
              {s.consecutiveFailures > 0 && <p className="text-warning">{s.consecutiveFailures.toLocaleString("fa-IR")} شکست پیاپی</p>}
              {s.lastError && <p className="text-error">{s.lastError}</p>}
            </div>
            <SourceForm
              pluginId={id}
              allowPrerelease={plugin.allowPrerelease}
              source={{
                id: s.id,
                url: s.url,
                adapter: s.adapter,
                versionSelector: s.versionSelector,
                versionAttribute: s.versionAttribute,
                versionRegex: s.versionRegex,
                downloadSelector: s.downloadSelector,
                downloadUrl: s.downloadUrl,
                priority: s.priority,
                enabled: s.enabled,
                notes: s.notes,
              }}
            />
            <form action={deleteSourceAction} className="mt-3">
              <input type="hidden" name="pluginId" value={id} />
              <input type="hidden" name="id" value={s.id} />
              <ConfirmButton message="این منبع حذف شود؟ نسخه‌های دریافت‌شده از آن باقی می‌مانند.">حذف منبع</ConfirmButton>
            </form>
          </Card>
        ))}
        <Card title="افزودن منبع" description="چند منبع برای یک افزونه مجاز است؛ همه بررسی می‌شوند و جدیدترین نسخه قابل مقایسه انتخاب می‌شود." className="scroll-mt-24">
          <div id="new-source" />
          <SourceForm pluginId={id} allowPrerelease={plugin.allowPrerelease} />
        </Card>
      </div>

      <div id="releases" className="mt-8 scroll-mt-24">
        <Card title="نسخه‌ها" description={`حداکثر ۳ نسخه قابل دانلود (جاری + دو نسخه قبلی). کنترل‌های اجباری انتشار خودکار: ${REQUIRED_CHECKS.map((k) => CHECK_LABEL[k]).join("، ")}.`}>
          {releases.length === 0 ? (
            <p className="text-sm text-muted">هنوز نسخه‌ای دریافت نشده است. پس از افزودن منبع «بررسی همین الان» را بزنید.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {releases.map((r) => {
                const pending = r.state === "review" || r.state === "candidate";
                const allPass = REQUIRED_CHECKS.every((k) => r.checks[k]?.status === "PASS");
                return (
                  <li key={r.id} id={`release-${r.id}`} className="scroll-mt-24 rounded-lg border border-line p-4">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <strong dir="ltr">{r.sourceVersion}</strong>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs ${r.downloadable ? "bg-success-bg text-success" : pending ? "bg-warning-bg text-warning" : "bg-page text-ink-2"}`}>
                        {RELEASE_STATE_LABEL[r.state] ?? r.state}
                        {r.id === plugin.currentReleaseId && " · جاری"}
                      </span>
                      <span className="text-xs text-muted">
                        نسخه داخل بسته: <span dir="ltr">{r.packageVersion || "—"}</span> · {formatBytes(r.bytes)} · {when(r.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted" dir="ltr">
                      SHA-256 {r.sha256}
                      {r.fileDeletedAt ? " (file removed)" : ""}
                    </p>
                    <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      {Object.entries(CHECK_LABEL).map(([k, label]) => {
                        const c = r.checks[k as keyof typeof r.checks];
                        return (
                          <li key={k} className="rounded-md border border-line p-2">
                            <span className="flex items-center justify-between gap-2">
                              <span className="font-medium">{label}</span>
                              <span className={`rounded px-2 py-0.5 text-xs ${CHECK_STATUS_TONE[c?.status ?? "PENDING"]}`}>{CHECK_STATUS_LABEL[c?.status ?? "PENDING"]}</span>
                            </span>
                            {c?.detail && <span className="mt-1 block text-xs leading-[1.8] text-ink-2">{c.detail}</span>}
                          </li>
                        );
                      })}
                    </ul>
                    {r.warnings.length > 0 && (
                      <ul className="mt-3 list-disc rounded-md bg-warning-bg p-3 ps-6 text-xs leading-[1.9] text-warning">
                        {r.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    )}
                    {r.overrideReason && <p className="mt-2 text-xs text-ink-2">انتشار دستی با دلیل: {r.overrideReason}</p>}
                    {pending && !r.fileDeletedAt && (
                      <div className="mt-4 grid gap-3 border-t border-line pt-4 lg:grid-cols-2">
                        <form action={publishReleaseAction} className="flex flex-col gap-2">
                          <input type="hidden" name="pluginId" value={id} />
                          <input type="hidden" name="releaseId" value={r.id} />
                          {!allPass && (
                            <label className="flex flex-col gap-1 text-xs">
                              <span className="font-medium">دلیل انتشار با وجود کنترل‌های ناتمام (ثبت در گزارش تغییرات)</span>
                              <textarea name="override" required rows={2} maxLength={500} className="field text-sm" placeholder="مثلاً: فایل را خودم در وردپرس آزمایشی نصب و بررسی کردم." />
                            </label>
                          )}
                          <SubmitButton>{allPass ? "انتشار این نسخه" : "انتشار دستی با مسئولیت مدیر"}</SubmitButton>
                        </form>
                        <form action={rejectReleaseAction} className="flex flex-col gap-2">
                          <input type="hidden" name="pluginId" value={id} />
                          <input type="hidden" name="releaseId" value={r.id} />
                          <label className="flex flex-col gap-1 text-xs">
                            <span className="font-medium">دلیل رد (اختیاری)</span>
                            <input name="reason" maxLength={300} className="field h-10 text-sm" />
                          </label>
                          <SubmitButton variant="danger">رد این نسخه</SubmitButton>
                        </form>
                      </div>
                    )}
                    {r.state === "published" && (
                      <form action={withdrawReleaseAction} className="mt-4 flex flex-wrap items-end gap-2 border-t border-line pt-4">
                        <input type="hidden" name="pluginId" value={id} />
                        <input type="hidden" name="releaseId" value={r.id} />
                        <label className="flex min-w-[240px] flex-1 flex-col gap-1 text-xs">
                          <span className="font-medium">برداشتن فوری این فایل از دسترس (مشکوک/نادرست) — دلیل</span>
                          <input name="reason" required maxLength={300} className="field h-10 text-sm" />
                        </label>
                        <SubmitButton variant="danger">برداشتن فایل</SubmitButton>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <div id="jobs" className="mt-8 grid scroll-mt-24 gap-6 lg:grid-cols-2">
        <Card title="بررسی‌های اخیر" description="هر کلیک یا اجرای شبانه یک کار در صف است؛ اجرای طولانی در پنل انجام نمی‌شود.">
          {jobs.length === 0 ? (
            <p className="text-sm text-muted">هنوز بررسی‌ای انجام نشده است.</p>
          ) : (
            <ul className="flex flex-col gap-3 text-sm">
              {jobs.map((j) => (
                <li key={j.id} className="rounded-md border border-line p-3">
                  <p className="flex flex-wrap items-center gap-x-3">
                    <strong>#{j.id}</strong>
                    <span>{JOB_STATE_LABEL[j.state] ?? j.state}</span>
                    {typeof j.result?.status === "string" && <span className="text-ink-2">{OUTCOME_LABEL[j.result.status] ?? j.result.status}</span>}
                    <span className="text-xs text-muted">
                      {j.requestedBy === "admin" ? "دستی" : j.requestedBy === "schedule" ? "شبانه" : "سیستم"} · {when(j.createdAt)}
                      {j.attempts > 1 && ` · تلاش ${j.attempts.toLocaleString("fa-IR")}`}
                    </span>
                  </p>
                  {j.error && <p className="mt-1 text-xs text-error">{j.error}</p>}
                  {j.log.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-brand-hover">گزارش ({j.log.length.toLocaleString("fa-IR")} خط)</summary>
                      <ol className="mt-2 max-h-64 list-decimal overflow-auto ps-5 text-xs leading-[1.9] text-ink-2">
                        {j.log.map((l, i) => (
                          <li key={i}>{l}</li>
                        ))}
                      </ol>
                    </details>
                  )}
                  {(j.state === "queued" || j.state === "running") && (
                    <form action={cancelJobAction} className="mt-2">
                      <input type="hidden" name="pluginId" value={id} />
                      <input type="hidden" name="jobId" value={j.id} />
                      <SubmitButton variant="secondary">لغو پیش از انتشار</SubmitButton>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="خوانش‌های اخیر منابع" description="شواهد کوتاه انتخاب نسخه و فایل؛ متن صفحه منبع ذخیره نمی‌شود.">
          {observations.length === 0 ? (
            <p className="text-sm text-muted">—</p>
          ) : (
            <ul className="flex flex-col gap-2 text-xs leading-[1.9]">
              {observations.map((o) => (
                <li key={o.id} className="border-b border-line pb-2 last:border-b-0">
                  <span className="font-medium">منبع #{o.sourceId}</span> · {when(o.observedAt)} · {SOURCE_STATUS_LABEL[o.result] ?? o.result}
                  {o.sourceVersion && (
                    <>
                      {" "}
                      · <span dir="ltr">{o.sourceVersion}</span>
                    </>
                  )}
                  {o.confidence > 0 && ` · اطمینان ${o.confidence}٪`}
                  {o.evidence.length > 0 && <span className="block text-muted">{o.evidence.join(" | ")}</span>}
                  {o.error && <span className="block text-error">{o.error}</span>}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted">
            <Link href="/admin/plugins/monitor">پایش همه افزونه‌ها</Link>
          </p>
        </Card>
      </div>
    </>
  );
}
