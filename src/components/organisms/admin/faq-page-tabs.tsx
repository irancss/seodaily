import Link from "next/link";

import { FAQ_PAGES, type FaqPage } from "@/db/schema";
import { cx } from "@/lib/utils";

export const FAQ_PAGE_LABELS: Record<FaqPage, string> = { home: "صفحه اصلی", services: "خدمات", "web-design": "طراحی سایت", seo: "سئو" };

/** Pills switching the FAQ editor between site pages; `current` is active. */
export function FaqPageTabs({ current }: { current: FaqPage }) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {FAQ_PAGES.map((p) => (
        <Link
          key={p}
          href={`/admin/faqs?page=${p}`}
          className={cx("rounded-full border px-4 py-1.5 text-sm font-medium no-underline", p === current ? "border-brand bg-brand text-white hover:text-white" : "border-line bg-white text-ink-2")}
        >
          {FAQ_PAGE_LABELS[p]}
        </Link>
      ))}
    </div>
  );
}
