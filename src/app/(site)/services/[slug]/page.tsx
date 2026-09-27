import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowBadge, ButtonLink, GridBackdrop, HeroBadge, Icon, JsonLd } from "@/components/atoms";
import { CtaSection, FaqList } from "@/components/organisms";
import { Breadcrumb, BrowserFrame, SectionHeading, Visual } from "@/components/molecules";
import { cx, stepNo } from "@/lib/utils";
import { decodeSlug } from "@/lib/utils";
import { getCategory, getServiceBySlug, getServicesBySlugs } from "@/modules/services/queries";
import { serviceHref } from "@/modules/services/routes";
import { breadcrumbJsonLd, buildMetadata, faqJsonLd, getSiteUrl } from "@/modules/seo/metadata";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = decodeSlug((await params).slug);
  const service = await getServiceBySlug(slug);
  if (!service) return {};
  return buildMetadata({
    title: service.metaTitle || service.title,
    description: service.metaDescription || service.heroDescription || service.summary,
    path: serviceHref(service.slug),
    image: service.imageUrl,
  });
}

const PROBLEM_ICONS = ["alert", "question", "layers"];
const DELIVERABLE_ICONS = ["doc-lines", "doc-check", "list-doc", "folder"];

export default async function ServicePage({ params }: Props) {
  const slug = decodeSlug((await params).slug);
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const [category, related, base] = await Promise.all([
    getCategory(service.category),
    getServicesBySlugs(service.relatedSlugs),
    getSiteUrl(),
  ]);
  const categoryTitle = category?.title ?? "";
  const categoryHref = `/${service.category}`;
  const description = service.heroDescription || service.summary;

  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    ...(service.englishTitle ? { alternateName: service.englishTitle } : {}),
    description,
    serviceType: categoryTitle,
    provider: { "@id": `${base}/#organization` },
    url: `${base}${serviceHref(service.slug)}`,
    ...(service.imageUrl ? { image: `${base}${service.imageUrl}` } : {}),
  };

  return (
    <>
      {/* 01 · hero */}
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

      {/* 02 · problem */}
      {(service.problemIntro || service.problems.length > 0) && (
        <section className="section bg-white">
          <div className="container-site grid items-start gap-8 lg:grid-cols-[460px_minmax(0,1fr)] lg:gap-24">
            <div className="flex flex-col gap-3 lg:gap-5">
              <h2 className="t-h2">این خدمت چه مشکلی را حل می‌کند؟</h2>
              {service.problemIntro && <p className="body-lg">{service.problemIntro}</p>}
            </div>
            {service.problems.length > 0 && (
              <ul className="border-t border-line">
                {service.problems.map((p, i) => (
                  <li key={i} className="flex items-center gap-4 border-b border-line py-5 lg:gap-5 lg:py-6">
                    <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-soft text-brand">
                      <Icon name={PROBLEM_ICONS[i % PROBLEM_ICONS.length]} />
                    </span>
                    <p className="text-lg leading-[1.9] font-semibold lg:text-xl lg:leading-[1.65]">{p}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* 03 · includes */}
      {service.includes.length > 0 && (
        <section className="section">
          <div className="container-site">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
              <h2 className="t-h2">این خدمت شامل چه مواردی است؟</h2>
              {service.includesIntro && <p className="max-w-[440px] text-base leading-[1.9] text-muted">{service.includesIntro}</p>}
            </div>
            <ul className="mt-6 grid rounded-md border border-line bg-white px-5 lg:mt-12 lg:grid-cols-2 lg:rounded-xl lg:px-8">
              {service.includes.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 border-b border-line py-5 last:border-b-0 lg:gap-4 lg:py-7 lg:odd:border-l lg:odd:pl-8 lg:even:pr-8 lg:[&:nth-last-child(-n+2):nth-child(odd)]:border-b-0"
                >
                  <span aria-hidden="true" className="mt-px flex size-8 shrink-0 items-center justify-center rounded-full bg-soft text-brand">
                    <Icon name="check-thin" size={18} />
                  </span>
                  <div>
                    <h3 className="t-h3">{item.title}</h3>
                    {item.description && <p className="mt-1 text-base leading-[1.9] text-ink-2">{item.description}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 04 · process */}
      {service.process.length > 0 && (
        <section id="service-process" className="section bg-soft">
          <div className="container-site">
            <h2 className="t-h2">روند اجرای پروژه</h2>
            <ol
              className="relative mt-8 grid gap-7 lg:mt-14 lg:grid-cols-[repeat(var(--steps),minmax(0,1fr))] lg:gap-8"
              style={{ ["--steps" as string]: Math.min(service.process.length, 6) }}
            >
              <li aria-hidden="true" className="absolute top-2 bottom-2 right-[7px] w-0.5 bg-brand/25 lg:inset-x-0 lg:top-[7px] lg:bottom-auto lg:h-0.5 lg:w-auto" />
              {service.process.map((step, i) => (
                <li key={i} className="relative grid grid-cols-[16px_minmax(0,1fr)] gap-5 lg:flex lg:flex-col lg:gap-0">
                  <span
                    aria-hidden="true"
                    className={cx(
                      "mt-1 size-4 rounded-full border-2 border-brand lg:mt-0",
                      i === service.process.length - 1 ? "bg-brand" : "bg-white",
                    )}
                  />
                  <div>
                    <span className="block text-sm leading-[1.7] font-bold text-brand lg:mt-6 lg:text-4xl lg:leading-[1.55]">
                      <span className="lg:hidden">مرحله </span>
                      {stepNo(i)}
                    </span>
                    <h3 className="t-h3 mt-1 lg:mt-2">{step.title}</h3>
                    {step.description && <p className="mt-1 text-base leading-[1.9] text-ink-2 lg:mt-2">{step.description}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* 05 · for who */}
      {(service.forWhoIntro || service.situations.length > 0 || service.businessTypes.length > 0) && (
        <section className="section bg-white">
          {/* Mobile order: intro, business types, then the situations panel. */}
          <div className="container-site flex flex-col lg:grid lg:grid-cols-2 lg:items-start lg:gap-24">
            <div className="contents lg:flex lg:flex-col">
              <h2 className="t-h2">این خدمت مناسب چه کسب‌وکارهایی است؟</h2>
              {service.forWhoIntro && <p className="body-lg mt-3 lg:mt-4">{service.forWhoIntro}</p>}
              {service.situations.length > 0 && (
                <div className="order-last mt-8 rounded-md border border-line bg-page p-5 lg:mt-10 lg:rounded-none lg:border-x-0 lg:border-b-0 lg:bg-transparent lg:p-0 lg:pt-8">
                  <h3 className="text-lg leading-[1.9] font-semibold lg:text-xl lg:leading-[1.65]">چه زمانی سراغ این خدمت بیایید؟</h3>
                  <ul className="mt-3 flex flex-col gap-3 lg:mt-4">
                    {service.situations.map((s, i) => (
                      <li key={i} className="flex items-start gap-3 text-base leading-[1.9] text-ink">
                        <Icon name="check-round" size={22} className="mt-0.5 shrink-0 text-brand" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {service.businessTypes.length > 0 && (
              <div className="mt-6 lg:mt-0 lg:rounded-xl lg:border lg:border-line lg:bg-page lg:p-10">
                <span className="hidden text-sm leading-[1.7] font-medium text-muted lg:block">انواع کسب‌وکار</span>
                <ul className="flex flex-wrap gap-2 lg:mt-4 lg:gap-3">
                  {service.businessTypes.map((t) => (
                    <li key={t} className="inline-flex h-11 items-center rounded-full border border-line bg-page px-4 text-sm leading-[1.7] font-medium text-ink lg:bg-white lg:px-[18px] lg:text-base lg:leading-normal">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 06 · deliverables */}
      {service.deliverables.length > 0 && (
        <section className="section">
          <div className="container-site">
            <SectionHeading align="stack" title="در پایان چه چیزی دریافت می‌کنید؟" text={service.deliverablesIntro || undefined} />
            <div className="mt-6 overflow-hidden rounded-md border border-line bg-white lg:mt-12 lg:rounded-xl">
              <div className="flex h-12 items-center gap-2 border-b border-line bg-page px-5 text-sm leading-[1.7] font-medium text-muted lg:h-14 lg:px-10">
                <Icon name="checklist" size={18} />
                فهرست تحویلی — {service.title}
              </div>
              <ul className="grid px-5 lg:grid-cols-2 lg:px-0">
                {service.deliverables.map((d, i) => (
                  <li
                    key={i}
                    className="grid grid-cols-[44px_minmax(0,1fr)] gap-4 border-b border-line py-5 last:border-b-0 lg:grid-cols-[56px_minmax(0,1fr)] lg:gap-5 lg:p-10 lg:odd:border-l lg:[&:nth-last-child(-n+2):nth-child(odd)]:border-b-0"
                  >
                    <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-md bg-soft text-brand lg:size-14">
                      <Icon name={DELIVERABLE_ICONS[i % DELIVERABLE_ICONS.length]} size={24} strokeWidth={1.75} />
                    </span>
                    <div>
                      <h3 className="t-h3">{d.title}</h3>
                      {d.description && <p className="mt-1 text-base leading-[1.9] text-ink-2 lg:mt-2">{d.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* 07 · related */}
      {related.length > 0 && (
        <section className="bg-white py-16 lg:py-20">
          <div className="container-site">
            <h2 className="t-h2">خدمات مرتبط</h2>
            <ul className="mt-6 grid gap-3 lg:mt-10 lg:grid-cols-3 lg:gap-6">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={serviceHref(r.slug)}
                    className="card-link flex min-h-[72px] items-center justify-between gap-3 rounded-md border border-line bg-page px-5 py-3 text-ink no-underline hover:text-ink lg:h-[104px] lg:gap-4 lg:px-7 lg:py-0"
                  >
                    <span className="flex flex-col">
                      <span className="text-sm leading-[1.7] font-medium text-muted">
                        {r.category === "seo" ? "سئو" : "طراحی سایت"}
                      </span>
                      <span className="card-title text-lg leading-[1.9] font-semibold lg:text-xl lg:leading-[1.65]">{r.title}</span>
                    </span>
                    <span className="lg:hidden">
                      <ArrowBadge size={40} variant="soft" />
                    </span>
                    <span className="hidden lg:block">
                      <ArrowBadge variant="soft" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 08 · faq */}
      {service.faqs.length > 0 && (
        <section className="section">
          <div className="mx-auto w-full max-w-[920px] px-5">
            <SectionHeading align="center" title="سؤال‌های متداول" text={`پرسش‌های رایج درباره ${service.title}`} />
            <div className="mt-6 lg:mt-10">
              <FaqList items={service.faqs} variant="panel" />
            </div>
          </div>
          <JsonLd data={faqJsonLd(service.faqs)} />
        </section>
      )}

      {/* 09 · cta */}
      <CtaSection
        variant="white"
        padTop={service.faqs.length === 0}
        title={`برای شروع ${service.title}، درباره پروژه‌تان صحبت کنیم`}
        text="اطلاعات اولیه پروژه را ارسال کنید تا نیازها و شرایط آن بررسی شود."
      />

      <JsonLd data={serviceLd} />
      <JsonLd
        data={await breadcrumbJsonLd([
          { name: "صفحه اصلی", path: "/" },
          { name: categoryTitle, path: categoryHref },
          { name: service.title, path: serviceHref(service.slug) },
        ])}
      />
    </>
  );
}
