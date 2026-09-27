import Link from "next/link";

import { ArrowBadge, Icon } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import { stepNo } from "@/lib/utils";
import { SELECTOR } from "@/modules/pages/services-content";

export function ServicesSelectorSection() {
  return (
    <section className="section bg-soft">
      <div className="container-site">
        <SectionHeading
          align="stack"
          title="کدام خدمت مناسب شماست؟"
          text="وضعیتی را که به شرایط فعلی شما نزدیک‌تر است پیدا کنید؛ مسیر پیشنهادی نقطه شروع گفت‌وگوست، نه تصمیم نهایی."
        />
        <div className="mt-6 overflow-hidden rounded-md border border-line bg-white lg:mt-12 lg:rounded-xl">
          <div aria-hidden="true" className="hidden grid-cols-[5fr_120px_6fr] gap-6 border-b border-line bg-page px-10 py-4 text-sm leading-[1.7] font-medium text-muted lg:grid">
            <span>وضعیت فعلی شما</span>
            <span />
            <span>مسیر پیشنهادی</span>
          </div>
          <ol>
            {SELECTOR.map((row, i) => (
              <li
                key={row.situation}
                className="grid border-b border-line p-5 last:border-b-0 lg:grid-cols-[5fr_120px_6fr] lg:items-center lg:gap-6 lg:px-10 lg:py-8"
              >
                <div className="lg:flex lg:items-center lg:gap-5">
                  <div className="flex items-center gap-3 lg:contents">
                    <span className="text-base leading-normal font-bold text-brand lg:text-xl lg:leading-[1.65]">{stepNo(i)}</span>
                    <span className="text-sm leading-[1.7] font-medium text-muted lg:hidden">وضعیت فعلی شما</span>
                  </div>
                  <p className="t-h3 mt-1 lg:mt-0">{row.situation}</p>
                </div>
                <div aria-hidden="true" className="hidden items-center text-brand lg:flex">
                  <span className="h-px grow bg-line-strong" />
                  <Icon name="caret-left" />
                </div>
                <Link
                  href={row.href}
                  className="card-link mt-4 flex min-h-16 items-center justify-between gap-3 rounded-sm bg-soft px-4 py-3 text-ink no-underline hover:text-ink lg:mt-0 lg:min-h-0 lg:gap-4 lg:rounded-none lg:bg-transparent lg:p-0"
                >
                  <span className="flex flex-col">
                    <span className="inline-flex items-center gap-1 text-sm leading-[1.7] font-medium text-ink-2 lg:text-muted">
                      <span aria-hidden="true" className="flex text-brand lg:hidden">
                        <Icon name="arrow-down" size={14} />
                      </span>
                      مسیر پیشنهادی:
                    </span>
                    <span className="card-title text-base leading-normal font-semibold lg:text-xl lg:leading-[1.65]">{row.path}</span>
                  </span>
                  <span className="lg:hidden">
                    <ArrowBadge size={36} variant="white" />
                  </span>
                  <span className="hidden lg:block">
                    <ArrowBadge />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
        <p className="mt-5 text-base leading-[1.9] text-ink-2 lg:mt-6">
          مطمئن نیستید؟ در{" "}
          <Link href="/contact" className="font-semibold underline underline-offset-4">
            فرم درخواست مشاوره
          </Link>{" "}
          گزینه «هنوز مطمئن نیستم» را انتخاب کنید.
        </p>
      </div>
    </section>
  );
}
