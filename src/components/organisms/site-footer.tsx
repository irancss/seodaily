import Link from "next/link";

import { BrandMark } from "@/components/atoms/brand-mark";
import { Icon } from "@/components/atoms/icon";
import { formatPhone, phoneE164 } from "@/lib/utils";
import type { ContactSettings, GeneralSettings } from "@/modules/settings/types";

const SERVICE_LINKS = [
  { href: "/web-design", label: "طراحی سایت" },
  { href: "/seo", label: "سئو" },
  { href: "/pricing", label: "تعرفه‌ها و ماشین‌حساب" },
  { href: "/services", label: "همه خدمات" },
];

const QUICK_LINKS = [
  { href: "/portfolio", label: "نمونه‌کارها" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس و درخواست مشاوره" },
];

function LinkColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title} className="flex flex-col gap-3">
      <h2 className="text-base leading-normal font-semibold text-white">{title}</h2>
      <ul className="flex flex-col gap-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group inline-flex items-center gap-2 py-1.5 text-sm leading-[1.8] text-inverse-muted no-underline hover:text-white"
            >
              <span aria-hidden="true" className="h-px w-0 bg-cyan-400 transition-all duration-300 group-hover:w-3" />
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter({ general, contact }: { general: GeneralSettings; contact: ContactSettings }) {
  return (
    <footer className="surface-dark shrink-0 overflow-hidden pb-24 lg:pb-0">
      <div aria-hidden="true" className="h-px bg-gradient-to-l from-transparent via-cyan-400/70 to-transparent" />
      <div aria-hidden="true" className="orb orb-blue -top-40 -left-40 size-[480px] opacity-40" />
      <div aria-hidden="true" className="orb orb-cyan -right-32 -bottom-48 size-[420px] opacity-30" style={{ ["--i" as string]: 1 }} />

      <div className="container-site grid gap-10 pt-14 pb-10 lg:grid-cols-[1.6fr_1fr_1fr_1.4fr] lg:gap-12 lg:pt-20 lg:pb-14">
        <div className="flex flex-col items-start gap-5">
          <BrandMark name={general.siteName} logo={general.footerLogo} inverse />
          <p className="max-w-[360px] text-sm leading-[1.9] text-inverse-muted">{general.footerDescription}</p>
          <Link href="/contact" className="btn btn-glass h-11 px-5 text-sm">
            درخواست مشاوره
            <Icon name="arrow-left" size={18} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-10 lg:contents">
          <LinkColumn title="خدمات" links={SERVICE_LINKS} />
          <LinkColumn title="دسترسی سریع" links={QUICK_LINKS} />
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-base leading-normal font-semibold text-white">تماس با ما</h2>
          {contact.phone ? (
            <a
              href={`tel:${phoneE164(contact.phone)}`}
              className="glass-card group flex items-center gap-3 rounded-md p-3 text-white no-underline hover:text-white"
            >
              <span aria-hidden="true" className="icon-gradient size-10 rounded-full">
                <Icon name="phone" size={18} />
              </span>
              <span className="flex flex-col">
                <span className="text-xs text-inverse-muted">تلفن و موبایل</span>
                <span dir="ltr" className="text-lg font-bold tracking-wide">
                  {formatPhone(contact.phone)}
                </span>
              </span>
            </a>
          ) : null}
          {(contact.email || contact.address) && (
            <ul className="flex flex-col gap-2 text-sm leading-[1.8] text-inverse-muted">
              {contact.email && (
                <li className="flex items-start gap-2">
                  <Icon name="mail" size={18} className="mt-0.5 shrink-0 text-cyan-300" />
                  <a href={`mailto:${contact.email}`} dir="ltr" className="text-inverse-muted no-underline hover:text-white">
                    {contact.email}
                  </a>
                </li>
              )}
              {contact.address && (
                <li className="flex items-start gap-2">
                  <Icon name="pin" size={18} className="mt-0.5 shrink-0 text-cyan-300" />
                  <span>{contact.address}</span>
                </li>
              )}
            </ul>
          )}
          {contact.socials.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {contact.socials.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center rounded-full border border-white/15 px-3 text-xs text-inverse-muted no-underline hover:border-cyan-300 hover:text-white"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="container-site">
        <div className="flex flex-col gap-1 border-t border-white/10 py-5 text-sm leading-[1.8] text-inverse-muted lg:flex-row lg:justify-between">
          <span>© {general.siteName} — تمامی حقوق محفوظ است.</span>
          <span>{general.footerNote}</span>
        </div>
      </div>
    </footer>
  );
}
