import { cx } from "@/lib/utils";

/** Faint grid that sits behind heroes and CTAs. */
export function GridBackdrop({
  className,
  size = 48,
  fade = "down",
}: {
  className?: string;
  size?: number;
  fade?: "down" | "radial" | "none";
}) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "grid-bg pointer-events-none absolute inset-0",
        fade === "down" && "fade-down",
        fade === "radial" && "fade-radial",
        className,
      )}
      style={{ ["--grid" as string]: `${size}px` }}
    />
  );
}
