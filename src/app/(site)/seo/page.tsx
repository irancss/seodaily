import Link from "next/link";

import { Icon } from "@/components/icon";
import { JsonLd } from "@/components/json-ld";
import { CtaSection } from "@/components/site/cta";
import { FaqList } from "@/components/site/faq";
import { SerpMockup } from "@/components/site/mockups";
import { ButtonLink, cx, GridBackdrop, HeroBadge, IconTile, stepNo } from "@/components/site/ui";
import { getFaqs, getServicesByCategory, serviceHref } from "@/lib/data";
import { breadcrumbJsonLd, faqJsonLd, getSiteUrl, pageMetadata } from "@/lib/seo";
import { getPageText } from "@/lib/settings";

export function generateMetadata() {
  return pageMetadata("seo", "/seo");
}

const APPROACH = [
  ["بررسی داده‌ها", "مرور داده‌های سرچ کنسول، آنالیتیکس و وضعیت فعلی صفحات سایت.", "chevron-left"],
  ["شناسایی مشکلات و فرصت‌ها", "پیدا کردن خطاهای فنی، کمبودهای محتوایی و موضوعاتی که هنوز پوشش داده نشده‌اند.", "chevron-left"],
  ["تدوین اولویت‌ها", "مرتب کردن کارها بر اساس اثر احتمالی و منابعی که پروژه در اختیار دارد.", "prioritize"],
  ["اجرا", "انجام اصلاحات فنی، محتوایی و ساختاری طبق اولویت‌های تعیین‌شده.", "chevron-left"],
  ["اندازه‌گیری", "بررسی تغییرات بعد از اجرا با همان داده‌هایی که در شروع کار دیده شد.", "chevron-left"],
  ["بهبود", "اصلاح مسیر بر اساس نتایج و تعریف اولویت‌های دور بعد.", "cycle"],
];

const TECHNICAL = [
  "ساختار و ایندکس‌پذیری صفحات",
  <>
    سرعت و <span dir="ltr">Core Web Vitals</span>
  </>,
  <>
    ساختار <span dir="ltr">URL</span> و لینک‌های داخلی
  </>,
  "داده‌های ساختاریافته",
  "خطاهای خزش و ریدایرکت‌ها",
];
const CONTENT = [
  "تحقیق کلمات کلیدی و نیت جست‌وجو",
  "معماری محتوا و خوشه‌های موضوعی",
  "بهینه‌سازی صفحات موجود",
  "برنامه تولید محتوا",
  "هماهنگی محتوا با مسیر فروش",
];
const FACTORS = ["وضعیت فعلی سایت", "رقابت بازار", "منابع پروژه", "سابقه دامنه"];

function Half({
  tone,
  icon,
  eyebrow,
  title,
  text,
  items,
  link,
}: {
  tone: "white" | "soft";
  icon: string;
  eyebrow: string;
  title: string;
  text: string;
  items: React.ReactNode[];
  link?: { href: string; label: string };
}) {
  return (
    <div
      className={cx(
        "flex flex-col items-start px-5 py-16 lg:py-24",
        tone === "white"
          ? "bg-white lg:border-l lg:border-line lg:pr-[max(20px,calc((100vw-1200px)/2))] lg:pl-16"
          : "border-t border-line bg-soft lg:border-t-0 lg:pr-16 lg:pl-[max(20px,calc((100vw-1200px)/2))]",
      )}
    >
      <span className="inline-flex items-center gap-3">
        <IconTile name={icon} size={44} iconSize={22} tone={tone === "white" ? "soft" : "white"} />
        <span dir="ltr" className="text-sm leading-[1.7] font-medium text-muted">
          {eyebrow}
        </span>
      </span>
      <h2 className="t-h2 mt-4 lg:mt-5">{title}</h2>
      <p className="body-lg mt-3 lg:mt-4">{text}</p>
      <ul className="mt-6 w-full border-t border-line lg:mt-8">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 border-b border-line py-3.5 text-base leading-[1.9] text-ink lg:items-center lg:gap-4 lg:py-4 lg:text-lg">
            <span
              aria-hidden="true"
              className={cx(
                "mt-[3px] flex size-6 shrink-0 items-center justify-center rounded-full text-brand lg:mt-0 lg:size-7",
                tone === "white" ? "bg-soft" : "bg-white",
              )}
            >
              <Icon name="check" size={16} />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {link && (
        <Link href={link.href} className="text-link mt-5 lg:mt-8">
          {link.label}
          <Icon name="arrow-left" />
        </Link>
      )}
    </div>
  );
}

