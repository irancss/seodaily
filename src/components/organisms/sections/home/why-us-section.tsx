import { stepNo } from "@/lib/utils";
import { WHY_US } from "@/modules/pages/home-content";

export function HomeWhyUsSection() {
  return (
    <section className="section">
      <div className="container-site grid items-start gap-8 lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-24">
        <div className="flex flex-col gap-3 lg:gap-4">
          <h2 className="t-h2">فقط ظاهر سایت مهم نیست</h2>
          <p className="body-lg">
            سایتی که خوب دیده شود اما ساختار درستی نداشته باشد، کمکی به رشد کسب‌وکار نمی‌کند. این اصول در همه
            پروژه‌ها کنار هم در نظر گرفته می‌شوند.
          </p>
        </div>
        <ol className="border-t border-line">
          {WHY_US.map(([title, body], i) => (
            <li key={title} className="grid grid-cols-[44px_minmax(0,1fr)] border-b border-line py-6 lg:grid-cols-[72px_minmax(0,1fr)] lg:py-8">
              <span className="text-xl leading-[1.65] font-bold text-brand lg:text-2xl lg:leading-[1.6]">{stepNo(i)}</span>
              <div>
                <h3 className="text-xl leading-[1.65] font-semibold lg:text-2xl lg:leading-[1.6] lg:font-bold">{title}</h3>
                <p className="body-lg mt-1 lg:mt-2">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
