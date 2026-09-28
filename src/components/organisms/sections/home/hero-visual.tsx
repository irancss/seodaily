import { Dots, Icon } from "@/components/atoms";
import { cx, vars } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <span className={cx("block rounded-full", className)} />;
}

/** Skeleton of a website shown when no project picture has been uploaded yet. */
function SkeletonSite() {
  return (
    <div className="flex h-[250px] flex-col gap-4 bg-white p-4 sm:h-[300px] lg:h-[340px] lg:gap-5 lg:p-6">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="icon-gradient size-5 rounded-md shadow-none" />
          <Bar className="h-2.5 w-16 bg-line-strong" />
        </span>
        <span className="hidden items-center gap-3 sm:flex">
          <Bar className="h-2 w-9 bg-line" />
          <Bar className="h-2 w-9 bg-line" />
          <Bar className="h-2 w-9 bg-line" />
          <span className="block h-6 w-16 rounded-md bg-brand" />
        </span>
      </div>
      <div className="grid grow grid-cols-[1.1fr_1fr] items-center gap-5">
        <div className="flex flex-col gap-2.5">
          <Bar className="h-3.5 w-[90%] bg-ink/80" />
          <Bar className="h-3.5 w-[65%] bg-gradient-to-l from-brand to-brand-decorative" />
          <Bar className="mt-2 h-2 w-[95%] bg-line" />
          <Bar className="h-2 w-[80%] bg-line" />
          <span className="mt-3 flex gap-2">
            <span className="block h-7 w-20 rounded-md bg-brand" />
            <span className="block h-7 w-16 rounded-md border border-line-strong" />
          </span>
        </div>
        <div className="grid-bg relative h-full max-h-[170px] rounded-lg bg-soft" style={vars({ grid: "18px" })}>
          <span className="absolute right-1/2 bottom-4 flex h-16 w-24 translate-x-1/2 items-end gap-1.5 lg:h-20">
            {[40, 65, 50, 85, 100].map((h, i) => (
              <span key={i} className="grow rounded-t-sm bg-gradient-to-t from-brand to-brand-decorative" style={{ height: `${h}%` }} />
            ))}
          </span>
        </div>
      </div>
      <div className="hidden grid-cols-3 gap-3 sm:grid">
        {[0, 1, 2].map((i) => (
          <span key={i} className="flex h-14 items-center gap-2 rounded-lg border border-line bg-page px-3 lg:h-16">
            <span className="size-6 shrink-0 rounded-md bg-soft" />
            <span className="flex grow flex-col gap-1.5">
              <Bar className="h-1.5 w-[80%] bg-line-strong" />
              <Bar className="h-1.5 w-[55%] bg-line" />
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Home hero picture: a glass browser frame with floating status cards. */
export function HomeHeroVisual({ imageUrl }: { imageUrl?: string }) {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-[580px] pt-6 pb-6 lg:pt-4 lg:pb-10">
      <div className="frame-glass rounded-2xl p-2 lg:p-2.5">
        <div className="overflow-hidden rounded-xl bg-white">
          <div className="flex h-8 items-center gap-3 border-b border-line bg-page px-3 lg:h-9">
            <Dots size={8} />
            <span className="flex h-5 grow items-center gap-1.5 rounded-full border border-line bg-white px-2.5">
              <span className="size-2 shrink-0 rounded-full bg-success/60" />
              <span className="h-1.5 w-2/5 rounded-full bg-line-strong" />
            </span>
          </div>
          {imageUrl ? (
            <div className="relative h-[250px] sm:h-[300px] lg:h-[340px]">
              <img src={imageUrl} alt="" fetchPriority="high" className="absolute inset-0 size-full object-cover object-top" />
            </div>
          ) : (
            <SkeletonSite />
          )}
        </div>
      </div>

      {/* Organic traffic chart */}
      <div className="float-card float absolute top-0 -left-3 hidden w-[210px] p-4 sm:block lg:-left-4 min-[1440px]:-left-12" style={vars({ i: 0 })}>
        <div className="flex items-center justify-between gap-2 text-xs leading-[1.7]">
          <span className="font-semibold text-ink"><span className="css-label" data-label="ترافیک ارگانیک" /></span>
          <span className="flex items-center gap-1 font-bold text-success">
            <Icon name="trending-up" size={14} />
            <span className="css-label" data-label="رشد" />
          </span>
        </div>
        <svg viewBox="0 0 180 64" className="mt-2 h-14 w-full" fill="none">
          <defs>
            <linearGradient id="hero-line" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#06b6d4" />
              <stop offset="1" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="hero-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#2563eb" stopOpacity="0.18" />
              <stop offset="1" stopColor="#2563eb" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 58 C 25 54, 40 47, 62 44 S 98 34, 118 27 S 156 10, 180 5 L180 64 L0 64 Z" fill="url(#hero-area)" />
          <path
            d="M0 58 C 25 54, 40 47, 62 44 S 98 34, 118 27 S 156 10, 180 5"
            stroke="url(#hero-line)"
            strokeWidth="3"
            strokeLinecap="round"
            className="draw-line"
            style={vars({ len: 220 })}
          />
        </svg>
      </div>

      {/* Core Web Vitals */}
      <div className="float-card float absolute -right-3 bottom-20 hidden p-4 sm:block lg:-right-10" style={vars({ i: 1 })}>
        <p className="text-xs leading-[1.7] font-semibold text-ink" dir="ltr">
          <span className="css-label" data-label="Core Web Vitals" />
        </p>
        <div className="mt-2 flex gap-1.5" dir="ltr">
          {["LCP", "INP", "CLS"].map((k) => (
            <span key={k} className="flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-[11px] font-bold text-success">
              <span className="size-1.5 rounded-full bg-success" />
              <span className="css-label" data-label={k} />
            </span>
          ))}
        </div>
      </div>

      {/* Keyword ranking */}
      <div className="float-card float absolute bottom-0 left-8 hidden items-center gap-3 py-3 ps-3 pe-5 lg:flex" style={vars({ i: 2 })}>
        <span className="icon-gradient size-10 rounded-full">
          <Icon name="search" size={18} />
        </span>
        <span className="flex flex-col">
          <span className="text-xs leading-[1.7] text-muted"><span className="css-label" data-label="رتبه کلمات کلیدی" /></span>
          <span className="flex items-center gap-1 text-sm leading-[1.7] font-bold text-ink">
            <span className="css-label" data-label="رو به بهبود" />
            <Icon name="arrow-up" size={14} className="text-success" />
          </span>
        </span>
      </div>
    </div>
  );
}
