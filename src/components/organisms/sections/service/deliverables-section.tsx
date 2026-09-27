import { Icon, IconTile } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import type { Service } from "@/db/schema";
import { cx, vars } from "@/lib/utils";

import { DELIVERABLE_ICONS } from "./icons";
import { toneClass, type SectionTone } from "./tone";

type Props = {
  service: Service;
  tone?: SectionTone;
};

export function ServiceDeliverablesSection({ service, tone }: Props) {
  const count = service.deliverables.length;
  const threeCols = count % 3 === 0;
  return (
    <section className={cx("section", toneClass(tone))}>
      <div className="container-site">
        <SectionHeading
          eyebrow="خروجی کار"
          title="در پایان چه چیزی *دریافت* می‌کنید؟"
          text={service.deliverablesIntro || undefined}
        />

        {/* The hand-over package: a board of checklist cards. */}
        <div className="surface-soft-gradient reveal relative isolate mt-8 overflow-hidden rounded-xl border border-line p-3 sm:p-4 lg:mt-14 lg:rounded-2xl lg:p-6">
          <div aria-hidden="true" className="grid-bg fade-radial pointer-events-none absolute inset-0 -z-10 opacity-70" style={vars({ grid: "28px" })} />
          <div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-1 pb-4 lg:px-2 lg:pb-6">
            <p className="flex items-center gap-3 text-sm leading-[1.7] font-semibold text-ink lg:text-base">
              <span aria-hidden="true" className="icon-gradient size-9 rounded-[10px]">
                <Icon name="checklist" size={18} />
              </span>
              فهرست تحویلی — {service.title}
            </p>
            <span className="chip">{count} مورد</span>
          </div>
          <ul className={cx("grid gap-3 sm:grid-cols-2 lg:gap-4", threeCols && "lg:grid-cols-3")}>
            {service.deliverables.map((item, i) => {
              // An odd last card spans the two-column rows.
              const alone = count % 2 === 1 && i === count - 1;
              return (
                <li
                  key={i}
                  className={cx("reveal", alone && "sm:col-span-2", alone && threeCols && "lg:col-span-1")}
                  style={vars({ i: i % 3 })}
                >
                  <div className="card-fancy flex h-full items-start gap-4 rounded-xl p-5 lg:p-6">
                    {/* Wrapped: the tile's own `flex` would beat `hidden`. */}
                    <span className="hidden shrink-0 sm:block">
                      <IconTile
                        name={DELIVERABLE_ICONS[i % DELIVERABLE_ICONS.length]}
                        tone="soft"
                        className="size-12 rounded-[14px]"
                        iconSize={24}
                      />
                    </span>
                    <div className="min-w-0 grow">
                      <h3 className="t-h3">{item.title}</h3>
                      {item.description && <p className="mt-1 text-base leading-[1.9] text-ink-2">{item.description}</p>}
                    </div>
                    <span aria-hidden="true" className="icon-gradient mt-1 size-7 rounded-full shadow-none">
                      <Icon name="check" size={14} strokeWidth={3} />
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
