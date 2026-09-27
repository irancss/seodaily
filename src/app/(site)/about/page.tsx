import { ButtonLink, HeroBadge, Icon, JsonLd } from "@/components/atoms";
import { CtaSection, SystemDiagram } from "@/components/organisms";
import { cx, stepNo } from "@/lib/utils";
import { SectionHeading } from "@/components/molecules";
import { getTeam } from "@/modules/team/queries";
import { breadcrumbJsonLd, getSiteUrl, pageMetadata } from "@/modules/seo/metadata";
import { getPageText } from "@/modules/settings/queries";

export function generateMetadata() {
  return pageMetadata("about", "/about");
}

const PRINCIPLES = [
  ["سادگی", "هر بخشی که به کاربر یا کسب‌وکار کمکی نکند کنار گذاشته می‌شود تا سایت ساده‌تر فهمیده و مدیریت شود."],
  ["شفافیت", "کارهای انجام‌شده، دلیل هر تصمیم و محدودیت‌های پروژه به‌روشنی با کارفرما در میان گذاشته می‌شود."],
  ["تصمیم مبتنی بر داده", "اولویت‌ها بر اساس وضعیت واقعی سایت، رفتار کاربران و داده‌های قابل اندازه‌گیری تعیین می‌شوند، نه حدس."],
  ["قابلیت توسعه", "ساختار سایت طوری ساخته می‌شود که افزودن صفحه، محصول یا بخش جدید در آینده به بازسازی کامل نیاز نداشته باشد."],
];

const METHOD = [
  ["شناخت", "آشنایی با کسب‌وکار، مخاطبان و هدف پروژه."],
  ["تحلیل", "بررسی وضعیت فعلی سایت، رقبا و نیاز کاربران."],
  ["برنامه‌ریزی", "تعیین ساختار، اولویت‌ها و ترتیب کارها."],
  ["اجرا", "طراحی، پیاده‌سازی و بهینه‌سازی طبق برنامه."],
  ["اندازه‌گیری", "بررسی نتیجه کارها با داده‌های قابل اندازه‌گیری."],
  ["بهبود", "اصلاح بخش‌هایی که به بهبود نیاز دارند."],
];

