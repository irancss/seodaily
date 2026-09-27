import { Icon } from "@/components/atoms";
import { FeatureCard, SectionHeading } from "@/components/molecules";
import type { Service } from "@/db/schema";
import { cx, vars } from "@/lib/utils";

import { INCLUDE_ICONS, pickIcon } from "./icons";
import { toneClass, type SectionTone } from "./tone";

type Props = {
  service: Service;
  tone?: SectionTone;
};

/** Bento layout: a few cards span two of the three desktop columns so every row is full. */
function layout(i: number, count: number) {
  if (count === 1) return { wide: true, className: "sm:col-span-2 lg:col-span-3" };
  const rest = count % 3;
  const wide = (rest === 2 && i === 0) || (rest === 1 && (i === 0 || i === count - 1));
  const wideSm = count % 2 === 1 && i === 0;
  return {
    wide,
    className: cx(wideSm && "sm:col-span-2", wide ? "lg:col-span-2" : wideSm && "lg:col-span-1"),
  };
}

export function ServiceIncludesSection({ service, tone }: Props) {
  const count = service.includes.length;
  return (
    <section className={cx("section", toneClass(tone))}>
      <div className="container-site">
        <SectionHeading
          eyebrow="آنچه انجام می‌شود"
          title="این خدمت شامل چه *مواردی* است؟"
          text={service.includesIntro || undefined}
        />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-6">
          {service.includes.map((item, i) => {
            const icon = pickIcon(`${item.title} ${item.description}`, i, INCLUDE_ICONS);
            const { wide, className } = layout(i, count);
            return (
              <li key={i} className={cx("reveal", className)} style={vars({ i: i % 3 })}>
                <FeatureCard
                  icon={icon}
                  title={item.title}
                  text={item.description || undefined}
                  index={i}
                  className={wide ? "lg:pl-44" : undefined}
                >
                  {wide && (
                    <span aria-hidden="true" className="pointer-events-none absolute bottom-6 left-6 hidden text-brand/[0.07] lg:block">
                      <Icon name={icon} size={112} strokeWidth={1.25} />
                    </span>
                  )}
                </FeatureCard>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
