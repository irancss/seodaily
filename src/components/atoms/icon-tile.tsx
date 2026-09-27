import { Icon, type IconName } from "@/components/atoms/icon";
import { cx } from "@/lib/utils";

const TONES = {
  soft: "bg-soft text-brand",
  white: "border border-line bg-white text-brand",
  /** Brand gradient with a white glyph; tilts when its card is hovered. */
  gradient: "icon-gradient",
  /** Translucent tile for dark sections. */
  glass: "border border-white/15 bg-white/10 text-sky-200",
};

export function IconTile({
  name,
  size = 56,
  iconSize = 28,
  round = false,
  tone = "soft",
  className,
}: {
  name: IconName | string;
  size?: number;
  iconSize?: number;
  round?: boolean;
  tone?: keyof typeof TONES;
  /** Size classes (e.g. responsive); replaces `size` when given. */
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx("flex shrink-0 items-center justify-center", round ? "rounded-full" : "rounded-md", TONES[tone], className)}
      style={className ? undefined : { width: size, height: size }}
    >
      <Icon name={name} size={iconSize} strokeWidth={1.75} />
    </span>
  );
}
