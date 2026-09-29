import Link from "next/link";

import { ButtonLink, Icon, IconTile } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import type { Category, Service } from "@/db/schema";
import { cx, vars } from "@/lib/utils";
import { CATEGORY_UI } from "@/modules/pages/home-content";
import { serviceHref } from "@/modules/services/routes";

type Props = {
  categories: Category[];
  /** Published sub-services keyed by category slug. */
  services: Record<string, Pick<Service, "slug" | "title">[]>;
};

/** Decorative calculator used on the pricing card. */
function CalculatorMock() {
  const rows: [string, boolean][] = [
    ["طراحی صفحات سایت", true],
    ["سئو داخلی و فنی", true],
    ["تولید محتوای ماهانه", false],
  ];
  return (
    <div aria-hidden="true" className="w-full max-w-[340px] rounded-xl bg-white p-4 text-ink shadow-lg lg:p-5">
      <div className="flex items-center justify-between">
        <span className="css-label text-sm font-bold" data-label="برآورد هزینه پروژه" />
        <Icon name="calculator" size={18} className="text-brand" />
      </div>
      <ul className="mt-3 flex flex-col divide-y divide-line">
        {rows.map(([label, on]) => (
          <li key={label} className="flex items-center justify-between gap-3 py-2.5 text-sm text-ink-2">
            <span className="css-label" data-label={label} />
            <span className="mock-switch" data-on={on || undefined} />
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center justify-between rounded-lg bg-soft px-3 py-2.5">
        <span className="css-label text-sm font-semibold" data-label="جمع کل" />
        <span className="flex items-center gap-1.5">
          <span className="block h-2.5 w-16 rounded-full bg-gradient-to-l from-brand to-brand-decorative" />
          <span className="css-label text-xs text-muted" data-label="تومان" />
        </span>
      </div>
    </div>
  );
}

export function HomeServicesIntroSection({ categories, services }: Props) {
  return (
    <section className="section">
      <div className="container-site">
        <SectionHeading
          eyebrow="خدمات ما"
          title="برای رشد آنلاین، از *کجا* شروع کنیم؟"
          text="بسته به وضعیت فعلی کسب‌وکار، ممکن است به یک سایت جدید، بازطراحی سایت فعلی، سئو یا ترکیبی از این خدمات نیاز داشته باشید."
        />
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-5 lg:mt-14 lg:grid-cols-12 lg:gap-6">
          {categories.map((category, i) => {
            const ui = CATEGORY_UI[category.slug] ?? CATEGORY_UI["web-design"];
            const subs = services[category.slug] ?? [];
            return (
              <article
                key={category.slug}
                className={cx("card-fancy reveal flex flex-col rounded-xl p-6 lg:rounded-2xl lg:p-10", i === 0 ? "lg:col-span-7" : "lg:col-span-5")}
                style={vars({ i })}
              >
                <div className="flex items-start justify-between gap-4">
                  <IconTile name={ui.icon} tone="gradient" className="size-14 rounded-2xl lg:size-16" iconSize={30} />
                  <span aria-hidden="true" className="text-5xl leading-none font-bold text-line lg:text-6xl">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-6 text-2xl leading-[1.6] font-bold lg:text-[28px]">{category.title}</h3>
                <p className="mt-2 text-base leading-[1.9] text-ink-2 lg:mt-3">{category.description}</p>
                {subs.length > 0 && (
                  <ul className="mt-6 flex flex-col divide-y divide-line border-y border-line">
                    {subs.map((s) => (
                      <li key={s.slug}>
                        <Link
                          href={serviceHref(s.slug)}
                          className="group/sub flex min-h-12 items-center justify-between gap-3 py-2.5 text-base leading-[1.8] font-medium text-ink no-underline hover:text-brand"
                        >
                          {s.title}
                          <Icon
                            name="arrow-left"
                            size={18}
                            className="shrink-0 text-muted transition-transform duration-300 group-hover/sub:-translate-x-1 group-hover/sub:text-brand"
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <ButtonLink href={ui.href} variant="secondary" size="sm" arrow className="mt-6 self-stretch sm:self-start lg:mt-8">
                  {ui.cta}
                </ButtonLink>
              </article>
            );
          })}

          <article className="surface-dark reveal flex flex-col items-start gap-8 overflow-hidden rounded-xl p-6 lg:col-span-12 lg:flex-row lg:items-center lg:justify-between lg:rounded-2xl lg:p-12">
            <div aria-hidden="true" className="grid-bg-dark fade-radial pointer-events-none absolute inset-0 -z-10" style={vars({ grid: "36px" })} />
            <span aria-hidden="true" className="orb orb-blue -top-40 left-1/4 size-[420px]" />
            <div className="flex max-w-[620px] flex-col items-start gap-3">
              <span className="eyebrow">تعرفه‌ها و ماشین‌حساب</span>
              <h3 className="t-h2">
                هزینه پروژه‌تان را <span className="text-gradient">همین حالا</span> برآورد کنید
              </h3>
              <p className="body-lg">
                گزینه‌های موردنیاز برای طراحی سایت، سئو یا تولید محتوا را انتخاب کنید و برآورد هزینه را همان لحظه ببینید.
              </p>
              <ButtonLink href="/pricing" variant="white" size="lg" arrow className="mt-3 w-full sm:w-auto">
                ورود به ماشین‌حساب هزینه
              </ButtonLink>
            </div>
            <CalculatorMock />
          </article>
        </div>
        <p className="mt-6 leading-8 text-ink-2">
          برای مقایسهٔ گزینه‌ها و انتخاب نقطه شروع، <Link href="/services" className="font-medium text-brand-hover underline underline-offset-4">فهرست کامل خدمات طراحی سایت و سئو</Link> را ببینید.
        </p>
      </div>
    </section>
  );
}
