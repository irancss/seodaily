import type { ReactNode } from "react";

import { Icon, type IconName } from "@/components/atoms";
import { SectionHeading } from "@/components/molecules";
import { PENDING } from "@/modules/pages/contact-content";
import type { ContactSettings, PageText } from "@/modules/settings/types";

type Props = {
  text: PageText;
  contact: ContactSettings;
};

export function ContactDirectSection({ text, contact }: Props) {
  const channels: { icon: IconName; title: string; value: ReactNode }[] = [
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
  );
}
