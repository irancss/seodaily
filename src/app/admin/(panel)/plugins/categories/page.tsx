import Link from "next/link";

import { Icon } from "@/components/atoms";
import { PageHeader } from "@/components/molecules";
import { PluginsSubnav } from "@/components/organisms/admin/plugins/plugins-subnav";
import { listCategoriesAdmin } from "@/modules/plugins/admin-queries";

export const metadata = { title: "دسته‌های افزونه" };

export default async function PluginCategoriesAdmin() {
  const categories = await listCategoriesAdmin();
  return (
    <>
      <PageHeader
        title="دسته‌های افزونه"
        description="هر دسته صفحه /plugins/نامک دارد؛ هم‌سطح افزونه‌ها."
        action={
          <Link href="/admin/plugins/categories/new" className="btn btn-primary h-11 px-5 text-sm">
            <Icon name="plus" size={18} />
            دسته جدید
          </Link>
        }
      />
      <PluginsSubnav />
      {categories.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-strong bg-white p-8 text-center text-sm text-muted">هنوز دسته‌ای ساخته نشده است.</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <Link href={`/admin/plugins/categories/${c.id}`} className="font-medium text-ink no-underline hover:text-brand">
                {c.title}
                <span className="ms-2 text-xs font-normal text-muted" dir="ltr">
                  /plugins/{c.slug}
                </span>
              </Link>
              <span className="text-sm text-muted">
                {c.pluginCount.toLocaleString("fa-IR")} افزونه{!c.published && " · پنهان"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
