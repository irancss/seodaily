import { ButtonLink } from "@/components/atoms";
import { ProjectCard, SectionHeading } from "@/components/molecules";
import type { Project } from "@/db/schema";
import { vars } from "@/lib/utils";

type Props = {
  projects: Project[];
};

const HEADING = {
  eyebrow: "نمونه‌کارها",
  title: "نمونه‌کارهای *طراحی سایت*",
  text: "نمونه‌هایی از طراحی‌ها و پروژه‌هایی که روی آن‌ها کار شده است.",
};

export function WebDesignPortfolioSection({ projects }: Props) {
  // A single project gets a wide feature layout instead of a half-empty grid.
  if (projects.length === 1) {
    return (
      <section className="section bg-white">
        <div className="container-site grid items-center gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div className="flex flex-col items-start gap-6 lg:gap-8">
            <SectionHeading align="stack" {...HEADING} />
            <ButtonLink href="/portfolio" variant="secondary" arrow className="reveal w-full sm:w-auto">
              مشاهده همه نمونه‌کارها
            </ButtonLink>
          </div>
          <ProjectCard project={projects[0]} className="reveal" style={vars({ i: 1 })} height="h-[240px] lg:h-[400px]" />
        </div>
      </section>
    );
  }

  return (
    <section className="section bg-white">
      <div className="container-site">
        <SectionHeading
          {...HEADING}
          action={
            <ButtonLink href="/portfolio" variant="secondary" size="sm" arrow>
              مشاهده همه نمونه‌کارها
            </ButtonLink>
          }
        />
        <div className="mt-8 grid gap-8 lg:mt-14 lg:grid-cols-2 lg:gap-6">
          {projects.map((p, i) => (
            <ProjectCard key={p.id} project={p} className="reveal" style={vars({ i })} height="h-[240px] lg:h-[360px]" />
          ))}
        </div>
        <ButtonLink href="/portfolio" variant="secondary" arrow className="mt-8 w-full lg:hidden">
          مشاهده همه نمونه‌کارها
        </ButtonLink>
      </div>
    </section>
  );
}
