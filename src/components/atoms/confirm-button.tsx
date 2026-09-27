"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { Icon } from "@/components/atoms/icon";

/** Delete button that asks for confirmation first. */
export function ConfirmButton({ children = "حذف", message = "از حذف این مورد مطمئن هستید؟" }: { children?: ReactNode; message?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className="btn h-11 border border-error bg-white px-4 text-sm text-error hover:bg-error-bg"
    >
      <Icon name="trash" size={16} />
      {children}
    </button>
  );
}

