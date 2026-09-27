import { SectionHeading } from "@/components/molecules";
import { cx, stepNo } from "@/lib/utils";
import { PRINCIPLES } from "@/modules/pages/about-content";

export function AboutPrinciplesSection() {
  return (
    <section className="section">
      <div className="container-site">
        <SectionHeading align="stack" title="اصول کاری ما" text="این چهار اصل در همه پروژه‌ها، از طراحی تا سئو، مبنای تصمیم‌گیری است." />
        <ol className="mt-8 border-t border-line lg:mt-12 lg:grid lg:grid-cols-4 lg:pt-10">
          {PRINCIPLES.map(([title, body], i) => (
            <li
              key={title}
              className={cx(
                "grid grid-cols-[64px_minmax(0,1fr)] border-b border-line py-6",
                "lg:flex lg:flex-col lg:border-b-0 lg:px-7 lg:py-0 lg:first:pr-0 lg:last:pl-0",
                i > 0 && "lg:border-r",
              )}
            >
              <span className="text-4xl leading-[1.55] font-bold text-brand lg:text-5xl lg:leading-[1.5]">{stepNo(i)}</span>
              <div className="pt-2 lg:pt-0">
                <h3 className="text-xl leading-[1.65] font-semibold lg:mt-4 lg:text-2xl lg:leading-[1.6] lg:font-bold">{title}</h3>
                <p className="mt-1 text-base leading-[1.9] text-ink-2 lg:mt-2">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
