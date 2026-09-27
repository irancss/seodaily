import { ButtonLink, Icon } from "@/components/atoms";
import { PageHero } from "@/components/organisms";
import type { Service } from "@/db/schema";

import { ServiceHeroVisual } from "./hero-visual";

type Props = {
  service: Service;
  categoryTitle: string;
};

export function ServiceHeroSection({ service, categoryTitle }: Props) {
  const categoryHref = `/${service.category}`;
  const description = service.heroDescription || service.summary;
  const points = service.includes.slice(0, 3).map((item) => item.title);

  return (
    <PageHero
      tone="dark"
      breadcrumb={[
        { label: "صفحه اصلی", href: "/" },
        { label: categoryTitle, href: categoryHref },
        { label: service.title },
      ]}
      badge={categoryTitle || undefined}
      title={service.title}
      subtitle={description || undefined}
      actions={
        <>
          <ButtonLink href="/contact" size="lg" arrow>
            درخواست مشاوره
          </ButtonLink>
          {service.process.length > 0 && (
            <ButtonLink href="#service-process" variant="glass" size="lg">
              <Icon name="arrow-down" />
              روند اجرای پروژه
            </ButtonLink>
          )}
        </>
      }
      aside={<ServiceHeroVisual service={service} categoryTitle={categoryTitle} />}
    >
      {points.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {points.map((point) => (
            <li key={point} className="chip">
              <Icon name="check" size={16} className="text-cyan-300" />
              {point}
            </li>
          ))}
        </ul>
      )}
    </PageHero>
  );
}
