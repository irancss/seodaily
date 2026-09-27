import { IconTile } from "@/components/atoms";
import { vars } from "@/lib/utils";
import { VALUES } from "@/modules/pages/about-content";

/** Statement block: how every project is approached. */
export function AboutPhilosophySection() {
  return (
    <section className="section relative isolate overflow-hidden bg-white">
      <div aria-hidden="true" className="grid-bg fade-radial pointer-events-none absolute inset-0 -z-10 opacity-50" style={vars({ grid: "48px" })} />
      <div className="container-site flex flex-col items-start lg:items-center lg:text-center">
        <div className="reveal flex flex-col items-start gap-3 lg:items-center">
          <span className="eyebrow">فلسفه کار</span>
          <h2 className="t-h2">
            نگاه ما به <span className="text-gradient">پروژه</span>
          </h2>
        </div>

        <div className="reveal relative mt-6 max-w-[960px] lg:mt-10">
          <span
            aria-hidden="true"
            className="text-gradient pointer-events-none absolute -top-16 -right-12 hidden text-[160px] leading-none font-bold opacity-25 select-none lg:block"
          >
            «
          </span>
          <p className="relative text-[22px] leading-[1.8] font-bold text-ink lg:text-[34px] lg:leading-[1.75]">
            <span className="text-ink-2">
              قبل از انتخاب ابزار یا طراحی ظاهر، مسئله کسب‌وکار و نیاز کاربر بررسی می‌شود.
            </span>{" "}
            هدف، ساخت راهکاری است که <span className="text-gradient">قابل استفاده، قابل مدیریت و قابل توسعه</span> باشد.
          </p>
        </div>

        <ul className="mt-8 grid w-full gap-3 sm:grid-cols-3 lg:mt-14 lg:max-w-[880px] lg:gap-5">
          {VALUES.map((value, i) => (
            <li
              key={value.title}
              className="reveal-scale card-fancy flex items-center gap-4 rounded-xl p-4 lg:flex-col lg:gap-4 lg:p-6"
              style={vars({ i })}
            >
              <IconTile name={value.icon} tone="gradient" className="size-12 rounded-[14px]" iconSize={22} />
              <span className="text-base leading-normal font-bold text-ink lg:text-xl lg:leading-[1.65]">{value.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
