import type { ReactNode } from "react";

import { JsonLd } from "@/components/atoms";
import { FloatingCall } from "@/components/molecules";
import { SiteFooter, SiteHeader } from "@/components/organisms";
import type { Menus } from "@/modules/menus/types";
import type { ContactSettings, GeneralSettings } from "@/modules/settings/types";

type Props = {
  general: GeneralSettings;
  contact: ContactSettings;
  menus: Menus;
  /** Organization structured data, rendered after the footer. */
  jsonLd: unknown;
  children: ReactNode;
};

/** Public site skeleton: skip link, header, main content and footer. */
export function SiteShell({ general, contact, menus, jsonLd, children }: Props) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#content"
        className="sr-only z-50 rounded-sm bg-white focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:px-4 focus:py-2"
      >
        پرش به محتوا
      </a>
      <SiteHeader siteName={general.siteName} menus={menus} phone={contact.phone} />
      <main id="content" className="flex grow flex-col">
        {children}
      </main>
      <SiteFooter general={general} contact={contact} />
      {contact.phone && <FloatingCall phone={contact.phone} />}
      <JsonLd data={jsonLd} />
    </div>
  );
}
