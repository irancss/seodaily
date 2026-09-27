import Link from "next/link";

import { ButtonLink, Icon } from "@/components/atoms";
import { ProjectCard, SectionHeading } from "@/components/molecules";
import type { Project } from "@/db/schema";

type Props = {
  projects: Project[];
};

export function WebDesignPortfolioSection({ projects }: Props) {
  return (
    <section className="section bg-white">
      <div className="container-site">
        <SectionHeading
          title="نمونه‌کارهای طراحی سایت"
          action={
            <Link href="/portfolio" className="text-link">
              مشاهده همه نمونه‌کارها
              <Icon name="arrow-left" />
            </Link>
          }
        />
        <div className="mt-6 grid gap-8 lg:mt-12 lg:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} height="h-[220px] lg:h-[360px]" />
          ))}
        </div>
        <ButtonLink href="/portfolio" variant="secondary" arrow className="mt-8 w-full lg:hidden">
          مشاهده همه نمونه‌کارها
        </ButtonLink>
      </div>
    </section>
  );
}
