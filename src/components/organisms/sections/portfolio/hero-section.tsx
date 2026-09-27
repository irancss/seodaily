import { GridBackdrop, HeroBadge } from "@/components/atoms";
import type { PageText } from "@/modules/settings/types";

type Props = {
  text: PageText;
};

export function PortfolioHeroSection({ text }: Props) {
  return (
    <section className="relative overflow-hidden pt-10 pb-10 lg:pt-20 lg:pb-16">
      <GridBackdrop className="opacity-60" />
      <div className="container-site relative grid items-end gap-3 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col items-start">
          <HeroBadge>{text.badge}</HeroBadge>
          <h1 className="t-h1 mt-4">{text.title}</h1>
        </div>
        <p className="body-lg lg:pb-2">{text.subtitle}</p>
      </div>
    </section>
  );
}
