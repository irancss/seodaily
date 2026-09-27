import type { ReactNode } from "react";

import { cx } from "@/lib/utils";

export function SectionHeading({
  title,
  text,
  align = "split",
  action,
  className,
}: {
  title: ReactNode;
  text?: ReactNode;
  align?: "split" | "stack" | "center";
  action?: ReactNode;
  className?: string;
}) {
  if (align === "center") {
    return (
      <div className={cx("flex flex-col gap-3 lg:items-center lg:text-center", className)}>
        <h2 className="t-h2">{title}</h2>
        {text && <p className="body-lg max-w-[680px]">{text}</p>}
      </div>
    );
  }
  if (align === "stack") {
    return (
      <div className={cx("flex max-w-[720px] flex-col gap-3", className)}>
        <h2 className="t-h2">{title}</h2>
        {text && <p className="body-lg">{text}</p>}
        {action}
      </div>
    );
  }
  if (action) {
    // Title and text stay together with the action at the far end. On mobile
    // the design moves the action below the content, so pages render it there.
    return (
      <div className={cx("flex items-end justify-between gap-12", className)}>
        <div className="flex flex-col gap-2 lg:max-w-[640px] lg:gap-3">
          <h2 className="t-h2">{title}</h2>
          {text && <p className="body-lg">{text}</p>}
        </div>
        <div className="hidden shrink-0 lg:block">{action}</div>
      </div>
    );
  }
  return (
    <div
      className={cx(
        "flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-16",
        className,
      )}
    >
      <h2 className="t-h2 lg:max-w-[640px]">{title}</h2>
      {text && <p className="body-lg lg:max-w-[520px]">{text}</p>}
    </div>
  );
}
