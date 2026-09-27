import { JsonLd } from "@/components/atoms";
import {
  PortfolioCaseStudySection,
  PortfolioCtaSection,
  PortfolioHeroSection,
  PortfolioProjectsSection,
} from "@/components/organisms/sections/portfolio";
import { getPublishedProjects } from "@/modules/projects/queries";
import { projectHref } from "@/modules/projects/routes";
import { breadcrumbJsonLd, getSiteUrl, pageMetadata } from "@/modules/seo/metadata";
import { getPageText } from "@/modules/settings/queries";

export function generateMetadata() {
  return pageMetadata("portfolio", "/portfolio");
}

export default async function PortfolioPage() {
  const [text, projects, base] = await Promise.all([getPageText("portfolio"), getPublishedProjects(), getSiteUrl()]);
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
    name: text.title,
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
      <PortfolioHeroSection text={text} />

      {/* 02–03 · filter + grid */}
      <PortfolioProjectsSection items={items} />

      {/* 04 · case study */}
      {caseStudy && <PortfolioCaseStudySection caseStudy={caseStudy} />}

      {/* 05 · cta */}
      <PortfolioCtaSection text={text} />

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
