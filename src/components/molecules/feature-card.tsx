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
      <div className="flex items-start justify-between gap-4">
        {icon && <IconTile name={icon} tone="gradient" className="size-12 rounded-[14px] lg:size-14" />}
        {index !== undefined && (
          <span aria-hidden="true" className="text-2xl leading-none font-bold text-line-strong lg:text-3xl">
            {String(index + 1).padStart(2, "0")}
          </span>
        )}
        {href && index === undefined && <ArrowBadge size={40} />}
      </div>
      <h3 className="card-title t-h3 mt-5 transition-colors lg:mt-6">{title}</h3>
      {text && <p className="mt-2 text-base leading-[1.9] text-ink-2">{text}</p>}
      {children}
    </>
  );
  const classes = cx("card-fancy flex h-full flex-col rounded-xl p-6 lg:p-8", className);

  if (href) {
    return (
      <Link href={href} className={cx("card-link text-ink no-underline hover:text-ink", classes)}>
        {body}
      </Link>
    );
  }
  return <div className={classes}>{body}</div>;
}
