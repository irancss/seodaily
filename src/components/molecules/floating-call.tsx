import { Icon } from "@/components/atoms/icon";
import { formatPhone, phoneE164 } from "@/lib/utils";

/** Round call button pinned to the bottom-left corner on small screens. */
export function FloatingCall({ phone }: { phone: string }) {
  return (
    <a href={`tel:${phoneE164(phone)}`} className="fab-call lg:hidden" aria-label={`تماس تلفنی: ${formatPhone(phone)}`}>
      <Icon name="phone" size={22} />
    </a>
  );
}
