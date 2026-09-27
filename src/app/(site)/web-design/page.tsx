import Link from "next/link";

import { Icon } from "@/components/icon";
import { JsonLd } from "@/components/json-ld";
import { CtaSection } from "@/components/site/cta";
import { FaqList } from "@/components/site/faq";
import { ResponsiveFrames } from "@/components/site/mockups";
import { ProjectCard } from "@/components/site/project-card";
import { ArrowBadge, ButtonLink, cx, HeroBadge, IconTile, SectionHeading, stepNo } from "@/components/site/ui";
import { getFaqs, getPublishedProjects, getServicesByCategory, serviceHref } from "@/lib/data";
import { breadcrumbJsonLd, faqJsonLd, getSiteUrl, pageMetadata } from "@/lib/seo";
import { getGeneral, getPageText } from "@/lib/settings";

export function generateMetadata() {
  return pageMetadata("web-design", "/web-design");
}

const PRINCIPLES = [
  ["cursor", "تجربه کاربری", "مسیر حرکت کاربر در صفحات ساده و قابل پیش‌بینی باشد."],
  ["responsive", "طراحی Responsive", "صفحات در موبایل، تبلت و دسکتاپ درست نمایش داده شوند."],
  ["gauge", "سرعت و Performance", "حجم صفحات و منابع طوری مدیریت شود که سایت سبک بماند."],
  ["sitemap", "ساختار مناسب سئو", "آدرس‌ها، عنوان‌ها و ساختار صفحات از ابتدا منظم باشند."],
  ["edit", "مدیریت آسان محتوا", "ویرایش متن، تصویر و صفحات برای تیم شما قابل انجام باشد."],
  ["grid-plus", "قابلیت توسعه", "اضافه کردن بخش‌ها و امکانات جدید در آینده ممکن باشد."],
];

const STEPS = [
  ["شناخت کسب‌وکار", "بررسی اهداف، مخاطبان، رقبا و نیازهای اصلی پروژه."],
  ["معماری صفحات", "تعیین صفحات، منوها و مسیر حرکت کاربر در سایت."],
  ["طراحی رابط کاربری", "طراحی ظاهر صفحات بر اساس ساختار تأییدشده."],
  ["پیاده‌سازی", "ساخت صفحات و امکانات روی پلتفرم انتخاب‌شده."],
  ["تست", "بررسی نمایش، سرعت و عملکرد در دستگاه‌های مختلف."],
  ["تحویل", "راه‌اندازی سایت و آشنایی تیم شما با مدیریت آن."],
];

const TECH_FACTORS = [
  ["نوع و مقیاس پروژه", "تعداد صفحات، نوع محتوا و پیچیدگی امکانات."],
  ["نیاز به مدیریت محتوا توسط تیم شما", "اینکه چه کسی و هر چند وقت سایت را به‌روزرسانی می‌کند."],
  ["امکانات فروشگاهی", "نیاز به سبد خرید، پرداخت آنلاین و مدیریت موجودی."],
  ["نیاز به توسعه در آینده", "امکاناتی که ممکن است بعداً به سایت اضافه شوند."],
  ["بودجه و زمان‌بندی", "منابعی که برای ساخت و نگهداری سایت در نظر دارید."],
];

