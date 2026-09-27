// Decorative skeleton illustrations from the design. All aria-hidden unless
// they carry a label.

import { Icon } from "@/components/icon";

import { BrowserFrame, cx, Dots, PlaceholderChip } from "./ui";

function Bar({ w, h = 8, strong = false, brand = false, className }: { w: string | number; h?: number; strong?: boolean; brand?: boolean; className?: string }) {
  return (
    <span
      className={cx(
        "block shrink-0 rounded-full",
        brand ? "bg-brand/25" : strong ? "bg-line-strong" : "bg-line",
        className,
      )}
      style={{ width: w, height: h }}
    />
  );
}

function GridBox({ className, size = 24 }: { className?: string; size?: number }) {
  return <span className={cx("grid-bg block bg-soft", className)} style={{ ["--grid" as string]: `${size}px` }} />;
}

/** Home hero: desktop browser with an overlapping phone. */
export function HomeHeroMockup({ imageUrl }: { imageUrl?: string }) {
  return (
    <div className="relative lg:pb-10" aria-hidden={imageUrl ? undefined : true}>
      <BrowserFrame>
        {imageUrl ? (
          <div className="relative h-[220px] lg:h-[396px]">
            <img src={imageUrl} alt="" className="absolute inset-0 size-full object-cover object-top" />
          </div>
        ) : (
          <div className="relative flex h-[220px] flex-col gap-5 bg-white p-4 lg:h-[396px] lg:p-6">
            <div className="flex items-center justify-between">
              <Bar w={88} h={12} strong />
              <span className="hidden gap-3 sm:flex">
                <Bar w={40} /> <Bar w={40} /> <Bar w={40} />
                <span className="block h-5 w-16 rounded-sm bg-brand/25" />
              </span>
            </div>
            <div className="grid grid-cols-2 items-center gap-6">
              <div className="flex flex-col gap-3">
                <Bar w="90%" h={16} strong />
                <Bar w="70%" h={16} strong />
                <Bar w="95%" className="mt-2" />
                <Bar w="80%" />
                <span className="mt-2 block h-7 w-24 rounded-sm bg-brand/25" />
              </div>
              <GridBox className="h-[120px] rounded-md lg:h-[170px]" />
            </div>
            <div className="hidden grid-cols-3 gap-4 lg:grid">
              <span className="h-24 rounded-md border border-line bg-page" />
              <span className="h-24 rounded-md border border-line bg-page" />
              <span className="h-24 rounded-md border border-line bg-page" />
            </div>
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <PlaceholderChip icon>جای تصویر پروژه واقعی</PlaceholderChip>
            </span>
          </div>
        )}
      </BrowserFrame>
      <div
        aria-hidden="true"
        className="absolute bottom-0 -left-8 hidden h-[288px] w-[148px] rounded-xl border border-line bg-white p-2 shadow-md lg:block"
      >
        <div className="flex h-full flex-col gap-2.5 rounded-[16px] border border-line bg-page px-3 py-3.5">
          <Bar w={48} strong />
          <GridBox className="mt-1.5 h-12 w-full rounded-sm lg:h-[72px]" size={12} />
          <Bar w="90%" strong />
          <Bar w="70%" h={6} />
          <Bar w="80%" h={6} />
          <span className="mt-auto block h-6 w-full rounded-sm bg-brand/25" />
        </div>
      </div>
    </div>
  );
}

/** Services page, web design block. */
export function DesignFrame() {
  return (
    <BrowserFrame shadow="sm" className="w-full">
      <div className="grid-bg relative flex h-[300px] flex-col gap-5 bg-page p-6 lg:h-[480px]" style={{ ["--grid" as string]: "32px" }}>
        <div aria-hidden="true" className="flex items-center justify-between">
          <Bar w={88} h={12} strong />
          <span className="flex gap-3"><Bar w={40} strong /><Bar w={40} strong /><Bar w={40} strong /></span>
        </div>
        <div aria-hidden="true" className="flex h-[140px] flex-col gap-3 rounded-md border border-line bg-white p-7 lg:h-[200px]">
          <Bar w="60%" h={16} strong />
          <Bar w="45%" h={16} strong />
          <Bar w="75%" className="mt-2" />
          <Bar w="65%" className="hidden lg:block" />
        </div>
        <div aria-hidden="true" className="grid grow grid-cols-3 gap-4">
          <span className="rounded-md border border-line bg-white" />
          <span className="rounded-md border border-line bg-white" />
          <span className="rounded-md border border-line bg-white" />
        </div>
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <PlaceholderChip icon>جای تصویر نمونه</PlaceholderChip>
        </span>
      </div>
    </BrowserFrame>
  );
}

