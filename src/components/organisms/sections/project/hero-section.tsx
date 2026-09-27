import { Icon } from "@/components/atoms";
import { BrowserFrame, Visual } from "@/components/molecules";
import { PageHero } from "@/components/organisms";
import type { Project } from "@/db/schema";

type Props = {
  project: Project;
};

export function ProjectHeroSection({ project }: Props) {
  const url = project.websiteUrl ? project.websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") : null;

  return (
    <PageHero
      tone="light"
      breadcrumb={[
        { label: "صفحه اصلی", href: "/" },
        { label: "نمونه‌کارها", href: "/portfolio" },
        { label: project.title },
      ]}
      badge={project.projectType || undefined}
      title={project.title}
      subtitle={project.summary || undefined}
      actions={
        project.websiteUrl ? (
          <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary h-14 px-8 shadow-brand">
            مشاهده سایت
            <Icon name="external" size={18} />
          </a>
        ) : undefined
      }
    >
      {/* The project picture, large, on a frosted panel. */}
      <div className="relative mt-2 lg:mt-4">
        <span aria-hidden="true" className="orb orb-soft-cyan -bottom-24 left-1/4 size-[480px]" />
        <div className="rounded-2xl border border-white/80 bg-white/60 p-1.5 shadow-[0_40px_90px_-30px_rgb(15_23_42/0.35)] backdrop-blur sm:p-2 lg:rounded-[28px] lg:p-3">
          <BrowserFrame url={url} shadow="none" className="rounded-xl lg:rounded-2xl">
            <Visual src={project.imageUrl} alt={project.title} priority className="h-[240px] sm:h-[380px] lg:h-[560px]" />
          </BrowserFrame>
        </div>
      </div>
    </PageHero>
  );
}
