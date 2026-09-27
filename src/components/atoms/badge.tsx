import type { ReactNode } from "react";

import { cx } from "@/lib/utils";

export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: "gray" | "blue" | "green" | "amber" }) {
  const tones = {
    gray: "bg-page text-ink-2 border-line",
    blue: "bg-soft text-brand-hover border-soft",
    green: "bg-success-bg text-success border-success-bg",
    amber: "bg-warning-bg text-warning border-warning-bg",
  };
  return <span className={cx("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs leading-[1.8] font-medium", tones[tone])}>{children}</span>;
}