/** Services page, SEO block: abstract search results. */
export function SeoFrame() {
  return (
    <BrowserFrame shadow="sm" className="w-full">
      <div className="grid-bg relative flex h-[300px] flex-col gap-4 bg-soft p-6 lg:h-[480px]" style={{ ["--grid" as string]: "32px" }}>
        <div aria-hidden="true" className="flex h-12 items-center gap-3 rounded-full border border-line bg-white px-5 text-muted">
          <Icon name="search" size={18} />
          <Bar w="40%" strong />
        </div>
        {[0.65, 0.55, 0.6].map((w, i) => (
          <div key={i} aria-hidden="true" className={cx("flex flex-col gap-2.5 rounded-md border border-line bg-white p-5", i === 2 && "hidden lg:flex")}>
            <Bar w="30%" h={6} />
            <Bar w={`${w * 100}%`} h={12} brand={i === 0} strong={i !== 0} />
            <Bar w="90%" h={6} />
          </div>
        ))}
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <PlaceholderChip icon>جای تصویر نمونه</PlaceholderChip>
        </span>
      </div>
    </BrowserFrame>
  );
}

/** Services CTA: a sketch of the consultation form. */
export function FormSketch() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-md border border-line bg-page">
      <div className="flex h-7 items-center gap-1.5 border-b border-line px-2.5 lg:h-9 lg:px-3.5">
        <Dots size={8} />
      </div>
      {/* Mobile shows a short strip: one field and the button. */}
      <div className="grid-bg flex h-24 flex-col gap-2 p-4 [--grid:16px] lg:h-60 lg:gap-2.5 lg:p-7 lg:[--grid:24px]">
        <Bar w={72} strong className="hidden lg:block" />
        <span className="block h-7 rounded-sm border border-line bg-white lg:h-9" />
        <Bar w={96} strong className="mt-1.5 hidden lg:block" />
        <span className="hidden h-9 rounded-sm border border-line bg-white lg:block" />
        <span className="mt-auto block h-7 w-24 rounded-sm bg-brand/25 lg:h-9 lg:w-[120px]" />
      </div>
    </div>
  );
}

