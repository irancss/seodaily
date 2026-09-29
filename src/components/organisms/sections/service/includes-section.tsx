import { FeatureCard, SectionHeading } from "@/components/molecules";
import type { Service } from "@/db/schema";
import { cx, vars } from "@/lib/utils";

import { INCLUDE_ICONS, pickIcon } from "./icons";
import { toneClass, type SectionTone } from "./tone";

type Props = {
  service: Service;
  tone?: SectionTone;
};

/** Three cards per desktop row; finish with pairs instead of one oversized card. */
function layout(i: number, count: number) {
  if (count === 1) return "sm:col-span-2 lg:col-span-6 max-w-2xl";
  const pairedStart = count % 3 === 1 ? count - 4 : count % 3 === 2 ? count - 2 : count;
  return cx(
    count % 2 === 1 && i === count - 1 && "sm:col-span-2",
    i >= pairedStart ? "lg:col-span-3" : "lg:col-span-2",
  );
}

export function ServiceIncludesSection({ service, tone }: Props) {
  const count = service.includes.length;
  return (
    <section id="service-includes" className={cx("section", toneClass(tone))}>
      <div className="container-site">
        <SectionHeading
          eyebrow="آنچه انجام می‌شود"
          title="این خدمت شامل چه *مواردی* است؟"
          text={service.includesIntro || undefined}
        />
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:mt-8 lg:grid-cols-6 lg:gap-5">
          {service.includes.map((item, i) => {
            const icon = pickIcon(`${item.title} ${item.description}`, i, INCLUDE_ICONS);
            return (
              <li key={i} className={cx("reveal min-w-0", layout(i, count))} style={vars({ i: i % 3 })}>
                <FeatureCard
                  icon={icon}
                  title={item.title}
                  text={item.description || undefined}
                  index={i}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
