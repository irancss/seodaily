import { Icon, IconTile } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import type { Service } from "@/db/schema";
import { cx, vars } from "@/lib/utils";

import { toneClass, type SectionTone } from "./tone";

type Props = {
  service: Service;
  tone?: SectionTone;
};

export function ServiceForWhoSection({ service, tone }: Props) {
  const hasSituations = service.situations.length > 0;
  return (
    <section className={cx("section", toneClass(tone))}>
      {/* Mobile order: intro, business types, then the situations panel. */}
      <div
        className={cx(
          "container-site grid items-center gap-10 lg:gap-16",
          hasSituations && "lg:grid-cols-[minmax(0,7fr)_minmax(0,6fr)]",
        )}
      >
        <div className="flex flex-col items-start">
          <SectionHeading
            align="stack"
            className="[&_h2]:text-balance"
            eyebrow="مخاطبان این خدمت"
            title="این خدمت مناسب چه *کسب‌وکارهایی* است؟"
            text={service.forWhoIntro || undefined}
          />
          {service.businessTypes.length > 0 && (
            <div className="mt-8 w-full lg:mt-10">
              <span className="text-sm leading-[1.7] font-medium text-muted">انواع کسب‌وکار</span>
              <ul className="mt-3 flex flex-wrap gap-2 lg:gap-3">
                {service.businessTypes.map((type, i) => (
                  <li
                    key={type}
                    className="reveal-scale inline-flex min-h-11 items-center gap-2.5 rounded-full border border-line bg-white px-4 text-[15px] leading-[1.7] font-medium text-ink shadow-sm lg:px-5 lg:text-base"
                    style={vars({ i: Math.min(i, 6) })}
                  >
                    <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-gradient-to-l from-brand to-brand-decorative" />
                    {type}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {hasSituations && (
          <div className="surface-dark reveal overflow-hidden rounded-xl p-6 sm:p-8 lg:rounded-2xl lg:p-10">
            <div
              aria-hidden="true"
              className="grid-bg-dark fade-radial pointer-events-none absolute inset-0 -z-10"
              style={vars({ grid: "32px" })}
            />
            <span aria-hidden="true" className="orb orb-blue -top-36 -left-28 size-[380px]" />
            <span aria-hidden="true" className="orb orb-cyan -right-28 -bottom-44 size-[340px]" style={vars({ i: 1 })} />
            <div className="flex items-center gap-4">
              <IconTile name="target" tone="glass" className="size-12 rounded-[14px]" iconSize={24} />
              <h3 className="text-lg leading-[1.8] font-bold lg:text-xl lg:leading-[1.65]">چه زمانی سراغ این خدمت بیایید؟</h3>
            </div>
            <ul className="mt-6 flex flex-col gap-3 lg:mt-8">
              {service.situations.map((situation, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-base leading-[1.9] text-slate-100"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-300"
                  >
                    <Icon name="check" size={14} strokeWidth={3} />
                  </span>
                  {situation}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
