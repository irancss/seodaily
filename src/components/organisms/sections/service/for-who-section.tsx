import { Icon } from "@/components/atoms";
import type { Service } from "@/db/schema";

type Props = {
  service: Service;
};

export function ServiceForWhoSection({ service }: Props) {
  return (
    <section className="section bg-white">
      {/* Mobile order: intro, business types, then the situations panel. */}
      <div className="container-site flex flex-col lg:grid lg:grid-cols-2 lg:items-start lg:gap-24">
        <div className="contents lg:flex lg:flex-col">
          <h2 className="t-h2">این خدمت مناسب چه کسب‌وکارهایی است؟</h2>
          {service.forWhoIntro && <p className="body-lg mt-3 lg:mt-4">{service.forWhoIntro}</p>}
          {service.situations.length > 0 && (
            <div className="order-last mt-8 rounded-md border border-line bg-page p-5 lg:mt-10 lg:rounded-none lg:border-x-0 lg:border-b-0 lg:bg-transparent lg:p-0 lg:pt-8">
              <h3 className="text-lg leading-[1.9] font-semibold lg:text-xl lg:leading-[1.65]">چه زمانی سراغ این خدمت بیایید؟</h3>
              <ul className="mt-3 flex flex-col gap-3 lg:mt-4">
                {service.situations.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-base leading-[1.9] text-ink">
                    <Icon name="check-round" size={22} className="mt-0.5 shrink-0 text-brand" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {service.businessTypes.length > 0 && (
          <div className="mt-6 lg:mt-0 lg:rounded-xl lg:border lg:border-line lg:bg-page lg:p-10">
            <span className="hidden text-sm leading-[1.7] font-medium text-muted lg:block">انواع کسب‌وکار</span>
            <ul className="flex flex-wrap gap-2 lg:mt-4 lg:gap-3">
              {service.businessTypes.map((t) => (
                <li key={t} className="inline-flex h-11 items-center rounded-full border border-line bg-page px-4 text-sm leading-[1.7] font-medium text-ink lg:bg-white lg:px-[18px] lg:text-base lg:leading-normal">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
