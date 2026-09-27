import { SectionHeading } from "@/components/molecules";
import { StepsTimeline } from "@/components/organisms/steps-timeline";
import { COLLAB_PROCESS } from "@/modules/services/content";

export function HomeProcessSection() {
  return (
    <section className="section surface-soft-gradient">
      <div className="container-site">
        <SectionHeading
          eyebrow="مسیر همکاری"
          title="همکاری ما *چطور* پیش می‌رود؟"
          text="هر پروژه از شناخت شروع می‌شود و بعد از اجرا هم با ارزیابی ادامه پیدا می‌کند."
        />
        <StepsTimeline
          className="mt-10 lg:mt-16"
          steps={COLLAB_PROCESS.map(([title, description]) => ({ title, description }))}
        />
      </div>
    </section>
  );
}
