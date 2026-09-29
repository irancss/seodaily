import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState, JsonLd } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import { PageHero } from "@/components/organisms/page-hero";
import { Pagination } from "@/components/organisms/plugins/pagination";
import { PluginGrid } from "@/components/organisms/plugins/plugin-card";
import { PluginFilters } from "@/components/organisms/plugins/plugin-filters";
import { PluginSearch } from "@/components/organisms/plugins/plugin-search";
import { faNumber } from "@/modules/plugins/labels";
import { LIST_SINCE, LIST_SORTS, latestPlugins, listPublishedPlugins, popularPlugins, publishedCategories, type ListSort } from "@/modules/plugins/queries";
import { breadcrumbJsonLd, buildMetadata, getSiteUrl } from "@/modules/seo/metadata";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const TITLE = "افزونه‌های وردپرس";
const DESCRIPTION = "دانلود افزونه‌های وردپرس با فایل اصلی و دست‌نخورده، همراه با توضیح فارسی، نسخه و تاریخ به‌روزرسانی.";

function readParams(sp: Record<string, string | string[] | undefined>) {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const q = one(sp.q).trim().slice(0, 80);
  const page = Math.max(1, Number.parseInt(one(sp.page), 10) || 1);
  const category = one(sp.category).slice(0, 80);
  const since = one(sp.since) in LIST_SINCE ? one(sp.since) : "";
  const sort = (one(sp.sort) in LIST_SORTS ? one(sp.sort) : "updated") as ListSort;
  return { q, page, category, since, sort };
}

type Filters = ReturnType<typeof readParams>;

const pageHref = (f: Partial<Filters>) => (page: number) => {
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  if (f.category) params.set("category", f.category);
  if (f.since) params.set("since", f.since);
  if (f.sort && f.sort !== "updated") params.set("sort", f.sort);
  if (page > 1) params.set("page", String(page));
  const s = params.toString();
  return s ? `/plugins?${s}` : "/plugins";
};

/** Search, filters and sort make a result page (noindex); plain pagination does not. */
const isFiltered = (f: Filters) => Boolean(f.q || f.category || f.since || f.sort !== "updated");

async function query(f: Filters) {
  const categories = await publishedCategories();
  const categoryId = f.category ? (categories.find((c) => c.slug === f.category)?.id ?? -1) : undefined;
  const list = await listPublishedPlugins({ q: f.q, categoryId, sinceDays: f.since ? Number(f.since) : undefined, sort: f.sort, page: f.page });
  return { categories, list };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const f = readParams(await searchParams);
  const { list } = await query(f);
  const meta = await buildMetadata({
    title: list.page > 1 ? `${TITLE} – صفحه ${faNumber(list.page)}` : TITLE,
    description: DESCRIPTION,
    path: pageHref(isFiltered(f) ? f : {})(list.page),
  });
  // Search, filtered results and an empty library stay out of the index.
  return isFiltered(f) || list.total === 0 ? { ...meta, robots: { index: false, follow: true } } : meta;
}

export default async function PluginsPage({ searchParams }: Props) {
  const f = readParams(await searchParams);
  const { q, page } = f;
  const [{ list, categories }, latest, popular, base] = await Promise.all([
    query(f),
    latestPlugins(),
    popularPlugins(),
    getSiteUrl(),
  ]);
  if (page > list.pages) notFound();
  const firstPage = !isFiltered(f) && list.page === 1;

  return (
    <>
      <PageHero
        breadcrumb={[{ label: "خانه", href: "/" }, { label: TITLE }]}
        badge="کتابخانه افزونه"
        title="دانلود *افزونه‌های وردپرس*"
        subtitle="فایل اصلی هر افزونه، بدون تغییر، با توضیح فارسی، نسخه جاری و تاریخ آخرین به‌روزرسانی."
      >
        <PluginSearch defaultValue={q} dark />
        {categories.length > 0 && (
          <ul aria-label="دسته‌ها" className="mt-5 flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/plugins/${c.slug}`} className="chip-link min-h-10 px-4 text-sm">
                  {c.title} <span className="text-xs opacity-70">({faNumber(c.count)})</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageHero>

      {/* With a small library the full list below already is the "recent" list. */}
      {firstPage && latest.length > 0 && list.total > latest.length && (
        <section className="section">
          <div className="container-site">
            <SectionHeading align="stack" title="تازه‌های *به‌روزرسانی*" text="افزونه‌هایی که فایل آن‌ها به‌تازگی به‌روز شده است." />
            <PluginGrid plugins={latest} className="mt-8" />
          </div>
        </section>
      )}

      {firstPage && popular.length > 0 && (
        <section className="section bg-page">
          <div className="container-site">
            <SectionHeading align="stack" title="*پرطرفدار*ترین‌ها" text="بیشترین دانلود کامل در ۳۰ روز گذشته." />
            <PluginGrid plugins={popular} className="mt-8" />
          </div>
        </section>
      )}

      <section className="section" aria-labelledby="all-plugins">
        <div className="container-site">
          <h2 id="all-plugins" className="t-h2">
            {q ? `نتیجه جست‌وجوی «${q}»` : "همه افزونه‌ها"}
          </h2>
          <PluginFilters q={q} category={f.category} since={f.since} sort={f.sort} categories={categories} />
          {list.total > 0 && <p className="mt-4 text-sm text-muted">{faNumber(list.total)} افزونه</p>}
          {list.items.length > 0 ? (
            <PluginGrid plugins={list.items} className="mt-8" />
          ) : (
            <div className="mt-8">
              <EmptyState>
                {isFiltered(f) ? "افزونه‌ای با این مشخصات پیدا نشد. جست‌وجو یا فیلتر دیگری را امتحان کنید." : "هنوز افزونه‌ای منتشر نشده است."}
              </EmptyState>
            </div>
          )}
          <Pagination page={list.page} pages={list.pages} href={pageHref(f)} />
        </div>
      </section>

      {list.items.length > 0 && !isFiltered(f) && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: TITLE,
            url: `${base}${pageHref({})(list.page)}`,
            mainEntity: {
              "@type": "ItemList",
              itemListElement: list.items.map((p, i) => ({
                "@type": "ListItem",
                position: (list.page - 1) * 12 + i + 1,
                url: `${base}/plugins/${p.slug}`,
                name: p.name,
              })),
            },
          }}
        />
      )}
      <JsonLd
        data={await breadcrumbJsonLd([
          { name: "صفحه اصلی", path: "/" },
          { name: TITLE, path: "/plugins" },
        ])}
      />
    </>
  );
}
