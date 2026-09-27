import { Icon, IconTile } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import { cx, stepNo, vars } from "@/lib/utils";
import { APPROACH } from "@/modules/pages/seo-content";

/**
 * Desktop places the six steps as a loop: 01→03 along the first row (right to
 * left), down to 04, back along the second row to 06, then up to 01 again.
 */
const PLACE = ["", "", "", "lg:col-start-3 lg:row-start-2", "lg:col-start-2 lg:row-start-2", "lg:col-start-1 lg:row-start-2"];
/** Badge in the gap after each step on desktop, pointing to the next one. */
const LINK = [
  "top-1/2 -left-5 -translate-x-1/2 -translate-y-1/2",
  "top-1/2 -left-5 -translate-x-1/2 -translate-y-1/2",
  "-bottom-6 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-[-90deg]",
  "top-1/2 -right-5 translate-x-1/2 -translate-y-1/2 rotate-180",
  "top-1/2 -right-5 translate-x-1/2 -translate-y-1/2 rotate-180",
  "-top-6 left-1/2 -translate-x-1/2 -translate-y-1/2",
];

export function SeoApproachSection() {
  return (
    <section className="section bg-white">
      <div className="container-site">
        <SectionHeading
          eyebrow="روش کار"
          title="سئو را از *حدس* شروع نمی‌کنیم"
          text="هر اقدام باید به یک داده، یک مشکل مشخص یا یک فرصت قابل بررسی برگردد. مسیر کار شش مرحله دارد که پشت سر هم تکرار می‌شوند."
        />
        <ol className="mt-8 grid gap-5 lg:mt-14 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-12">
          {APPROACH.map(([title, body, icon], i) => {
            const last = i === APPROACH.length - 1;
            return (
              <li key={title} className={cx("reveal relative", PLACE[i])} style={vars({ i: i % 3 })}>
                <div className="card-fancy flex h-full flex-col rounded-xl p-5 lg:p-7">
                  <div className="flex items-center justify-between gap-4">
                    <IconTile name={icon} tone="gradient" className="size-12 rounded-[14px]" iconSize={24} />
                    <span aria-hidden="true" className="text-gradient text-4xl leading-none font-bold lg:text-[44px]">
                      {stepNo(i)}
                    </span>
                  </div>
                  <h3 className="t-h3 mt-5">{title}</h3>
                  <p className="mt-1.5 text-base leading-[1.9] text-ink-2 lg:mt-2">{body}</p>
                </div>
                {/* Mobile: a small arrow down to the next card. */}
                {!last && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-2.5 left-1/2 z-10 flex size-8 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-brand shadow-sm lg:hidden"
                  >
                    <Icon name="arrow-down" size={16} />
                  </span>
                )}
                {/* Desktop: the arrow along the loop; the last one leads back to step 01. */}
                <span
                  aria-hidden="true"
                  className={cx(
                    "absolute z-10 hidden size-9 items-center justify-center rounded-full lg:flex",
                    last ? "icon-gradient" : "border border-line bg-white text-brand shadow-sm",
                    LINK[i],
                  )}
                >
                  <Icon name={last ? "cycle" : "chevron-left"} size={18} />
                </span>
              </li>
            );
          })}
        </ol>
        <div className="reveal mt-8 flex items-start gap-4 rounded-xl border border-brand/15 bg-soft p-4 lg:mt-12 lg:items-center lg:px-6 lg:py-5">
          <span aria-hidden="true" className="icon-gradient size-10 rounded-full">
            <Icon name="cycle" size={20} />
          </span>
          <p className="text-base leading-[1.9] text-ink-2">
            <strong className="font-semibold text-ink">این چرخه به‌صورت مداوم تکرار می‌شود.</strong> نتیجه مرحله 06،
            نقطه شروع دور بعدی از مرحله 01 است.
          </p>
        </div>
      </div>
    </section>
  );
}
