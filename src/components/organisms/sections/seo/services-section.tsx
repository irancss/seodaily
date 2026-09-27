import Link from "next/link";

import { ArrowBadge, Icon, IconTile } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import type { Service } from "@/db/schema";
import { vars } from "@/lib/utils";
import { serviceHref } from "@/modules/services/routes";

type Props = {
  services: Service[];
};

export function SeoServicesSection({ services }: Props) {
  return (
    <section id="seo-services" className="section">
      <div className="container-site">
        <SectionHeading
          eyebrow="SEO Services"
          title="بخش‌های مختلف *خدمات سئو*"
          text="هر پروژه بسته به نتیجه بررسی اولیه، ترکیبی از این خدمات را شامل می‌شود؛ لازم نیست همه آن‌ها از روز اول شروع شوند."
        />
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:mt-14 lg:grid-cols-4 lg:gap-5">
          {services.map((s, i) => (
            <li key={s.slug} className="reveal" style={vars({ i: i % 4 })}>
              <Link
                href={serviceHref(s.slug)}
                className="card-fancy card-link grid h-full grid-cols-[48px_minmax(0,1fr)] gap-x-4 rounded-xl p-4 text-ink no-underline hover:text-ink sm:flex sm:flex-col sm:p-6"
              >
                <IconTile name={s.icon} tone="gradient" className="size-12 rounded-[14px]" iconSize={24} />
                <div className="flex min-w-0 flex-col sm:mb-5">
                  {s.englishTitle && (
                    <span dir="ltr" className="self-start text-xs leading-[1.7] font-semibold tracking-wide text-brand-hover sm:mt-5">
                      {s.englishTitle}
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="card-title t-h3 transition-colors">{s.title}</h3>
                    <span aria-hidden="true" className="flex text-brand sm:hidden">
                      <Icon name="chevron-left" size={18} />
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-[1.85] text-ink-2 sm:mt-2 sm:text-base sm:leading-[1.9]">{s.summary}</p>
                </div>
                <span className="mt-auto hidden items-center justify-between gap-2 border-t border-line pt-4 text-sm leading-[1.7] font-semibold text-brand sm:flex">
                  جزئیات خدمت
                  <ArrowBadge size={32} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
