import { Icon, type IconName } from "@/components/atoms/icon";
import { cx } from "@/lib/utils";

export function ArrowBadge({
  size = 44,
  variant = "outline",
  icon = "arrow-left",
}: {
  size?: number;
  variant?: "outline" | "soft" | "white";
  icon?: IconName;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "arrow-badge",
        variant === "outline" && "border border-line",
        variant === "soft" && "bg-soft",
        variant === "white" && "bg-white",
      )}
      style={{ width: size, height: size }}
    >
      <Icon name={icon} size={size <= 36 ? 18 : 20} />
    </span>
  );
}
