import { Icon } from "@/components/atoms";
import { SerpMockup } from "@/components/organisms/illustrations";
import { vars } from "@/lib/utils";

const CHECKS = ["ایندکس‌پذیری صفحات", "سرعت صفحات", "داده‌های ساختاریافته"];
/** Satellite topics around the pillar page of the cluster card (x, y). */
const TOPICS: [number, number][] = [
  [22, 16],
  [22, 70],
  [146, 16],
  [146, 70],
];

/** SEO hero: a results page in a glass frame, with a technical check card and a topic cluster card. */
export function SeoHeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[560px] py-6 lg:py-10">
      <div className="frame-glass rounded-2xl p-2 lg:p-2.5">
        <SerpMockup />
      </div>

      {/* Technical check of the site. */}
      <div
        aria-hidden="true"
        className="float-card float absolute top-0 -left-3 hidden w-[214px] p-4 sm:block xl:-left-12"
        style={vars({ i: 0 })}
      >
        <div className="flex items-center justify-between gap-2 text-xs leading-[1.7] font-semibold text-ink">
          <span className="css-label" data-label="بررسی فنی سایت" />
          <Icon name="shield" size={15} className="text-brand" />
        </div>
        <ul className="mt-2.5 flex flex-col gap-2">
          {CHECKS.map((label) => (
            <li key={label} className="flex items-center justify-between gap-2 text-xs leading-[1.7] text-ink-2">
              <span className="css-label" data-label={label} />
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success-bg text-success">
                <Icon name="check" size={12} />
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* A pillar page with its topic cluster. */}
      <div
        aria-hidden="true"
        className="float-card float absolute -right-3 bottom-0 hidden w-[196px] p-4 sm:block lg:bottom-4 xl:-right-12"
        style={vars({ i: 1 })}
      >
        <div className="flex items-center justify-between gap-2 text-xs leading-[1.7] font-semibold text-ink">
          <span className="css-label" data-label="خوشه موضوعی" />
          <Icon name="sitemap" size={15} className="text-brand" />
        </div>
        <svg viewBox="0 0 168 86" className="mt-2 h-[86px] w-full" fill="none">
          <defs>
            <linearGradient id="seo-hub" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#2563eb" />
              <stop offset="1" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          {TOPICS.map(([x, y]) => (
            <path
              key={`${x}-${y}`}
              d={`M84 43 L${x} ${y}`}
              stroke="#2563eb"
              strokeOpacity="0.4"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          ))}
          {TOPICS.map(([x, y]) => (
            <circle key={`c-${x}-${y}`} cx={x} cy={y} r="8" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" />
          ))}
          <circle cx="84" cy="43" r="16" fill="url(#seo-hub)" />
          <path d="M78 43h12M84 37v12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
