import { FeatureCard, SectionHeading } from "@/components/molecules";
import { StatsBand, type StatItem } from "@/components/organisms/stats-band";
import { vars } from "@/lib/utils";
import { WHY_US } from "@/modules/pages/home-content";

export function HomeWhyUsSection({ stats }: { stats: StatItem[] }) {
  return (
    <section className="section bg-white">
      <div className="container-site">
        <SectionHeading
          align="center"
          eyebrow="چرا سئو دیلی"
          title="فقط *ظاهر سایت* مهم نیست"
          text="سایتی که خوب دیده شود اما ساختار درستی نداشته باشد، کمکی به رشد کسب‌وکار نمی‌کند. این اصول در همه پروژه‌ها کنار هم در نظر گرفته می‌شوند."
        />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4 lg:gap-6">
          {WHY_US.map((item, i) => (
            <li key={item.title} className="reveal" style={vars({ i })}>
              <FeatureCard icon={item.icon} title={item.title} text={item.text} />
            </li>
          ))}
        </ul>
        <StatsBand items={stats} className="mt-10 lg:mt-16" />
      </div>
    </section>
  );
}
