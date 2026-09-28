import { ButtonLink, Icon } from "@/components/atoms";
import { PageHero } from "@/components/organisms/page-hero";
import type { PageText } from "@/modules/settings/types";

import { WebDesignHeroVisual } from "./hero-visual";
import { WebDesignRibbon } from "./ribbon";

type Props = {
  text: PageText;
  /** Words for the ribbon under the hero (principles and platforms). */
  ribbon: string[];
};

export function WebDesignHeroSection({ text, ribbon }: Props) {
  return (
    <>
      <PageHero
        breadcrumb={[{ label: "صفحه اصلی", href: "/" }, { label: "طراحی سایت" }]}
        badge={text.badge}
        title={text.title}
        subtitle={text.subtitle}
        actions={
          <>
            <ButtonLink href="/contact" size="lg" arrow>
              درخواست مشاوره طراحی سایت
            </ButtonLink>
            <ButtonLink href="/portfolio" size="lg" variant="glass">
              <Icon name="layers" />
              مشاهده نمونه‌کارها
            </ButtonLink>
          </>
        }
        aside={<WebDesignHeroVisual />}
      />
      <WebDesignRibbon items={ribbon} />
    </>
  );
}
