import type { ReactNode } from "react";

/** Small rounded label with a blue dot, above every hero title. */
export function HeroBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1 text-sm leading-[1.7] font-medium text-brand-hover">
      <span aria-hidden="true" className="size-2 rounded-full bg-brand" />
      {children}
    </span>
  );
}
