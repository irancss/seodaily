import { Icon } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import { cx, stepNo } from "@/lib/utils";
import { METHOD } from "@/modules/pages/about-content";

export function AboutMethodSection() {
  return (
    <section className="section bg-white">
      <div className="container-site">
        <SectionHeading align="stack" title="چطور کار می‌کنیم؟" text="هر مرحله خروجی مشخصی دارد و ورودی مرحله بعد است." />
        <div className="mt-8 rounded-xl bg-soft px-5 py-6 lg:mt-12 lg:px-8 lg:py-10">
          <ol className="flex flex-col lg:grid lg:grid-cols-6">
            {METHOD.map(([title, body], i) => [
              i > 0 && (
                <li key={`arrow-${i}`} aria-hidden="true" className="flex h-9 w-10 items-center justify-center text-brand lg:hidden">
                  <Icon name="arrow-down" size={18} />
                </li>
              ),
              <li key={title} className="relative flex gap-4 lg:flex-col lg:gap-0 lg:px-5 lg:first:pr-0 lg:last:pl-0">
                <span
                  className={cx(
                    "flex size-10 shrink-0 items-center justify-center rounded-sm border text-base leading-normal font-bold",
                    i === METHOD.length - 1 ? "border-brand bg-brand text-white" : "border-line bg-white text-brand",
                  )}
                >
                  {stepNo(i)}
                </span>
                <div>
                  <h3 className="t-h3 lg:mt-4">{title}</h3>
                  <p className="mt-0.5 text-sm leading-[1.8] text-ink-2 lg:mt-2">{body}</p>
                </div>
                {i < METHOD.length - 1 && (
                  <Icon name="arrow-left" size={24} className="absolute top-2 -left-3 hidden text-brand lg:block" />
                )}
              </li>,
            ])}
          </ol>
          <p className="mt-6 flex items-start gap-2 border-t border-line pt-4 text-sm leading-[1.8] text-ink-2 lg:mt-8 lg:items-center lg:pt-5">
            <Icon name="cycle-right" size={18} className="shrink-0 text-brand" />
            بهبود، نقطه شروع دور بعدی تحلیل است؛ این چرخه در طول همکاری ادامه پیدا می‌کند.
          </p>
        </div>
      </div>
    </section>
  );
}
