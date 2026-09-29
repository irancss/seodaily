import Link from "next/link";
import type { ReactNode } from "react";

import { ArrowBadge } from "@/components/atoms/arrow-badge";
import { IconTile } from "@/components/atoms/icon-tile";
import { cx } from "@/lib/utils";

/**
 * Icon + title + text card with the gradient hover border. With `href` the
 * whole card is a link.
 */
export function FeatureCard({
  icon,
  title,
  text,
  href,
  index,
  children,
  className,
}: {
  icon?: string;
  title: string;
  text?: ReactNode;
  href?: string;
  /** Position in its list, shown as a faint number in the corner. */
  index?: number;
  children?: ReactNode;
  className?: string;
}) {
  const body = (
    <>
      <div className="flex items-start gap-3">
        {icon && <IconTile name={icon} tone="gradient" className="size-11 rounded-[14px] sm:size-12" />}
        <h3 className="card-title t-h3 min-w-0 flex-1 self-center transition-colors">{title}</h3>
        {index !== undefined && (
          <span aria-hidden="true" className="shrink-0 text-2xl leading-none font-bold text-line-strong">
            {String(index + 1).padStart(2, "0")}
          </span>
        )}
        {href && index === undefined && <ArrowBadge size={40} />}
      </div>
      {text && <p className="mt-3 text-base leading-[1.9] text-ink-2">{text}</p>}
      {children}
    </>
  );
  const classes = cx("card-fancy flex h-full min-w-0 flex-col rounded-xl p-5 sm:p-6", className);

  if (href) {
    return (
      <Link href={href} className={cx("card-link text-ink no-underline hover:text-ink", classes)}>
        {body}
      </Link>
    );
  }
  return <div className={classes}>{body}</div>;
}
