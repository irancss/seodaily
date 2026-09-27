import { cx } from "@/lib/utils";

export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={cx(
        "mb-6 rounded-sm px-4 py-3 text-sm leading-[1.8] font-medium",
        error ? "bg-error-bg text-error" : "bg-success-bg text-success",
      )}
    >
      {error ?? ok}
    </p>
  );
}
