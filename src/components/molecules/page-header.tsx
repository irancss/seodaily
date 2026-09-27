import Link from "next/link";
import type { ReactNode } from "react";

import { Icon } from "@/components/atoms";

export function PageHeader({
  title,
  description,
  action,
  back,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back && (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-ink-2 no-underline hover:text-brand">
            <Icon name="arrow-left" size={16} className="rotate-180" />
            {back.label}
          </Link>
        )}
        <h1 className="text-2xl leading-[1.6] font-bold">{title}</h1>
        {description && <p className="mt-1 text-sm leading-[1.8] text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
