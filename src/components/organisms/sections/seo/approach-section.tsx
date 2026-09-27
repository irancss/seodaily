import { Icon } from "@/components/atoms";
import { stepNo } from "@/lib/utils";
import { APPROACH } from "@/modules/pages/seo-content";

export function SeoApproachSection() {
  return (
    <section className="section">
      <div className="container-site grid items-start gap-8 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-16">
        <div className="flex flex-col gap-2 lg:sticky lg:top-[104px] lg:gap-4">
          <span className="text-sm leading-[1.7] font-medium text-brand-hover">روش کار</span>
          <h2 className="t-h2">سئو را از حدس شروع نمی‌کنیم</h2>
          <p className="body-lg mt-1 lg:mt-0">
            هر اقدام باید به یک داده، یک مشکل مشخص یا یک فرصت قابل بررسی برگردد. مسیر کار شش مرحله دارد که پشت
            سر هم تکرار می‌شوند.
          </p>
        </div>
        <div>
          {/* Mobile: a vertical timeline; desktop: a 3×2 connected grid. */}
          <ol className="relative flex flex-col gap-6 lg:grid lg:grid-cols-3 lg:gap-x-8 lg:gap-y-14">
            <li aria-hidden="true" className="absolute top-[22px] right-[21px] bottom-[22px] w-0.5 bg-brand/25 lg:hidden" />
            {APPROACH.map(([title, body, icon], i) => (
              <li key={title} className="relative grid grid-cols-[44px_minmax(0,1fr)] gap-4 lg:flex lg:flex-col lg:gap-0">
                <span className="flex size-11 items-center justify-center rounded-full border-2 border-brand bg-white text-base font-bold text-brand lg:hidden">
                  {stepNo(i)}
                </span>
                <div className="hidden items-center gap-4 lg:flex">
                  <span className="text-5xl leading-[1.5] font-bold text-brand">{stepNo(i)}</span>
                  <span aria-hidden="true" className="flex grow items-center text-brand">
                    <span className="h-0.5 grow bg-brand/25" />
                    <Icon name={icon} />
                  </span>
                </div>
                <div className="pt-1 lg:pt-0">
                  <h3 className="t-h3 lg:mt-3">{title}</h3>
                  <p className="mt-1 text-base leading-[1.9] text-ink-2 lg:mt-2">{body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex items-start gap-3 rounded-md border border-line bg-soft p-4 lg:mt-12 lg:items-center lg:gap-4 lg:px-5 lg:py-4">
            <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-brand lg:size-10">
              <Icon name="cycle" />
            </span>
            <p className="text-base leading-[1.9] text-ink-2">
              <strong className="font-semibold text-ink">این چرخه به‌صورت مداوم تکرار می‌شود.</strong> نتیجه مرحله
              06، نقطه شروع دور بعدی از مرحله 01 است.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
