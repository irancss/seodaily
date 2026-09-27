import { Icon } from "@/components/atoms/icon";
import { cx, formatPhone, phoneE164 } from "@/lib/utils";

/** tel: link with the number shown left-to-right in the site's digits. */
export function PhoneLink({
  phone,
  className,
  showIcon = true,
  iconClassName,
}: {
  phone: string;
  className?: string;
  showIcon?: boolean;
  iconClassName?: string;
}) {
  return (
    <a href={`tel:${phoneE164(phone)}`} className={cx("inline-flex items-center gap-2 no-underline", className)}>
      {showIcon && (
        <span aria-hidden="true" className={cx("flex shrink-0 items-center justify-center", iconClassName)}>
          <Icon name="phone" size={18} />
        </span>
      )}
      <span dir="ltr">{formatPhone(phone)}</span>
    </a>
  );
}
