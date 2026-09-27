import { GridBackdrop, HeroBadge, Icon } from "@/components/atoms";
import { Breadcrumb } from "@/components/molecules";
import type { Category } from "@/db/schema";
import type { PageText } from "@/modules/settings/types";

type Props = {
  text: PageText;
  categories: Category[];
};

export function ServicesHeroSection({ text, categories }: Props) {
  return (
    <section className="relative overflow-hidden pt-8 pb-12 lg:pt-20 lg:pb-24">
      <GridBackdrop className="opacity-60" />
      <div className="container-site relative">
        <Breadcrumb separator="slash" items={[{ label: "صفحه اصلی", href: "/" }, { label: "خدمات" }]} />
        <div className="mt-5 grid items-end gap-4 lg:mt-12 lg:grid-cols-[7fr_5fr] lg:gap-16">
          <div className="flex flex-col items-start">
            <HeroBadge>{text.badge}</HeroBadge>
            <h1 className="t-h1 mt-4 lg:mt-5">{text.title}</h1>
          </div>
          <div className="flex flex-col items-start lg:border-r lg:border-line lg:pr-8">
            <p className="body-lg">{text.subtitle}</p>
            <div className="mt-6 flex flex-wrap items-center gap-2 lg:gap-3">
              {categories.map((c) => (
                <a
                  key={c.slug}
                  href={`#service-${c.slug}`}
                  className="btn-secondary inline-flex h-11 items-center gap-2 rounded-full border-line px-[18px] text-sm leading-[1.7] font-medium text-ink no-underline"
                >
                  {c.title}
                  <span className="text-brand">
                    <Icon name="arrow-down" size={16} />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
