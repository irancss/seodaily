import { ButtonLink, Icon, IconTile } from "@/components/atoms";
import { PageHero } from "@/components/organisms/page-hero";
import type { Category } from "@/db/schema";
import { vars } from "@/lib/utils";
import { CATEGORY_ICONS } from "@/modules/pages/services-content";
import type { PageText } from "@/modules/settings/types";

import { ServicesHeroVisual } from "./hero-visual";

type Props = {
  text: PageText;
  categories: Category[];
  /** Number of published sub-services of each category, in the same order. */
  counts: number[];
};

export function ServicesHeroSection({ text, categories, counts }: Props) {
  return (
    <>
      <PageHero
        breadcrumb={[{ label: "صفحه اصلی", href: "/" }, { label: "خدمات" }]}
        badge={text.badge}
        title={text.title}
        subtitle={text.subtitle}
        actions={
          <>
            <ButtonLink href="/contact" size="lg" arrow>
              درخواست مشاوره
            </ButtonLink>
            <ButtonLink href="/pricing" size="lg" variant="glass">
              <Icon name="calculator" />
              محاسبه هزینه پروژه
            </ButtonLink>
          </>
        }
        aside={<ServicesHeroVisual />}
      />

      {/* Jump links to the category blocks, overlapping the bottom of the hero. */}
      {categories.length > 0 && (
        <div className="container-site relative z-10 -mt-8 lg:-mt-12">
          <nav
            aria-label="دسته‌بندی خدمات"
            className="animate-in grid gap-1.5 rounded-2xl border border-line bg-white p-2 shadow-lg sm:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] sm:gap-2 lg:p-2.5"
            style={vars({ i: 4 })}
          >
            {categories.map((c, i) => (
              <a
                key={c.slug}
                href={`#service-${c.slug}`}
                className="group flex min-h-16 items-center gap-3 rounded-xl px-3 py-2.5 text-ink no-underline transition-colors hover:bg-soft hover:text-ink lg:gap-4 lg:px-4"
              >
                <IconTile name={CATEGORY_ICONS[c.slug] ?? "layers"} tone="gradient" className="size-11 rounded-xl lg:size-12" iconSize={22} />
                <span className="flex min-w-0 grow flex-col">
                  <span className="text-base leading-[1.7] font-bold lg:text-lg">{c.title}</span>
                  {counts[i] > 0 && <span className="text-sm leading-[1.7] text-muted">{counts[i]} خدمت تخصصی</span>}
                </span>
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-soft text-brand transition-transform duration-300 group-hover:translate-y-0.5"
                >
                  <Icon name="arrow-down" size={18} />
                </span>
              </a>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
