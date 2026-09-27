"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ArrowBadge, Icon } from "@/components/atoms";
import { BrowserFrame, Visual } from "@/components/molecules";
import { cx } from "@/lib/utils";

export type PortfolioItem = {
  id: number;
  slug: string;
  title: string;
  projectType: string;
  summary: string;
  imageUrl: string;
};

const PAGE_SIZE = 6;

function Meta({ item }: { item: PortfolioItem }) {
  return (
    <>
      {item.projectType && (
        <span className="inline-flex items-center gap-2 text-sm leading-[1.7] font-medium text-ink-2">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
          {item.projectType}
        </span>
      )}
      <h3 className="t-h3 mt-1">{item.title}</h3>
      {item.summary && <p className="mt-1 text-base leading-[1.9] text-ink-2">{item.summary}</p>}
    </>
  );
}

function ViewLink({ item, size = 36 }: { item: PortfolioItem; size?: number }) {
  return (
    <Link
      href={`/portfolio/${item.slug}`}
      className="card-link inline-flex min-h-11 items-center gap-3 text-base leading-normal font-semibold text-brand no-underline"
    >
      مشاهده پروژه<span className="sr-only">: {item.title}</span>
      <ArrowBadge size={size} />
    </Link>
  );
}

/**
 * Filter chips + the design's rhythm: every group of six shows one featured
 * full-width item, four in a 2×2 grid and one wide split item.
 */
export function PortfolioGrid({ items }: { items: PortfolioItem[] }) {
  const types = useMemo(() => [...new Set(items.map((i) => i.projectType).filter(Boolean))], [items]);
  const [filter, setFilter] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = filter ? items.filter((i) => i.projectType === filter) : items;
  const shown = filtered.slice(0, visible);

  function choose(type: string | null) {
    setFilter(type);
    setVisible(PAGE_SIZE);
  }

  return (
    <>
      {types.length > 1 && (
        <section aria-label="فیلتر نمونه‌کارها" className="border-y border-line bg-white">
          <div className="container-site flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:gap-6">
            <span id="portfolio-filter-label" className="shrink-0 text-sm leading-[1.7] font-medium text-muted">
              نوع پروژه:
            </span>
            <div role="group" aria-labelledby="portfolio-filter-label" className="flex flex-wrap items-center gap-2 lg:gap-3">
              {[null, ...types].map((type) => {
                const pressed = filter === type;
                return (
                  <button
                    key={type ?? "all"}
                    type="button"
                    aria-pressed={pressed}
                    onClick={() => choose(type)}
                    className={cx(
                      "min-h-11 cursor-pointer rounded-full border text-base leading-normal",
                      pressed
                        ? "border-brand bg-brand px-5 font-semibold text-white lg:px-6"
                        : "border-control bg-white px-[18px] font-medium text-ink hover:bg-soft lg:px-5",
                    )}
                  >
                    {type ?? "همه"}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="pt-10 pb-16 lg:pt-16 lg:pb-24">
        <div className="container-site">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            <h2 className="text-2xl leading-[1.6] font-bold">{filter ?? "همه پروژه‌ها"}</h2>
            <p aria-live="polite" className="text-sm leading-[1.8] text-muted">
              {filtered.length} پروژه
            </p>
          </div>

          <div className="mt-6 grid gap-10 lg:mt-8 lg:grid-cols-2 lg:gap-x-8 lg:gap-y-16">
            {shown.map((item, index) => {
              const slot = index % 6;
              if (slot === 0) {
                return (
                  <article key={item.id} className="flex flex-col gap-4 lg:col-span-2 lg:gap-6">
                    <BrowserFrame url={null}>
                      <Visual src={item.imageUrl} alt={item.title} className="h-[272px] lg:h-[516px]" />
                    </BrowserFrame>
                    <div className="flex flex-col items-start gap-2 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
                      <div className="flex flex-col">
                        <Meta item={item} />
                      </div>
                      <ViewLink item={item} size={40} />
                    </div>
                  </article>
                );
              }
              if (slot === 5) {
                return (
                  <article
                    key={item.id}
                    className="grid items-center gap-4 lg:col-span-2 lg:grid-cols-[5fr_7fr] lg:gap-12 lg:border-t lg:border-line lg:pt-16"
                  >
                    <div className="order-2 flex flex-col items-start lg:order-1">
                      <Meta item={item} />
                      <div className="mt-2 lg:mt-3">
                        <ViewLink item={item} />
                      </div>
                    </div>
                    <BrowserFrame compact shadow="none" className="order-1 lg:order-2">
                      <Visual src={item.imageUrl} alt={item.title} tone="page" className="h-[240px] lg:h-[380px]" />
                    </BrowserFrame>
                  </article>
                );
              }
              return (
                <article key={item.id} className="flex flex-col">
                  <BrowserFrame compact shadow="none">
                    <Visual src={item.imageUrl} alt={item.title} tone={slot % 3 === 0 ? "soft" : "page"} className="h-[240px] lg:h-[360px]" />
                  </BrowserFrame>
                  <div className="mt-4 flex flex-col items-start lg:mt-5">
                    <Meta item={item} />
                    <div className="mt-2 lg:mt-3">
                      <ViewLink item={item} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {filtered.length > visible && (
            <div className="mt-10 flex justify-center lg:mt-16">
              <button type="button" onClick={() => setVisible((v) => v + PAGE_SIZE)} className="btn btn-secondary h-[52px] w-full px-7 lg:w-auto">
                نمایش بیشتر
                <Icon name="chevron-down" />
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
