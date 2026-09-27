import type { ReactNode } from "react";

import { cx } from "@/lib/utils";

export function Card({ title, description, children, className }: { title?: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cx("rounded-xl border border-line bg-white p-5 sm:p-6", className)}>
      {title && <h2 className="text-lg leading-[1.7] font-bold">{title}</h2>}
      {description && <p className="mt-1 text-sm leading-[1.8] text-muted">{description}</p>}
      <div className={title || description ? "mt-5" : undefined}>{children}</div>
    </section>
  );
}
