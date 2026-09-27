import Link from "next/link";

import { Icon } from "@/components/icon";
import { JsonLd } from "@/components/json-ld";
import { FaqList } from "@/components/site/faq";
import { HomeHeroMockup } from "@/components/site/mockups";
import { ProjectCard } from "@/components/site/project-card";
import {
  ArrowBadge,
  ButtonLink,
  GridBackdrop,
  HeroBadge,
  IconTile,
  SectionHeading,
  stepNo,
} from "@/components/site/ui";
import { COLLAB_PROCESS } from "@/lib/content";
import { getCategories, getFaqs, getPublishedProjects, getServicesByCategory } from "@/lib/data";
import { faqJsonLd, pageMetadata } from "@/lib/seo";
import { getGeneral, getPageText } from "@/lib/settings";

export function generateMetadata() {
  return pageMetadata("home", "/");
}

const WHY_US = [
  ["طراحی متناسب با کسب‌وکار", "هر کسب‌وکار نیاز، مخاطب و مسیر فروش متفاوتی دارد."],
  ["ساختار فنی قابل توسعه", "سایت باید امروز نیاز کسب‌وکار را پاسخ دهد و فردا محدودش نکند."],
  ["توجه همزمان به کاربر و سئو", "ساختار صفحات از ابتدا با تجربه کاربری و موتور جست‌وجو هماهنگ شود."],
  ["تصمیم بر اساس داده", "در پروژه‌های سئو، تصمیم‌ها باید بر اساس داده و وضعیت واقعی سایت باشند."],
];


const CATEGORY_UI: Record<string, { icon: string; href: string; cta: string }> = {
  "web-design": { icon: "layout", href: "/web-design", cta: "مشاهده خدمات طراحی سایت" },
  seo: { icon: "search-minus", href: "/seo", cta: "مشاهده خدمات سئو" },
};

