import { PageHeader } from "@/components/molecules";
import { PageTextEditor } from "@/components/organisms/admin";
import { getStoredPageTexts } from "@/modules/admin/pages-queries";
import { getSiteUrl } from "@/modules/seo/metadata";
import { DEFAULT_PAGES } from "@/modules/settings/defaults";
import { PAGE_KEYS, PAGE_LABELS, type PageKey } from "@/modules/settings/types";

export const metadata = { title: "متن و سئوی صفحات" };

const PATHS: Record<PageKey, string> = {
  home: "/",
  services: "/services",
  "web-design": "/web-design",
  seo: "/seo",
  portfolio: "/portfolio",
  about: "/about",
  contact: "/contact",
};

type Props = { searchParams: Promise<{ ok?: string; error?: string; open?: string }> };

export default async function PagesAdmin({ searchParams }: Props) {
  const sp = await searchParams;
  const [stored, base] = await Promise.all([getStoredPageTexts(), getSiteUrl()]);

  return (
    <>
      <PageHeader
        title="متن و سئوی صفحات"
        description="عنوان سئو (Title)، توضیحات متا و متن‌های اصلی هر صفحه. فیلدی که خالی بماند، متن پیش‌فرض طرح را نشان می‌دهد."
      />
      <div className="flex flex-col gap-4">
        {PAGE_KEYS.map((key) => (
          <PageTextEditor
            key={key}
            pageKey={key}
            label={PAGE_LABELS[key]}
            path={PATHS[key]}
            siteUrl={base}
            defaults={DEFAULT_PAGES[key]}
            values={stored[key] ?? {}}
            open={sp.open === key}
          />
        ))}
      </div>
    </>
  );
}
