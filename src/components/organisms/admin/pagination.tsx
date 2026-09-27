import Link from "next/link";

import { cx } from "@/lib/utils";

/** Numbered page links; renders nothing when there is a single page. */
export function Pagination({ page, pages, href }: { page: number; pages: number; href: (page: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="صفحه‌بندی" className="mt-6 flex items-center justify-center gap-2">
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? "page" : undefined}
          className={cx("flex size-10 items-center justify-center rounded-sm border text-sm no-underline", p === page ? "border-brand bg-brand text-white hover:text-white" : "border-line bg-white text-ink")}
        >
          {p}
        </Link>
      ))}
    </nav>
  );
}
