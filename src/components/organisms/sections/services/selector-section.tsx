import Link from "next/link";

import { ArrowBadge, Icon, IconTile } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import { FormSketch } from "@/components/organisms/illustrations";
import { stepNo, vars } from "@/lib/utils";
import { SELECTOR } from "@/modules/pages/services-content";

/** «Which service do I need?»: situation cards that lead to the suggested path. */
export function ServicesSelectorSection() {
  return (
    <section className="section surface-soft-gradient relative isolate overflow-hidden">
      <div aria-hidden="true" className="grid-bg fade-radial pointer-events-none absolute inset-0 -z-10 opacity-70" style={vars({ grid: "44px" })} />
      <span aria-hidden="true" className="orb orb-soft-blue -top-40 -left-40 size-[520px]" />
      <div className="container-site">
        <SectionHeading
          align="center"
          eyebrow="انتخاب مسیر"
          title="کدام خدمت *مناسب* شماست؟"
          text="وضعیتی را که به شرایط فعلی شما نزدیک‌تر است پیدا کنید؛ مسیر پیشنهادی نقطه شروع گفت‌وگوست، نه تصمیم نهایی."
        />
        <ol className="mt-8 grid gap-4 lg:mt-14 lg:grid-cols-3 lg:gap-6">
          {SELECTOR.map((row, i) => (
            <li key={row.situation} className="reveal" style={vars({ i })}>
              <Link
                href={row.href}
                className="card-fancy card-link group flex h-full flex-col rounded-xl p-5 text-ink no-underline hover:text-ink lg:rounded-2xl lg:p-7"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2.5 text-sm leading-[1.7] font-medium text-muted">
                    {/* Radio that fills when the card is hovered or focused. */}
                    <span
                      aria-hidden="true"
                      className="flex size-5 items-center justify-center rounded-full border-2 border-line-strong transition-colors duration-300 group-hover:border-brand group-focus-visible:border-brand"
                    >
                      <span className="size-2 rounded-full bg-brand opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
                    </span>
                    وضعیت فعلی شما
                  </span>
                  <span aria-hidden="true" className="text-sm leading-none font-bold text-line-strong">
                    {stepNo(i)}
                  </span>
                </span>
                <p className="t-h3 mt-4">{row.situation}</p>
                <span aria-hidden="true" className="my-5 flex items-center gap-3 text-brand lg:my-6">
                  <span className="grow border-t border-dashed border-line-strong" />
                  <span className="flex size-8 items-center justify-center rounded-full bg-soft">
                    <Icon name="arrow-down" size={16} />
                  </span>
                  <span className="grow border-t border-dashed border-line-strong" />
                </span>
                <span className="mt-auto flex items-center gap-3 rounded-xl bg-soft p-3 lg:p-4">
                  <IconTile name={row.icon} tone="gradient" className="size-11 rounded-xl" iconSize={22} />
                  <span className="flex min-w-0 grow flex-col">
                    <span className="text-sm leading-[1.7] text-ink-2">مسیر پیشنهادی:</span>
                    <span className="card-title text-lg leading-[1.6] font-bold transition-colors">{row.path}</span>
                  </span>
                  <ArrowBadge size={40} variant="white" />
                </span>
              </Link>
            </li>
          ))}
        </ol>

        <div className="reveal mt-5 grid items-center gap-5 rounded-xl border border-dashed border-brand/35 bg-white/70 p-5 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14 lg:rounded-2xl lg:px-8 lg:py-6">
          <div className="flex items-start gap-4 lg:items-center">
            <span aria-hidden="true" className="icon-gradient size-11 rounded-full">
              <Icon name="question" size={20} />
            </span>
            <p className="text-base leading-[1.9] text-ink-2 lg:text-lg">
              <strong className="font-bold text-ink">مطمئن نیستید؟</strong> در{" "}
              <Link href="/contact" className="font-semibold underline underline-offset-4">
                فرم درخواست مشاوره
              </Link>{" "}
              گزینه «هنوز مطمئن نیستم» را انتخاب کنید.
            </p>
          </div>
          <FormSketch picked="هنوز مطمئن نیستم" />
        </div>
      </div>
    </section>
  );
}
