import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import { CtaSection } from "@/components/organisms";
import { BlockRenderer, hasContent } from "@/components/organisms/blocks/block-renderer";
import { PricingHeroSection, PricingStepsSection } from "@/components/organisms/sections/pricing";
import { PricingCalculator } from "@/components/organisms/sections/pricing/pricing-calculator";
import { entityHrefs } from "@/modules/plugins/queries";
import { pricingJsonLd } from "@/modules/pricing/json-ld";
import { getPricing } from "@/modules/pricing/queries";
import { pricingHref, pricingPageKey } from "@/modules/pricing/routes";
import { isPricingService, PRICING_SERVICE_LABELS, PRICING_SERVICES } from "@/modules/pricing/types";
import { breadcrumbJsonLd, getSiteUrl, pageMetadata } from "@/modules/seo/metadata";
import { getContact, getPageText } from "@/modules/settings/queries";

type Props = { params: Promise<{ service: string }> };

export async function generateMetadata({ params }: Props) {
  const { service } = await params;
  if (!isPricingService(service)) notFound();
  return pageMetadata(pricingPageKey(service), pricingHref(service));
}

export default async function ServicePricingPage({ params }: Props) {
  const { service } = await params;
  if (!isPricingService(service)) notFound();
  const [text, pricing, base, contact] = await Promise.all([getPageText(pricingPageKey(service)), getPricing(), getSiteUrl(), getContact()]);
  const config = pricing[service];
  const label = PRICING_SERVICE_LABELS[service];
  const hrefs = await entityHrefs([config.content]);

  return (
    <>
      <PricingHeroSection text={text} service={service} />
      <section id="pricing-services" className="section">
        <div className="container-site">
          <SectionHeading eyebrow="بسته‌ها و برآورد هزینه" title={`بسته‌های *${label}*`} text={config.intro || undefined} />
          {service !== "content" && <p className="mt-4 leading-8 text-ink-2">برای آشنایی با محدودهٔ کار، <Link href={`/${service}`} className="font-medium text-brand-hover underline underline-offset-4">خدمات {label}</Link> را ببینید.</p>}
          <PricingCalculator service={service} label={label} pricing={{ ...config, content: null }} />
        </div>
      </section>
      {hasContent(config.content) && (
        <section aria-label={`توضیحات و جدول‌های تعرفه ${label}`} className="section bg-white">
          <div className="container-site min-w-0">
            <BlockRenderer document={config.content} hrefs={hrefs} anchorPrefix={`pricing-${service}-`} />
          </div>
        </section>
      )}
      <PricingStepsSection />
      <nav aria-label="تعرفه خدمات دیگر" className="container-site flex flex-wrap gap-3 pb-8">
        {PRICING_SERVICES.filter((other) => other !== service).map((other) => <Link key={other} href={pricingHref(other)} className="btn btn-secondary min-h-11 px-4 py-2 text-sm">تعرفه {PRICING_SERVICE_LABELS[other]}</Link>)}
      </nav>
      <CtaSection padTop phone={contact.phone} title={text.ctaTitle} text={text.ctaText} />
      <JsonLd data={pricingJsonLd(pricing, base, [service])} />
      <JsonLd data={await breadcrumbJsonLd([{ name: "صفحه اصلی", path: "/" }, { name: "تعرفه‌ها", path: "/pricing" }, { name: `تعرفه ${label}`, path: pricingHref(service) }])} />
    </>
  );
}
