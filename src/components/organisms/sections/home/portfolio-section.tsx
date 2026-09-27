import { ButtonLink } from "@/components/atoms";
import { ProjectCard, SectionHeading } from "@/components/molecules";
import type { Project } from "@/db/schema";
import { cx, vars } from "@/lib/utils";

type Props = {
  projects: Project[];
};

/** Fills the bento grid when fewer than three projects are published. */
function NextProjectCard({ tall, index }: { tall: boolean; index: number }) {
  return (
    <div
      className={cx(
        "surface-dark reveal flex min-h-[260px] flex-col items-start justify-end gap-4 overflow-hidden rounded-xl p-6 lg:p-8",
        tall && "lg:row-span-2",
      )}
      style={vars({ i: index })}
    >
      <div aria-hidden="true" className="grid-bg-dark fade-radial pointer-events-none absolute inset-0 -z-10" style={vars({ grid: "32px" })} />
      <span aria-hidden="true" className="orb orb-blue -top-32 -left-24 size-[340px]" />
      <span className="eyebrow">پروژه بعدی</span>
      <p className="t-h3 lg:text-2xl lg:leading-[1.6]">
        نمونه‌کار بعدی می‌تواند <span className="text-gradient">سایت شما</span> باشد
      </p>
      <p className="text-base leading-[1.9] text-inverse-muted">درباره کسب‌وکار و هدفتان بگویید تا مسیر پروژه را با هم مشخص کنیم.</p>
      <ButtonLink href="/contact" variant="white" size="sm" arrow className="mt-2">
        شروع گفت‌وگو
      </ButtonLink>
    </div>
  );
}

export function HomePortfolioSection({ projects }: Props) {
  return (
    <section className="section">
      <div className="container-site">
        <SectionHeading
          eyebrow="نمونه‌کارها"
          title="بخشی از *پروژه‌ها*"
          text="نمونه‌هایی از طراحی‌ها و پروژه‌هایی که روی آن‌ها کار شده است."
          action={
            <ButtonLink href="/portfolio" variant="secondary" size="sm" arrow>
              مشاهده همه نمونه‌کارها
            </ButtonLink>
          }
        />
        <div className="mt-8 grid gap-8 lg:mt-14 lg:grid-cols-[7fr_5fr] lg:grid-rows-[auto_auto] lg:gap-x-6">
          {projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} large={i === 0} className="reveal" style={vars({ i })} />
          ))}
          {projects.length < 3 && <NextProjectCard tall={projects.length === 1} index={projects.length} />}
        </div>
        <ButtonLink href="/portfolio" variant="secondary" arrow className="mt-8 w-full lg:hidden">
          مشاهده همه نمونه‌کارها
        </ButtonLink>
      </div>
    </section>
  );
}
