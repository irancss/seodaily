"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ArrowBadge, Icon } from "@/components/atoms";
import { BrowserFrame, Visual } from "@/components/molecules";
import { cx, vars } from "@/lib/utils";
import { projectHref } from "@/modules/projects/routes";

export type PortfolioItem = {
  id: number;
  slug: string;
  title: string;
  projectType: string;
  summary: string;
  imageUrl: string;
};

const PAGE_SIZE = 6;

/** Regular card: framed picture that zooms on hover, type chip, name and summary. */
function ProjectTile({ item }: { item: PortfolioItem }) {
  return (
    <Link href={projectHref(item.slug)} className="card-link group flex h-full flex-col gap-4 text-ink no-underline hover:text-ink lg:gap-5">
      <div className="relative rounded-xl transition-[transform,box-shadow] duration-500 ease-[var(--ease-out)] group-hover:-translate-y-1 group-hover:shadow-lg">
        <BrowserFrame compact shadow="sm" className="rounded-xl">
          <Visual src={item.imageUrl} alt={item.title} className="img-zoom h-[240px] sm:h-[280px] lg:h-[300px]" />
        </BrowserFrame>
        {item.projectType && (
          <span className="chip absolute top-10 right-3 bg-white/90 text-xs shadow-sm backdrop-blur lg:top-12 lg:right-4">
            {item.projectType}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="card-title t-h3 transition-colors">{item.title}</h3>
          {item.summary && <p className="mt-0.5 line-clamp-1 text-sm leading-[1.8] text-muted">{item.summary}</p>}
        </div>
        <ArrowBadge />
      </div>
    </Link>
  );
}

/** Wide split card: the first of every six, and the sixth on a dark panel. */
function ProjectFeature({ item, dark = false }: { item: PortfolioItem; dark?: boolean }) {
  return (
    <Link
      href={projectHref(item.slug)}
      className={cx(
        "card-link group grid overflow-hidden rounded-xl no-underline lg:rounded-2xl",
        "transition-[transform,box-shadow] duration-500 ease-[var(--ease-out)] hover:-translate-y-1 hover:shadow-lg",
        dark
          ? "surface-dark lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
          : "border border-line bg-white text-ink shadow-sm hover:text-ink lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]",
      )}
    >
      <div
        className={cx(
          "relative isolate overflow-hidden p-3 sm:p-5 lg:p-8",
          dark ? "lg:order-2" : "surface-soft-gradient",
        )}
      >
        {dark ? (
          <>
            <div aria-hidden="true" className="grid-bg-dark fade-radial pointer-events-none absolute inset-0 -z-10" style={vars({ grid: "32px" })} />
            <span aria-hidden="true" className="orb orb-blue -top-40 -left-24 size-[420px]" />
          </>
        ) : (
          <div aria-hidden="true" className="grid-bg fade-radial pointer-events-none absolute inset-0 -z-10 opacity-70" style={vars({ grid: "28px" })} />
        )}
        <div className={cx("rounded-xl", dark && "frame-glass p-1.5 lg:p-2")}>
          <BrowserFrame compact shadow={dark ? "none" : "md"} className="rounded-xl">
            <Visual src={item.imageUrl} alt={item.title} className="img-zoom h-[220px] sm:h-[320px] lg:h-[400px]" />
          </BrowserFrame>
        </div>
      </div>
      <div className={cx("flex flex-col items-start justify-center p-6 sm:p-8 lg:p-12", dark && "lg:order-1")}>
        {item.projectType && <span className="chip">{item.projectType}</span>}
        <h3
          className={cx(
            "card-title mt-4 text-2xl leading-[1.6] font-bold transition-colors lg:text-[28px]",
            dark && "text-white group-hover:text-cyan-200",
          )}
        >
          {item.title}
        </h3>
        {item.summary && <p className="body-lg mt-2 lg:mt-3">{item.summary}</p>}
        <span
          className={cx(
            "mt-6 inline-flex items-center gap-3 text-base leading-normal font-semibold lg:mt-8",
            dark ? "text-cyan-200" : "text-brand",
          )}
        >
          مشاهده پروژه
          <ArrowBadge size={40} variant={dark ? "white" : "outline"} />
        </span>
      </div>
    </Link>
  );
}

/**
 * Filter pills + the portfolio rhythm: every group of six shows one wide
 * feature card, four regular cards in a 2×2 grid and one wide dark card.
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
    <section id="portfolio-projects" aria-labelledby="portfolio-list-title" className="section bg-white">
      <div className="container-site">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <div className="flex flex-col items-start gap-2 lg:gap-3">
            <span className="eyebrow">پروژه‌ها</span>
            <h2 id="portfolio-list-title" className="t-h2">
              {filter ?? "همه پروژه‌ها"}
            </h2>
            <p aria-live="polite" className="text-sm leading-[1.8] text-muted">
              {filtered.length} پروژه
            </p>
          </div>

          {types.length > 1 && (
            <div aria-label="فیلتر نمونه‌کارها" role="region" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <span id="portfolio-filter-label" className="shrink-0 text-sm leading-[1.7] font-medium text-muted">
                نوع پروژه:
              </span>
              <div role="group" aria-labelledby="portfolio-filter-label" className="flex flex-wrap items-center gap-2">
                {[null, ...types].map((type) => {
                  const pressed = filter === type;
                  const count = type ? items.filter((i) => i.projectType === type).length : items.length;
                  return (
                    <button
                      key={type ?? "all"}
                      type="button"
                      aria-pressed={pressed}
                      onClick={() => choose(type)}
                      className={cx(
                        "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border ps-5 pe-2 text-[15px] leading-normal font-semibold",
                        "transition-[transform,box-shadow,background-color,border-color,color] duration-300 ease-[var(--ease-out)]",
                        pressed
                          ? "border-transparent bg-gradient-to-l from-brand-hover to-brand text-white shadow-brand"
                          : "border-line bg-white text-ink hover:-translate-y-0.5 hover:border-brand/40 hover:text-brand-hover hover:shadow-md",
                      )}
                    >
                      {type ?? "همه"}
                      <span
                        aria-hidden="true"
                        className={cx(
                          "flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold",
                          pressed ? "bg-white/20 text-white" : "bg-soft text-brand-hover",
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-x-8 gap-y-10 lg:mt-12 lg:grid-cols-2 lg:gap-y-14">
          {shown.map((item, index) => {
            const slot = index % 6;
            const wide = slot === 0 || slot === 5;
            return (
              <article key={item.id} className={cx("reveal", wide && "lg:col-span-2")} style={vars({ i: wide ? 0 : (slot + 1) % 2 })}>
                {wide ? <ProjectFeature item={item} dark={slot === 5} /> : <ProjectTile item={item} />}
              </article>
            );
          })}
        </div>

        {filtered.length > visible && (
          <div className="mt-10 flex justify-center lg:mt-16">
            <button
              type="button"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
              className="btn btn-secondary h-[52px] w-full rounded-full px-8 sm:w-auto"
            >
              <Icon name="chevron-down" />
              نمایش بیشتر
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
