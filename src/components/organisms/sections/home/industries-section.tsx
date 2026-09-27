import Link from "next/link";

import { ArrowBadge, Icon } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import type { LinkItem } from "@/modules/settings/types";

type Props = {
  industries: LinkItem[];
};

export function HomeIndustriesSection({ industries }: Props) {
  return (
    <section className="section">
      <div className="container-site">
        <SectionHeading
          align="stack"
          title="برای کسب‌وکارهای مختلف"
          text="هر صنف مخاطب، رقبا و مسیر تصمیم‌گیری خودش را دارد؛ ساختار سایت و برنامه سئو هم باید بر همین اساس تعریف شود."
        />
        {/* Mobile: one white panel with rows; desktop: a grid of tiles. */}
        <ul className="mt-6 rounded-md border border-line bg-white px-4 lg:mt-12 lg:grid lg:grid-cols-4 lg:gap-4 lg:border-0 lg:bg-transparent lg:px-0">
          {industries.map((item) => (
            <li key={item.title} className="border-b border-line last:border-b-0 lg:border-b-0">
              <Link
                href={item.url || "/contact"}
                className="card-link flex h-14 items-center justify-between gap-3 text-base leading-normal font-semibold text-ink no-underline hover:text-ink lg:h-[88px] lg:rounded-md lg:border lg:border-line lg:bg-white lg:px-6 lg:text-xl lg:leading-[1.65]"
              >
                {item.title}
                <span aria-hidden="true" className="flex text-brand lg:hidden">
                  <Icon name="chevron-left" size={18} />
                </span>
                <span className="hidden lg:block">
                  <ArrowBadge size={40} variant="soft" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
