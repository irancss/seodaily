// Decorative skeleton illustrations from the design. All aria-hidden unless
// they carry a label. The website mockups are white "screens" meant to sit in
// a glass frame (`frame-glass`) on the dark page heroes.

import { Dots, Icon } from "@/components/atoms";

import { cx } from "@/lib/utils";

const LINE_TONES = {
  line: "bg-line",
  strong: "bg-line-strong",
  ink: "bg-ink/80",
  brand: "bg-brand",
  tint: "bg-brand/20",
  white: "bg-white",
  "white-soft": "bg-white/60",
  gradient: "bg-gradient-to-l from-brand to-brand-decorative",
};

/** Skeleton text line of the website mockups. */
function Line({ w, h = 6, tone = "line", className }: { w: string | number; h?: number; tone?: keyof typeof LINE_TONES; className?: string }) {
  return <span className={cx("block shrink-0 rounded-full", LINE_TONES[tone], className)} style={{ width: w, height: h }} />;
}

/** Window chrome of the mockups: dots and an address pill. */
/** Browser chrome for the mockups; the address bar is a plain shape (no fake URL text in the page). */
function WindowBar() {
  return (
    <div className="flex h-8 shrink-0 items-center gap-3 border-b border-line bg-page px-3 lg:h-9">
      <Dots size={8} />
      <span className="flex h-5 min-w-0 grow items-center gap-1.5 rounded-full border border-line bg-white px-2.5">
        <span className="size-2 shrink-0 rounded-full bg-success/60" />
        <span className="h-1.5 w-2/5 rounded-full bg-line-strong" />
      </span>
    </div>
  );
}

/** Stylised photo: a sun over two hills. */
function PictureBlock({ className }: { className?: string }) {
  return (
    <span className={cx("relative block overflow-hidden rounded-md bg-gradient-to-b from-sky-100 to-white", className)}>
      <span className="absolute top-[16%] left-[20%] size-4 rounded-full bg-brand-decorative/70 lg:size-5" />
      <span className="absolute inset-x-0 bottom-0 h-[64%] bg-brand/25 [clip-path:polygon(0_100%,0_58%,28%_18%,56%_62%,74%_40%,100%_72%,100%_100%)]" />
      <span className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-l from-brand to-brand-decorative [clip-path:polygon(0_100%,0_72%,24%_42%,50%_82%,74%_30%,100%_66%,100%_100%)]" />
    </span>
  );
}

