"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Icon, type IconName } from "@/components/atoms/icon";
import { TOAST_EVENT, type ToastKind, type ToastMessage } from "@/lib/toast";
import { cx } from "@/lib/utils";

const ICONS: Record<ToastKind, { icon: IconName; className: string }> = {
  success: { icon: "check", className: "bg-success text-white" },
  error: { icon: "alert", className: "bg-error text-white" },
  info: { icon: "info", className: "bg-brand text-white" },
};

/** Success/info toasts close by themselves; errors stay until dismissed. */
const AUTO_CLOSE_MS = 4500;
const MAX_VISIBLE = 4;

function ToastCard({ item, onClose }: { item: ToastMessage; onClose: (id: number) => void }) {
  const { icon, className } = ICONS[item.kind];
  return (
    <div className="toast">
      <span aria-hidden="true" className={cx("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full", className)}>
        <Icon name={icon} size={16} strokeWidth={2.5} />
      </span>
      <p className="grow">{item.message}</p>
      <button
        type="button"
        onClick={() => onClose(item.id)}
        aria-label="بستن پیام"
        className="-m-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-inverse-muted hover:bg-white/10 hover:text-white"
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

export function Toaster() {
  const [items, setItems] = useState<ToastMessage[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  useEffect(() => {
    const active = timers.current;
    function onToast(event: Event) {
      const item = (event as CustomEvent<ToastMessage>).detail;
      // A success means earlier problems were resolved, so their error toasts go.
      setItems((list) =>
        [...list.filter((t) => t.message !== item.message && !(item.kind === "success" && t.kind === "error")), item].slice(
          -MAX_VISIBLE,
        ),
      );
      if (item.kind !== "error") active.set(item.id, setTimeout(() => dismiss(item.id), AUTO_CLOSE_MS));
    }
    window.addEventListener(TOAST_EVENT, onToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast);
      active.forEach(clearTimeout);
      active.clear();
    };
  }, [dismiss]);

  // Two live regions that always exist, so screen readers announce new toasts.
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
      <div role="status" aria-live="polite" className="flex flex-col items-center gap-2">
        {items.filter((t) => t.kind !== "error" && !t.silent).map((t) => (
          <ToastCard key={t.id} item={t} onClose={dismiss} />
        ))}
      </div>
      <div role="alert" aria-live="assertive" className="flex flex-col items-center gap-2">
        {items.filter((t) => t.kind === "error" && !t.silent).map((t) => (
          <ToastCard key={t.id} item={t} onClose={dismiss} />
        ))}
      </div>
      {/* Already announced by the page itself: visual only, so it is not read twice. */}
      <div aria-hidden="true" className="flex flex-col items-center gap-2">
        {items.filter((t) => t.silent).map((t) => (
          <ToastCard key={t.id} item={t} onClose={dismiss} />
        ))}
      </div>
    </div>
  );
}
