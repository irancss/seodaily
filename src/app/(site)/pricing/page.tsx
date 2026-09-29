import { JsonLd } from "@/components/atoms";
import { permanentRedirect } from "next/navigation";
import { CtaSection } from "@/components/organisms";
import { PricingHeroSection, PricingServicesSection } from "@/components/organisms/sections/pricing";
import { pricingHref } from "@/modules/pricing/routes";
import { getPricing } from "@/modules/pricing/queries";
import { isPricingService } from "@/modules/pricing/types";
import { breadcrumbJsonLd, pageMetadata } from "@/modules/seo/metadata";
import { getContact, getPageText } from "@/modules/settings/queries";

export function generateMetadata() {
  return pageMetadata("pricing", "/pricing");
}

type Props = { searchParams: Promise<{ service?: string }> };

export default async function PricingPage({ searchParams }: Props) {
  const { service } = await searchParams;
  if (isPricingService(service)) permanentRedirect(pricingHref(service));
  const [text, pricing, contact] = await Promise.all([
    getPageText("pricing"),
    getPricing(),
    getContact(),
  ]);

  return (
    <>
      <PricingHeroSection text={text} />
      <PricingServicesSection pricing={pricing} />
      <CtaSection padTop phone={contact.phone} title={text.ctaTitle} text={text.ctaText} />

      <JsonLd
        data={await breadcrumbJsonLd([
          { name: "صفحه اصلی", path: "/" },
          { name: "تعرفه‌ها", path: "/pricing" },
        ])}
      />
    </>
  );
}
