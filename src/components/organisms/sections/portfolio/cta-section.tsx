import { CtaSection } from "@/components/organisms";
import type { PageText } from "@/modules/settings/types";

type Props = {
  text: PageText;
};

export function PortfolioCtaSection({ text }: Props) {
  return <CtaSection title={text.ctaTitle} text={text.ctaText} />;
}
