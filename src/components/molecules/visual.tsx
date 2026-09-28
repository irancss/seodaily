import Image from "next/image";

import { PlaceholderChip } from "@/components/atoms";
import { cx } from "@/lib/utils";

/** Image area of a project/service: the uploaded picture or the design's grid placeholder. */
export function Visual({
  src,
  alt,
  label = "نمونه پروژه",
  tone = "soft",
  priority = false,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  className,
}: {
  src?: string | null;
  alt: string;
  label?: string;
  tone?: "soft" | "page";
  /** Above-the-fold picture (hero): load it right away instead of lazily. */
  priority?: boolean;
  /** Rendered width, so the browser downloads a matching size. */
  sizes?: string;
  className?: string;
}) {
  if (src) {
    return (
      <div className={cx("relative overflow-hidden bg-page", className)}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover object-top" />
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
