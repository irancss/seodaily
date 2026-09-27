import type { ReactNode } from "react";

import { Icon } from "@/components/atoms/icon";

export function PlaceholderChip({ children, icon = false }: { children: ReactNode; icon?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm leading-[1.7] font-medium whitespace-nowrap text-ink-2 shadow-sm">
      {icon && <Icon name="image" size={18} />}
      {children}
    </span>
  );
}
