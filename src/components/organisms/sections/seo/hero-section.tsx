import { ButtonLink, GridBackdrop, HeroBadge } from "@/components/atoms";
import { SerpMockup } from "@/components/organisms";
import type { PageText } from "@/modules/settings/types";

type Props = {
  text: PageText;
};

export function SeoHeroSection({ text }: Props) {
  return (
    <section className="relative overflow-hidden pt-10 pb-12 lg:pt-20 lg:pb-24">
      <GridBackdrop className="opacity-60" />
      <div className="container-site relative grid items-center gap-10 lg:grid-cols-[560px_minmax(0,1fr)] lg:gap-16">
        <div className="flex flex-col items-start">
          <HeroBadge>{text.badge}</HeroBadge>
          <h1 className="t-h1 mt-4 lg:mt-6">{text.title}</h1>
          <p className="body-lg mt-4 lg:mt-6">{text.subtitle}</p>
          <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4 lg:mt-10">
            <ButtonLink href="/contact" arrow>
              درخواست بررسی سئو
            </ButtonLink>
            <ButtonLink href="#seo-services" variant="secondary" className="px-6">
              مشاهده خدمات سئو
            </ButtonLink>
          </div>
        </div>
        <SerpMockup />
      </div>
    </section>
  );
}
