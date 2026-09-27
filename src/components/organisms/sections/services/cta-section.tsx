import { CtaSection } from "@/components/organisms/cta-section";
import type { PageText } from "@/modules/settings/types";

type Props = {
  text: PageText;
  phone: string;
};

export function ServicesCtaSection({ text, phone }: Props) {
  return <CtaSection phone={phone} eyebrow="شروع همکاری" title={text.ctaTitle} text={text.ctaText} />;
}
