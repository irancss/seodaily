import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteShell } from "@/components/templates";
import { getMenus } from "@/modules/menus/queries";
import { getSiteUrl, organizationJsonLd } from "@/modules/seo/metadata";
import { getContact, getGeneral } from "@/modules/settings/queries";

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
  const [general, contact, menus, orgLd] = await Promise.all([getGeneral(), getContact(), getMenus(), organizationJsonLd()]);
  return (
    <SiteShell general={general} contact={contact} menus={menus} jsonLd={orgLd}>
      {children}
    </SiteShell>
  );
}
