import { FeatureCard, SectionHeading } from "@/components/molecules";
import type { Service } from "@/db/schema";
import { vars } from "@/lib/utils";
import { serviceHref } from "@/modules/services/routes";

type Props = {
  services: Service[];
};

export function WebDesignSiteTypesSection({ services }: Props) {
  return (
    <section className="section">
      <div className="container-site">
        <SectionHeading
          eyebrow="انواع سایت"
          title="چه نوع سایتی *نیاز* دارید؟"
          text="نوع سایت از هدف کسب‌وکار شما مشخص می‌شود. برای هر گزینه، صفحه‌ای با جزئیات بیشتر در نظر گرفته شده است."
        />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-6">
          {services.map((s, i) => (
            <li key={s.slug} className="reveal" style={vars({ i: i % 3 })}>
              <FeatureCard icon={s.icon} title={s.title} text={s.summary} href={serviceHref(s.slug)}>
                {s.englishTitle && (
                  <span dir="ltr" className="mt-auto self-start pt-5 text-xs leading-[1.6] font-semibold tracking-wide text-muted">
                    {s.englishTitle}
                  </span>
                )}
              </FeatureCard>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