/** Web design hero: desktop + mobile frames on a grid panel. */
export function ResponsiveFrames() {
  return (
    <div className="grid-bg relative rounded-xl border border-line bg-soft p-4 [--grid:24px] lg:p-8 lg:[--grid:32px]">
      <div className="flex items-end gap-3 lg:gap-6">
        <div className="relative min-w-0 grow overflow-hidden rounded-md border border-line bg-white shadow-md">
          <div className="flex h-7 items-center gap-3 border-b border-line bg-page px-2.5 lg:h-9 lg:px-3">
            <Dots size={8} />
            <div dir="ltr" className="hidden h-[22px] grow items-center rounded-full border border-line bg-white px-2.5 text-sm text-muted sm:flex">
              www.example.com
            </div>
          </div>
          <div aria-hidden="true" className="flex h-[150px] flex-col gap-2.5 p-3 lg:h-[280px] lg:gap-4 lg:p-5">
            <div className="flex items-center justify-between">
              <Bar w={72} h={10} strong />
              <span className="hidden gap-2.5 sm:flex"><Bar w={32} h={6} /><Bar w={32} h={6} /><Bar w={32} h={6} /></span>
            </div>
            <div className="grid grid-cols-2 items-center gap-5">
              <div className="flex flex-col gap-2.5">
                <Bar w="90%" h={12} strong />
                <Bar w="65%" h={12} strong />
                <Bar w="95%" h={6} className="mt-1.5" />
                <span className="mt-1.5 block h-[22px] w-20 rounded-sm bg-brand/25" />
              </div>
              <GridBox className="h-14 rounded-sm lg:h-[120px]" size={20} />
            </div>
            <div className="grid grow grid-cols-3 gap-3">
              <span className="rounded-sm border border-line bg-page" />
              <span className="rounded-sm border border-line bg-page" />
              <span className="rounded-sm border border-line bg-page" />
            </div>
          </div>
          <span className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2">
            <PlaceholderChip icon>جای تصویر پروژه واقعی</PlaceholderChip>
          </span>
        </div>
        <div aria-hidden="true" className="h-[176px] w-[88px] shrink-0 rounded-[16px] border border-line bg-white p-[5px] shadow-md lg:h-[288px] lg:w-36 lg:rounded-xl lg:p-2">
          <div className="flex h-full flex-col gap-1.5 rounded-[12px] border border-line bg-white px-1.5 py-2 lg:gap-2 lg:rounded-[16px] lg:px-2.5 lg:py-3">
            <span className="flex items-center justify-between"><Bar w={40} strong /><span className="block h-2 w-3.5 rounded-[2px] bg-line" /></span>
            <Bar w="90%" strong className="mt-1" />
            <Bar w="60%" strong />
            <Bar w="85%" h={5} />
            <span className="block h-[18px] w-full rounded-[6px] bg-brand/25" />
            <GridBox className="h-10 w-full rounded-sm lg:h-16" size={12} />
            <span className="block w-full grow rounded-sm border border-line bg-page" />
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-3 text-sm leading-[1.7] font-medium text-muted lg:mt-4 lg:gap-6">
        <span className="inline-flex grow items-center justify-center gap-2"><Icon name="desktop" size={16} />نمای دسکتاپ</span>
        <span className="inline-flex w-[88px] shrink-0 items-center justify-center gap-2 lg:w-36"><Icon name="mobile" size={16} />نمای موبایل</span>
      </div>
    </div>
  );
}

