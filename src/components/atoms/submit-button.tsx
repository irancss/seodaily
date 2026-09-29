"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { cx } from "@/lib/utils";

export function SubmitButton({ children = "ذخیره", variant = "primary", className, disabled = false, "aria-describedby": describedBy }: { children?: ReactNode; variant?: "primary" | "danger" | "secondary"; className?: string; disabled?: boolean; "aria-describedby"?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-describedby={describedBy}
      className={cx(
        "btn h-11 px-5 text-sm",
        variant === "primary" && "btn-primary",
        variant === "secondary" && "btn-secondary",
        variant === "danger" && "border border-error bg-white text-error hover:bg-error-bg",
        className,
      )}
    >
      {pending ? "در حال انجام…" : children}
    </button>
  );
}
