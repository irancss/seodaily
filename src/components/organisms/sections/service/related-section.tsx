import Link from "next/link";

import { ArrowBadge, IconTile } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import type { Service } from "@/db/schema";
import { cx, vars } from "@/lib/utils";
import { serviceHref } from "@/modules/services/routes";

import { toneClass, type SectionTone } from "./tone";

type Props = {
  related: Pick<Service, "slug" | "title" | "category" | "icon" | "summary">[];
  tone?: SectionTone;
};

export function ServiceRelatedSection({ related, tone }: Props) {
  return (
    <section className={cx("section", toneClass(tone))}>
      <div className="container-site">
        <SectionHeading eyebrow="ادامه مسیر" title="خدمات *مرتبط*" />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-6">
          {related.map((r, i) => (
            <li key={r.slug} className="reveal" style={vars({ i: i % 3 })}>
              <Link
                href={serviceHref(r.slug)}
                className="card-link card-fancy flex h-full flex-col items-start rounded-xl p-6 text-ink no-underline hover:text-ink lg:p-7"
              >
                <span className="flex w-full items-start justify-between gap-4">
                  <IconTile name={r.icon} tone="gradient" className="size-12 rounded-[14px]" iconSize={24} />
                  <ArrowBadge size={40} />
                </span>
                <span className="mt-5 text-sm leading-[1.7] font-medium text-muted">
                  {r.category === "seo" ? "سئو" : "طراحی سایت"}
                </span>
                <span className="card-title text-lg leading-[1.8] font-bold transition-colors lg:text-xl lg:leading-[1.65]">
                  {r.title}
                </span>
                {r.summary && <span className="mt-2 line-clamp-2 text-base leading-[1.9] text-ink-2">{r.summary}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
