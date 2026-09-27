import { SectionHeading } from "@/components/molecules";
import { stepNo } from "@/lib/utils";
import { COLLAB_PROCESS } from "@/modules/services/content";

export function ServicesProcessSection() {
  return (
    <section className="section bg-white">
      <div className="container-site">
        <SectionHeading
          title="فرایند همکاری"
          text="این مراحل برای طراحی سایت و سئو مشترک است؛ جزئیات هر مرحله بسته به پروژه مشخص می‌شود."
        />
        <ol className="mt-8 grid gap-6 lg:mt-16 lg:grid-cols-4 lg:gap-8">
          {COLLAB_PROCESS.map(([title, body], i) => (
            <li
              key={title}
              className="relative grid grid-cols-[56px_minmax(0,1fr)] gap-4 border-t border-line pt-5 lg:flex lg:flex-col lg:gap-0 lg:pt-6"
            >
              <span aria-hidden="true" className="absolute -top-0.5 right-0 h-[3px] w-10 bg-brand lg:w-12" />
              <span className="t-hero text-brand">{stepNo(i)}</span>
              <div>
                <h3 className="t-h3 lg:mt-4">{title}</h3>
                <p className="mt-1 text-base leading-[1.9] text-ink-2 lg:mt-2">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
