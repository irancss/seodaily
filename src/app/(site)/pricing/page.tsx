import { JsonLd } from "@/components/atoms";
import { CtaSection } from "@/components/organisms";
import { PricingHeroSection, PricingServicesSection, PricingStepsSection } from "@/components/organisms/sections/pricing";
import { pricingJsonLd } from "@/modules/pricing/json-ld";
import { getPricing } from "@/modules/pricing/queries";
import { isPricingService } from "@/modules/pricing/types";
import { breadcrumbJsonLd, getSiteUrl, pageMetadata } from "@/modules/seo/metadata";
import { getPageText } from "@/modules/settings/queries";

export function generateMetadata() {
  return pageMetadata("pricing", "/pricing");
}

type Props = { searchParams: Promise<{ service?: string }> };

export default async function PricingPage({ searchParams }: Props) {
  const [{ service }, text, pricing, base] = await Promise.all([searchParams, getPageText("pricing"), getPricing(), getSiteUrl()]);

  return (
    <>
      <PricingHeroSection text={text} />
      <PricingServicesSection pricing={pricing} initial={isPricingService(service) ? service : "web-design"} />
      <PricingStepsSection />
      <CtaSection padTop title={text.ctaTitle} text={text.ctaText} />

      <JsonLd data={pricingJsonLd(pricing, base)} />
      <JsonLd
        data={await breadcrumbJsonLd([
          { name: "صفحه اصلی", path: "/" },
          { name: "تعرفه‌ها", path: "/pricing" },
        ])}
      />
    </>
  );
}
