import { faDate, formatBytes } from "@/modules/plugins/labels";
import type { PublicRelease } from "@/modules/plugins/queries";

/** Downloadable versions (at most three). The phone check and file link are added by the download flow. */
export function DownloadBox({ releases }: { releases: PublicRelease[] }) {
  if (releases.length === 0) {
    return <p className="mt-4 rounded-lg border border-dashed border-line-strong bg-white p-5 text-sm text-muted">فعلاً نسخه‌ای برای دانلود آماده نیست.</p>;
  }
  return (
    <ul className="mt-4 flex flex-col gap-3">
      {releases.map((r) => (
        <li key={r.id} className="rounded-lg border border-line bg-white p-4">
          <p className="font-semibold">
            نسخه <span dir="ltr">{r.version}</span> {r.current && <span className="chip ms-2 text-xs">جدیدترین</span>}
          </p>
          <p className="mt-1 text-sm text-muted">
            {[r.publishedAt ? faDate(r.publishedAt) : "", formatBytes(r.bytes)].filter(Boolean).join(" · ")}
          </p>
        </li>
      ))}
    </ul>
  );
}
