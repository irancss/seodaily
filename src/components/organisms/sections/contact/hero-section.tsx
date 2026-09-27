import { GridBackdrop, HeroBadge } from "@/components/atoms";
import type { PageText } from "@/modules/settings/types";

type Props = {
  text: PageText;
};

export function ContactHeroSection({ text }: Props) {
  return (
    <section className="relative overflow-hidden pt-10 pb-8 lg:pt-20 lg:pb-12">
      <GridBackdrop className="opacity-60" />
      <div className="container-site relative flex flex-col items-start">
        <HeroBadge>{text.badge}</HeroBadge>
        <h1 className="t-h1 mt-4 lg:mt-6">{text.title}</h1>
        <p className="body-lg mt-4 max-w-[720px]">{text.subtitle}</p>
      </div>
    </section>
  );
}
