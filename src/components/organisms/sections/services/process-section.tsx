import { SectionHeading } from "@/components/molecules";
import { StepsTimeline } from "@/components/organisms/steps-timeline";
import { COLLAB_PROCESS } from "@/modules/services/content";

export function ServicesProcessSection() {
  return (
    <section className="section bg-white">
      <div className="container-site">
        <SectionHeading
          eyebrow="مسیر همکاری"
          title="فرایند *همکاری*"
          text="این مراحل برای طراحی سایت و سئو مشترک است؛ جزئیات هر مرحله بسته به پروژه مشخص می‌شود."
        />
        <StepsTimeline
          className="mt-10 lg:mt-16"
          steps={COLLAB_PROCESS.map(([title, description]) => ({ title, description }))}
        />
      </div>
    </section>
  );
}
