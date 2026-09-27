import { JsonLd } from "@/components/atoms";
import { CtaSection } from "@/components/organisms";
import {
  WebDesignFaqSection,
  WebDesignHeroSection,
  WebDesignPortfolioSection,
  WebDesignPrinciplesSection,
  WebDesignProcessSection,
  WebDesignSiteTypesSection,
  WebDesignTechnologySection,
} from "@/components/organisms/sections/web-design";
import { getFaqs } from "@/modules/faqs/queries";
import { getPublishedProjects } from "@/modules/projects/queries";
import { breadcrumbJsonLd, faqJsonLd, getSiteUrl, pageMetadata } from "@/modules/seo/metadata";
import { getServicesByCategory } from "@/modules/services/queries";
import { serviceHref } from "@/modules/services/routes";
import { getGeneral, getPageText } from "@/modules/settings/queries";

export function generateMetadata() {
  return pageMetadata("web-design", "/web-design");
}

export default async function WebDesignPage() {
  const [text, general, types, projects, faqs, base] = await Promise.all([
    getPageText("web-design"),
    getGeneral(),
    getServicesByCategory("web-design"),
    getPublishedProjects(),
    getFaqs("web-design"),
    getSiteUrl(),
  ]);
  const showcase = projects.filter((p) => p.category === "web-design").slice(0, 2);
  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "طراحی سایت",
    serviceType: "Web design",
    description: text.metaDescription || text.subtitle,
    provider: { "@id": `${base}/#organization` },
    url: `${base}/web-design`,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "خدمات طراحی سایت",
      itemListElement: types.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.title, url: `${base}${serviceHref(s.slug)}` },
      })),
    },
  };

  return (
    <>
      <WebDesignHeroSection text={text} />
      {types.length > 0 && <WebDesignSiteTypesSection services={types} />}
      <WebDesignPrinciplesSection />
      <WebDesignProcessSection />
      {showcase.length > 0 && <WebDesignPortfolioSection projects={showcase} />}
      <WebDesignTechnologySection techOptions={general.techOptions} />
      {faqs.length > 0 && <WebDesignFaqSection faqs={faqs} jsonLd={faqJsonLd(faqs)} />}
      <CtaSection padTop title={text.ctaTitle} text={text.ctaText} button="درخواست مشاوره طراحی سایت" />

      <JsonLd data={serviceLd} />
      <JsonLd
        data={await breadcrumbJsonLd([
          { name: "صفحه اصلی", path: "/" },
          { name: "طراحی سایت", path: "/web-design" },
        ])}
      />
    </>
  );
}
