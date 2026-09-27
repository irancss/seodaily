import { JsonLd } from "@/components/atoms";
import {
  ServicesCtaSection,
  ServicesFaqSection,
  ServicesHeroSection,
  ServicesMainSection,
  ServicesProcessSection,
  ServicesSelectorSection,
} from "@/components/organisms/sections/services";
import { getFaqs } from "@/modules/faqs/queries";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/modules/seo/metadata";
import { getCategories, getServicesByCategory } from "@/modules/services/queries";
import { getContact, getPageText } from "@/modules/settings/queries";

export function generateMetadata() {
  return pageMetadata("services", "/services");
}

export default async function ServicesPage() {
  const [text, categories, faqs, contact] = await Promise.all([
    getPageText("services"),
    getCategories(),
    getFaqs("services"),
    getContact(),
  ]);
  const items = await Promise.all(categories.map((c) => getServicesByCategory(c.slug)));
  const breadcrumb = await breadcrumbJsonLd([
    { name: "صفحه اصلی", path: "/" },
    { name: "خدمات", path: "/services" },
  ]);

  return (
    <>
      <ServicesHeroSection text={text} categories={categories} counts={items.map((list) => list.length)} />
      <ServicesMainSection categories={categories} items={items} />
      <ServicesSelectorSection />
      <ServicesProcessSection />
      {faqs.length > 0 && <ServicesFaqSection faqs={faqs} jsonLd={faqJsonLd(faqs)} />}
      <ServicesCtaSection text={text} phone={contact.phone} />
      <JsonLd data={breadcrumb} />
    </>
  );
}
