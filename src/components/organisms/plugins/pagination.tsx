import Link from "next/link";

import { Icon } from "@/components/atoms";
import { cx } from "@/lib/utils";
import { faNumber } from "@/modules/plugins/labels";

/** Numbered pages as real links (crawlable, work without JavaScript). */
export function Pagination({ page, pages, href }: { page: number; pages: number; href: (page: number) => string }) {
  if (pages <= 1) return null;
  const shown = [...new Set([1, page - 1, page, page + 1, pages])].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
  const item = "flex h-10 min-w-10 items-center justify-center rounded-md border px-3 text-sm no-underline";
  return (
    <nav aria-label="صفحه‌بندی" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link href={href(page - 1)} rel="prev" className={cx(item, "border-line bg-white text-ink hover:border-brand")}>
          <Icon name="chevron-left" size={16} className="rotate-180" />
          <span className="sr-only">صفحه قبل</span>
        </Link>
      )}
      {shown.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && p - shown[i - 1] > 1 && <span aria-hidden="true" className="text-muted">…</span>}
          {p === page ? (
            <span aria-current="page" className={cx(item, "border-brand bg-brand font-semibold text-white")}>
              {faNumber(p)}
            </span>
          ) : (
            <Link href={href(p)} className={cx(item, "border-line bg-white text-ink hover:border-brand")}>
              {faNumber(p)}
            </Link>
          )}
        </span>
      ))}
      {page < pages && (
        <Link href={href(page + 1)} rel="next" className={cx(item, "border-line bg-white text-ink hover:border-brand")}>
          <Icon name="chevron-left" size={16} />
          <span className="sr-only">صفحه بعد</span>
        </Link>
      )}
    </nav>
  );
}
