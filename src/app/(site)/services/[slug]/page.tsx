import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/atoms";
import { ServicePageTemplate } from "@/components/templates";
import { decodeSlug } from "@/lib/utils";
import { breadcrumbJsonLd, buildMetadata, faqJsonLd, getSiteUrl } from "@/modules/seo/metadata";
import { getCategory, getServiceBySlug, getServicesBySlugs } from "@/modules/services/queries";
import { serviceHref } from "@/modules/services/routes";
import { getContact } from "@/modules/settings/queries";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = decodeSlug((await params).slug);
  const service = await getServiceBySlug(slug);
  if (!service) return {};
  return buildMetadata({
    title: service.metaTitle || service.title,
    description: service.metaDescription || service.heroDescription || service.summary,
    path: serviceHref(service.slug),
    image: service.imageUrl,
  });
}

export default async function ServicePage({ params }: Props) {
  const slug = decodeSlug((await params).slug);
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const [category, related, base, contact] = await Promise.all([
    getCategory(service.category),
    getServicesBySlugs(service.relatedSlugs),
    getSiteUrl(),
    getContact(),
  ]);
  const categoryTitle = category?.title ?? "";
  const categoryHref = `/${service.category}`;
  const description = service.heroDescription || service.summary;

  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    ...(service.englishTitle ? { alternateName: service.englishTitle } : {}),
    description,
    serviceType: categoryTitle,
    provider: { "@id": `${base}/#organization` },
    url: `${base}${serviceHref(service.slug)}`,
    ...(service.imageUrl ? { image: `${base}${service.imageUrl}` } : {}),
  };

  return (
    <>
      <ServicePageTemplate service={service} categoryTitle={categoryTitle} related={related} faqJsonLd={faqJsonLd(service.faqs)} phone={contact.phone} siteUrl={base} />

      <JsonLd data={serviceLd} />
      <JsonLd
        data={await breadcrumbJsonLd([
          { name: "صفحه اصلی", path: "/" },
          { name: categoryTitle, path: categoryHref },
          { name: service.title, path: serviceHref(service.slug) },
        ])}
      />
    </>
  );
}
