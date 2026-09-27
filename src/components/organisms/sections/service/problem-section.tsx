import { IconTile } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import type { Service } from "@/db/schema";
import { cx, stepNo, vars } from "@/lib/utils";

import { PROBLEM_ICONS } from "./icons";
import { toneClass, type SectionTone } from "./tone";

type Props = {
  service: Service;
  tone?: SectionTone;
};

export function ServiceProblemSection({ service, tone }: Props) {
  const hasList = service.problems.length > 0;
  return (
    <section className={cx("section", toneClass(tone))}>
      <div
        className={cx(
          "container-site grid items-start gap-8 lg:gap-20",
          hasList && "lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]",
        )}
      >
        <div className="lg:sticky lg:top-28">
          <SectionHeading
            align="stack"
            className="[&_h2]:text-balance"
            eyebrow="چالش‌ها"
            title="این خدمت چه *مشکلی* را حل می‌کند؟"
            text={service.problemIntro || undefined}
          />
        </div>
        {hasList && (
          <ul className="flex flex-col gap-3 lg:gap-4">
            {service.problems.map((problem, i) => (
              <li key={i} className="reveal" style={vars({ i: Math.min(i, 5) })}>
                <div className="card-fancy flex items-center gap-4 rounded-xl p-4 lg:gap-5 lg:p-6">
                  <IconTile
                    name={PROBLEM_ICONS[i % PROBLEM_ICONS.length]}
                    tone="soft"
                    className="size-12 rounded-[14px] lg:size-14"
                    iconSize={24}
                  />
                  <p className="grow text-base leading-[1.9] font-semibold text-ink lg:text-lg lg:leading-[1.8]">{problem}</p>
                  <span aria-hidden="true" className="hidden shrink-0 text-2xl leading-none font-bold text-line-strong sm:block">
                    {stepNo(i)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
