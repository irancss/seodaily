import { faDate, formatBytes } from "@/modules/plugins/labels";
import type { PublicRelease } from "@/modules/plugins/queries";

import { DownloadButton, DownloadSessionNote } from "./download-flow";

/**
 * Downloadable versions (at most three). Each button asks for a short-lived
 * link; without a verified phone on this browser it first opens the
 * phone/code dialog. The file never starts by itself: the visitor clicks
 * the link that appears.
 */
export function DownloadBox({ releases, preview = false, available = true }: { releases: PublicRelease[]; preview?: boolean; available?: boolean }) {
  if (releases.length === 0) {
    return <p className="mt-4 rounded-lg border border-dashed border-line-strong bg-white p-5 text-sm text-muted">فعلاً نسخه‌ای برای دانلود آماده نیست.</p>;
  }
  return (
    <div className="mt-4">
      <ul className="flex flex-col gap-3">
        {releases.map((r) => (
          <li key={r.id} className="rounded-lg border border-line bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  نسخه <span dir="ltr">{r.version}</span> {r.current && <span className="chip ms-2 text-xs">جدیدترین</span>}
                </p>
                <p className="mt-1 text-sm text-muted">{[r.publishedAt ? faDate(r.publishedAt) : "", formatBytes(r.bytes)].filter(Boolean).join(" · ")}</p>
              </div>
              {preview ? (
                <span className="text-xs text-muted">دکمه دانلود در پیش‌نمایش غیرفعال است</span>
              ) : !available ? (
                <span className="text-xs text-muted">دریافت فایل موقتاً فعال نیست</span>
              ) : (
                <DownloadButton releaseId={r.id} version={r.version} primary={r.current} />
              )}
            </div>
            {r.changelog && (
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-brand-hover">تغییرات این نسخه</summary>
                <p className="mt-2 whitespace-pre-line leading-[1.9] text-ink-2" dir="auto">
                  {r.changelog}
                </p>
              </details>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-[1.9] text-muted">
        دانلود رایگان است و فقط یک بار تأیید شماره موبایل ایران لازم دارد؛ این مرورگر تا ۳۰ روز شناخته می‌شود. شماره فقط برای ارسال کد و آمار داخلی دانلود نگه
        داشته می‌شود و پیامک تبلیغاتی ارسال نمی‌شود.
      </p>
      {!preview && <DownloadSessionNote />}
    </div>
  );
}
