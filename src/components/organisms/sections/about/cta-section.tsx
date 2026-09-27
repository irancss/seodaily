import { ButtonLink } from "@/components/atoms";
import { CtaSection } from "@/components/organisms";
import type { PageText } from "@/modules/settings/types";

type Props = {
  text: PageText;
};

export function AboutCtaSection({ text }: Props) {
  return (
    <CtaSection
      grid={false}
      title={text.ctaTitle}
      text={text.ctaText}
      secondary={
        <ButtonLink href="/portfolio" variant="secondary" size="lg" className="w-full lg:w-auto">
          مشاهده نمونه‌کارها
        </ButtonLink>
      }
    />
  );
}
