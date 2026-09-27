import { Icon } from "@/components/atoms";
import { FeatureCard, SectionHeading } from "@/components/molecules";
import { cx, vars } from "@/lib/utils";
import { PRINCIPLE_ICONS, PRINCIPLES } from "@/modules/pages/about-content";

/** «سادگی»: one clear card instead of a crowded page. */
function SimpleSketch() {
  return (
    <div className="flex w-44 flex-col gap-2.5 rounded-xl border border-line bg-white p-4 shadow-md">
      <span className="h-2 w-[70%] rounded-full bg-ink/70" />
      <span className="h-1.5 w-[90%] rounded-full bg-line-strong" />
      <span className="h-1.5 w-[60%] rounded-full bg-line" />
      <span className="mt-1.5 h-6 w-16 rounded-md bg-gradient-to-l from-brand to-brand-decorative" />
    </div>
  );
}

/** «قابلیت توسعه»: modules with room for the next one. */
function GrowSketch() {
  return (
    <div className="grid w-44 grid-cols-3 gap-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={cx("h-11 rounded-lg border border-line", i % 2 === 0 ? "bg-soft" : "bg-white")} />
      ))}
      <span className="flex h-11 items-center justify-center rounded-lg border border-dashed border-brand/50 text-brand">
        <Icon name="plus" size={16} />
      </span>
    </div>
  );
}

export function AboutPrinciplesSection() {
  return (
    <section className="section">
      <div className="container-site">
        <SectionHeading
          eyebrow="اصول کاری"
          title="اصول کاری *ما*"
          text="این چهار اصل در همه پروژه‌ها، از طراحی تا سئو، مبنای تصمیم‌گیری است."
        />
        {/* Bento: the first and last cards span two columns on desktop. */}
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-6">
          {PRINCIPLES.map(([title, body], i) => {
            const wide = i === 0 || i === PRINCIPLES.length - 1;
            return (
              <li key={title} className={cx("reveal", wide && "lg:col-span-2")} style={vars({ i: i % 2 })}>
                <FeatureCard icon={PRINCIPLE_ICONS[i]} title={title} text={body} index={i} className={wide ? "lg:pl-64" : undefined}>
                  {wide && (
                    <span aria-hidden="true" className="absolute top-1/2 left-10 hidden -translate-y-1/2 -rotate-3 lg:block">
                      {i === 0 ? <SimpleSketch /> : <GrowSketch />}
                    </span>
                  )}
                </FeatureCard>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
