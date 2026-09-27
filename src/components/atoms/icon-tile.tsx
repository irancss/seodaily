import { Icon, type IconName } from "@/components/atoms/icon";
import { cx } from "@/lib/utils";

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
  tone?: "soft" | "white";
  /** Size classes (e.g. responsive); replaces `size` when given. */
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "flex shrink-0 items-center justify-center text-brand",
        round ? "rounded-full" : "rounded-md",
        tone === "soft" ? "bg-soft" : "border border-line bg-white",
        className,
      )}
      style={className ? undefined : { width: size, height: size }}
    >
      <Icon name={name} size={iconSize} strokeWidth={1.75} />
    </span>
  );
}
