import Link from "next/link";

import { Icon } from "@/components/atoms";
import { PageHeader } from "@/components/molecules";
import { PluginsSubnav } from "@/components/organisms/admin/plugins/plugins-subnav";
import { listCategoriesAdmin, listPluginsAdmin } from "@/modules/plugins/admin-queries";
import { PLUGIN_STATUS_LABEL, publicDownloadCount } from "@/modules/plugins/labels";

export const metadata = { title: "افزونه‌ها" };

type Props = { searchParams: Promise<Record<string, string | undefined>> };

const dateFa = (d: Date | string | null) => (d ? new Date(d).toLocaleDateString("fa-IR", { timeZone: "Asia/Tehran" }) : "—");

export default async function PluginsAdmin({ searchParams }: Props) {
  const sp = await searchParams;
  const filters = { q: sp.q, status: sp.status, category: Number(sp.category) || undefined, attention: sp.attention === "1", page: Number(sp.page) || 1 };
  const [{ rows, total, page, pages }, categories] = await Promise.all([listPluginsAdmin(filters), listCategoriesAdmin()]);
  const pageHref = (n: number) => {
    const q = new URLSearchParams(Object.entries({ ...sp, page: String(n) }).filter(([, v]) => v) as [string, string][]);
    return `/admin/plugins?${q}`;
  };

  return (
    <>
      <PageHeader
        title="افزونه‌های وردپرس"
        description={`${total.toLocaleString("fa-IR")} افزونه`}
        action={
          <Link href="/admin/plugins/new" className="btn btn-primary h-11 px-5 text-sm">
            <Icon name="plus" size={18} />
            افزونه جدید
          </Link>
        }
      />
      <PluginsSubnav />
      <form method="get" className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4">
        <label className="flex min-w-48 grow flex-col gap-1.5 text-sm">
          <span className="font-medium">جست‌وجو</span>
          <input name="q" defaultValue={sp.q} className="field h-10" placeholder="نام یا نامک" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">وضعیت</span>
          <select name="status" defaultValue={sp.status ?? ""} className="field h-10">
            <option value="">همه</option>
            {Object.entries(PLUGIN_STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">دسته</span>
          <select name="category" defaultValue={sp.category ?? ""} className="field h-10">
            <option value="">همه</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <label className="inline-flex h-10 items-center gap-2 text-sm">
          <input type="checkbox" name="attention" value="1" defaultChecked={filters.attention} className="size-[18px] accent-brand" />
          نیازمند رسیدگی
        </label>
        <button className="btn btn-secondary h-10 px-5 text-sm">اعمال</button>
      </form>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-strong bg-white p-8 text-center text-sm text-muted">افزونه‌ای پیدا نشد.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-page text-right text-xs text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">افزونه</th>
                <th scope="col" className="px-4 py-3 font-medium">وضعیت</th>
                <th scope="col" className="px-4 py-3 font-medium">نسخه جاری</th>
                <th scope="col" className="px-4 py-3 font-medium">منابع</th>
                <th scope="col" className="px-4 py-3 font-medium">آخرین بررسی</th>
                <th scope="col" className="px-4 py-3 font-medium">دانلود</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <Link href={`/admin/plugins/${r.id}`} className="flex items-center gap-3 font-medium text-ink no-underline hover:text-brand">
                      {r.iconUrl ? (
                         
                        <img src={r.iconUrl} alt="" className="size-9 rounded-md border border-line object-cover" />
                      ) : (
                        <span aria-hidden="true" className="size-9 rounded-md bg-soft" />
                      )}
                      <span>
                        {r.name}
                        <span className="block text-xs font-normal text-muted" dir="ltr">
                          /plugins/{r.slug}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-page px-2.5 py-1 text-xs">{PLUGIN_STATUS_LABEL[r.status] ?? r.status}</span>
                    {r.reviewCount > 0 && <span className="ms-1 rounded-full bg-warning-bg px-2.5 py-1 text-xs text-warning">{r.reviewCount.toLocaleString("fa-IR")} نسخه منتظر بررسی</span>}
                    {r.discontinued && <span className="ms-1 rounded-full bg-page px-2.5 py-1 text-xs text-muted">متوقف</span>}
                  </td>
                  <td className="px-4 py-3" dir="ltr">
                    {r.currentVersion ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {r.sourceCount.toLocaleString("fa-IR")}
                    {r.failingSources > 0 && <span className="ms-1 text-xs text-error">({r.failingSources.toLocaleString("fa-IR")} با خطا)</span>}
                  </td>
                  <td className="px-4 py-3 text-muted">{dateFa(r.lastCheckedAt)}</td>
                  <td className="px-4 py-3">{publicDownloadCount(r).toLocaleString("fa-IR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <nav aria-label="صفحه‌بندی" className="mt-4 flex items-center justify-center gap-2 text-sm">
          {page > 1 && <Link href={pageHref(page - 1)} className="btn btn-secondary h-9 px-4">قبلی</Link>}
          <span>
            صفحه {page.toLocaleString("fa-IR")} از {pages.toLocaleString("fa-IR")}
          </span>
          {page < pages && <Link href={pageHref(page + 1)} className="btn btn-secondary h-9 px-4">بعدی</Link>}
        </nav>
      )}
    </>
  );
}
