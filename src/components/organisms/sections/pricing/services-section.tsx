import { FeatureCard, SectionHeading } from "@/components/molecules";
import { PRICING_SERVICE_LABELS, PRICING_SERVICES, type PricingConfig, type PricingService } from "@/modules/pricing/types";
import { pricingHref } from "@/modules/pricing/routes";

const ICONS: Record<PricingService, string> = { "web-design": "layout", seo: "trending-up", content: "pen" };

/** The overview links to real, independently indexable pricing pages. */
export function PricingServicesSection({ pricing }: { pricing: PricingConfig }) {
  return (
    <section id="pricing-services" className="section">
      <div className="container-site">
        <SectionHeading eyebrow="انتخاب خدمت" title="تعرفهٔ کدام *خدمت* را می‌خواهید؟" text="بسته‌های قیمت، توضیحات و ابزار برآورد هزینهٔ هر خدمت را در صفحهٔ مخصوص آن ببینید." />
        <ul className="mt-6 grid gap-4 md:grid-cols-3 lg:mt-8 lg:gap-5">
          {PRICING_SERVICES.map((service) => (
            <li key={service} className="min-w-0">
              <FeatureCard icon={ICONS[service]} title={`تعرفه ${PRICING_SERVICE_LABELS[service]}`} text={pricing[service].intro} href={pricingHref(service)} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
