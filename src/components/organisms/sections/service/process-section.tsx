import { SectionHeading } from "@/components/molecules";
import { StepsTimeline } from "@/components/organisms";
import type { Service } from "@/db/schema";

type Props = {
  service: Service;
};

/** `#service-process` is linked from the hero. */
export function ServiceProcessSection({ service }: Props) {
  return (
    <section id="service-process" className="section surface-soft-gradient">
      <div className="container-site">
        <SectionHeading
          eyebrow="مراحل کار"
          title="روند اجرای *پروژه*"
          action={<span className="chip">{service.process.length} مرحله</span>}
        />
        <StepsTimeline className="mt-10 lg:mt-16" steps={service.process} />
      </div>
    </section>
  );
}
