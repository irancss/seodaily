import Link from "next/link";

import { Icon } from "@/components/atoms";
import { BrowserFrame, Visual } from "@/components/molecules";
import type { Project } from "@/db/schema";
import { stepNo } from "@/lib/utils";
import { projectHref } from "@/modules/projects/routes";

type Props = {
  caseStudy: Project;
};

export function PortfolioCaseStudySection({ caseStudy }: Props) {
  return (
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
  );
}
