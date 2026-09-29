import Link from "next/link";

import { EmptyState } from "@/components/atoms";
import { BlockRenderer, hasContent, type HrefMap } from "@/components/organisms/blocks/block-renderer";
import { PageHero } from "@/components/organisms/page-hero";
import { cx } from "@/lib/utils";
import type { BlockDocument } from "@/modules/blocks/schema";
import { faNumber } from "@/modules/plugins/labels";
import type { PluginCard, PublicCategory } from "@/modules/plugins/queries";

import { Pagination } from "./pagination";
import { PluginGrid } from "./plugin-card";
import { PluginSearch } from "./plugin-search";

type Props = {
  category: { id: number; slug: string; title: string; h1: string; description: BlockDocument | null };
  list: { items: PluginCard[]; total: number; page: number; pages: number };
  categories: PublicCategory[];
  hrefs: HrefMap;
};

export function CategoryPageView({ category, list, categories, hrefs }: Props) {
  const href = (page: number) => (page > 1 ? `/plugins/${category.slug}?page=${page}` : `/plugins/${category.slug}`);
  return (
    <>
      <PageHero
        breadcrumb={[{ label: "خانه", href: "/" }, { label: "افزونه‌های وردپرس", href: "/plugins" }, { label: category.title }]}
        badge={list.total > 0 ? `${faNumber(list.total)} افزونه` : undefined}
        title={category.h1 || `افزونه‌های ${category.title}`}
      >
        <PluginSearch dark />
        {categories.length > 1 && (
          <ul aria-label="دسته‌ها" className="mt-5 flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/plugins/${c.slug}`}
                  aria-current={c.id === category.id ? "page" : undefined}
                  className={cx("chip-link min-h-10 px-4 text-sm", c.id === category.id && "border-brand text-brand-hover")}
                >
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageHero>

      <section className="section">
        <div className="container-site">
          {list.page === 1 && hasContent(category.description) && (
            <BlockRenderer document={category.description} hrefs={hrefs} className="mb-10 max-w-[860px]" />
          )}
          {list.items.length > 0 ? (
            <PluginGrid plugins={list.items} />
          ) : (
            <EmptyState>هنوز افزونه‌ای در این دسته منتشر نشده است.</EmptyState>
          )}
          <Pagination page={list.page} pages={list.pages} href={href} />
        </div>
      </section>
    </>
  );
}
