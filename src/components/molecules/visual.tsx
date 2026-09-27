import { PlaceholderChip } from "@/components/atoms";
import { cx } from "@/lib/utils";

/** Image area of a project/service: the uploaded picture or the design's grid placeholder. */
export function Visual({
  src,
  alt,
  label = "نمونه پروژه",
  tone = "soft",
  priority = false,
  className,
}: {
  src?: string | null;
  alt: string;
  label?: string;
  tone?: "soft" | "page";
  /** Above-the-fold picture (hero): load it right away instead of lazily. */
  priority?: boolean;
  className?: string;
}) {
  if (src) {
    return (
      <div className={cx("relative overflow-hidden bg-page", className)}>
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : undefined}
          className="absolute inset-0 size-full object-cover object-top"
        />
      </div>
    );
  }
  return (
    <div
      className={cx(
        "grid-bg flex items-center justify-center",
        tone === "soft" ? "bg-soft" : "bg-page",
        className,
      )}
      style={{ ["--grid" as string]: "32px" }}
    >
      <PlaceholderChip>{label}</PlaceholderChip>
    </div>
  );
}
