import { Dots, Icon } from "@/components/atoms";
import { cx, vars } from "@/lib/utils";
import { SYSTEM_PARTS } from "@/modules/pages/about-content";

const LABEL = "طراحی، محتوا، ساختار فنی و مسیر کاربر به‌عنوان اجزای یک سیستم واحد حول وب‌سایت";

// Parts sit on the orbit at 45° steps, clockwise from the top right (viewBox 400×400, radius 160).
const SPOTS = [
  { x: 313, y: 87, className: "top-[21.75%] left-[78.25%]" },
  { x: 313, y: 313, className: "top-[78.25%] left-[78.25%]" },
  { x: 87, y: 313, className: "top-[78.25%] left-[21.75%]" },
  { x: 87, y: 87, className: "top-[21.75%] left-[21.75%]" },
];

function Bar({ className }: { className?: string }) {
  return <span className={cx("block rounded-full", className)} />;
}

/**
 * About hero picture for the dark surface: the website in the middle of an
 * orbit, joined to the four parts that have to work together.
 */
export function SystemOrbit() {
  return (
    <div role="img" aria-label={LABEL} className="relative mx-auto aspect-square w-full max-w-[340px] sm:max-w-[440px] lg:max-w-[480px]">
      <div aria-hidden="true" className="absolute inset-0">
        {/* Glow and rings */}
        <span className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgb(37_99_235/0.4),rgb(37_99_235/0)_70%)]" />
        <span className="absolute inset-[10%] rounded-full border border-white/10" />
        <span className="absolute inset-[27%] rounded-full border border-dashed border-white/15" />

        <svg viewBox="0 0 400 400" fill="none" className="absolute inset-0 size-full">
          <defs>
            <linearGradient id="orbit-line" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#22d3ee" />
              <stop offset="1" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          {SPOTS.map((spot) => (
            <path
              key={`${spot.x}-${spot.y}`}
              d={`M200 200 L${spot.x} ${spot.y}`}
              stroke="url(#orbit-line)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeOpacity="0.7"
              className="draw-line"
              style={vars({ len: 170 })}
            />
          ))}
          {[
            [200, 40],
            [360, 200],
            [200, 360],
            [40, 200],
          ].map(([cx_, cy]) => (
            <circle key={`${cx_}-${cy}`} cx={cx_} cy={cy} r="3.5" fill="#22d3ee" fillOpacity="0.8" />
          ))}
        </svg>

        {/* The website */}
        <div className="frame-glass absolute top-1/2 left-1/2 w-[44%] -translate-x-1/2 -translate-y-1/2 rounded-xl p-1 lg:p-1.5">
          <div className="overflow-hidden rounded-lg bg-white">
            <div className="flex h-5 items-center border-b border-line bg-page px-2 lg:h-6">
              <Dots size={6} />
            </div>
            <div className="flex flex-col gap-1.5 p-2.5 lg:gap-2 lg:p-3">
              <span className="flex items-center justify-between">
                <span className="icon-gradient size-3.5 rounded-[4px] shadow-none lg:size-4" />
                <span className="flex gap-1">
                  <Bar className="h-1 w-3 bg-line lg:w-4" />
                  <Bar className="h-1 w-3 bg-line lg:w-4" />
                  <Bar className="h-1 w-3 bg-line lg:w-4" />
                </span>
              </span>
              <Bar className="mt-1 h-2 w-[85%] bg-ink/75" />
              <Bar className="h-2 w-[55%] bg-gradient-to-l from-brand to-brand-decorative" />
              <Bar className="h-1 w-[90%] bg-line-strong" />
              <span className="mt-1 flex gap-1.5">
                <span className="block h-3 w-9 rounded-[4px] bg-brand lg:h-3.5 lg:w-11" />
                <span className="block h-3 w-7 rounded-[4px] border border-line-strong lg:h-3.5 lg:w-9" />
              </span>
            </div>
          </div>
        </div>

        {/* The four parts */}
        {SYSTEM_PARTS.map((part, i) => (
          <span
            key={part.title}
            className={cx("absolute -translate-x-1/2 -translate-y-1/2", SPOTS[i].className)}
          >
            <span className="float flex flex-col items-center gap-1.5 lg:gap-2" style={vars({ i })}>
              <span className="icon-gradient size-10 rounded-[14px] lg:size-12">
                <Icon name={part.icon} size={20} />
              </span>
              <span className="rounded-full border border-white/15 bg-slate-900/70 px-3 py-0.5 text-xs leading-[1.8] font-semibold whitespace-nowrap text-white backdrop-blur lg:text-sm">
                {part.title}
              </span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
