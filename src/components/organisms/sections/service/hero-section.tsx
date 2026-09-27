import { ButtonLink, GridBackdrop, HeroBadge } from "@/components/atoms";
import { Breadcrumb, BrowserFrame, Visual } from "@/components/molecules";
import type { Service } from "@/db/schema";

type Props = {
  service: Service;
  categoryTitle: string;
};

export function ServiceHeroSection({ service, categoryTitle }: Props) {
  const categoryHref = `/${service.category}`;
  const description = service.heroDescription || service.summary;

  return (
    <section className="relative overflow-hidden pt-6 pb-12 lg:pt-8 lg:pb-24">
      <GridBackdrop className="opacity-50" />
      <div className="container-site relative">
        <Breadcrumb
          items={[
            { label: "صفحه اصلی", href: "/" },
            { label: categoryTitle, href: categoryHref },
            { label: service.title },
          ]}
        />
        <div className="mt-4 grid items-center gap-10 lg:mt-12 lg:grid-cols-[560px_minmax(0,1fr)] lg:gap-16">
          <div className="flex flex-col items-start">
            <HeroBadge>{categoryTitle}</HeroBadge>
            <h1 className="t-h1 mt-4 lg:mt-5">{service.title}</h1>
            {description && <p className="body-lg mt-4 lg:mt-5">{description}</p>}
            <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4 lg:mt-10">
              <ButtonLink href="/contact" arrow>
                درخواست مشاوره
              </ButtonLink>
              {service.process.length > 0 && (
                <ButtonLink href="#service-process" variant="secondary" className="px-6">
                  روند اجرای پروژه
                </ButtonLink>
              )}
            </div>
          </div>
          <BrowserFrame>
            <Visual
              src={service.imageUrl}
              alt={service.title}
              label="تصویر یا نمونه مرتبط با خدمت"
              className="h-[220px] lg:h-[360px]"
            />
          </BrowserFrame>
        </div>
      </div>
    </section>
  );
}
