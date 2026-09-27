import { Icon } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import { vars } from "@/lib/utils";
import { TECH_FACTORS } from "@/modules/pages/web-design-content";

type Props = {
  techOptions: string[];
};

export function WebDesignTechnologySection({ techOptions }: Props) {
  return (
    <section className="section">
      <div className="container-site">
        <div className="surface-dark grid items-center gap-10 overflow-hidden rounded-xl px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)] lg:gap-16 lg:rounded-2xl lg:p-14">
          <div aria-hidden="true" className="grid-bg-dark fade-radial pointer-events-none absolute inset-0 -z-10" style={vars({ grid: "40px" })} />
          <span aria-hidden="true" className="orb orb-blue -top-52 -right-40 size-[520px]" />
          <span aria-hidden="true" className="orb orb-cyan -bottom-60 left-1/4 size-[460px]" style={vars({ i: 1 })} />

          <div className="flex flex-col items-start">
            <SectionHeading
              align="stack"
              eyebrow="فناوری و پلتفرم"
              title="فناوری بر اساس *نیاز پروژه* انتخاب می‌شود"
              text="هیچ پلتفرمی برای همه پروژه‌ها بهترین انتخاب نیست. اینکه سایت با وردپرس، ووکامرس یا به‌صورت اختصاصی ساخته شود، به نوع کسب‌وکار، امکانات موردنیاز و برنامه شما برای آینده سایت بستگی دارد."
            />
            {techOptions.length > 0 && (
              <>
                <span className="mt-8 text-sm leading-[1.7] font-medium text-inverse-muted">نمونه گزینه‌ها</span>
                <ul className="mt-3 flex flex-wrap gap-2.5 lg:gap-3">
                  {techOptions.map((t, i) => (
                    <li
                      key={t}
                      className="reveal-scale inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.07] py-1.5 ps-1.5 pe-5 text-base leading-[1.8] font-semibold text-white"
                      style={vars({ i })}
                    >
                      <span aria-hidden="true" className="icon-gradient size-8 rounded-full shadow-none">
                        <Icon name="code" size={15} />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p className="mt-6 flex items-start gap-2 text-sm leading-[1.8] text-inverse-muted">
              <Icon name="info" size={18} className="mt-0.5 shrink-0 text-cyan-300" />
              انتخاب نهایی پس از بررسی نیازهای پروژه و با هماهنگی شما انجام می‌شود.
            </p>
          </div>

          <div className="float-card reveal p-5 sm:p-6 lg:p-8" style={vars({ i: 1 })}>
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="icon-gradient size-10 rounded-xl">
                <Icon name="checklist" size={20} />
              </span>
              <h3 className="t-h3">عوامل مؤثر در انتخاب فناوری</h3>
            </div>
            <ul className="mt-4 flex flex-col lg:mt-5">
              {TECH_FACTORS.map(([title, body]) => (
                <li key={title} className="grid grid-cols-[24px_minmax(0,1fr)] gap-3 border-t border-line py-3.5 lg:gap-4">
                  <Icon name="check-circle" size={22} className="mt-0.5 text-brand" />
                  <div>
                    <h4 className="text-base leading-[1.9] font-semibold">{title}</h4>
                    <p className="text-sm leading-[1.8] text-ink-2">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
