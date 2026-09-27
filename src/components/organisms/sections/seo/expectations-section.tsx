import { Icon, IconTile } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import { vars } from "@/lib/utils";
import { FACTORS } from "@/modules/pages/seo-content";

export function SeoExpectationsSection() {
  return (
    <section className="section bg-white">
      <div className="container-site grid items-center gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
        <div className="flex flex-col items-start">
          <SectionHeading
            align="stack"
            eyebrow="انتظار واقع‌بینانه از سئو"
            title="سئو یک پروژه کوتاه‌مدت با نتیجه تضمینی نیست"
            className="[&_h2]:text-balance"
          />
          <p className="reveal mt-5 text-lg leading-[1.9] font-medium text-ink lg:mt-6 lg:text-xl lg:leading-[1.85]">
            سرعت و میزان نتیجه به عوامل مختلفی مانند وضعیت فعلی سایت، رقابت بازار، منابع پروژه و سابقه دامنه وابسته است.
          </p>
          <p className="reveal mt-4 flex items-start gap-3 rounded-xl border border-line bg-page p-4 text-base leading-[1.9] text-ink-2 lg:mt-6 lg:p-5">
            <Icon name="info" size={20} className="mt-1 shrink-0 text-brand" />
            به همین دلیل در هیچ مرحله‌ای از همکاری، زمان یا رتبه مشخصی وعده داده نمی‌شود. به‌جای آن، برنامه کار و
            معیارهای سنجش پیشرفت از ابتدا شفاف تعریف می‌شوند.
          </p>
        </div>

        <div className="surface-soft-gradient reveal-scale relative isolate overflow-hidden rounded-xl p-5 sm:p-8 lg:rounded-2xl lg:p-10">
          <div aria-hidden="true" className="grid-bg fade-radial pointer-events-none absolute inset-0 -z-10 opacity-80" style={vars({ grid: "32px" })} />
          <span aria-hidden="true" className="orb orb-soft-cyan -right-32 -bottom-40 size-[380px]" />
          <div className="float-card p-5 lg:p-6">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="icon-gradient size-11 rounded-xl">
                <Icon name="checklist" size={22} />
              </span>
              <h3 className="text-base leading-[1.8] font-bold lg:text-lg">عوامل اثرگذار بر مسیر پروژه</h3>
            </div>
            <ul className="mt-4 flex flex-col divide-y divide-line border-t border-line">
              {FACTORS.map((f, i) => (
                <li key={f.title} className="reveal flex items-center gap-3 py-3.5" style={vars({ i })}>
                  <IconTile name={f.icon} tone="soft" className="size-10 rounded-[10px]" iconSize={20} />
                  <span className="grow text-base leading-[1.8] font-semibold">{f.title}</span>
                  <Icon name="check-circle" size={22} className="shrink-0 text-success" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
