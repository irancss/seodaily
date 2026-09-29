import Link from "next/link";
import { SectionHeading } from "@/components/molecules";
import { PRICING_SERVICE_LABELS, PRICING_SERVICES, type PricingConfig, type PricingService } from "@/modules/pricing/types";

import { PricingCalculator } from "./pricing-calculator";
import { PricingTabs } from "./pricing-tabs";

const ICONS: Record<PricingService, string> = { "web-design": "layout", seo: "trending-up", content: "pen" };

/** One tab per service, each with its pricing table, calculator and request form. */
export function PricingServicesSection({ pricing, initial }: { pricing: PricingConfig; initial: PricingService }) {
  return (
    <section id="pricing-services" aria-label="تعرفه خدمات" className="relative pb-16 lg:pb-24">
      <p className="container-site py-6 leading-8 text-ink-2">
        پیش از برآورد هزینه، جزئیات <Link href="/web-design" className="font-medium text-brand-hover underline underline-offset-4">خدمات طراحی سایت</Link> و <Link href="/seo" className="font-medium text-brand-hover underline underline-offset-4">خدمات سئو</Link> را ببینید تا گزینه‌های متناسب با نیازتان را انتخاب کنید.
      </p>
      <PricingTabs
        label="خدمات"
        initial={initial}
        tabs={PRICING_SERVICES.map((service) => {
          const label = PRICING_SERVICE_LABELS[service];
          return {
            id: service,
            label,
            icon: ICONS[service],
            panel: (
              <div className="container-site pt-10 lg:pt-16">
                <SectionHeading eyebrow="تعرفه و برآورد هزینه" title={`تعرفه *${label}*`} text={pricing[service].intro || undefined} />
                <PricingCalculator service={service} label={label} pricing={pricing[service]} />
              </div>
            ),
          };
        })}
      />
    </section>
  );
}
