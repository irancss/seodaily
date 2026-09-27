import Link from "next/link";
import type { ReactNode } from "react";

import { Icon } from "@/components/atoms/icon";
import { cx } from "@/lib/utils";

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  arrow = false,
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  arrow?: boolean;
  className?: string;
}) {
  const sizes = { sm: "h-12 px-5", md: "h-[52px] px-7", lg: "h-14 px-8" };
  return (
    <Link
      href={href}
      className={cx(
        "btn",
        variant === "primary" ? "btn-primary" : "btn-secondary",
        sizes[size],
        size === "lg" && variant === "primary" && "shadow-brand",
        className,
      )}
    >
      {children}
      {arrow && <Icon name="arrow-left" />}
    </Link>
  );
}
