import { JsonLd } from "@/components/atoms";
import {
  PortfolioCaseStudySection,
  PortfolioCtaSection,
  PortfolioHeroSection,
  PortfolioProjectsSection,
} from "@/components/organisms/sections/portfolio";
import { plainText } from "@/lib/utils";
import { getPublishedProjects } from "@/modules/projects/queries";
import { projectHref } from "@/modules/projects/routes";
import { breadcrumbJsonLd, getSiteUrl, pageMetadata } from "@/modules/seo/metadata";
import { getContact, getPageText } from "@/modules/settings/queries";

export function generateMetadata() {
  return pageMetadata("portfolio", "/portfolio");
}

export default async function PortfolioPage() {
  const [text, projects, base, contact] = await Promise.all([
    getPageText("portfolio"),
    getPublishedProjects(),
    getSiteUrl(),
    getContact(),
  ]);
  const caseStudy = projects.find((p) => p.isCaseStudy);
  const items = projects.map(({ id, slug, title, projectType, summary, imageUrl }) => ({
    id,
    slug,
    title,
    projectType,
    summary,
    imageUrl,
  }));

  const listLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: plainText(text.title),
    url: `${base}/portfolio`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: projects.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${base}${projectHref(p.slug)}`,
        name: p.title,
      })),
    },
  };

  return (
    <>
      {/* 01 · hero */}
      <PortfolioHeroSection text={text} items={items} />

      {/* 02–03 · filter + grid (white) */}
      <PortfolioProjectsSection items={items} />

      {/* 04 · case study (page colour) */}
      {caseStudy && <PortfolioCaseStudySection caseStudy={caseStudy} />}

      {/* 05 · cta */}
      <PortfolioCtaSection text={text} padTop={!caseStudy} phone={contact.phone} />

      <JsonLd data={listLd} />
      <JsonLd
        data={await breadcrumbJsonLd([
          { name: "صفحه اصلی", path: "/" },
          { name: "نمونه‌کارها", path: "/portfolio" },
        ])}
      />
    </>
  );
}