/** SEO hero: abstract search results page. */
export function SerpMockup() {
  return (
    <div role="img" aria-label="نمای نمادین یک صفحه نتایج جست‌وجو" className="overflow-hidden rounded-md border border-line bg-white shadow-md">
      <div aria-hidden="true" className="flex h-9 items-center gap-2.5 border-b border-line bg-page px-3 lg:h-11 lg:gap-4 lg:px-4">
        <Dots />
        <div className="flex h-7 grow items-center rounded-full border border-line bg-white px-3"><Bar w="40%" /></div>
      </div>
      <div aria-hidden="true" className="flex flex-col gap-3 p-4 lg:gap-4 lg:p-6">
        <div className="flex h-11 items-center gap-3 rounded-full border border-line bg-white px-4 text-muted">
          <Icon name="search" size={18} />
          <Bar w="42%" h={10} strong />
        </div>
        <div className="flex gap-4 border-b border-line px-1 pb-3">
          <span className="block h-2 w-11 rounded-full bg-brand/30" />
          <Bar w={36} /><Bar w={36} /><Bar w={36} />
        </div>
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cx(
                "flex flex-col gap-2 rounded-md border px-4 py-3",
                i === 1 ? "border-line bg-soft" : "border-transparent",
                i === 3 && "hidden lg:flex",
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cx("block size-4 rounded-full", i === 1 ? "bg-brand/30" : "bg-line")} />
                <Bar w="32%" strong={i === 1} />
              </div>
              {i === 1 ? <span className="block h-3 w-[64%] rounded-full bg-brand/35" /> : <Bar w="58%" h={12} strong />}
              <Bar w="90%" h={6} />
              <Bar w="75%" h={6} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DiagramLabel({ children }: { children: string }) {
  return (
    <span className="flex h-11 items-center justify-center gap-2 rounded-full border border-line bg-white text-sm leading-[1.7] font-medium text-ink shadow-sm">
      <span className="size-2 rounded-full bg-brand" />
      {children}
    </span>
  );
}

/** About hero on mobile: the four parts in a 2×2 layout around a website. */
function SystemDiagramCompact({ label }: { label: string }) {
  return (
    <div role="img" aria-label={label} className="relative h-[268px] overflow-hidden rounded-xl border border-line bg-white lg:hidden">
      <div aria-hidden="true" className="grid-bg absolute inset-0 opacity-60 [--grid:20px]" />
      <svg aria-hidden="true" viewBox="0 0 348 266" preserveAspectRatio="none" fill="none" className="absolute inset-0 size-full">
        {["M174 133L94 42", "M174 133L254 42", "M174 133L94 224", "M174 133L254 224"].map((d) => (
          <path key={d} d={d} stroke="#2563eb" strokeOpacity="0.35" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div aria-hidden="true" className="absolute inset-x-5 top-5 grid grid-cols-2 gap-3">
        <DiagramLabel>طراحی</DiagramLabel>
        <DiagramLabel>محتوا</DiagramLabel>
      </div>
      <div aria-hidden="true" className="absolute top-1/2 left-1/2 h-24 w-[150px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-md border border-line bg-white shadow-md">
        <div className="flex h-[22px] items-center border-b border-line bg-page px-2"><Dots size={6} /></div>
        <div className="flex flex-col gap-1.5 p-2.5">
          <Bar w="70%" h={7} strong />
          <Bar w="90%" h={5} />
          <span className="mt-0.5 block h-3.5 w-11 rounded-sm bg-brand/25" />
        </div>
      </div>
      <div aria-hidden="true" className="absolute inset-x-5 bottom-5 grid grid-cols-2 gap-3">
        <DiagramLabel>ساختار فنی</DiagramLabel>
        <DiagramLabel>مسیر کاربر</DiagramLabel>
      </div>
    </div>
  );
}

const DIAGRAM_LABEL = "طراحی، محتوا، ساختار فنی و مسیر کاربر به‌عنوان اجزای یک سیستم واحد حول وب‌سایت";

/** About hero: four parts around a website. */
export function SystemDiagram() {
  return (
    <>
      <SystemDiagramCompact label={DIAGRAM_LABEL} />
      <SystemDiagramFull />
    </>
  );
}

function SystemDiagramFull() {
  const nodes = [
    { label: "طراحی", top: "12%", left: "50%" },
    { label: "محتوا", top: "50%", left: "83.4%" },
    { label: "ساختار فنی", top: "87.5%", left: "50%" },
    { label: "مسیر کاربر", top: "50%", left: "16.6%" },
  ];
  return (
    <div
      role="img"
      aria-label={DIAGRAM_LABEL}
      className="relative hidden h-[400px] overflow-hidden rounded-xl border border-line bg-white lg:block"
    >
      <div aria-hidden="true" className="grid-bg absolute inset-0 opacity-60" style={{ ["--grid" as string]: "24px" }} />
      <svg aria-hidden="true" viewBox="0 0 494 398" preserveAspectRatio="none" fill="none" className="absolute inset-0 size-full">
        <ellipse cx="247" cy="199" rx="165" ry="151" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
        {["M247 199V48", "M247 199V350", "M247 199H412", "M247 199H82"].map((d) => (
          <path key={d} d={d} stroke="#2563eb" strokeOpacity="0.35" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div aria-hidden="true" className="absolute top-1/2 left-1/2 h-24 w-36 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-md border border-line bg-white shadow-md lg:h-32 lg:w-[184px]">
        <div className="flex h-[26px] items-center border-b border-line bg-page px-2.5"><Dots size={7} /></div>
        <div className="flex flex-col gap-2 p-3">
          <Bar w="70%" strong />
          <Bar w="90%" h={6} />
          <Bar w="60%" h={6} className="hidden lg:block" />
          <span className="mt-1 block h-4 w-14 rounded-sm bg-brand/25" />
        </div>
      </div>
      {nodes.map((n) => (
        <span
          key={n.label}
          aria-hidden="true"
          className="absolute inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm leading-[1.7] font-medium whitespace-nowrap text-ink shadow-sm lg:px-4 lg:py-2"
          style={{ top: n.top, left: n.left }}
        >
          <span className="size-2 rounded-full bg-brand" />
          {n.label}
        </span>
      ))}
    </div>
  );
}
