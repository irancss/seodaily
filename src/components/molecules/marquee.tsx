import type { ReactNode } from "react";

import { cx } from "@/lib/utils";

/**
 * Endless horizontal ribbon. The second copy is hidden from assistive tech and
 * keyboard focus; motion pauses on hover/focus and stops for reduced motion.
 */
export function Marquee({
  items,
  reverse = false,
  duration = 40,
  className,
  label,
}: {
  items: ReactNode[];
  reverse?: boolean;
  duration?: number;
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cx("marquee", reverse && "marquee-reverse", className)}
      style={{ ["--marquee-duration" as string]: `${duration}s` }}
      aria-label={label}
      role={label ? "region" : undefined}
    >
      <ul className="marquee-track">
        {items.map((item, i) => (
          <li key={i} className="shrink-0">
            {item}
          </li>
        ))}
      </ul>
      <ul className="marquee-track" aria-hidden="true" inert>
        {items.map((item, i) => (
          <li key={i} className="shrink-0">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
