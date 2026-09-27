import { CtaSection } from "@/components/organisms";
import type { PageText } from "@/modules/settings/types";

type Props = {
  text: PageText;
  /** The panel needs its own top spacing after a white section. */
  padTop?: boolean;
};

export function PortfolioCtaSection({ text, padTop = false }: Props) {
  return (
    <CtaSection eyebrow="شروع همکاری" title={text.ctaTitle} text={text.ctaText} padTop={padTop} />
  );
}