export default async function AboutPage() {
  const [text, team, base] = await Promise.all([getPageText("about"), getTeam(), getSiteUrl()]);

  return (
    <>
      {/* 01 · hero */}
      <section className="pt-10 pb-12 lg:py-24">
        <div className="container-site grid items-center gap-8 lg:grid-cols-[minmax(0,640fr)_minmax(0,496fr)] lg:gap-16">
          <div className="flex flex-col items-start">
            <HeroBadge>{text.badge}</HeroBadge>
            <h1 className="t-h1 mt-4 lg:mt-6">{text.title}</h1>
            <p className="body-lg mt-4 max-w-[600px] lg:mt-6">{text.subtitle}</p>
          </div>
          <SystemDiagram />
        </div>
      </section>

      {/* 02 · philosophy */}
      <section className="section bg-white">
        <div className="container-site">
          <div className="grid items-start gap-4 border-t border-line pt-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-24 lg:pt-10">
            <h2 className="t-h2">نگاه ما به پروژه</h2>
            <div>
              <p className="text-lg leading-[1.9] text-ink">
                قبل از انتخاب ابزار یا طراحی ظاهر، مسئله کسب‌وکار و نیاز کاربر بررسی می‌شود. هدف، ساخت راهکاری است
                که قابل استفاده، قابل مدیریت و قابل توسعه باشد.
              </p>
              <ul className="mt-6 flex flex-col border-t border-line lg:mt-10 lg:flex-row lg:flex-wrap lg:gap-x-10 lg:gap-y-4 lg:pt-6">
                {["قابل استفاده", "قابل مدیریت", "قابل توسعه"].map((t) => (
                  <li
                    key={t}
                    className="flex min-h-12 items-center gap-3 border-b border-line text-base leading-normal font-semibold text-ink lg:min-h-0 lg:border-b-0 lg:text-xl lg:leading-[1.65]"
                  >
                    <Icon name="check-round" size={22} className="text-brand" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 03 · principles */}
      <section className="section">
        <div className="container-site">
          <SectionHeading align="stack" title="اصول کاری ما" text="این چهار اصل در همه پروژه‌ها، از طراحی تا سئو، مبنای تصمیم‌گیری است." />
          <ol className="mt-8 border-t border-line lg:mt-12 lg:grid lg:grid-cols-4 lg:pt-10">
            {PRINCIPLES.map(([title, body], i) => (
              <li
                key={title}
                className={cx(
                  "grid grid-cols-[64px_minmax(0,1fr)] border-b border-line py-6",
                  "lg:flex lg:flex-col lg:border-b-0 lg:px-7 lg:py-0 lg:first:pr-0 lg:last:pl-0",
                  i > 0 && "lg:border-r",
                )}
              >
                <span className="text-4xl leading-[1.55] font-bold text-brand lg:text-5xl lg:leading-[1.5]">{stepNo(i)}</span>
                <div className="pt-2 lg:pt-0">
                  <h3 className="text-xl leading-[1.65] font-semibold lg:mt-4 lg:text-2xl lg:leading-[1.6] lg:font-bold">{title}</h3>
                  <p className="mt-1 text-base leading-[1.9] text-ink-2 lg:mt-2">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 04 · method */}
      <section className="section bg-white">
        <div className="container-site">
          <SectionHeading align="stack" title="چطور کار می‌کنیم؟" text="هر مرحله خروجی مشخصی دارد و ورودی مرحله بعد است." />
          <div className="mt-8 rounded-xl bg-soft px-5 py-6 lg:mt-12 lg:px-8 lg:py-10">
            <ol className="flex flex-col lg:grid lg:grid-cols-6">
              {METHOD.map(([title, body], i) => [
                i > 0 && (
                  <li key={`arrow-${i}`} aria-hidden="true" className="flex h-9 w-10 items-center justify-center text-brand lg:hidden">
                    <Icon name="arrow-down" size={18} />
                  </li>
                ),
                <li key={title} className="relative flex gap-4 lg:flex-col lg:gap-0 lg:px-5 lg:first:pr-0 lg:last:pl-0">
                  <span
                    className={cx(
                      "flex size-10 shrink-0 items-center justify-center rounded-sm border text-base leading-normal font-bold",
                      i === METHOD.length - 1 ? "border-brand bg-brand text-white" : "border-line bg-white text-brand",
                    )}
                  >
                    {stepNo(i)}
                  </span>
                  <div>
                    <h3 className="t-h3 lg:mt-4">{title}</h3>
                    <p className="mt-0.5 text-sm leading-[1.8] text-ink-2 lg:mt-2">{body}</p>
                  </div>
                  {i < METHOD.length - 1 && (
                    <Icon name="arrow-left" size={24} className="absolute top-2 -left-3 hidden text-brand lg:block" />
                  )}
                </li>,
              ])}
            </ol>
            <p className="mt-6 flex items-start gap-2 border-t border-line pt-4 text-sm leading-[1.8] text-ink-2 lg:mt-8 lg:items-center lg:pt-5">
              <Icon name="cycle-right" size={18} className="shrink-0 text-brand" />
              بهبود، نقطه شروع دور بعدی تحلیل است؛ این چرخه در طول همکاری ادامه پیدا می‌کند.
            </p>
          </div>
        </div>
      </section>

      {/* 05 · team */}
      <section className="section">
        <div className="container-site grid items-start gap-6 lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-24">
          <div className="flex flex-col gap-2 lg:gap-3">
            <h2 className="t-h2">تیم سئو دیلی</h2>
            <p className="text-sm leading-[1.8] text-muted lg:text-base lg:leading-[1.9]">افرادی که پروژه‌ها را طراحی، اجرا و پیگیری می‌کنند.</p>
          </div>
          {team.length > 0 ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((m) => (
                <li key={m.id} className="flex flex-col rounded-xl border border-line bg-white p-6">
                  {m.photoUrl ? (
                    <img src={m.photoUrl} alt={m.name} loading="lazy" className="size-20 rounded-full object-cover" />
                  ) : (
                    <span aria-hidden="true" className="flex size-20 items-center justify-center rounded-full bg-soft text-brand">
                      <Icon name="team" size={32} />
                    </span>
                  )}
                  <h3 className="t-h3 mt-4">{m.name}</h3>
                  {m.role && <p className="text-sm leading-[1.7] font-medium text-brand-hover">{m.role}</p>}
                  {m.bio && <p className="mt-2 text-sm leading-[1.8] text-ink-2">{m.bio}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-line-strong bg-white px-6 py-8 text-center lg:min-h-60 lg:p-10">
              <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-full bg-soft text-brand lg:size-16">
                <Icon name="team" size={28} />
              </span>
              <p className="text-base leading-[1.9] text-ink-2">اطلاعات تیم پس از تأیید اضافه می‌شود.</p>
            </div>
          )}
        </div>
      </section>

      {/* 06 · cta */}
      <CtaSection
        grid={false}
        title={text.ctaTitle}
        text={text.ctaText}
        secondary={
          <ButtonLink href="/portfolio" variant="secondary" size="lg" className="w-full lg:w-auto">
            مشاهده نمونه‌کارها
          </ButtonLink>
        }
      />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: text.title,
          url: `${base}/about`,
          about: { "@id": `${base}/#organization` },
        }}
      />
      <JsonLd
        data={await breadcrumbJsonLd([
          { name: "صفحه اصلی", path: "/" },
          { name: "درباره ما", path: "/about" },
        ])}
      />
    </>
  );
}
