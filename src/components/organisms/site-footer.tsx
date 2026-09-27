import Link from "next/link";

import { PENDING } from "@/modules/pages/contact-content";
import type { ContactSettings, GeneralSettings } from "@/modules/settings/types";

export function SiteFooter({
  general,
  contact,
}: {
  general: GeneralSettings;
  contact: ContactSettings;
}) {
  const linkClass =
    "inline-block py-1.5 text-sm leading-[1.8] text-inverse-muted no-underline hover:text-white";

  return (
    <footer className="on-inverse shrink-0 bg-inverse text-white">
      <div className="container-site grid gap-10 pt-12 pb-10 lg:grid-cols-[2fr_1fr_1fr_1.4fr] lg:gap-12 lg:pt-16 lg:pb-12">
        <div className="flex flex-col gap-4">
          <Link href="/" className="text-2xl leading-[1.6] font-bold text-white no-underline hover:text-white">
            {general.siteName}
          </Link>
          <p className="max-w-[340px] text-sm leading-[1.8] text-inverse-muted">{general.footerDescription}</p>
        </div>

        <div className="grid grid-cols-2 gap-10 lg:contents">
          <nav aria-label="خدمات" className="flex flex-col gap-3">
            <h2 className="text-base leading-normal font-semibold text-white">خدمات</h2>
            <ul className="flex flex-col gap-1">
              <li><Link href="/web-design" className={linkClass}>طراحی سایت</Link></li>
              <li><Link href="/seo" className={linkClass}>سئو</Link></li>
              <li><Link href="/services" className={linkClass}>همه خدمات</Link></li>
            </ul>
          </nav>
          <nav aria-label="دسترسی سریع" className="flex flex-col gap-3">
            <h2 className="text-base leading-normal font-semibold text-white">دسترسی سریع</h2>
            <ul className="flex flex-col gap-1">
              <li><Link href="/portfolio" className={linkClass}>نمونه‌کارها</Link></li>
              <li><Link href="/about" className={linkClass}>درباره ما</Link></li>
              <li><Link href="/contact" className={linkClass}>تماس با ما</Link></li>
            </ul>
          </nav>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-base leading-normal font-semibold text-white">تماس</h2>
          <ul className="flex flex-col gap-2 text-sm leading-[1.8] text-inverse-muted">
            <li>
              تلفن:{" "}
              {contact.phone ? (
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} dir="ltr" className="text-inverse-muted no-underline hover:text-white">
                  {contact.phone}
                </a>
              ) : (
                PENDING
              )}
            </li>
            <li>
              ایمیل:{" "}
              {contact.email ? (
                <a href={`mailto:${contact.email}`} dir="ltr" className="text-inverse-muted no-underline hover:text-white">
                  {contact.email}
                </a>
              ) : (
                PENDING
              )}
            </li>
            <li>
              شبکه‌های اجتماعی:{" "}
              {contact.socials.length > 0
                ? contact.socials.map((s, i) => (
                    <span key={s.url}>
                      {i > 0 && "، "}
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-inverse-muted hover:text-white">
                        {s.title}
                      </a>
                    </span>
                  ))
                : "[پس از تأیید]"}
            </li>
            <li>آدرس: {contact.address || PENDING}</li>
          </ul>
        </div>
      </div>
      <div className="container-site">
        <div className="flex flex-col gap-1 border-t border-ink-2 py-5 text-sm leading-[1.8] text-inverse-muted lg:flex-row lg:justify-between">
          <span>© {general.siteName} — تمامی حقوق محفوظ است.</span>
          <span>{general.footerNote}</span>
        </div>
      </div>
    </footer>
  );
}
