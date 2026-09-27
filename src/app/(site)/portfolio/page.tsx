import Link from "next/link";

import { Icon } from "@/components/icon";
import { JsonLd } from "@/components/json-ld";
import { CtaSection } from "@/components/site/cta";
import { BrowserFrame, GridBackdrop, HeroBadge, stepNo, Visual } from "@/components/site/ui";
import { getPublishedProjects, projectHref } from "@/lib/data";
import { breadcrumbJsonLd, getSiteUrl, pageMetadata } from "@/lib/seo";
import { getPageText } from "@/lib/settings";

import { PortfolioGrid } from "./portfolio-grid";

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
      <section className="relative overflow-hidden pt-10 pb-10 lg:pt-20 lg:pb-16">
        <GridBackdrop className="opacity-60" />
        <div className="container-site relative grid items-end gap-3 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col items-start">
            <HeroBadge>{text.badge}</HeroBadge>
            <h1 className="t-h1 mt-4">{text.title}</h1>
          </div>
          <p className="body-lg lg:pb-2">{text.subtitle}</p>
        </div>
      </section>

      {/* 02–03 · filter + grid */}
      {items.length > 0 ? (
        <PortfolioGrid items={items} />
      ) : (
        <section className="border-t border-line bg-white py-16">
          <div className="container-site">
            <p className="text-base leading-[1.9] text-muted">نمونه‌کارها به‌زودی در این بخش نمایش داده می‌شوند.</p>
          </div>
        </section>
      )}

      {/* 04 · case study */}
      {caseStudy && (
        <section className="section bg-white">
          <div className="container-site">
            <div className="grid items-end gap-2 lg:grid-cols-2 lg:gap-16">
              <h2 className="t-h2">نگاهی دقیق‌تر به یک پروژه</h2>
              <p className="body-lg">مسئله، راهکار و نتیجه یک پروژه منتخب.</p>
            </div>
            <div className="mt-8 grid items-center gap-6 lg:mt-12 lg:grid-cols-[7fr_5fr] lg:gap-16">
              <BrowserFrame url={caseStudy.websiteUrl ? caseStudy.websiteUrl.replace(/^https?:\/\//, "") : undefined}>
                <Visual src={caseStudy.imageUrl} alt={caseStudy.title} className="h-[220px] lg:h-[480px]" />
              </BrowserFrame>
              <div className="flex flex-col">
                {caseStudy.projectType && <span className="text-sm leading-[1.7] font-medium text-muted">{caseStudy.projectType}</span>}
                <h3 className="mt-1 text-2xl leading-[1.6] font-bold">{caseStudy.title}</h3>
                <ol className="mt-6 border-t border-line">
                  {[
                    ["مسئله", caseStudy.problem],
                    ["راهکار", caseStudy.solution],
                    ["نتیجه", caseStudy.result],
                  ]
                    .filter(([, body]) => body)
                    .map(([title, body], i) => (
                      <li key={title} className="grid grid-cols-[40px_minmax(0,1fr)] border-b border-line py-5 lg:grid-cols-[48px_minmax(0,1fr)] lg:py-6">
                        <span className="text-xl leading-[1.65] font-bold text-brand">{stepNo(i)}</span>
                        <div>
                          <h4 className="t-h3">{title}</h4>
                          <p className="mt-1 text-base leading-[1.9] text-ink-2 lg:mt-2">{body}</p>
                        </div>
                      </li>
                    ))}
                </ol>
                <Link href={projectHref(caseStudy.slug)} className="text-link mt-4 self-start">
                  جزئیات پروژه
                  <Icon name="arrow-left" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 05 · cta */}
      <CtaSection variant="open" title={text.ctaTitle} text={text.ctaText} />

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
