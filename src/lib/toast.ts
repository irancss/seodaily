// Tiny event-based toast API; the <Toaster /> in the root layout renders them.
// Safe to call from any client component (no-op during server rendering).

export type ToastKind = "success" | "error" | "info";
/** `silent`: shown but not announced, for messages the page already announces inline (role="alert"/"status"). */
export type ToastMessage = { id: number; kind: ToastKind; message: string; silent?: boolean };
type Options = { silent?: boolean };

export const TOAST_EVENT = "sd:toast";

let seq = 0;

function emit(message: string, kind: ToastKind, options?: Options) {
  if (typeof window === "undefined" || !message) return;
  window.dispatchEvent(new CustomEvent<ToastMessage>(TOAST_EVENT, { detail: { id: ++seq, kind, message, silent: options?.silent } }));
}

export const toast = {
  success: (message: string, options?: Options) => emit(message, "success", options),
  error: (message: string, options?: Options) => emit(message, "error", options),
  info: (message: string, options?: Options) => emit(message, "info", options),
};
