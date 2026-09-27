import type { Metadata } from "next";
import type { ReactNode } from "react";

import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { getSiteUrl, organizationJsonLd } from "@/lib/seo";
import { getContact, getGeneral } from "@/lib/settings";

// Pages render per request from the tagged data cache (see lib/cache.ts), so
// admin edits show up immediately without a rebuild.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [general, base] = await Promise.all([getGeneral(), getSiteUrl()]);
  return {
    metadataBase: new URL(base),
    title: { default: general.siteName, template: `%s | ${general.siteName}` },
    description: general.footerDescription,
    applicationName: general.siteName,
    formatDetection: { telephone: false },
    ...(general.googleVerification ? { verification: { google: general.googleVerification } } : {}),
  };
}

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [general, contact, orgLd] = await Promise.all([getGeneral(), getContact(), organizationJsonLd()]);
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
      <JsonLd data={orgLd} />
    </div>
  );
}
