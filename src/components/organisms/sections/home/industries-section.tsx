import Link from "next/link";

import { Icon } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import { vars } from "@/lib/utils";
import type { LinkItem } from "@/modules/settings/types";

type Props = {
  industries: LinkItem[];
};

export function HomeIndustriesSection({ industries }: Props) {
  return (
    <section className="section bg-white">
      <div className="container-site">
        <SectionHeading
          align="center"
          eyebrow="حوزه‌های کاری"
          title="برای *کسب‌وکارهای مختلف*"
          text="هر صنف مخاطب، رقبا و مسیر تصمیم‌گیری خودش را دارد؛ ساختار سایت و برنامه سئو هم باید بر همین اساس تعریف شود."
        />
        <ul className="mt-8 flex flex-wrap gap-3 lg:mt-12 lg:justify-center lg:gap-4">
          {industries.map((item, i) => (
            <li key={item.title} className="reveal-scale" style={vars({ i: Math.min(i, 8) })}>
              <Link href={item.url || "/contact"} className="chip-link">
                <span aria-hidden="true" className="size-2.5 rounded-full bg-gradient-to-l from-brand to-brand-decorative" />
                {item.title}
                <Icon name="arrow-left" size={16} className="chip-arrow text-brand" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
