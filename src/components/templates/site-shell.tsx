import type { ReactNode } from "react";

import { JsonLd } from "@/components/atoms";
import { SiteFooter, SiteHeader } from "@/components/organisms";
import type { ContactSettings, GeneralSettings } from "@/modules/settings/types";

type Props = {
  general: GeneralSettings;
  contact: ContactSettings;
  /** Organization structured data, rendered after the footer. */
  jsonLd: unknown;
  children: ReactNode;
};

/** Public site skeleton: skip link, header, main content and footer. */
export function SiteShell({ general, contact, jsonLd, children }: Props) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#content"
        className="sr-only z-50 rounded-sm bg-white px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:right-2"
      >
        پرش به محتوا
      </a>
      <SiteHeader siteName={general.siteName} />
      <main id="content" className="flex grow flex-col">
        {children}
      </main>
      <SiteFooter general={general} contact={contact} />
      <JsonLd data={jsonLd} />
    </div>
  );
}
