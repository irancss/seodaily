import type { ReactNode } from "react";

import { Dots } from "@/components/atoms";
import { cx } from "@/lib/utils";

/** Browser chrome around an image or a placeholder. */
export function BrowserFrame({
  children,
  url = "www.example.com",
  compact = false,
  shadow = "md",
  className,
}: {
  children: ReactNode;
  url?: string | null;
  compact?: boolean;
  shadow?: "none" | "sm" | "md";
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex flex-col overflow-hidden rounded-md border border-line bg-white",
        shadow === "md" && "shadow-md",
        shadow === "sm" && "shadow-sm",
        className,
      )}
    >
      <div
        className={cx(
          "flex shrink-0 items-center gap-4 border-b border-line bg-page",
          compact ? "h-7 px-2.5 lg:h-9 lg:px-3.5" : "h-9 px-3 lg:h-11 lg:px-4",
        )}
      >
        <Dots size={compact ? 8 : 10} />
        {url !== null && !compact && (
          <div
            dir="ltr"
            className="flex h-[22px] min-w-0 grow items-center truncate rounded-full border border-line bg-white px-2.5 text-sm text-muted lg:h-7 lg:px-3"
          >
            {url}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
