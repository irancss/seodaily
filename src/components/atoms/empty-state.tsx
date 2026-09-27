import type { ReactNode } from "react";

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-md border border-dashed border-line-strong bg-white p-8 text-center text-sm text-muted">{children}</p>;
}
