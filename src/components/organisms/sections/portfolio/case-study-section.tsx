import { ButtonLink, Icon, type IconName } from "@/components/atoms";
import { BrowserFrame, SectionHeading, Visual } from "@/components/molecules";
import type { Project } from "@/db/schema";
import { cx, vars } from "@/lib/utils";
import { projectHref } from "@/modules/projects/routes";

type Props = {
  caseStudy: Project;
};

export function PortfolioCaseStudySection({ caseStudy }: Props) {
  const story = (
    [
      ["مسئله", caseStudy.problem, "alert"],
      ["راهکار", caseStudy.solution, "sparkle"],
      ["نتیجه", caseStudy.result, "trending-up"],
    ] as [string, string, IconName][]
  ).filter(([, body]) => body);
  const url = caseStudy.websiteUrl ? caseStudy.websiteUrl.replace(/^https?:\/\//, "") : null;

  return (
    <section className="section">
      <div className="container-site">
        <SectionHeading eyebrow="مطالعه موردی" title="نگاهی دقیق‌تر به یک *پروژه*" text="مسئله، راهکار و نتیجه یک پروژه منتخب." />

        <div className="reveal mt-8 grid overflow-hidden rounded-xl border border-line bg-white shadow-md lg:mt-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:rounded-2xl">
          {/* Picture */}
          <div className="surface-soft-gradient relative isolate flex items-center overflow-hidden p-4 sm:p-6 lg:p-10">
            <div aria-hidden="true" className="grid-bg fade-radial pointer-events-none absolute inset-0 -z-10 opacity-80" style={vars({ grid: "28px" })} />
            <span aria-hidden="true" className="orb orb-soft-blue -top-32 -right-24 size-[380px]" />
            <BrowserFrame url={url} className="w-full rounded-xl shadow-lg">
              <Visual src={caseStudy.imageUrl} alt={caseStudy.title} className="h-[220px] sm:h-[340px] lg:h-[420px]" />
            </BrowserFrame>
          </div>

          {/* Story */}
          <div className="flex flex-col items-start p-6 sm:p-8 lg:p-10">
            {caseStudy.projectType && <span className="chip">{caseStudy.projectType}</span>}
            <h3 className="mt-3 text-2xl leading-[1.6] font-bold lg:text-[28px]">{caseStudy.title}</h3>
            {story.length > 0 && (
              <ol className="relative mt-6 flex w-full flex-col gap-5 lg:mt-8 lg:gap-6">
                {story.length > 1 && (
                  <span aria-hidden="true" className="absolute top-5 right-[19px] bottom-5 w-0.5 rounded-full bg-line">
                    <span className="step-line step-line-v grow-y" />
                  </span>
                )}
                {story.map(([title, body, icon], i) => {
                  const result = title === "نتیجه";
                  return (
                    <li key={title} className="relative grid grid-cols-[40px_minmax(0,1fr)] gap-4">
                      <span
                        aria-hidden="true"
                        className={cx(
                          "relative flex size-10 items-center justify-center rounded-full",
                          result ? "icon-gradient" : "border border-line bg-white text-brand",
                        )}
                      >
                        <Icon name={icon} size={18} />
                      </span>
                      <div className={cx("reveal", result && "rounded-lg border border-brand/15 bg-soft px-4 py-3")} style={vars({ i })}>
                        <h4 className="t-h3">{title}</h4>
                        <p className="mt-1 text-base leading-[1.9] whitespace-pre-line text-ink-2">{body}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
            <ButtonLink href={projectHref(caseStudy.slug)} variant="primary" arrow className="mt-8 w-full sm:w-auto">
              جزئیات پروژه
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
