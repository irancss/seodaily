import { ButtonLink, HeroBadge } from "@/components/atoms";
import { ResponsiveFrames } from "@/components/organisms";
import type { PageText } from "@/modules/settings/types";

type Props = {
  text: PageText;
};

export function WebDesignHeroSection({ text }: Props) {
  return (
    <section className="pt-10 pb-12 lg:pt-20 lg:pb-24">
      <div className="container-site grid items-center gap-10 lg:grid-cols-[520px_minmax(0,1fr)] lg:gap-16">
        <div className="flex flex-col items-start">
          <HeroBadge>{text.badge}</HeroBadge>
          <h1 className="t-h1 mt-4 lg:mt-6">{text.title}</h1>
          <p className="body-lg mt-4 lg:mt-6">{text.subtitle}</p>
          <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 lg:mt-10">
            <ButtonLink href="/contact" arrow>
              درخواست مشاوره طراحی سایت
            </ButtonLink>
            <ButtonLink href="/portfolio" variant="secondary" className="px-6">
              مشاهده نمونه‌کارها
            </ButtonLink>
          </div>
        </div>
        <ResponsiveFrames />
      </div>
    </section>
  );
}
