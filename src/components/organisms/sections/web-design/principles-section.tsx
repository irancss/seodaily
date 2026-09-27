import { Fragment, type ReactNode } from "react";

import { Icon, IconTile } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import { cx, vars } from "@/lib/utils";
import { PRINCIPLES } from "@/modules/pages/web-design-content";

/** A visitor's path through three pages ending at the contact step. */
function FlowVisual() {
  const steps = ["home", "layers", "message"];
  return (
    <div className="grid-bg relative flex items-center rounded-xl bg-soft px-4 py-6 lg:px-6" style={vars({ grid: "20px" })}>
      {steps.map((name, i) => (
        <Fragment key={name}>
          {i > 0 && <span className="mx-2 h-0 grow border-t-2 border-dashed border-brand/35" />}
          <span className="flex flex-col items-center gap-2">
            <span
              className={cx(
                "flex size-11 items-center justify-center rounded-xl lg:size-12",
                i === steps.length - 1 ? "icon-gradient" : "bg-white text-brand shadow-sm ring-1 ring-line",
              )}
            >
              <Icon name={name} size={20} />
            </span>
            <span className="block h-1.5 w-9 rounded-full bg-line-strong" />
          </span>
        </Fragment>
      ))}
      <Icon name="cursor" size={22} className="absolute bottom-4 left-5 fill-white text-ink drop-shadow lg:left-7" />
    </div>
  );
}

/** A small page editor: toolbar, text lines and a picture. */
function EditorVisual() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-line bg-page px-3 py-2">
        {["pen", "image", "indent", "copy"].map((name) => (
          <span key={name} className="flex size-7 items-center justify-center rounded-md bg-white text-ink-2 ring-1 ring-line">
            <Icon name={name} size={14} />
          </span>
        ))}
        <span className="ms-auto block h-7 w-16 rounded-md bg-brand" />
      </div>
      <div className="flex gap-3 p-3.5 lg:p-4">
        <div className="flex grow flex-col gap-2">
          <span className="block h-2.5 w-[70%] rounded-full bg-ink/80" />
          <span className="block h-1.5 w-full rounded-full bg-line" />
          <span className="block h-1.5 w-[92%] rounded-full bg-line" />
          <span className="flex items-center gap-1">
            <span className="block h-1.5 w-[55%] rounded-full bg-line" />
            <span className="block h-3.5 w-0.5 rounded-full bg-brand" />
          </span>
        </div>
        <span className="relative block w-20 shrink-0 overflow-hidden rounded-lg bg-gradient-to-b from-sky-100 to-white lg:w-24">
          <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-l from-brand to-brand-decorative [clip-path:polygon(0_100%,0_60%,30%_20%,60%_70%,100%_30%,100%_100%)]" />
        </span>
      </div>
    </div>
  );
}

/** Speed gauge drawn while the tile scrolls in (no numbers: it is only a symbol). */
function GaugeVisual() {
  return (
    <svg viewBox="0 0 100 58" className="h-auto w-28 lg:w-32" fill="none">
      <defs>
        <linearGradient id="wd-gauge" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#06b6d4" />
          <stop offset="1" stopColor="#60a5fa" />
        </linearGradient>
      </defs>
      <path d="M10 50 A40 40 0 0 1 90 50" stroke="rgb(255 255 255 / 0.12)" strokeWidth="8" strokeLinecap="round" />
      <path
        d="M10 50 A40 40 0 0 1 85.64 31.84"
        stroke="url(#wd-gauge)"
        strokeWidth="8"
        strokeLinecap="round"
        className="draw-line"
        style={vars({ len: 110 })}
      />
      <circle cx="50" cy="50" r="5" fill="#fff" />
      <path d="M50 50 L78 30" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

type Tile = { icon: string; title: string; body: string };

function PrincipleTile({ tile, wide, visual, i }: { tile: Tile; wide?: boolean; visual?: ReactNode; i: number }) {
  return (
    <li className={cx("reveal", wide && "lg:col-span-2")} style={vars({ i })}>
      <div
        className={cx(
          "card-fancy flex h-full flex-col rounded-xl p-6 lg:rounded-2xl lg:p-8",
          wide && "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center lg:gap-8",
        )}
      >
        <div>
          <IconTile name={tile.icon} tone="gradient" className="size-12 rounded-[14px] lg:size-14" iconSize={26} />
          <h3 className="t-h3 mt-5 lg:mt-6">{tile.title}</h3>
          <p className="mt-2 text-base leading-[1.9] text-ink-2">{tile.body}</p>
        </div>
        {visual && (
          <div aria-hidden="true" className="mt-6 lg:mt-0">
            {visual}
          </div>
        )}
      </div>
    </li>
  );
}

/** The six principles as a bento: the heading takes the first cell, two wide tiles carry small illustrations. */
export function WebDesignPrinciplesSection() {
  const [ux, responsive, speed, seo, content, growth] = PRINCIPLES.map(([icon, title, body]) => ({ icon, title, body }));
  return (
    <section className="section bg-white">
      <div className="container-site grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        <div className="flex flex-col justify-center sm:col-span-2 lg:col-span-1 lg:pe-6">
          <SectionHeading
            align="stack"
            eyebrow="اصول طراحی"
            title="در طراحی سایت چه چیزهایی برای ما *مهم* است؟"
            text="ظاهر سایت فقط یک بخش از کار است. این شش اصل در طراحی و پیاده‌سازی همه صفحات کنار هم در نظر گرفته می‌شوند."
          />
        </div>
        <ul className="contents">
          <PrincipleTile tile={ux} wide visual={<FlowVisual />} i={0} />
          <PrincipleTile tile={responsive} i={0} />
          <li className="reveal" style={vars({ i: 1 })}>
            <div className="surface-dark flex h-full flex-col overflow-hidden rounded-xl p-6 lg:rounded-2xl lg:p-8">
              <div aria-hidden="true" className="grid-bg-dark fade-radial pointer-events-none absolute inset-0 -z-10" style={vars({ grid: "28px" })} />
              <span aria-hidden="true" className="orb orb-blue -top-32 -left-24 size-[300px]" />
              <div className="flex items-start justify-between gap-4">
                <IconTile name={speed.icon} tone="gradient" className="size-12 rounded-[14px] lg:size-14" iconSize={26} />
                <span aria-hidden="true">
                  <GaugeVisual />
                </span>
              </div>
              <h3 className="t-h3 mt-5 lg:mt-6">{speed.title}</h3>
              <p className="mt-2 text-base leading-[1.9] text-inverse-muted">{speed.body}</p>
            </div>
          </li>
          <PrincipleTile tile={seo} i={2} />
          <PrincipleTile tile={content} wide visual={<EditorVisual />} i={0} />
          <PrincipleTile tile={growth} i={1} />
        </ul>
      </div>
    </section>
  );
}
