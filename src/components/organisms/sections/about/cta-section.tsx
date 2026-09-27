import { ButtonLink } from "@/components/atoms";
import { CtaSection } from "@/components/organisms";
import type { PageText } from "@/modules/settings/types";

type Props = {
  text: PageText;
  phone: string;
};

export function AboutCtaSection({ text, phone }: Props) {
  return (
    // The team section above is white, so the panel brings its own top spacing.
    <CtaSection
      phone={phone}
      padTop
      eyebrow="شروع همکاری"
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
