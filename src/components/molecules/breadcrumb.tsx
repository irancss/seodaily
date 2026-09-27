import Link from "next/link";

import { Icon } from "@/components/atoms";
import { cx } from "@/lib/utils";

export function Breadcrumb({
  items,
  separator = "chevron",
}: {
  items: { label: string; href?: string }[];
  /** `slash`: the services page variant with underlined links. */
  separator?: "chevron" | "slash";
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
              <span aria-hidden="true" className="flex text-muted">
                {slash ? "/" : <Icon name="chevron-left" size={16} />}
              </span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className={cx(
                  "text-ink-2 hover:text-brand",
                  slash ? "underline underline-offset-4" : "no-underline",
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
