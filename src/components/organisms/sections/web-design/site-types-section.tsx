import Link from "next/link";

import { ArrowBadge, Icon, IconTile } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import type { Service } from "@/db/schema";
import { serviceHref } from "@/modules/services/routes";

type Props = {
  services: Service[];
};

export function WebDesignSiteTypesSection({ services }: Props) {
  return (
    <section className="section bg-white">
      <div className="container-site">
        <SectionHeading
          title="چه نوع سایتی نیاز دارید؟"
          text="نوع سایت از هدف کسب‌وکار شما مشخص می‌شود. برای هر گزینه، صفحه‌ای با جزئیات بیشتر در نظر گرفته شده است."
        />
        {/* Mobile: a hairline list of rows; desktop: a grid of cards. */}
        <ul className="mt-6 border-t border-line lg:mt-12 lg:grid lg:grid-cols-3 lg:gap-6 lg:border-0">
          {services.map((s) => (
            <li key={s.slug} className="border-b border-line lg:border-0">
              <Link
                href={serviceHref(s.slug)}
                className="card-link grid grid-cols-[40px_minmax(0,1fr)_18px] items-center gap-3.5 py-5 text-ink no-underline hover:text-ink lg:flex lg:h-full lg:flex-col lg:items-stretch lg:gap-0 lg:rounded-md lg:border lg:border-line lg:bg-white lg:p-8"
              >
                <span className="flex items-center justify-between">
                  <IconTile name={s.icon} iconSize={22} className="size-10 lg:size-12" />
                  <span className="hidden lg:block">
                    <ArrowBadge size={40} />
                  </span>
                </span>
                <div>
                  <h3 className="card-title text-base leading-[1.9] font-semibold lg:mt-6 lg:text-xl lg:leading-[1.65]">
                    {s.title}
                  </h3>
                  <p className="text-sm leading-[1.8] text-ink-2 lg:mt-2 lg:text-base lg:leading-[1.9]">{s.summary}</p>
                </div>
                <span aria-hidden="true" className="flex text-brand lg:hidden">
                  <Icon name="chevron-left" size={18} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
