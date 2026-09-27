// Tiny event-based toast API; the <Toaster /> in the root layout renders them.
// Safe to call from any client component (no-op during server rendering).

export type ToastKind = "success" | "error" | "info";
export type ToastMessage = { id: number; kind: ToastKind; message: string };

export const TOAST_EVENT = "sd:toast";

let seq = 0;

function emit(message: string, kind: ToastKind) {
  if (typeof window === "undefined" || !message) return;
  window.dispatchEvent(new CustomEvent<ToastMessage>(TOAST_EVENT, { detail: { id: ++seq, kind, message } }));
}

export const toast = {
  success: (message: string) => emit(message, "success"),
  error: (message: string) => emit(message, "error"),
  info: (message: string) => emit(message, "info"),
};
