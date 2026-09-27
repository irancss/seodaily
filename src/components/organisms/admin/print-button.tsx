"use client";

import { Icon } from "@/components/atoms/icon";

export function PrintButton({ label = "چاپ قرارداد" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-primary h-11 px-5 text-sm">
      <Icon name="doc-check" size={18} />
      {label}
    </button>
  );
}
