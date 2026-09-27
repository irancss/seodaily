import { ButtonLink, Icon } from "@/components/atoms";
import { PageHero, type PortfolioItem } from "@/components/organisms";
import type { PageText } from "@/modules/settings/types";

import { PortfolioHeroVisual } from "./hero-visual";

type Props = {
  text: PageText;
  items: PortfolioItem[];
};

export function PortfolioHeroSection({ text, items }: Props) {
  const images = items.map((i) => i.imageUrl).filter(Boolean);
  const types = [...new Set(items.map((i) => i.projectType).filter(Boolean))];

  return (
    <PageHero
      tone="light"
      breadcrumb={[{ label: "صفحه اصلی", href: "/" }, { label: "نمونه‌کارها" }]}
      badge={text.badge}
      title={text.title}
      subtitle={text.subtitle}
      actions={
        <>
          {items.length > 0 && (
            <ButtonLink href="#portfolio-projects" size="lg">
              <Icon name="arrow-down" />
              مشاهده پروژه‌ها
            </ButtonLink>
          )}
          <ButtonLink href="/contact" variant="secondary" size="lg" arrow>
            درخواست مشاوره
          </ButtonLink>
        </>
      }
      aside={<PortfolioHeroVisual images={images} types={types} />}
    />
  );
}
