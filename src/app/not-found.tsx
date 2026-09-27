import { SiteNotFound, SiteShell } from "@/components/templates";
import { getMenus } from "@/modules/menus/queries";
import { organizationJsonLd } from "@/modules/seo/metadata";
import { getContact, getGeneral } from "@/modules/settings/queries";

export const metadata = { title: "صفحه پیدا نشد", robots: { index: false } };

/** Unmatched URLs: the site's 404 inside the normal header and footer. */
export default async function NotFound() {
  const [general, contact, menus, orgLd] = await Promise.all([getGeneral(), getContact(), getMenus(), organizationJsonLd()]);
  return (
    <SiteShell general={general} contact={contact} menus={menus} jsonLd={orgLd}>
      <SiteNotFound />
    </SiteShell>
  );
}
