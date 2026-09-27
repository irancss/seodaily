import Link from "next/link";

import { ArrowBadge, ButtonLink, Icon } from "@/components/atoms";
import { BrowserFrame, Visual } from "@/components/molecules";
import { DesignFrame, SeoFrame } from "@/components/organisms";
import type { Category, Service } from "@/db/schema";
import { cx, stepNo } from "@/lib/utils";
import { serviceHref } from "@/modules/services/routes";

type Props = {
  index: number;
  category: Category;
  items: Service[];
  mirrored: boolean;
};

export function MainServiceBlock({ index, category, items, mirrored }: Props) {
  const isSeo = category.slug === "seo";
  return (
    <article className="grid items-center gap-8 lg:grid-cols-2 lg:gap-20">
      <div className={mirrored ? "lg:order-2" : undefined}>
        <div className="flex items-center gap-3">
          <span className="text-xl leading-[1.65] font-bold text-brand lg:text-2xl lg:leading-[1.6]">{stepNo(index)}</span>
          <span className="text-sm leading-[1.7] font-medium text-muted">خدمت اصلی</span>
        </div>
        <h2 className="t-h2 mt-2 lg:mt-4">{category.title}</h2>
        <p className="body-lg mt-3 lg:mt-4">{category.description}</p>
        {/* Mobile keeps the image between the description and the sub-services. */}
        <div aria-hidden="true" className="mt-6 lg:hidden">
          <BrowserFrame compact shadow="none">
            <Visual alt="" label="جای تصویر نمونه" tone={isSeo ? "soft" : "page"} className="h-[180px]" />
          </BrowserFrame>
        </div>
        {items.length > 0 && (
          <>
            <h3 className="mt-6 text-sm leading-[1.7] font-medium text-muted lg:mt-8">زیرخدمات {category.title}</h3>
            <ul className="mt-2 border-t border-line">
              {items.map((s) => (
                <li key={s.slug} className="border-b border-line">
                  <Link
                    href={serviceHref(s.slug)}
                    className="card-link flex min-h-14 items-center justify-between gap-3 text-ink no-underline hover:text-ink lg:h-[60px] lg:gap-4"
                  >
                    <span className="card-title text-base leading-[1.9] font-medium lg:text-lg">{s.title}</span>
                    <span aria-hidden="true" className="flex text-brand lg:hidden">
                      <Icon name="chevron-left" size={18} />
                    </span>
                    <span className="hidden lg:block">
                      <ArrowBadge size={36} variant="soft" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
        <ButtonLink href={`/${category.slug}`} variant="secondary" arrow className="mt-6 w-full lg:mt-8 lg:h-12 lg:w-auto lg:px-5">
          مشاهده خدمات {category.title}
        </ButtonLink>
      </div>
      <div className={cx("hidden lg:block", mirrored && "lg:order-1")}>{isSeo ? <SeoFrame /> : <DesignFrame />}</div>
    </article>
  );
}