/** A company website (menu, hero, feature cards): the web design half of the services hero. */
export function DesignFrame() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-xl bg-white">
      <WindowBar />
      <div className="flex flex-col gap-3 p-3.5 lg:gap-4 lg:p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="icon-gradient size-5 rounded-md shadow-none" />
            <Line w={52} h={8} tone="strong" />
          </span>
          <span className="flex items-center gap-2.5">
            <Line w={24} className="hidden sm:block" />
            <Line w={24} className="hidden sm:block" />
            <Line w={24} className="hidden sm:block" />
            <span className="block h-5 w-12 rounded-md bg-brand" />
          </span>
        </div>
        <div className="grid grid-cols-[1.15fr_1fr] items-center gap-4 rounded-lg bg-soft p-3.5 lg:p-4">
          <div className="flex flex-col gap-2">
            <Line w="94%" h={9} tone="ink" />
            <Line w="62%" h={9} tone="gradient" />
            <Line w="96%" h={5} className="mt-1" />
            <Line w="78%" h={5} />
            <span className="mt-2 flex gap-1.5">
              <span className="block h-6 w-16 rounded-md bg-brand" />
              <span className="block h-6 w-12 rounded-md border border-line-strong bg-white" />
            </span>
          </div>
          <PictureBlock className="h-24 lg:h-28" />
        </div>
        <div className="grid grid-cols-3 gap-2.5 lg:gap-3">
          {[0, 1, 2].map((i) => (
            <span key={i} className="flex flex-col gap-1.5 rounded-lg border border-line p-2.5">
              <span className="mb-1 flex size-5 items-center justify-center rounded-md bg-soft">
                <span className="size-2 rounded-full bg-brand/60" />
              </span>
              <Line w="85%" h={5} tone="strong" />
              <Line w="60%" h={5} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Search results with the site's result on top: the SEO half of the services hero. */
export function SeoFrame() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-xl bg-white">
      <WindowBar />
      <div className="flex flex-col gap-3 p-3.5 lg:p-4">
        <div className="flex h-9 items-center gap-2.5 rounded-full border border-line px-3.5 shadow-sm">
          <Icon name="search" size={16} className="text-brand" />
          <Line w="46%" h={7} tone="strong" />
        </div>
        <div className="flex flex-col gap-1.5 rounded-lg border border-brand/20 bg-soft p-3">
          <span className="flex items-center gap-1.5">
            <span className="icon-gradient size-3.5 rounded-full shadow-none" />
            <Line w="28%" h={5} tone="strong" />
          </span>
          <Line w="70%" h={8} tone="gradient" />
          <Line w="92%" h={5} />
        </div>
        {["62%", "50%"].map((w) => (
          <div key={w} className="flex flex-col gap-1.5 px-3">
            <span className="flex items-center gap-1.5">
              <span className="size-3.5 rounded-full bg-line" />
              <Line w="24%" h={5} />
            </span>
            <Line w={w} h={8} tone="strong" />
            <Line w="88%" h={5} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** A question of the consultation form with one answer picked (services page, «not sure yet» note). */
export function FormSketch({ picked }: { picked?: string }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2 rounded-xl border border-line bg-white p-3.5 shadow-md lg:p-4">
      <span className="flex items-center justify-between px-0.5 pb-0.5">
        <Line w={88} h={6} tone="strong" />
        <Dots size={6} />
      </span>
      <span className="flex h-9 items-center gap-2.5 rounded-lg border border-line px-3">
        <span className="size-3.5 shrink-0 rounded-full border-2 border-line-strong" />
        <Line w="52%" h={6} />
      </span>
      <span className="flex h-9 items-center gap-2.5 rounded-lg border border-brand/40 bg-soft px-3 text-[13px] leading-none font-semibold whitespace-nowrap text-ink">
        <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full border-2 border-brand">
          <span className="size-1.5 rounded-full bg-brand" />
        </span>
        {picked ? <span className="css-label" data-label={picked} /> : <Line w="50%" h={6} tone="tint" />}
      </span>
    </div>
  );
}

/** Web design hero: the same shop on a desktop and a phone, in frames made for the dark hero. */
export function ResponsiveFrames() {
  return (
    <div aria-hidden="true" className="relative pb-12 sm:pb-14">
      <div className="frame-glass rounded-2xl p-2 lg:p-2.5">
        <div className="overflow-hidden rounded-xl bg-white">
          <WindowBar />
          <div className="flex flex-col gap-3 p-3.5 lg:gap-4 lg:p-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="icon-gradient size-5 rounded-full shadow-none" />
                <Line w={48} h={8} tone="strong" />
              </span>
              <span className="flex items-center gap-2.5">
                <Line w={24} className="hidden sm:block" />
                <Line w={24} className="hidden sm:block" />
                <Line w={24} className="hidden sm:block" />
                <span className="flex size-6 items-center justify-center rounded-full bg-soft text-brand">
                  <Icon name="bag" size={12} />
                </span>
              </span>
            </div>
            <div className="relative flex h-28 flex-col justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-l from-brand to-brand-decorative p-4 lg:h-36 lg:gap-2.5 lg:p-5">
              <span className="absolute -top-10 -left-8 size-32 rounded-full bg-white/10" />
              <span className="absolute -bottom-14 left-24 size-28 rounded-full bg-white/10" />
              <Line w="46%" h={9} tone="white" />
              <Line w="30%" h={9} tone="white-soft" />
              <span className="relative mt-2 block h-7 w-20 rounded-md bg-white shadow-sm">
                {/* The visitor clicks the call to action. */}
                <span className="absolute top-1/2 left-5 flex -translate-y-1/2">
                  <span className="live-dot" />
                </span>
                <Icon name="cursor" size={20} className="absolute top-3 left-5 fill-white text-ink drop-shadow" />
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 lg:gap-3">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="flex flex-col gap-1.5 rounded-lg border border-line p-1.5 lg:p-2">
                  <span className={cx("block h-10 rounded-md lg:h-14", i % 2 ? "bg-soft" : "bg-sky-50")} />
                  <Line w="80%" h={5} tone="strong" />
                  <Line w="46%" h={5} tone="tint" />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-2 w-[27%] max-w-[148px] rounded-[22px] bg-ink p-1.5 shadow-2xl ring-1 ring-white/20 sm:-left-4 lg:rounded-[28px] lg:p-2">
        <div className="flex aspect-[9/17] flex-col gap-2 overflow-hidden rounded-[17px] bg-white p-2 lg:rounded-[21px] lg:p-2.5">
          <span className="mx-auto block h-1.5 w-8 shrink-0 rounded-full bg-line" />
          <span className="flex items-center justify-between">
            <span className="icon-gradient size-3.5 rounded-full shadow-none" />
            <span className="flex flex-col gap-0.5">
              <Line w={12} h={2} tone="strong" />
              <Line w={12} h={2} tone="strong" />
            </span>
          </span>
          <span className="flex flex-col gap-1 rounded-md bg-gradient-to-l from-brand to-brand-decorative p-2">
            <Line w="80%" h={5} tone="white" />
            <Line w="55%" h={5} tone="white-soft" />
            <span className="mt-1 block h-3.5 w-10 rounded-sm bg-white" />
          </span>
          <span className="grid grid-cols-2 gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={cx("block h-9 rounded-md lg:h-11", i % 2 ? "bg-sky-50" : "bg-soft")} />
            ))}
          </span>
          <Line w="70%" h={4} tone="strong" />
          <Line w="50%" h={4} />
        </div>
      </div>
    </div>
  );
}

/** SEO hero: a search results page with the site's result highlighted. */
export function SerpMockup() {
  return (
    <div role="img" aria-label="نمای نمادین یک صفحه نتایج جست‌وجو" className="overflow-hidden rounded-xl bg-white">
      <div aria-hidden="true">
        <WindowBar />
        <div className="flex flex-col gap-3 p-4 lg:gap-3.5 lg:p-5">
          <div className="flex h-10 items-center gap-3 rounded-full border border-line px-4 shadow-sm lg:h-11">
            <Icon name="search" size={18} className="text-brand" />
            <Line w="44%" h={8} tone="strong" />
          </div>
          <div className="flex items-center gap-4 border-b border-line px-1 pb-2.5">
            <span className="relative">
              <Line w={36} h={6} tone="brand" />
              <span className="absolute inset-x-0 -bottom-[11px] h-0.5 rounded-full bg-brand" />
            </span>
            <Line w={30} />
            <Line w={30} />
            <Line w={30} />
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-brand/25 bg-soft p-3.5 shadow-sm">
            <span className="flex items-center gap-2">
              <span className="icon-gradient size-5 rounded-full shadow-none" />
              <span className="flex flex-col gap-1">
                <Line w={64} h={5} tone="strong" />
                <Line w={92} h={4} />
              </span>
            </span>
            <Line w="74%" h={10} tone="gradient" />
            <Line w="94%" h={5} />
            <Line w="80%" h={5} />
            <span className="mt-1 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="flex h-6 items-center rounded-md border border-line bg-white px-2">
                  <Line w="70%" h={4} tone="tint" />
                </span>
              ))}
            </span>
          </div>
          {["58%", "50%"].map((w, i) => (
            <div key={w} className={cx("flex flex-col gap-2 px-3.5", i === 1 && "hidden sm:flex")}>
              <span className="flex items-center gap-2">
                <span className="size-5 rounded-full bg-line" />
                <Line w={72} h={5} />
              </span>
              <Line w={w} h={9} tone="strong" />
              <Line w="90%" h={5} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
