import Link from "next/link";

import { Icon } from "@/components/atoms";
import { cx } from "@/lib/utils";

export function Breadcrumb({
  items,
  separator = "chevron",
  inverse = false,
}: {
  items: { label: string; href?: string }[];
  /** `slash`: the services page variant with underlined links. */
  separator?: "chevron" | "slash";
  /** Light text for dark heroes. */
  inverse?: boolean;
}) {
  const slash = separator === "slash";
  return (
    <nav aria-label="مسیر صفحه">
      <ol
        className={cx(
          "flex flex-wrap items-center gap-2 text-sm",
          slash ? "leading-[1.8] text-muted" : "leading-[1.7] font-medium",
        )}
      >
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && (
              <span aria-hidden="true" className={cx("flex", inverse ? "text-slate-500" : "text-muted")}>
                {slash ? "/" : <Icon name="chevron-left" size={16} />}
              </span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className={cx(
                  inverse ? "text-inverse-muted hover:text-white" : "text-ink-2 hover:text-brand",
                  slash ? "underline underline-offset-4" : "no-underline",
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className={cx("font-medium", inverse ? "text-white" : "text-ink")}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
