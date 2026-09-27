import { CtaSection } from "@/components/organisms/cta-section";
import type { PageText } from "@/modules/settings/types";

type Props = {
  text: PageText;
};

export function HomeCtaSection({ text }: Props) {
  return <CtaSection eyebrow="شروع همکاری" title={text.ctaTitle} text={text.ctaText} />;
}
