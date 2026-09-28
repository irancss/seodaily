import { ButtonLink, Icon } from "@/components/atoms";
import { PageHero } from "@/components/organisms/page-hero";
import type { PageText } from "@/modules/settings/types";

import { SeoHeroVisual } from "./hero-visual";

type Props = {
  text: PageText;
};

export function SeoHeroSection({ text }: Props) {
  return (
    <PageHero
      breadcrumb={[{ label: "صفحه اصلی", href: "/" }, { label: "سئو" }]}
      badge={text.badge}
      title={text.title}
      subtitle={text.subtitle}
      actions={
        <>
          <ButtonLink href="/contact" size="lg" arrow>
            درخواست بررسی سئو
          </ButtonLink>
          <ButtonLink href="#seo-services" size="lg" variant="glass">
            <Icon name="arrow-down" />
            مشاهده خدمات سئو
          </ButtonLink>
        </>
      }
      aside={<SeoHeroVisual />}
    />
  );
}
