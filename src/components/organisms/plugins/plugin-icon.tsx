import Image from "next/image";

import { cx } from "@/lib/utils";

/** The plugin's icon, or its first letter on a tinted tile when it has none. */
export function PluginIcon({ src, name, size = 56, priority = false, className }: { src: string; name: string; size?: number; priority?: boolean; className?: string }) {
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        priority={priority}
        className={cx("shrink-0 rounded-xl border border-line bg-white object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  const letter = Array.from(name.trim())[0] ?? "؟";
  return (
    <span
      aria-hidden="true"
      data-letter={letter.toUpperCase()}
      className={cx("flex shrink-0 items-center justify-center rounded-xl bg-soft font-bold text-brand-hover before:content-[attr(data-letter)]", className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
    </span>
  );
}
