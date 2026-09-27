import { Icon } from "@/components/atoms";

export function AboutPhilosophySection() {
  return (
    <section className="section bg-white">
      <div className="container-site">
        <div className="grid items-start gap-4 border-t border-line pt-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-24 lg:pt-10">
          <h2 className="t-h2">نگاه ما به پروژه</h2>
          <div>
            <p className="text-lg leading-[1.9] text-ink">
              قبل از انتخاب ابزار یا طراحی ظاهر، مسئله کسب‌وکار و نیاز کاربر بررسی می‌شود. هدف، ساخت راهکاری است
              که قابل استفاده، قابل مدیریت و قابل توسعه باشد.
            </p>
            <ul className="mt-6 flex flex-col border-t border-line lg:mt-10 lg:flex-row lg:flex-wrap lg:gap-x-10 lg:gap-y-4 lg:pt-6">
              {["قابل استفاده", "قابل مدیریت", "قابل توسعه"].map((t) => (
                <li
                  key={t}
                  className="flex min-h-12 items-center gap-3 border-b border-line text-base leading-normal font-semibold text-ink lg:min-h-0 lg:border-b-0 lg:text-xl lg:leading-[1.65]"
                >
                  <Icon name="check-round" size={22} className="text-brand" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
