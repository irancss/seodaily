import { Icon } from "@/components/atoms";
import { DesignFrame, SeoFrame } from "@/components/organisms/illustrations";
import { vars } from "@/lib/utils";

/** Services hero: the two main services as stacked glass mockups, each with a floating label. */
export function ServicesHeroVisual() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-[560px] pt-14 pb-2 sm:pt-20 lg:pb-4">
      {/* SEO: a results page, behind. */}
      <div className="frame-glass absolute top-0 left-0 w-[70%] rounded-2xl p-1.5 lg:p-2">
        <SeoFrame />
      </div>
      {/* Web design: a website, in front. */}
      <div className="frame-glass relative w-[86%] rounded-2xl p-2 lg:p-2.5">
        <DesignFrame />
      </div>

      <div
        className="float-card float absolute top-3 -left-3 hidden items-center gap-2.5 py-2.5 ps-2.5 pe-4 sm:flex xl:-left-9"
        style={vars({ i: 0 })}
      >
        <span className="icon-gradient size-9 rounded-full">
          <Icon name="search-minus" size={17} />
        </span>
        <span className="flex flex-col">
          <span className="text-[11px] leading-[1.6] text-muted"><span className="css-label" data-label="دیده‌شدن در جست‌وجو" /></span>
          <span className="text-sm leading-[1.6] font-bold text-ink"><span className="css-label" data-label="سئو" /></span>
        </span>
      </div>
      <div
        className="float-card float absolute -right-3 bottom-0 hidden items-center gap-2.5 py-2.5 ps-2.5 pe-4 sm:flex lg:bottom-4 xl:-right-9"
        style={vars({ i: 1 })}
      >
        <span className="icon-gradient size-9 rounded-full">
          <Icon name="layout" size={17} />
        </span>
        <span className="flex flex-col">
          <span className="text-[11px] leading-[1.6] text-muted"><span className="css-label" data-label="زیرساخت وب" /></span>
          <span className="text-sm leading-[1.6] font-bold text-ink"><span className="css-label" data-label="طراحی سایت" /></span>
        </span>
      </div>
    </div>
  );
}
