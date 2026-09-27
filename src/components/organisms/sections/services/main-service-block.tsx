import Link from "next/link";

import { ArrowBadge, ButtonLink, IconTile, StatCounter } from "@/components/atoms";
import type { Category, Service } from "@/db/schema";
import { cx, stepNo, vars } from "@/lib/utils";
import { CATEGORY_ICONS } from "@/modules/pages/services-content";
import { serviceHref } from "@/modules/services/routes";

type Props = {
  index: number;
  category: Category;
  items: Service[];
  mirrored: boolean;
};

/** One main service as a bento pair: a dark intro tile beside a tile of links to its sub-services. */
export function MainServiceBlock({ index, category, items, mirrored }: Props) {
  const hasItems = items.length > 0;
  return (
    <article id={`service-${category.slug}`} className="grid gap-4 lg:grid-cols-12 lg:gap-6">
      <div
        className={cx(
          "surface-dark reveal flex flex-col items-start overflow-hidden rounded-xl p-6 sm:p-8 lg:rounded-2xl lg:p-10",
          hasItems ? "lg:col-span-5" : "lg:col-span-12",
          mirrored && "lg:order-2",
        )}
      >
        <div aria-hidden="true" className="grid-bg-dark fade-radial pointer-events-none absolute inset-0 -z-10" style={vars({ grid: "32px" })} />
        <span aria-hidden="true" className="orb orb-blue -top-48 -right-40 size-[460px]" />
        <span aria-hidden="true" className="orb orb-cyan -bottom-56 -left-44 size-[420px]" style={vars({ i: 1 })} />

        <div className="flex w-full items-start justify-between gap-4">
          <IconTile name={CATEGORY_ICONS[category.slug] ?? "layers"} tone="gradient" className="size-14 rounded-2xl lg:size-16" iconSize={30} />
          <span aria-hidden="true" className="text-5xl leading-none font-bold text-white/10 lg:text-6xl">
            {stepNo(index)}
          </span>
        </div>
        <span className="eyebrow mt-6 lg:mt-8">خدمت اصلی</span>
        <h2 className="t-h2 mt-2">{category.title}</h2>
        <p className="body-lg mt-3">{category.description}</p>

        <div className="mt-8 flex w-full flex-col items-start gap-6 lg:mt-auto lg:pt-10">
          {hasItems && (
            <p className="flex w-full items-end gap-3 border-t border-white/10 pt-6">
              <StatCounter value={items.length} className="text-gradient text-5xl leading-[1.15] font-bold" />
              <span className="pb-1.5 text-sm leading-[1.7] text-inverse-muted">خدمت تخصصی {category.title}</span>
            </p>
          )}
          <ButtonLink href={`/${category.slug}`} variant="white" arrow className="w-full sm:w-auto">
            مشاهده خدمات {category.title}
          </ButtonLink>
        </div>
      </div>

      {hasItems && (
        <div
          className={cx(
            "reveal flex flex-col rounded-xl border border-line bg-white p-4 shadow-sm sm:p-6 lg:col-span-7 lg:rounded-2xl lg:p-8",
            mirrored && "lg:order-1",
          )}
          style={vars({ i: 1 })}
        >
          <h3 className="px-1 text-base leading-[1.8] font-bold lg:text-lg">زیرخدمات {category.title}</h3>
          <ul className="mt-3 grid grow auto-rows-fr gap-2.5 sm:grid-cols-2 sm:gap-3 lg:mt-5">
            {items.map((s) => (
              <li key={s.slug}>
                <Link
                  href={serviceHref(s.slug)}
                  className="card-fancy card-link flex h-full min-h-[72px] items-center gap-3 rounded-xl bg-page p-3 text-ink no-underline hover:bg-white hover:text-ink lg:px-4"
                >
                  <IconTile name={s.icon} tone="white" className="size-11 rounded-xl" iconSize={22} />
                  <span className="flex min-w-0 grow flex-col">
                    <span className="card-title text-base leading-[1.7] font-semibold transition-colors">{s.title}</span>
                    {s.englishTitle && (
                      <span dir="ltr" className="text-right text-xs leading-[1.6] text-muted">
                        {s.englishTitle}
                      </span>
                    )}
                  </span>
                  <ArrowBadge size={30} variant="white" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
