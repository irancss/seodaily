import type { Service } from "@/db/schema";
import { cx, stepNo } from "@/lib/utils";

type Props = {
  service: Service;
};

export function ServiceProcessSection({ service }: Props) {
  return (
    <section id="service-process" className="section bg-soft">
      <div className="container-site">
        <h2 className="t-h2">روند اجرای پروژه</h2>
        <ol
          className="relative mt-8 grid gap-7 lg:mt-14 lg:grid-cols-[repeat(var(--steps),minmax(0,1fr))] lg:gap-8"
          style={{ ["--steps" as string]: Math.min(service.process.length, 6) }}
        >
          <li aria-hidden="true" className="absolute top-2 bottom-2 right-[7px] w-0.5 bg-brand/25 lg:inset-x-0 lg:top-[7px] lg:bottom-auto lg:h-0.5 lg:w-auto" />
          {service.process.map((step, i) => (
            <li key={i} className="relative grid grid-cols-[16px_minmax(0,1fr)] gap-5 lg:flex lg:flex-col lg:gap-0">
              <span
                aria-hidden="true"
                className={cx(
                  "mt-1 size-4 rounded-full border-2 border-brand lg:mt-0",
                  i === service.process.length - 1 ? "bg-brand" : "bg-white",
                )}
              />
              <div>
                <span className="block text-sm leading-[1.7] font-bold text-brand lg:mt-6 lg:text-4xl lg:leading-[1.55]">
                  <span className="lg:hidden">مرحله </span>
                  {stepNo(i)}
                </span>
                <h3 className="t-h3 mt-1 lg:mt-2">{step.title}</h3>
                {step.description && <p className="mt-1 text-base leading-[1.9] text-ink-2 lg:mt-2">{step.description}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