export default async function WebDesignPage() {
  const [text, general, types, projects, faqs, base] = await Promise.all([
    getPageText("web-design"),
    getGeneral(),
    getServicesByCategory("web-design"),
    getPublishedProjects(),
    getFaqs("web-design"),
    getSiteUrl(),
  ]);
  const showcase = projects.filter((p) => p.category === "web-design").slice(0, 2);
  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "طراحی سایت",
    serviceType: "Web design",
    description: text.metaDescription || text.subtitle,
    provider: { "@id": `${base}/#organization` },
    url: `${base}/web-design`,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "خدمات طراحی سایت",
      itemListElement: types.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.title, url: `${base}${serviceHref(s.slug)}` },
      })),
    },
  };

  return (
    <>
      {/* 01 · hero */}
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

      {/* 02 · site types */}
      {types.length > 0 && (
        <section className="section bg-white">
          <div className="container-site">
            <SectionHeading
              title="چه نوع سایتی نیاز دارید؟"
              text="نوع سایت از هدف کسب‌وکار شما مشخص می‌شود. برای هر گزینه، صفحه‌ای با جزئیات بیشتر در نظر گرفته شده است."
            />
            {/* Mobile: a hairline list of rows; desktop: a grid of cards. */}
            <ul className="mt-6 border-t border-line lg:mt-12 lg:grid lg:grid-cols-3 lg:gap-6 lg:border-0">
              {types.map((s) => (
                <li key={s.slug} className="border-b border-line lg:border-0">
                  <Link
                    href={serviceHref(s.slug)}
                    className="card-link grid grid-cols-[40px_minmax(0,1fr)_18px] items-center gap-3.5 py-5 text-ink no-underline hover:text-ink lg:flex lg:h-full lg:flex-col lg:items-stretch lg:gap-0 lg:rounded-md lg:border lg:border-line lg:bg-white lg:p-8"
                  >
                    <span className="flex items-center justify-between">
                      <IconTile name={s.icon} iconSize={22} className="size-10 lg:size-12" />
                      <span className="hidden lg:block">
                        <ArrowBadge size={40} />
                      </span>
                    </span>
                    <div>
                      <h3 className="card-title text-base leading-[1.9] font-semibold lg:mt-6 lg:text-xl lg:leading-[1.65]">
                        {s.title}
                      </h3>
                      <p className="text-sm leading-[1.8] text-ink-2 lg:mt-2 lg:text-base lg:leading-[1.9]">{s.summary}</p>
                    </div>
                    <span aria-hidden="true" className="flex text-brand lg:hidden">
                      <Icon name="chevron-left" size={18} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 03 · principles */}
      <section className="section">
        <div className="container-site grid items-start gap-8 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-24">
          <div className="flex flex-col gap-3 lg:gap-4">
            <h2 className="t-h2">در طراحی سایت چه چیزهایی برای ما مهم است؟</h2>
            <p className="body-lg">
              ظاهر سایت فقط یک بخش از کار است. این شش اصل در طراحی و پیاده‌سازی همه صفحات کنار هم در نظر گرفته
              می‌شوند.
            </p>
          </div>
          <ul className="grid border-b border-line sm:grid-cols-2 sm:gap-x-12">
            {PRINCIPLES.map(([icon, title, body]) => (
              <li key={title} className="grid grid-cols-[40px_minmax(0,1fr)] gap-4 border-t border-line py-5 lg:grid-cols-[44px_minmax(0,1fr)] lg:py-7">
                <IconTile name={icon} iconSize={20} round tone="white" className="size-10 lg:size-11" />
                <div>
                  <h3 className="t-h3">{title}</h3>
                  <p className="mt-1 text-base leading-[1.9] text-ink-2">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 04 · process */}
      <section className="section bg-soft">
        <div className="container-site">
          <SectionHeading
            align="center"
            title="مسیر طراحی سایت، مرحله به مرحله"
            text="هر پروژه از شناخت کسب‌وکار شروع می‌شود و تا تحویل، در این شش مرحله پیش می‌رود."
          />
          <ol className="relative mt-8 grid gap-6 lg:mt-16 lg:grid-cols-6">
            <li aria-hidden="true" className="absolute top-4 bottom-4 right-[5px] w-0.5 bg-brand/25 lg:inset-x-[90px] lg:top-[5px] lg:bottom-auto lg:h-0.5 lg:w-auto" />
            {STEPS.map(([title, body], i) => (
              <li key={title} className="relative grid grid-cols-[12px_minmax(0,1fr)] gap-5 lg:flex lg:flex-col lg:items-center lg:gap-0 lg:text-center">
                <span
                  aria-hidden="true"
                  className={cx(
                    "mt-[11px] size-3 rounded-full border-2 border-brand lg:mt-0",
                    i === STEPS.length - 1 ? "bg-brand" : "bg-white",
                  )}
                />
                <div>
                  <div className="flex items-baseline gap-3 lg:block">
                    <span className="block text-xl leading-[1.65] font-bold text-brand lg:mt-5 lg:text-2xl lg:leading-[1.6]">{stepNo(i)}</span>
                    <h3 className="t-h3 lg:mt-2">{title}</h3>
                  </div>
                  <p className="mt-1 text-base leading-[1.9] text-ink-2 lg:mt-2">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 05 · portfolio */}
      {showcase.length > 0 && (
        <section className="section bg-white">
          <div className="container-site">
            <SectionHeading
              title="نمونه‌کارهای طراحی سایت"
              action={
                <Link href="/portfolio" className="text-link">
                  مشاهده همه نمونه‌کارها
                  <Icon name="arrow-left" />
                </Link>
              }
            />
            <div className="mt-6 grid gap-8 lg:mt-12 lg:grid-cols-2">
              {showcase.map((p) => (
                <ProjectCard key={p.id} project={p} height="h-[220px] lg:h-[360px]" />
              ))}
            </div>
            <ButtonLink href="/portfolio" variant="secondary" arrow className="mt-8 w-full lg:hidden">
              مشاهده همه نمونه‌کارها
            </ButtonLink>
          </div>
        </section>
      )}

      {/* 06 · technology */}
      <section className="section">
        <div className="container-site grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_560px] lg:gap-24">
          <div className="flex flex-col items-start">
            <h2 className="t-h2">فناوری بر اساس نیاز پروژه انتخاب می‌شود</h2>
            <p className="body-lg mt-4 lg:mt-6">
              هیچ پلتفرمی برای همه پروژه‌ها بهترین انتخاب نیست. اینکه سایت با وردپرس، ووکامرس یا به‌صورت اختصاصی
              ساخته شود، به نوع کسب‌وکار، امکانات موردنیاز و برنامه شما برای آینده سایت بستگی دارد.
            </p>
            {general.techOptions.length > 0 && (
              <>
                <span className="mt-6 text-sm leading-[1.7] font-medium text-muted lg:mt-8">نمونه گزینه‌ها</span>
                <ul className="mt-3 flex flex-wrap gap-2 lg:gap-3">
                  {general.techOptions.map((t) => (
                    <li key={t} className="rounded-full border border-line bg-white px-4 py-2 text-base leading-normal font-medium text-ink lg:px-5">
                      {t}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p className="mt-4 flex items-start gap-2 text-sm leading-[1.8] text-muted">
              <Icon name="info" size={18} className="mt-0.5 shrink-0" />
              انتخاب نهایی پس از بررسی نیازهای پروژه و با هماهنگی شما انجام می‌شود.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-white p-6 lg:p-10">
            <h3 className="t-h3">عوامل مؤثر در انتخاب فناوری</h3>
            <ul className="mt-3 lg:mt-4">
              {TECH_FACTORS.map(([title, body]) => (
                <li key={title} className="grid grid-cols-[22px_minmax(0,1fr)] gap-3 border-t border-line py-4 lg:grid-cols-[24px_minmax(0,1fr)] lg:gap-4">
                  <Icon name="check-circle" size={22} className="text-brand" />
                  <div>
                    <h4 className="text-base leading-[1.9] font-semibold">{title}</h4>
                    <p className="text-sm leading-[1.8] text-ink-2">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 07 · faq */}
      {faqs.length > 0 && (
        <section className="section bg-white">
          <div className="mx-auto w-full max-w-[840px] px-5">
            <SectionHeading
              align="center"
              title="سؤال‌های متداول طراحی سایت"
              text={
                <>
                  اگر پاسخ سؤالتان اینجا نیست، آن را همراه با{" "}
                  <Link href="/contact" className="font-semibold underline-offset-[6px]">
                    درخواست مشاوره
                  </Link>{" "}
                  بفرستید.
                </>
              }
            />
            <div className="mt-6 lg:mt-12">
              <FaqList items={faqs} />
            </div>
          </div>
          <JsonLd data={faqJsonLd(faqs)} />
        </section>
      )}

      {/* 08 · cta */}
      <CtaSection padTop title={text.ctaTitle} text={text.ctaText} button="درخواست مشاوره طراحی سایت" />

      <JsonLd data={serviceLd} />
      <JsonLd
        data={await breadcrumbJsonLd([
          { name: "صفحه اصلی", path: "/" },
          { name: "طراحی سایت", path: "/web-design" },
        ])}
      />
    </>
  );
}
