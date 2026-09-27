import Link from "next/link";

import { Icon } from "@/components/atoms";
import type { Service } from "@/db/schema";
import { serviceHref } from "@/modules/services/routes";

type Props = {
  services: Service[];
};

export function SeoServicesSection({ services }: Props) {
  return (
    <section id="seo-services" className="section bg-white">
      <div className="container-site">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="flex max-w-[560px] flex-col gap-1 lg:gap-2">
            <span dir="ltr" className="self-start text-sm leading-[1.7] font-medium text-muted">
              SEO Services
            </span>
            <h2 className="t-h2">بخش‌های مختلف خدمات سئو</h2>
          </div>
          <p className="body-lg lg:max-w-[520px]">
            هر پروژه بسته به نتیجه بررسی اولیه، ترکیبی از این خدمات را شامل می‌شود؛ لازم نیست همه آن‌ها از روز
            اول شروع شوند.
          </p>
        </div>
        {/* Mobile: a hairline list; desktop: a 4-column hairline grid. */}
        <ul className="mt-6 border-t border-line lg:mt-12 lg:grid lg:grid-cols-4">
          {services.map((s) => (
            <li key={s.slug} className="border-b border-line lg:border-l lg:[&:nth-child(4n)]:border-l-0">
              <Link
                href={serviceHref(s.slug)}
                className="card-link grid h-full grid-cols-[28px_minmax(0,1fr)] gap-3.5 py-5 text-ink no-underline hover:text-ink lg:flex lg:flex-col lg:gap-0 lg:px-7 lg:py-8"
              >
                <span aria-hidden="true" className="pt-1 text-brand lg:pt-0">
                  <Icon name={s.icon} size={28} strokeWidth={1.75} />
                </span>
                <div className="lg:contents">
                  <div className="flex items-center justify-between gap-2 lg:contents">
                    <h3 className="card-title t-h3 lg:mt-5">{s.title}</h3>
                    <span aria-hidden="true" className="flex text-brand lg:hidden">
                      <Icon name="chevron-left" size={18} />
                    </span>
                  </div>
                  {s.englishTitle && (
                    <span dir="ltr" className="block text-right text-sm leading-[1.7] font-medium text-muted lg:self-start">
                      {s.englishTitle}
                    </span>
                  )}
                  <p className="mt-2 text-base leading-[1.9] text-ink-2 lg:mt-3">{s.summary}</p>
                </div>
                <span className="mt-auto hidden items-center gap-2 pt-5 text-sm leading-[1.7] font-semibold text-brand lg:inline-flex">
                  جزئیات خدمت
                  <span aria-hidden="true" className="arrow-badge size-8 border border-line">
                    <Icon name="arrow-left" size={16} />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
