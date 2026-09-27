"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { toast } from "@/lib/toast";

/**
 * Server actions redirect with ?ok=… or ?error=…; show that as a toast and
 * drop the parameters from the address bar (no navigation, no refetch).
 */
export function FlashToaster() {
  const params = useSearchParams();
  const shown = useRef<string | null>(null);

  useEffect(() => {
    const ok = params.get("ok");
    const error = params.get("error");
    if (!ok && !error) return;

    const key = `${ok}|${error}|${params.toString()}`;
    if (shown.current !== key) {
      shown.current = key;
      if (error) toast.error(error);
      else if (ok) toast.success(ok);
    }

    const next = new URLSearchParams(params);
    next.delete("ok");
    next.delete("error");
    const qs = next.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
  }, [params]);

  return null;
}
