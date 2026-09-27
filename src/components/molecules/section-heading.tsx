import type { ReactNode } from "react";

import { Highlight } from "@/components/atoms";
import { cx } from "@/lib/utils";

/**
 * Section title with an optional eyebrow label. String titles may wrap a word
 * in *stars* to give it the brand gradient.
 */
export function SectionHeading({
  eyebrow,
  title,
  text,
  align = "split",
  action,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  text?: ReactNode;
  align?: "split" | "stack" | "center";
  action?: ReactNode;
  className?: string;
}) {
  const heading = (
    <>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className="t-h2">{typeof title === "string" ? <Highlight text={title} /> : title}</h2>
    </>
  );

  if (align === "center") {
    return (
      <div className={cx("reveal flex flex-col items-start gap-3 lg:items-center lg:text-center", className)}>
        {heading}
        {text && <p className="body-lg max-w-[680px]">{text}</p>}
        {action}
      </div>
    );
  }
  if (align === "stack") {
    return (
      <div className={cx("reveal flex max-w-[720px] flex-col items-start gap-3", className)}>
        {heading}
        {text && <p className="body-lg">{text}</p>}
        {action}
      </div>
    );
  }
  if (action) {
    // Title and text stay together with the action at the far end. On mobile
    // the action moves below the content, so pages render it there as well.
    return (
      <div className={cx("reveal flex items-end justify-between gap-12", className)}>
        <div className="flex flex-col items-start gap-2 lg:max-w-[640px] lg:gap-3">
          {heading}
          {text && <p className="body-lg">{text}</p>}
        </div>
        <div className="hidden shrink-0 lg:block">{action}</div>
      </div>
    );
  }
  return (
    <div className={cx("reveal flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-16", className)}>
      <div className="flex flex-col items-start gap-3 lg:max-w-[640px]">{heading}</div>
      {text && <p className="body-lg lg:max-w-[520px]">{text}</p>}
    </div>
  );
}
