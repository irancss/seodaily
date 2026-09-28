"use client";

import { useState } from "react";

/** Copies a code block's text; the code itself is only ever displayed. */
export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="block-code-copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
    >
      <span aria-live="polite">{copied ? "کپی شد" : "کپی کد"}</span>
    </button>
  );
}
