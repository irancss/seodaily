import { PlaceholderChip } from "@/components/atoms";
import { cx } from "@/lib/utils";

/** Image area of a project/service: the uploaded picture or the design's grid placeholder. */
export function Visual({
  src,
  alt,
  label = "نمونه پروژه",
  tone = "soft",
  className,
}: {
  src?: string | null;
  alt: string;
  label?: string;
  tone?: "soft" | "page";
  className?: string;
}) {
  if (src) {
    return (
      <div className={cx("relative overflow-hidden bg-page", className)}>
        <img src={src} alt={alt} className="absolute inset-0 size-full object-cover object-top" />
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
