import Link from "next/link";

import { ArrowBadge, ButtonLink, GridBackdrop, HeroBadge, Icon, JsonLd } from "@/components/atoms";
import { DesignFrame, FaqList, FormSketch, SeoFrame } from "@/components/organisms";
import { Breadcrumb, BrowserFrame, SectionHeading, Visual } from "@/components/molecules";
import { cx, stepNo } from "@/lib/utils";
import type { Category, Service } from "@/db/schema";
import { COLLAB_PROCESS } from "@/modules/services/content";
import { getCategories, getServicesByCategory } from "@/modules/services/queries";
import { getFaqs } from "@/modules/faqs/queries";
import { serviceHref } from "@/modules/services/routes";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/modules/seo/metadata";
import { getPageText } from "@/modules/settings/queries";

export function generateMetadata() {
  return pageMetadata("services", "/services");
}

const SELECTOR = [
  { situation: "هنوز سایت ندارم", path: "طراحی سایت", href: "/web-design" },
  { situation: "سایت دارم اما نیاز به بازطراحی دارد", path: "بررسی و بازطراحی", href: "/services/website-redesign" },
  { situation: "سایت دارم اما ورودی گوگل کافی نیست", path: "بررسی سئو", href: "/seo" },
];

function MainServiceBlock({
  index,
  category,
  items,
  mirrored,
}: {
  index: number;
  category: Category;
  items: Service[];
  mirrored: boolean;
}) {
  const isSeo = category.slug === "seo";
  return (
    <article className="grid items-center gap-8 lg:grid-cols-2 lg:gap-20">
      <div className={mirrored ? "lg:order-2" : undefined}>
        <div className="flex items-center gap-3">
          <span className="text-xl leading-[1.65] font-bold text-brand lg:text-2xl lg:leading-[1.6]">{stepNo(index)}</span>
          <span className="text-sm leading-[1.7] font-medium text-muted">خدمت اصلی</span>
        </div>
        <h2 className="t-h2 mt-2 lg:mt-4">{category.title}</h2>
        <p className="body-lg mt-3 lg:mt-4">{category.description}</p>
        {/* Mobile keeps the image between the description and the sub-services. */}
        <div aria-hidden="true" className="mt-6 lg:hidden">
          <BrowserFrame compact shadow="none">
            <Visual alt="" label="جای تصویر نمونه" tone={isSeo ? "soft" : "page"} className="h-[180px]" />
          </BrowserFrame>
        </div>
        {items.length > 0 && (
          <>
            <h3 className="mt-6 text-sm leading-[1.7] font-medium text-muted lg:mt-8">زیرخدمات {category.title}</h3>
            <ul className="mt-2 border-t border-line">
              {items.map((s) => (
                <li key={s.slug} className="border-b border-line">
                  <Link
                    href={serviceHref(s.slug)}
                    className="card-link flex min-h-14 items-center justify-between gap-3 text-ink no-underline hover:text-ink lg:h-[60px] lg:gap-4"
                  >
                    <span className="card-title text-base leading-[1.9] font-medium lg:text-lg">{s.title}</span>
                    <span aria-hidden="true" className="flex text-brand lg:hidden">
                      <Icon name="chevron-left" size={18} />
                    </span>
                    <span className="hidden lg:block">
                      <ArrowBadge size={36} variant="soft" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
        <ButtonLink href={`/${category.slug}`} variant="secondary" arrow className="mt-6 w-full lg:mt-8 lg:h-12 lg:w-auto lg:px-5">
          مشاهده خدمات {category.title}
        </ButtonLink>
      </div>
      <div className={cx("hidden lg:block", mirrored && "lg:order-1")}>{isSeo ? <SeoFrame /> : <DesignFrame />}</div>
    </article>
  );
}

export default async function ServicesPage() {
  const [text, categories, faqs] = await Promise.all([getPageText("services"), getCategories(), getFaqs("services")]);
  const items = await Promise.all(categories.map((c) => getServicesByCategory(c.slug)));
  const breadcrumb = await breadcrumbJsonLd([
    { name: "صفحه اصلی", path: "/" },
    { name: "خدمات", path: "/services" },
  ]);

  return (
    <>
      {/* 01 · hero */}
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

      {/* 02 · main services */}
      <section id="services-main" className="section bg-white">
        <div className="container-site flex flex-col gap-16 lg:gap-24">
          {categories.map((c, i) => (
            <div
              key={c.slug}
              id={`service-${c.slug}`}
              className={i > 0 ? "border-t border-line pt-16 lg:border-0 lg:pt-0" : undefined}
            >
              <MainServiceBlock index={i} category={c} items={items[i]} mirrored={i % 2 === 1} />
            </div>
          ))}
        </div>
      </section>

      {/* 03 · selector */}
      <section className="section bg-soft">
        <div className="container-site">
          <SectionHeading
            align="stack"
            title="کدام خدمت مناسب شماست؟"
            text="وضعیتی را که به شرایط فعلی شما نزدیک‌تر است پیدا کنید؛ مسیر پیشنهادی نقطه شروع گفت‌وگوست، نه تصمیم نهایی."
          />
          <div className="mt-6 overflow-hidden rounded-md border border-line bg-white lg:mt-12 lg:rounded-xl">
            <div aria-hidden="true" className="hidden grid-cols-[5fr_120px_6fr] gap-6 border-b border-line bg-page px-10 py-4 text-sm leading-[1.7] font-medium text-muted lg:grid">
              <span>وضعیت فعلی شما</span>
              <span />
              <span>مسیر پیشنهادی</span>
            </div>
            <ol>
              {SELECTOR.map((row, i) => (
                <li
                  key={row.situation}
                  className="grid border-b border-line p-5 last:border-b-0 lg:grid-cols-[5fr_120px_6fr] lg:items-center lg:gap-6 lg:px-10 lg:py-8"
                >
                  <div className="lg:flex lg:items-center lg:gap-5">
                    <div className="flex items-center gap-3 lg:contents">
                      <span className="text-base leading-normal font-bold text-brand lg:text-xl lg:leading-[1.65]">{stepNo(i)}</span>
                      <span className="text-sm leading-[1.7] font-medium text-muted lg:hidden">وضعیت فعلی شما</span>
                    </div>
                    <p className="t-h3 mt-1 lg:mt-0">{row.situation}</p>
                  </div>
                  <div aria-hidden="true" className="hidden items-center text-brand lg:flex">
                    <span className="h-px grow bg-line-strong" />
                    <Icon name="caret-left" />
                  </div>
                  <Link
                    href={row.href}
                    className="card-link mt-4 flex min-h-16 items-center justify-between gap-3 rounded-sm bg-soft px-4 py-3 text-ink no-underline hover:text-ink lg:mt-0 lg:min-h-0 lg:gap-4 lg:rounded-none lg:bg-transparent lg:p-0"
                  >
                    <span className="flex flex-col">
                      <span className="inline-flex items-center gap-1 text-sm leading-[1.7] font-medium text-ink-2 lg:text-muted">
                        <span aria-hidden="true" className="flex text-brand lg:hidden">
                          <Icon name="arrow-down" size={14} />
                        </span>
                        مسیر پیشنهادی:
                      </span>
                      <span className="card-title text-base leading-normal font-semibold lg:text-xl lg:leading-[1.65]">{row.path}</span>
                    </span>
                    <span className="lg:hidden">
                      <ArrowBadge size={36} variant="white" />
                    </span>
                    <span className="hidden lg:block">
                      <ArrowBadge />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
          <p className="mt-5 text-base leading-[1.9] text-ink-2 lg:mt-6">
            مطمئن نیستید؟ در{" "}
            <Link href="/contact" className="font-semibold underline underline-offset-4">
              فرم درخواست مشاوره
            </Link>{" "}
            گزینه «هنوز مطمئن نیستم» را انتخاب کنید.
          </p>
        </div>
      </section>

      {/* 04 · process */}
      <section className="section bg-white">
        <div className="container-site">
          <SectionHeading
            title="فرایند همکاری"
            text="این مراحل برای طراحی سایت و سئو مشترک است؛ جزئیات هر مرحله بسته به پروژه مشخص می‌شود."
          />
          <ol className="mt-8 grid gap-6 lg:mt-16 lg:grid-cols-4 lg:gap-8">
            {COLLAB_PROCESS.map(([title, body], i) => (
              <li
                key={title}
                className="relative grid grid-cols-[56px_minmax(0,1fr)] gap-4 border-t border-line pt-5 lg:flex lg:flex-col lg:gap-0 lg:pt-6"
              >
                <span aria-hidden="true" className="absolute -top-0.5 right-0 h-[3px] w-10 bg-brand lg:w-12" />
                <span className="t-hero text-brand">{stepNo(i)}</span>
                <div>
                  <h3 className="t-h3 lg:mt-4">{title}</h3>
                  <p className="mt-1 text-base leading-[1.9] text-ink-2 lg:mt-2">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 05 · faq */}
      {faqs.length > 0 && (
        <section className="section">
          <div className="mx-auto w-full max-w-[840px] px-5">
            <SectionHeading align="center" title="سؤال‌های متداول" text="پاسخ چند سؤال رایج درباره انتخاب و ترکیب خدمات." />
            <div className="mt-6 lg:mt-12">
              <FaqList items={faqs} variant="boxed" />
            </div>
            <div className="mt-6 flex lg:mt-8 lg:justify-center">
              <Link href="/contact" className="text-link lg:text-center">
                سؤال دیگری دارید؟ آن را در فرم مشاوره بنویسید
              </Link>
            </div>
          </div>
          <JsonLd data={faqJsonLd(faqs)} />
        </section>
      )}

      {/* 06 · cta */}
      <section className="flex grow items-center pb-16 lg:pb-24">
        <div className="container-site">
          <div className="grid items-center gap-6 rounded-xl border border-line bg-white p-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-16 lg:rounded-2xl lg:px-16 lg:py-14">
            <div className="flex flex-col items-start">
              <h2 className="t-h2">{text.ctaTitle}</h2>
              <p className="body-lg mt-3 lg:mt-4">{text.ctaText}</p>
              <ButtonLink href="/contact" size="lg" arrow className="mt-6 w-full sm:w-auto lg:mt-8">
                درخواست مشاوره
              </ButtonLink>
            </div>
            <div className="order-first lg:order-none">
              <FormSketch />
            </div>
          </div>
        </div>
      </section>
      <JsonLd data={breadcrumb} />
    </>
  );
}
