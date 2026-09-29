import { PageHeader } from "@/components/molecules";
import { MenuEditor, type MenuSuggestion } from "@/components/organisms/admin";
import { phoneE164 } from "@/lib/utils";
import { getMenus } from "@/modules/menus/queries";
import { serviceHref } from "@/modules/services/routes";
import { getServicesByCategory } from "@/modules/services/queries";
import { getContact } from "@/modules/settings/queries";

export const metadata = { title: "منوی سایت" };

const PAGES: MenuSuggestion[] = [
  { label: "صفحه اصلی", url: "/" },
  { label: "خدمات", url: "/services" },
  { label: "طراحی سایت", url: "/web-design" },
  { label: "سئو", url: "/seo" },
  { label: "تعرفه‌ها", url: "/pricing" },
  { label: "تعرفه طراحی سایت", url: "/pricing/web-design" },
  { label: "تعرفه سئو", url: "/pricing/seo" },
  { label: "تعرفه تولید محتوا", url: "/pricing/content" },
  { label: "نمونه‌کارها", url: "/portfolio" },
  { label: "درباره ما", url: "/about" },
  { label: "تماس با ما", url: "/contact" },
];

export default async function MenusAdmin() {
  const [menus, webServices, seoServices, contact] = await Promise.all([
    getMenus(),
    getServicesByCategory("web-design"),
    getServicesByCategory("seo"),
    getContact(),
  ]);
  const suggestions: MenuSuggestion[] = [
    ...PAGES,
    ...[...webServices, ...seoServices].map((s) => ({ label: s.title, url: serviceHref(s.slug) })),
    ...(contact.phone ? [{ label: "تماس تلفنی", url: `tel:${phoneE164(contact.phone)}` }] : []),
  ];

  return (
    <>
      <PageHeader
        title="منوی سایت"
        description="منوی دسکتاپ و موبایل را جداگانه بچینید. ترتیب را با فلش‌ها عوض کنید و با دکمه‌های تورفتگی، آیتم را زیرمنوی آیتم بالایی کنید."
      />
      {/* Remount after a save so the editor starts from the stored (normalised) menus. */}
      <MenuEditor key={JSON.stringify(menus)} initial={menus} suggestions={suggestions} />
    </>
  );
}
