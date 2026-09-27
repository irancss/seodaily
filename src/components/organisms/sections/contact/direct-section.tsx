import type { ReactNode } from "react";

import { IconTile, PhoneLink, type IconName } from "@/components/atoms";
import type { ContactSettings, PageText } from "@/modules/settings/types";

type Props = {
  text: PageText;
  contact: ContactSettings;
};

/** Direct contact channels (side column of the contact page); only the ones set in the settings. */
export function ContactDirectSection({ text, contact }: Props) {
  // A link inside `value` may stretch over its whole card (`after:inset-0`).
  const channels: { icon: IconName; title: string; value: ReactNode }[] = [];
  if (contact.phone) {
    channels.push({
      icon: "phone",
      title: "تلفن",
      value: (
        <PhoneLink
          phone={contact.phone}
          showIcon={false}
          className="text-lg leading-[1.7] font-bold text-ink after:absolute after:inset-0 after:rounded-xl hover:text-brand"
        />
      ),
    });
  }
  if (contact.email) {
    channels.push({
      icon: "mail",
      title: "ایمیل",
      value: (
        <a
          href={`mailto:${contact.email}`}
          dir="ltr"
          className="block truncate text-base leading-[1.8] font-semibold text-ink no-underline after:absolute after:inset-0 after:rounded-xl hover:text-brand"
        >
          {contact.email}
        </a>
      ),
    });
  }
  if (contact.socials.length > 0) {
    channels.push({
      icon: "share",
      title: "شبکه‌های اجتماعی",
      value: (
        <span className="flex flex-wrap gap-x-3 gap-y-1">
          {contact.socials.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-8 items-center text-base leading-[1.8] font-semibold text-ink hover:text-brand"
            >
              {s.title}
            </a>
          ))}
        </span>
      ),
    });
  }
  if (contact.address) {
    channels.push({
      icon: "pin",
      title: "آدرس",
      value: <span className="text-base leading-[1.9] text-ink">{contact.address}</span>,
    });
  }

  return (
    <section id="contact-direct" aria-labelledby="cd-title" className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6 lg:p-7">
      <h2 id="cd-title" className="text-xl leading-[1.65] font-bold lg:text-2xl lg:leading-[1.6]">
        {text.ctaTitle}
      </h2>
      <p className="mt-1 text-sm leading-[1.8] text-muted lg:text-base lg:leading-[1.9]">{text.ctaText}</p>
      {channels.length > 0 && (
        <ul className="mt-5 flex flex-col gap-3">
          {channels.map((c) => (
            <li
              key={c.title}
              className="relative flex items-center gap-4 rounded-xl border border-line bg-page p-4 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
            >
              <IconTile name={c.icon} tone="gradient" className="size-11 rounded-[12px]" iconSize={20} />
              <div className="min-w-0 grow">
                <h3 className="text-sm leading-[1.7] font-medium text-muted">{c.title}</h3>
                {c.value}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
