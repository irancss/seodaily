import { Icon } from "@/components/atoms";
import { ResponsiveFrames } from "@/components/organisms/illustrations";
import { cx, vars } from "@/lib/utils";

const SWATCHES = ["bg-brand", "bg-brand-decorative", "bg-ink", "bg-soft"];
const DEVICES = ["desktop", "responsive", "mobile"];

/** Web design hero: the site on desktop and phone, with a design-system card and a responsive badge. */
export function WebDesignHeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[580px] pt-6 lg:pt-8">
      <ResponsiveFrames />

      {/* Design system: type and brand colours. */}
      <div
        aria-hidden="true"
        className="float-card float absolute top-0 -left-3 hidden w-[184px] p-4 sm:block lg:-top-2 xl:-left-10"
        style={vars({ i: 0 })}
      >
        <div className="flex items-center justify-between gap-2 text-xs leading-[1.7] font-semibold text-ink">
          <span className="css-label" data-label="سیستم طراحی" />
          <Icon name="palette" size={15} className="text-brand" />
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-3">
          <span dir="ltr" className="text-gradient text-[32px] leading-none font-bold">
            <span className="css-label" data-label="Aa" />
          </span>
          <span className="flex">
            {SWATCHES.map((c, i) => (
              <span key={c} className={cx("size-6 rounded-full ring-2 ring-white", c, i > 0 && "-ms-1.5")} />
            ))}
          </span>
        </div>
        <div className="mt-3 flex flex-col gap-1.5">
          <span className="block h-1.5 w-full rounded-full bg-line" />
          <span className="block h-1.5 w-2/3 rounded-full bg-line" />
        </div>
      </div>

      {/* Same page on every screen size. */}
      <div
        aria-hidden="true"
        className="float-card float absolute -right-3 bottom-20 hidden items-center gap-3 py-2.5 ps-2.5 pe-4 sm:flex lg:bottom-24 xl:-right-10"
        style={vars({ i: 1 })}
      >
        <span className="flex gap-1">
          {DEVICES.map((name) => (
            <span key={name} className="flex size-8 items-center justify-center rounded-lg bg-soft text-brand">
              <Icon name={name} size={16} />
            </span>
          ))}
        </span>
        <span className="flex flex-col">
          <span className="text-[11px] leading-[1.6] text-muted"><span className="css-label" data-label="نمایش درست در همه دستگاه‌ها" /></span>
          <span className="text-sm leading-[1.6] font-bold text-ink"><span className="css-label" data-label="طراحی Responsive" /></span>
        </span>
      </div>
    </div>
  );
}
