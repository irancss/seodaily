import { ButtonLink, Icon } from "@/components/atoms";
import { PageHero } from "@/components/organisms/page-hero";
import { PRICING_POINTS } from "@/modules/pages/pricing-content";
import type { PageText } from "@/modules/settings/types";

export function PricingHeroSection({ text }: { text: PageText }) {
  return (
    <PageHero
      breadcrumb={[{ label: "صفحه اصلی", href: "/" }, { label: "تعرفه‌ها" }]}
      badge={text.badge}
      title={text.title}
      subtitle={text.subtitle}
      actions={
        <>
          <a href="#pricing-services" className="btn btn-white h-[52px] px-7">
            <Icon name="calculator" />
            محاسبه هزینه
          </a>
          <ButtonLink href="/contact" variant="glass">
            درخواست مشاوره
          </ButtonLink>
        </>
      }
    >
      <ul className="flex flex-wrap gap-2">
        {PRICING_POINTS.map((point) => (
          <li key={point} className="chip">
            <Icon name="check" size={16} className="text-cyan-300" />
            {point}
          </li>
        ))}
      </ul>
    </PageHero>
  );
}
