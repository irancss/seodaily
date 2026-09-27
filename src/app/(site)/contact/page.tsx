import { GridBackdrop, HeroBadge, Icon, type IconName, JsonLd } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import { stepNo } from "@/lib/utils";
import { SERVICE_CHOICES } from "@/db/schema";
import { breadcrumbJsonLd, getSiteUrl, pageMetadata } from "@/modules/seo/metadata";
import { getContact, getGeneral, getPageText } from "@/modules/settings/queries";

import { ContactForm } from "@/components/organisms";

export function generateMetadata() {
  return pageMetadata("contact", "/contact");
}

const NEXT_STEPS = [
  "اطلاعات اولیه بررسی می‌شود.",
  "در صورت نیاز برای تکمیل اطلاعات با شما تماس گرفته می‌شود.",
  "مسیر مناسب همکاری مشخص می‌شود.",
];

const PENDING = "[پس از تأیید اضافه می‌شود]";

type Props = { searchParams: Promise<{ service?: string }> };

export default async function ContactPage({ searchParams }: Props) {
  const [{ service }, text, general, contact, base] = await Promise.all([
    searchParams,
    getPageText("contact"),
    getGeneral(),
    getContact(),
    getSiteUrl(),
  ]);
  const defaultService = SERVICE_CHOICES.find((s) => s === service);

  const channels: { icon: IconName; title: string; value: React.ReactNode }[] = [
    {
      icon: "phone",
      title: "تلفن",
      value: contact.phone ? (
        <a href={`tel:${contact.phone.replace(/\s/g, "")}`} dir="ltr" className="text-ink-2 no-underline hover:text-brand">
          {contact.phone}
        </a>
      ) : (
        PENDING
      ),
    },
    {
      icon: "mail",
      title: "ایمیل",
      value: contact.email ? (
        <a href={`mailto:${contact.email}`} dir="ltr" className="text-ink-2 no-underline hover:text-brand">
          {contact.email}
        </a>
      ) : (
        PENDING
      ),
    },
    {
      icon: "share",
      title: "شبکه‌های اجتماعی",
      value:
        contact.socials.length > 0 ? (
          <span className="flex flex-wrap gap-x-3">
            {contact.socials.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="text-ink-2 hover:text-brand">
                {s.title}
              </a>
            ))}
          </span>
        ) : (
          PENDING
        ),
    },
    { icon: "pin", title: "آدرس", value: contact.address || PENDING },
  ];

  return (
    <>
      {/* 01 · hero */}
      <section className="relative overflow-hidden pt-10 pb-8 lg:pt-20 lg:pb-12">
        <GridBackdrop className="opacity-60" />
        <div className="container-site relative flex flex-col items-start">
          <HeroBadge>{text.badge}</HeroBadge>
          <h1 className="t-h1 mt-4 lg:mt-6">{text.title}</h1>
          <p className="body-lg mt-4 max-w-[720px]">{text.subtitle}</p>
        </div>
      </section>

      {/* 02 · form + side column */}
      <section className="lg:pb-24">
        <div className="container-site grid items-start gap-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,3fr)] lg:gap-12">
          <div className="rounded-xl border border-line bg-white px-5 py-6 sm:p-10">
            <h2 id="cf-title" className="text-xl leading-[1.65] font-semibold lg:text-2xl lg:leading-[1.6] lg:font-bold">
              فرم درخواست مشاوره
            </h2>
            <p className="mt-1 text-sm leading-[1.8] text-muted lg:mt-2">
              فیلدهای ستاره‌دار (<span aria-hidden="true" className="text-error">*</span>) الزامی هستند.
            </p>
            <ContactForm budgets={general.budgets} defaultService={defaultService} />
          </div>

          {/* Mobile: the next steps become a full-width band after the form. */}
          <div className="-mx-5 flex flex-col gap-4 lg:sticky lg:top-24 lg:mx-0">
            <section aria-labelledby="ns-title" className="bg-soft px-5 py-16 lg:rounded-xl lg:p-10">
              <h2 id="ns-title" className="text-2xl leading-[1.6] font-bold">
                بعد از ارسال درخواست چه اتفاقی می‌افتد؟
              </h2>
              <ol className="relative mt-6 flex flex-col gap-6 lg:mt-8 lg:gap-7">
                <li aria-hidden="true" className="absolute top-[22px] right-[21px] bottom-[22px] w-0.5 bg-brand/25" />
                {NEXT_STEPS.map((step, i) => (
                  <li key={step} className="relative grid grid-cols-[44px_minmax(0,1fr)] items-start gap-4">
                    <span className="flex size-11 items-center justify-center rounded-full border-2 border-brand bg-white text-base leading-normal font-bold text-brand">
                      {stepNo(i)}
                    </span>
                    <p className="pt-1.5 text-base leading-[1.9] text-ink">{step}</p>
                  </li>
                ))}
              </ol>
            </section>
            <div className="hidden flex-col gap-1 rounded-md border border-line bg-white p-6 lg:flex">
              <p className="text-base leading-[1.9] font-semibold text-ink">ترجیح می‌دهید مستقیم در ارتباط باشید؟</p>
              <a href="#contact-direct" className="text-link self-start">
                مشاهده راه‌های ارتباطی
                <Icon name="arrow-down" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 03 · direct contact */}
      <section id="contact-direct" className="flex grow items-center border-line bg-white py-16 lg:border-t lg:py-20">
        <div className="container-site">
          <SectionHeading title={text.ctaTitle} text={text.ctaText} />
          <ul className="mt-6 rounded-md border border-line bg-page px-4 lg:mt-10 lg:grid lg:grid-cols-4 lg:rounded-none lg:border-x-0 lg:bg-transparent lg:px-0">
            {channels.map((c) => (
              <li
                key={c.title}
                className="grid grid-cols-[44px_minmax(0,1fr)] items-center gap-4 border-b border-line py-4 last:border-b-0 lg:flex lg:flex-col lg:items-stretch lg:border-r lg:border-b-0 lg:px-6 lg:py-8 lg:first:border-r-0 lg:first:pr-0 lg:last:pl-0"
              >
                <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-md bg-soft text-brand lg:size-12">
                  <Icon name={c.icon} size={22} />
                </span>
                <div>
                  <h3 className="text-base leading-normal font-semibold lg:text-xl lg:leading-[1.65]">{c.title}</h3>
                  <p className="mt-0.5 text-sm leading-[1.8] text-muted lg:mt-1 lg:text-base lg:leading-[1.9]">{c.value}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: text.title,
          url: `${base}/contact`,
          about: { "@id": `${base}/#organization` },
        }}
      />
      <JsonLd
        data={await breadcrumbJsonLd([
          { name: "صفحه اصلی", path: "/" },
          { name: "تماس با ما", path: "/contact" },
        ])}
      />
    </>
  );
}
