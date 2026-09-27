import { ButtonLink } from "@/components/atoms";
import { PageHero } from "@/components/organisms";
import type { PageText } from "@/modules/settings/types";

import { SystemOrbit } from "./system-orbit";

type Props = {
  text: PageText;
};

export function AboutHeroSection({ text }: Props) {
  return (
    <PageHero
      tone="dark"
      breadcrumb={[{ label: "صفحه اصلی", href: "/" }, { label: "درباره ما" }]}
      badge={text.badge}
      title={text.title}
      subtitle={text.subtitle}
      actions={
        <>
          <ButtonLink href="/contact" size="lg" arrow>
            درخواست مشاوره
          </ButtonLink>
          <ButtonLink href="/portfolio" variant="glass" size="lg">
            مشاهده نمونه‌کارها
          </ButtonLink>
        </>
      }
      aside={<SystemOrbit />}
    />
  );
}
