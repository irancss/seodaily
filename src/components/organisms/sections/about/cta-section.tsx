import { ButtonLink } from "@/components/atoms";
import { CtaSection } from "@/components/organisms";
import type { PageText } from "@/modules/settings/types";

type Props = {
  text: PageText;
};

export function AboutCtaSection({ text }: Props) {
  return (
    <CtaSection
      title={text.ctaTitle}
      text={text.ctaText}
      secondary={
        <ButtonLink href="/portfolio" variant="glass" size="lg" className="w-full sm:w-auto lg:w-full">
          مشاهده نمونه‌کارها
        </ButtonLink>
      }
    />
  );
}
