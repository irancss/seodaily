import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Icon } from "@/components/icon";
import { JsonLd } from "@/components/json-ld";
import { CtaSection } from "@/components/site/cta";
import { Breadcrumb, BrowserFrame, GridBackdrop, HeroBadge, stepNo, Visual } from "@/components/site/ui";
import { decodeSlug, getProjectBySlug, projectHref } from "@/lib/data";
import { breadcrumbJsonLd, buildMetadata, getSiteUrl } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = decodeSlug((await params).slug);
  const project = await getProjectBySlug(slug);
  if (!project) return {};
  return buildMetadata({
    title: project.title,
    description: project.summary || project.description.slice(0, 160),
    path: projectHref(project.slug),
    image: project.imageUrl,
    type: "article",
  });
}

export default async function ProjectPage({ params }: Props) {
  const slug = decodeSlug((await params).slug);
  const project = await getProjectBySlug(slug);
  if (!project) notFound();
  const base = await getSiteUrl();

  const story = [
    ["مسئله", project.problem],
    ["راهکار", project.solution],
    ["نتیجه", project.result],
  ].filter(([, body]) => body);

  const ld = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.summary || project.description,
    url: `${base}${projectHref(project.slug)}`,
    ...(project.imageUrl ? { image: `${base}${project.imageUrl}` } : {}),
    creator: { "@id": `${base}/#organization` },
    ...(project.projectType ? { genre: project.projectType } : {}),
  };

  return (
    <>
      <section className="relative overflow-hidden pt-6 pb-12 lg:pt-8 lg:pb-20">
        <GridBackdrop className="opacity-50" />
        <div className="container-site relative">
          <Breadcrumb
            items={[
              { label: "صفحه اصلی", href: "/" },
              { label: "نمونه‌کارها", href: "/portfolio" },
              { label: project.title },
            ]}
          />
          <div className="mt-8 flex flex-col items-start lg:mt-12">
            {project.projectType && <HeroBadge>{project.projectType}</HeroBadge>}
            <h1 className="t-h1 mt-5">{project.title}</h1>
            {project.summary && <p className="body-lg mt-5 max-w-[720px]">{project.summary}</p>}
            {project.websiteUrl && (
              <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary mt-8 h-12 px-5">
                مشاهده سایت
                <Icon name="external" size={18} />
              </a>
            )}
          </div>
          <BrowserFrame className="mt-10 lg:mt-12" url={project.websiteUrl ? project.websiteUrl.replace(/^https?:\/\//, "") : undefined}>
            <Visual src={project.imageUrl} alt={project.title} className="h-[260px] lg:h-[560px]" />
          </BrowserFrame>
        </div>
      </section>

      {(project.description || story.length > 0) && (
        <section className="section bg-white">
          <div className="container-site grid items-start gap-10 lg:grid-cols-[7fr_5fr] lg:gap-16">
            <div className="flex flex-col gap-4">
              <h2 className="t-h2">درباره پروژه</h2>
              {project.description.split(/\n{2,}/).map((para, i) => (
                <p key={i} className="body-lg whitespace-pre-line">
                  {para}
                </p>
              ))}
            </div>
            {story.length > 0 && (
              <ol className="border-t border-line">
                {story.map(([title, body], i) => (
                  <li key={title} className="grid grid-cols-[48px_minmax(0,1fr)] border-b border-line py-6">
                    <span className="text-xl leading-[1.65] font-bold text-brand">{stepNo(i)}</span>
                    <div>
                      <h3 className="t-h3">{title}</h3>
                      <p className="mt-2 text-base leading-[1.9] whitespace-pre-line text-ink-2">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      )}

      <CtaSection variant="open" title="پروژه‌ای در ذهن دارید؟" text="اطلاعات اولیه پروژه را برای ما بفرستید تا نیازها و شرایط آن بررسی شود." />

      <JsonLd data={ld} />
      <JsonLd
        data={await breadcrumbJsonLd([
          { name: "صفحه اصلی", path: "/" },
          { name: "نمونه‌کارها", path: "/portfolio" },
          { name: project.title, path: projectHref(project.slug) },
        ])}
      />
    </>
  );
}
