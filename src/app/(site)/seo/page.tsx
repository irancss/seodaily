import { JsonLd } from "@/components/atoms";
import { CtaSection } from "@/components/organisms";
import {
  SeoApproachSection,
  SeoExpectationsSection,
  SeoFaqSection,
  SeoHeroSection,
  SeoServicesSection,
  SeoTechnicalContentSection,
} from "@/components/organisms/sections/seo";
import { getFaqs } from "@/modules/faqs/queries";
import { breadcrumbJsonLd, faqJsonLd, getSiteUrl, pageMetadata } from "@/modules/seo/metadata";
import { getServicesByCategory } from "@/modules/services/queries";
import { serviceHref } from "@/modules/services/routes";
import { getContact, getPageText } from "@/modules/settings/queries";

export function generateMetadata() {
  return pageMetadata("seo", "/seo");
}

export default async function SeoPage() {
  const [text, services, faqs, base, contact] = await Promise.all([
    getPageText("seo"),
    getServicesByCategory("seo"),
    getFaqs("seo"),
    getSiteUrl(),
    getContact(),
  ]);
  const technical = services.find((s) => s.slug === "technical-seo");
  const content = services.find((s) => s.slug === "content-strategy");

  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "سئو",
    serviceType: "Search engine optimization",
    description: text.metaDescription || text.subtitle,
    provider: { "@id": `${base}/#organization` },
    url: `${base}/seo`,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "خدمات سئو",
      itemListElement: services.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.title, url: `${base}${serviceHref(s.slug)}` },
      })),
    },
  };

  return (
    <>
      <SeoHeroSection text={text} />
      {services.length > 0 && <SeoServicesSection services={services} />}
      <SeoApproachSection />
      <SeoTechnicalContentSection technical={technical} content={content} />
      <SeoExpectationsSection />
      {faqs.length > 0 && <SeoFaqSection faqs={faqs} jsonLd={faqJsonLd(faqs)} />}
      <CtaSection
        phone={contact.phone}
        padTop={faqs.length === 0}
        eyebrow="قدم اول"
        title={text.ctaTitle}
        text={text.ctaText}
        button="درخواست بررسی سئو"
      />

      <JsonLd data={serviceLd} />
      <JsonLd
        data={await breadcrumbJsonLd([
          { name: "صفحه اصلی", path: "/" },
          { name: "سئو", path: "/seo" },
        ])}
      />
    </>
  );
}
