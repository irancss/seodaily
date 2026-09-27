import { SectionHeading } from "@/components/molecules";
import { StepsTimeline } from "@/components/organisms/steps-timeline";
import { PRICING_STEPS } from "@/modules/pages/pricing-content";

export function PricingStepsSection() {
  return (
    <section className="section surface-soft-gradient">
      <div className="container-site">
        <SectionHeading
          eyebrow="از برآورد تا قرارداد"
          title="بعد از ثبت برآورد *چه می‌شود*؟"
          text="برآورد آنلاین نقطه شروع است؛ قیمت نهایی بعد از بررسی جزئیات پروژه و گفت‌وگو با شما مشخص می‌شود."
        />
        <StepsTimeline className="mt-10 lg:mt-16" steps={PRICING_STEPS} />
      </div>
    </section>
  );
}
