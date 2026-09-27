import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/atoms";
import { ProjectAboutSection, ProjectCtaSection, ProjectHeroSection } from "@/components/organisms/sections/project";
import { decodeSlug } from "@/lib/utils";
import { getProjectBySlug } from "@/modules/projects/queries";
import { projectHref } from "@/modules/projects/routes";
import { breadcrumbJsonLd, buildMetadata, getSiteUrl } from "@/modules/seo/metadata";

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
      <ProjectHeroSection project={project} />

      {(project.description || story.length > 0) && <ProjectAboutSection description={project.description} story={story} />}

      <ProjectCtaSection />

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
