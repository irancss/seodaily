import { ButtonLink } from "@/components/atoms";
import { ProjectCard, SectionHeading } from "@/components/molecules";
import type { Project } from "@/db/schema";

type Props = {
  projects: Project[];
};

export function HomePortfolioSection({ projects }: Props) {
  return (
    <section className="section bg-white">
      <div className="container-site">
        <SectionHeading
          title="بخشی از پروژه‌ها"
          text="نمونه‌هایی از طراحی‌ها و پروژه‌هایی که روی آن‌ها کار شده است."
          action={
            <ButtonLink href="/portfolio" variant="secondary" size="sm" arrow>
              مشاهده همه نمونه‌کارها
            </ButtonLink>
          }
        />
        <div className="mt-8 grid gap-8 lg:mt-14 lg:grid-cols-[7fr_5fr] lg:grid-rows-[auto_auto] lg:gap-x-6">
          {projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} large={i === 0} />
          ))}
        </div>
        <ButtonLink href="/portfolio" variant="secondary" arrow className="mt-8 w-full lg:hidden">
          مشاهده همه نمونه‌کارها
        </ButtonLink>
      </div>
    </section>
  );
}
