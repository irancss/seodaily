import { SectionHeading } from "@/components/molecules";
import { StepsTimeline } from "@/components/organisms/steps-timeline";
import { STEPS } from "@/modules/pages/web-design-content";

export function WebDesignProcessSection() {
  return (
    <section className="section surface-soft-gradient">
      <div className="container-site">
        <SectionHeading
          align="center"
          eyebrow="مراحل پروژه"
          title="مسیر طراحی سایت، *مرحله به مرحله*"
          text="هر پروژه از شناخت کسب‌وکار شروع می‌شود و تا تحویل، در این شش مرحله پیش می‌رود."
        />
        <StepsTimeline className="mt-8 lg:mt-14" steps={STEPS.map(([title, description]) => ({ title, description }))} />
      </div>
    </section>
  );
}
