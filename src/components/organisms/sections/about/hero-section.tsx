import { HeroBadge } from "@/components/atoms";
import { SystemDiagram } from "@/components/organisms";
import type { PageText } from "@/modules/settings/types";

type Props = {
  text: PageText;
};

export function AboutHeroSection({ text }: Props) {
  return (
    <section className="pt-10 pb-12 lg:py-24">
      <div className="container-site grid items-center gap-8 lg:grid-cols-[minmax(0,640fr)_minmax(0,496fr)] lg:gap-16">
        <div className="flex flex-col items-start">
          <HeroBadge>{text.badge}</HeroBadge>
          <h1 className="t-h1 mt-4 lg:mt-6">{text.title}</h1>
          <p className="body-lg mt-4 max-w-[600px] lg:mt-6">{text.subtitle}</p>
        </div>
        <SystemDiagram />
      </div>
    </section>
  );
}