export default async function SeoPage() {
  const [text, services, faqs, base] = await Promise.all([
    getPageText("seo"),
    getServicesByCategory("seo"),
    getFaqs("seo"),
    getSiteUrl(),
  ]);
  const technical = services.find((s) => s.slug === "technical-seo");
  const content = services.find((s) => s.slug === "content-strategy");

  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "سئو",
    serviceType: "Search engine optimization",
    description: text.metaDescription || text.subtitle,
    provider: { "@id": `${base}/#organization` },
    url: `${base}/seo`,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "خدمات سئو",
      itemListElement: services.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.title, url: `${base}${serviceHref(s.slug)}` },
      })),
    },
  };

  return (
    <>
      {/* 01 · hero */}
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

      {/* 02 · services grid */}
      {services.length > 0 && (
        <section id="seo-services" className="section bg-white">
          <div className="container-site">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
              <div className="flex max-w-[560px] flex-col gap-1 lg:gap-2">
                <span dir="ltr" className="self-start text-sm leading-[1.7] font-medium text-muted">
                  SEO Services
                </span>
                <h2 className="t-h2">بخش‌های مختلف خدمات سئو</h2>
              </div>
              <p className="body-lg lg:max-w-[520px]">
                هر پروژه بسته به نتیجه بررسی اولیه، ترکیبی از این خدمات را شامل می‌شود؛ لازم نیست همه آن‌ها از روز
                اول شروع شوند.
              </p>
            </div>
            {/* Mobile: a hairline list; desktop: a 4-column hairline grid. */}
            <ul className="mt-6 border-t border-line lg:mt-12 lg:grid lg:grid-cols-4">
              {services.map((s) => (
                <li key={s.slug} className="border-b border-line lg:border-l lg:[&:nth-child(4n)]:border-l-0">
                  <Link
                    href={serviceHref(s.slug)}
                    className="card-link grid h-full grid-cols-[28px_minmax(0,1fr)] gap-3.5 py-5 text-ink no-underline hover:text-ink lg:flex lg:flex-col lg:gap-0 lg:px-7 lg:py-8"
                  >
                    <span aria-hidden="true" className="pt-1 text-brand lg:pt-0">
                      <Icon name={s.icon} size={28} strokeWidth={1.75} />
                    </span>
                    <div className="lg:contents">
                      <div className="flex items-center justify-between gap-2 lg:contents">
                        <h3 className="card-title t-h3 lg:mt-5">{s.title}</h3>
                        <span aria-hidden="true" className="flex text-brand lg:hidden">
                          <Icon name="chevron-left" size={18} />
                        </span>
                      </div>
                      {s.englishTitle && (
                        <span dir="ltr" className="block text-right text-sm leading-[1.7] font-medium text-muted lg:self-start">
                          {s.englishTitle}
                        </span>
                      )}
                      <p className="mt-2 text-base leading-[1.9] text-ink-2 lg:mt-3">{s.summary}</p>
                    </div>
                    <span className="mt-auto hidden items-center gap-2 pt-5 text-sm leading-[1.7] font-semibold text-brand lg:inline-flex">
                      جزئیات خدمت
                      <span aria-hidden="true" className="arrow-badge size-8 border border-line">
                        <Icon name="arrow-left" size={16} />
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 03 · approach */}
      <section className="section">
        <div className="container-site grid items-start gap-8 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-16">
          <div className="flex flex-col gap-2 lg:sticky lg:top-[104px] lg:gap-4">
            <span className="text-sm leading-[1.7] font-medium text-brand-hover">روش کار</span>
            <h2 className="t-h2">سئو را از حدس شروع نمی‌کنیم</h2>
            <p className="body-lg mt-1 lg:mt-0">
              هر اقدام باید به یک داده، یک مشکل مشخص یا یک فرصت قابل بررسی برگردد. مسیر کار شش مرحله دارد که پشت
              سر هم تکرار می‌شوند.
            </p>
          </div>
          <div>
            {/* Mobile: a vertical timeline; desktop: a 3×2 connected grid. */}
            <ol className="relative flex flex-col gap-6 lg:grid lg:grid-cols-3 lg:gap-x-8 lg:gap-y-14">
              <li aria-hidden="true" className="absolute top-[22px] right-[21px] bottom-[22px] w-0.5 bg-brand/25 lg:hidden" />
              {APPROACH.map(([title, body, icon], i) => (
                <li key={title} className="relative grid grid-cols-[44px_minmax(0,1fr)] gap-4 lg:flex lg:flex-col lg:gap-0">
                  <span className="flex size-11 items-center justify-center rounded-full border-2 border-brand bg-white text-base font-bold text-brand lg:hidden">
                    {stepNo(i)}
                  </span>
                  <div className="hidden items-center gap-4 lg:flex">
                    <span className="text-5xl leading-[1.5] font-bold text-brand">{stepNo(i)}</span>
                    <span aria-hidden="true" className="flex grow items-center text-brand">
                      <span className="h-0.5 grow bg-brand/25" />
                      <Icon name={icon} />
                    </span>
                  </div>
                  <div className="pt-1 lg:pt-0">
                    <h3 className="t-h3 lg:mt-3">{title}</h3>
                    <p className="mt-1 text-base leading-[1.9] text-ink-2 lg:mt-2">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex items-start gap-3 rounded-md border border-line bg-soft p-4 lg:mt-12 lg:items-center lg:gap-4 lg:px-5 lg:py-4">
              <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-brand lg:size-10">
                <Icon name="cycle" />
              </span>
              <p className="text-base leading-[1.9] text-ink-2">
                <strong className="font-semibold text-ink">این چرخه به‌صورت مداوم تکرار می‌شود.</strong> نتیجه مرحله
                06، نقطه شروع دور بعدی از مرحله 01 است.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 04 · technical / content */}
      <section className="grid border-y border-line lg:grid-cols-2">
        <Half
          tone="white"
          icon="code"
          eyebrow="Technical SEO"
          title="سئوی فنی"
          text="سئوی فنی مطمئن می‌شود موتورهای جست‌وجو بتوانند صفحات سایت را بدون مانع پیدا کنند، بخوانند و درست ایندکس کنند."
          items={TECHNICAL}
          link={technical ? { href: serviceHref(technical.slug), label: "جزئیات سئو تکنیکال" } : undefined}
        />
        <Half
          tone="soft"
          icon="file"
          eyebrow="Content SEO"
          title="سئو و محتوا"
          text="محتوا باید به سؤال واقعی مخاطب پاسخ دهد و در ساختاری قرار بگیرد که هم کاربر و هم موتور جست‌وجو مسیرش را بفهمند."
          items={CONTENT}
          link={content ? { href: serviceHref(content.slug), label: "جزئیات استراتژی محتوا" } : undefined}
        />
      </section>

      {/* 05 · expectations */}
      <section className="section">
        <div className="container-site">
          <div aria-hidden="true" className="relative h-px bg-line">
            <span className="absolute -top-px right-0 h-[3px] w-20 bg-brand lg:w-[120px]" />
          </div>
          <span className="mt-6 block text-sm leading-[1.7] font-medium text-brand-hover lg:mt-8">انتظار واقع‌بینانه از سئو</span>
          <h2 className="t-h1 mt-3 max-w-[980px] lg:mt-4">سئو یک پروژه کوتاه‌مدت با نتیجه تضمینی نیست</h2>
          {/* Mobile order: statement, factors, then the explanation. */}
          <div className="mt-5 flex flex-col lg:mt-10 lg:grid lg:grid-cols-[7fr_5fr] lg:items-start lg:gap-16">
            <div className="contents lg:flex lg:flex-col lg:gap-4">
              <p className="text-base leading-[1.9] text-ink lg:text-lg">
                سرعت و میزان نتیجه به عوامل مختلفی مانند وضعیت فعلی سایت، رقابت بازار، منابع پروژه و سابقه دامنه
                وابسته است.
              </p>
              <p className="order-last mt-6 text-base leading-[1.9] text-ink-2 lg:mt-0">
                به همین دلیل در هیچ مرحله‌ای از همکاری، زمان یا رتبه مشخصی وعده داده نمی‌شود. به‌جای آن، برنامه کار و
                معیارهای سنجش پیشرفت از ابتدا شفاف تعریف می‌شوند.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3 lg:mt-0">
              <span className="text-sm leading-[1.7] font-medium text-muted">عوامل اثرگذار بر مسیر پروژه</span>
              <ul className="flex flex-wrap gap-2">
                {FACTORS.map((f) => (
                  <li key={f} className="pill px-3.5 py-1 lg:px-4 lg:py-1.5">
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 06 · faq */}
      {faqs.length > 0 && (
        <section className="section bg-white">
          <div className="container-site">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
              <div className="flex max-w-[640px] flex-col gap-3">
                <h2 className="t-h2">سؤال‌های رایج درباره سئو</h2>
                <p className="body-lg">پاسخ‌ها کلی هستند؛ جزئیات هر پروژه بعد از بررسی سایت مشخص می‌شود.</p>
              </div>
              <Link href="/contact" className="text-link hidden shrink-0 lg:inline-flex">
                سؤال دیگری دارید؟
              </Link>
            </div>
            <div className="mt-6 lg:mt-10">
              <FaqList items={faqs} variant="numbered" />
            </div>
            <Link href="/contact" className="text-link mt-5 lg:hidden">
              سؤال دیگری دارید؟
            </Link>
          </div>
          <JsonLd data={faqJsonLd(faqs)} />
        </section>
      )}

      {/* 07 · cta */}
      <CtaSection variant="open" title={text.ctaTitle} text={text.ctaText} button="درخواست بررسی سئو" />

      <JsonLd data={serviceLd} />
      <JsonLd
        data={await breadcrumbJsonLd([
          { name: "صفحه اصلی", path: "/" },
          { name: "سئو", path: "/seo" },
        ])}
      />
    </>
  );
}