export default async function HomePage() {
  const [text, general, categories, webServices, seoServices, projects, faqs] = await Promise.all([
    getPageText("home"),
    getGeneral(),
    getCategories(),
    getServicesByCategory("web-design"),
    getServicesByCategory("seo"),
    getPublishedProjects(),
    getFaqs("home"),
  ]);
  const tags: Record<string, string[]> = {
    "web-design": webServices.slice(0, 4).map((s) => s.title),
    seo: seoServices.slice(0, 4).map((s) => s.title),
  };
  const featured = projects.slice(0, 3);
  const heroImage = projects.find((p) => p.imageUrl)?.imageUrl;

  return (
    <>
      {/* 01 · hero */}
      <section className="relative overflow-hidden pt-10 pb-12 lg:pt-24 lg:pb-28">
        <GridBackdrop className="opacity-60" />
        <div className="container-site relative grid items-center gap-10 lg:grid-cols-[520px_minmax(0,1fr)] lg:gap-16">
          <div className="flex flex-col items-start">
            <HeroBadge>{text.badge}</HeroBadge>
            <h1 className="t-hero mt-4 lg:mt-6">{text.title}</h1>
            <p className="body-lg mt-4 lg:mt-6">{text.subtitle}</p>
            <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4 lg:mt-10">
              <ButtonLink href="/contact" arrow>
                درخواست مشاوره
              </ButtonLink>
              <ButtonLink href="/portfolio" variant="secondary" className="px-6">
                مشاهده نمونه‌کارها
              </ButtonLink>
            </div>
          </div>
          <HomeHeroMockup imageUrl={heroImage} />
        </div>
      </section>

      {/* 02 · services intro */}
      <section className="section bg-white">
        <div className="container-site">
          <div className="grid gap-3 lg:grid-cols-2 lg:items-end lg:gap-16">
            <h2 className="t-h2">برای رشد آنلاین، از کجا شروع کنیم؟</h2>
            <p className="body-lg">
              بسته به وضعیت فعلی کسب‌وکار، ممکن است به یک سایت جدید، بازطراحی سایت فعلی، سئو یا ترکیبی از این
              خدمات نیاز داشته باشید.
            </p>
          </div>
          <div className="mt-8 grid gap-4 lg:mt-14 lg:grid-cols-2 lg:gap-6">
            {categories.map((category, i) => {
              const ui = CATEGORY_UI[category.slug] ?? CATEGORY_UI["web-design"];
              return (
                <article key={category.slug} className="flex flex-col rounded-xl border border-line bg-page p-6 lg:p-10">
                  <div className="flex items-center justify-between lg:items-start">
                    <span className="t-h2 text-brand">{stepNo(i)}</span>
                    <IconTile name={ui.icon} className="size-12 lg:size-14" />
                  </div>
                  <h3 className="mt-4 text-xl leading-[1.65] font-semibold lg:mt-6 lg:text-2xl lg:leading-[1.6] lg:font-bold">
                    {category.title}
                  </h3>
                  <p className="mt-2 text-base leading-[1.9] text-ink-2 lg:mt-3">{category.description}</p>
                  {tags[category.slug]?.length > 0 && (
                    <ul className="mt-5 flex flex-wrap gap-2 lg:mt-6">
                      {tags[category.slug].map((t) => (
                        <li key={t} className="pill">
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                  <ButtonLink href={ui.href} variant="secondary" size="sm" arrow className="mt-6 lg:mt-8 lg:self-start">
                    {ui.cta}
                  </ButtonLink>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 03 · why us */}
      <section className="section">
        <div className="container-site grid items-start gap-8 lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-24">
          <div className="flex flex-col gap-3 lg:gap-4">
            <h2 className="t-h2">فقط ظاهر سایت مهم نیست</h2>
            <p className="body-lg">
              سایتی که خوب دیده شود اما ساختار درستی نداشته باشد، کمکی به رشد کسب‌وکار نمی‌کند. این اصول در همه
              پروژه‌ها کنار هم در نظر گرفته می‌شوند.
            </p>
          </div>
          <ol className="border-t border-line">
            {WHY_US.map(([title, body], i) => (
              <li key={title} className="grid grid-cols-[44px_minmax(0,1fr)] border-b border-line py-6 lg:grid-cols-[72px_minmax(0,1fr)] lg:py-8">
                <span className="text-xl leading-[1.65] font-bold text-brand lg:text-2xl lg:leading-[1.6]">{stepNo(i)}</span>
                <div>
                  <h3 className="text-xl leading-[1.65] font-semibold lg:text-2xl lg:leading-[1.6] lg:font-bold">{title}</h3>
                  <p className="body-lg mt-1 lg:mt-2">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 04 · portfolio */}
      {featured.length > 0 && (
        <section className="section bg-white">
          <div className="container-site">
            <SectionHeading
              title="بخشی از پروژه‌ها"
              text="نمونه‌هایی از طراحی‌ها و پروژه‌هایی که روی آن‌ها کار شده است."
              action={
                <ButtonLink href="/portfolio" variant="secondary" size="sm" arrow>
                  مشاهده همه نمونه‌کارها
                </ButtonLink>
              }
            />
            <div className="mt-8 grid gap-8 lg:mt-14 lg:grid-cols-[7fr_5fr] lg:grid-rows-[auto_auto] lg:gap-x-6">
              {featured.map((project, i) => (
                <ProjectCard key={project.id} project={project} large={i === 0} />
              ))}
            </div>
            <ButtonLink href="/portfolio" variant="secondary" arrow className="mt-8 w-full lg:hidden">
              مشاهده همه نمونه‌کارها
            </ButtonLink>
          </div>
        </section>
      )}

      {/* 05 · process */}
      <section className="section bg-soft">
        <div className="container-site">
          <div className="grid gap-3 lg:grid-cols-2 lg:items-end lg:gap-16">
            <h2 className="t-h2">مسیر همکاری چطور پیش می‌رود؟</h2>
            <p className="body-lg">هر پروژه از شناخت شروع می‌شود و بعد از اجرا هم با ارزیابی ادامه پیدا می‌کند.</p>
          </div>
          <ol className="relative mt-8 grid gap-6 lg:mt-16 lg:grid-cols-4 lg:gap-8">
            <li aria-hidden="true" className="absolute top-[22px] bottom-[22px] right-[21px] w-0.5 bg-brand/25 lg:inset-x-7 lg:top-[27px] lg:bottom-auto lg:h-0.5 lg:w-auto" />
            {COLLAB_PROCESS.map(([title, body], i) => (
              <li key={title} className="relative grid grid-cols-[44px_minmax(0,1fr)] gap-4 lg:flex lg:flex-col lg:gap-0">
                <span
                  className={
                    "flex size-11 items-center justify-center rounded-full border-2 border-brand text-base font-bold lg:size-14 lg:text-xl " +
                    (i === COLLAB_PROCESS.length - 1 ? "bg-brand text-white" : "bg-white text-brand")
                  }
                >
                  {stepNo(i)}
                </span>
                <div className="pt-1 lg:pt-0">
                  <h3 className="t-h3 lg:mt-6">{title}</h3>
                  <p className="mt-1 text-base leading-[1.9] text-ink-2 lg:mt-2">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 06 · industries */}
      {general.industries.length > 0 && (
        <section className="section">
          <div className="container-site">
            <SectionHeading
              align="stack"
              title="برای کسب‌وکارهای مختلف"
              text="هر صنف مخاطب، رقبا و مسیر تصمیم‌گیری خودش را دارد؛ ساختار سایت و برنامه سئو هم باید بر همین اساس تعریف شود."
            />
            {/* Mobile: one white panel with rows; desktop: a grid of tiles. */}
            <ul className="mt-6 rounded-md border border-line bg-white px-4 lg:mt-12 lg:grid lg:grid-cols-4 lg:gap-4 lg:border-0 lg:bg-transparent lg:px-0">
              {general.industries.map((item) => (
                <li key={item.title} className="border-b border-line last:border-b-0 lg:border-b-0">
                  <Link
                    href={item.url || "/contact"}
                    className="card-link flex h-14 items-center justify-between gap-3 text-base leading-normal font-semibold text-ink no-underline hover:text-ink lg:h-[88px] lg:rounded-md lg:border lg:border-line lg:bg-white lg:px-6 lg:text-xl lg:leading-[1.65]"
                  >
                    {item.title}
                    <span aria-hidden="true" className="flex text-brand lg:hidden">
                      <Icon name="chevron-left" size={18} />
                    </span>
                    <span className="hidden lg:block">
                      <ArrowBadge size={40} variant="soft" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 08 · faq */}
      {faqs.length > 0 && (
        <section className="section bg-white">
          <div className="container-site grid items-start gap-6 lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-24">
            <div className="flex flex-col gap-3 lg:gap-4">
              <h2 className="t-h2">سؤال‌های متداول</h2>
              <p className="body-lg">اگر پاسخ سؤالتان در این فهرست نیست، آن را همراه با درخواست مشاوره برای ما بفرستید.</p>
              <Link href="/contact" className="text-link self-start">
                ارسال سؤال از طریق فرم مشاوره
              </Link>
            </div>
            <FaqList items={faqs} />
          </div>
          <JsonLd data={faqJsonLd(faqs)} />
        </section>
      )}

      {/* 09 · final CTA */}
      <section className="flex grow items-center py-16 lg:py-24">
        <div className="container-site">
          <div className="relative flex flex-col items-start gap-6 overflow-hidden rounded-xl border border-line bg-soft px-6 py-7 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:rounded-2xl lg:p-16">
            <div
              aria-hidden="true"
              className="grid-bg absolute inset-y-0 left-0 hidden w-[420px] lg:block"
              style={{ ["--grid" as string]: "32px", maskImage: "linear-gradient(270deg, transparent 0%, #000 100%)" }}
            />
            <div className="relative flex max-w-[680px] flex-col gap-3 lg:gap-4">
              <h2 className="t-h2">{text.ctaTitle}</h2>
              <p className="body-lg">{text.ctaText}</p>
            </div>
            <ButtonLink href="/contact" size="lg" arrow className="relative w-full shrink-0 sm:w-auto">
              درخواست مشاوره
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
