import { SectionHeading } from "@/components/molecules";
import { cx, stepNo } from "@/lib/utils";
import { STEPS } from "@/modules/pages/web-design-content";

export function WebDesignProcessSection() {
  return (
    <section className="section bg-soft">
      <div className="container-site">
        <SectionHeading
          align="center"
          title="مسیر طراحی سایت، مرحله به مرحله"
          text="هر پروژه از شناخت کسب‌وکار شروع می‌شود و تا تحویل، در این شش مرحله پیش می‌رود."
        />
        <ol className="relative mt-8 grid gap-6 lg:mt-16 lg:grid-cols-6">
          <li aria-hidden="true" className="absolute top-4 bottom-4 right-[5px] w-0.5 bg-brand/25 lg:inset-x-[90px] lg:top-[5px] lg:bottom-auto lg:h-0.5 lg:w-auto" />
          {STEPS.map(([title, body], i) => (
            <li key={title} className="relative grid grid-cols-[12px_minmax(0,1fr)] gap-5 lg:flex lg:flex-col lg:items-center lg:gap-0 lg:text-center">
              <span
                aria-hidden="true"
                className={cx(
                  "mt-[11px] size-3 rounded-full border-2 border-brand lg:mt-0",
                  i === STEPS.length - 1 ? "bg-brand" : "bg-white",
                )}
              />
              <div>
                <div className="flex items-baseline gap-3 lg:block">
                  <span className="block text-xl leading-[1.65] font-bold text-brand lg:mt-5 lg:text-2xl lg:leading-[1.6]">{stepNo(i)}</span>
                  <h3 className="t-h3 lg:mt-2">{title}</h3>
                </div>
                <p className="mt-1 text-base leading-[1.9] text-ink-2 lg:mt-2">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
