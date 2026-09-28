import { ButtonLink, Highlight, Icon, PhoneLink, WordRotator } from "@/components/atoms";
import { vars } from "@/lib/utils";
import { HERO_POINTS } from "@/modules/pages/home-content";
import type { PageText } from "@/modules/settings/types";

import { HomeHeroVisual } from "./hero-visual";

type Props = {
  text: PageText;
  heroImage?: string;
  /** Business types cycled after «مناسب» under the title. */
  audiences: string[];
  phone: string;
};

export function HomeHeroSection({ text, heroImage, audiences, phone }: Props) {
  return (
    <section className="surface-dark overflow-hidden">
      <div aria-hidden="true" className="grid-bg-dark fade-down pointer-events-none absolute inset-0 -z-10" style={vars({ grid: "56px" })} />
      <span aria-hidden="true" className="orb orb-blue -top-72 -right-56 size-[720px]" />
      <span aria-hidden="true" className="orb orb-cyan top-1/3 -left-64 size-[600px]" style={vars({ i: 1 })} />

      <div className="container-site relative grid items-center gap-8 pt-10 pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,540px)] lg:gap-14 lg:pt-20 lg:pb-28">
        <div className="flex flex-col items-start">
          <span className="badge-glass animate-in">
            <span aria-hidden="true" className="live-dot" />
            {text.badge}
          </span>
          <h1 className="t-display animate-rise mt-5 lg:mt-6" style={vars({ i: 1 })}>
            <Highlight text={text.title} />
          </h1>
          {audiences.length > 0 && (
            <p className="animate-in mt-3 text-lg leading-[1.8] font-semibold text-inverse-muted lg:mt-4 lg:text-2xl lg:leading-[1.7]" style={vars({ i: 2 })}>
              مناسب <WordRotator words={audiences} className="text-white" />
            </p>
          )}
          <p className="body-lg animate-rise mt-4 max-w-[580px] lg:mt-5" style={vars({ i: 3 })}>
            {text.subtitle}
          </p>
          <div className="animate-in mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center lg:mt-9" style={vars({ i: 4 })}>
            <ButtonLink href="/contact" size="lg" arrow>
              درخواست مشاوره
            </ButtonLink>
            <ButtonLink href="/pricing" size="lg" variant="glass">
              <Icon name="calculator" />
              محاسبه هزینه پروژه
            </ButtonLink>
          </div>
          <ul className="animate-in mt-7 flex flex-wrap gap-2 lg:mt-9" style={vars({ i: 5 })}>
            {HERO_POINTS.map((point) => (
              <li key={point} className="chip">
                <Icon name="check" size={16} className="text-cyan-300" />
                {point}
              </li>
            ))}
          </ul>
          {phone && (
            <p className="animate-in mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-[1.8] text-inverse-muted" style={vars({ i: 6 })}>
              مشاوره تلفنی:
              <PhoneLink phone={phone} className="font-semibold text-white hover:text-cyan-200" iconClassName="text-cyan-300" />
            </p>
          )}
        </div>
        <div className="animate-scale" style={vars({ i: 2 })}>
          <HomeHeroVisual imageUrl={heroImage} />
        </div>
      </div>
    </section>
  );
}
