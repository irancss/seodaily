import { stepNo } from "@/lib/utils";
import { COLLAB_PROCESS } from "@/modules/services/content";

export function HomeProcessSection() {
  return (
    <section className="section bg-soft">
      <div className="container-site">
        <div className="grid gap-3 lg:grid-cols-2 lg:items-end lg:gap-16">
          <h2 className="t-h2">مسیر همکاری چطور پیش می‌رود؟</h2>
          <p className="body-lg">هر پروژه از شناخت شروع می‌شود و بعد از اجرا هم با ارزیابی ادامه پیدا می‌کند.</p>
        </div>
        <ol className="relative mt-8 grid gap-6 lg:mt-16 lg:grid-cols-4 lg:gap-8">
          <li aria-hidden="true" className="absolute top-[22px] bottom-[22px] right-[21px] w-0.5 bg-brand/25 lg:inset-x-7 lg:top-[27px] lg:bottom-auto lg:h-0.5 lg:w-auto" />
          {COLLAB_PROCESS.map(([title, body], i) => (
            <li key={title} className="relative grid grid-cols-[44px_minmax(0,1fr)] gap-4 lg:flex lg:flex-col lg:gap-0">
              <span
                className={
                  "flex size-11 items-center justify-center rounded-full border-2 border-brand text-base font-bold lg:size-14 lg:text-xl " +
                  (i === COLLAB_PROCESS.length - 1 ? "bg-brand text-white" : "bg-white text-brand")
                }
              >
                {stepNo(i)}
              </span>
              <div className="pt-1 lg:pt-0">
                <h3 className="t-h3 lg:mt-6">{title}</h3>
                <p className="mt-1 text-base leading-[1.9] text-ink-2 lg:mt-2">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
