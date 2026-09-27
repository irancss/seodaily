import { GridBackdrop, HeroBadge, Icon } from "@/components/atoms";
import { Breadcrumb, BrowserFrame, Visual } from "@/components/molecules";
import type { Project } from "@/db/schema";

type Props = {
  project: Project;
};

export function ProjectHeroSection({ project }: Props) {
  return (
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
  );
}
