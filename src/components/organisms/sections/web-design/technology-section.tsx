import { Icon } from "@/components/atoms";
import { TECH_FACTORS } from "@/modules/pages/web-design-content";

type Props = {
  techOptions: string[];
};

export function WebDesignTechnologySection({ techOptions }: Props) {
  return (
    <section className="section">
      <div className="container-site grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_560px] lg:gap-24">
        <div className="flex flex-col items-start">
          <h2 className="t-h2">فناوری بر اساس نیاز پروژه انتخاب می‌شود</h2>
          <p className="body-lg mt-4 lg:mt-6">
            هیچ پلتفرمی برای همه پروژه‌ها بهترین انتخاب نیست. اینکه سایت با وردپرس، ووکامرس یا به‌صورت اختصاصی
            ساخته شود، به نوع کسب‌وکار، امکانات موردنیاز و برنامه شما برای آینده سایت بستگی دارد.
          </p>
          {techOptions.length > 0 && (
            <>
              <span className="mt-6 text-sm leading-[1.7] font-medium text-muted lg:mt-8">نمونه گزینه‌ها</span>
              <ul className="mt-3 flex flex-wrap gap-2 lg:gap-3">
                {techOptions.map((t) => (
                  <li key={t} className="rounded-full border border-line bg-white px-4 py-2 text-base leading-normal font-medium text-ink lg:px-5">
                    {t}
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-4 flex items-start gap-2 text-sm leading-[1.8] text-muted">
            <Icon name="info" size={18} className="mt-0.5 shrink-0" />
            انتخاب نهایی پس از بررسی نیازهای پروژه و با هماهنگی شما انجام می‌شود.
          </p>
        </div>
        <div className="rounded-xl border border-line bg-white p-6 lg:p-10">
          <h3 className="t-h3">عوامل مؤثر در انتخاب فناوری</h3>
          <ul className="mt-3 lg:mt-4">
            {TECH_FACTORS.map(([title, body]) => (
              <li key={title} className="grid grid-cols-[22px_minmax(0,1fr)] gap-3 border-t border-line py-4 lg:grid-cols-[24px_minmax(0,1fr)] lg:gap-4">
                <Icon name="check-circle" size={22} className="text-brand" />
                <div>
                  <h4 className="text-base leading-[1.9] font-semibold">{title}</h4>
                  <p className="text-sm leading-[1.8] text-ink-2">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
