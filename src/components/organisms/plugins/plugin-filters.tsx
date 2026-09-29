import Link from "next/link";

import { LIST_SINCE, LIST_SORTS, type PublicCategory } from "@/modules/plugins/queries";

type Props = { q: string; category: string; since: string; sort: string; categories: PublicCategory[] };

/** One small GET form (no tabs): category, update window and order. Filtered URLs are noindex. */
export function PluginFilters({ q, category, since, sort, categories }: Props) {
  const active = Boolean(category || since || (sort && sort !== "updated"));
  const select = "field h-10 min-w-0 py-0 text-sm";
  return (
    <form action="/plugins" method="get" aria-label="فیلتر فهرست افزونه‌ها" className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-line bg-page p-3">
      {q && <input type="hidden" name="q" value={q} />}
      {categories.length > 0 && (
        <label className="flex min-w-[150px] flex-1 flex-col gap-1 text-xs font-medium text-ink-2 sm:flex-none">
          دسته
          <select name="category" defaultValue={category} className={select}>
            <option value="">همه دسته‌ها</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="flex min-w-[150px] flex-1 flex-col gap-1 text-xs font-medium text-ink-2 sm:flex-none">
        به‌روزرسانی
        <select name="since" defaultValue={since} className={select}>
          <option value="">هر زمان</option>
          {Object.entries(LIST_SINCE).map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-[150px] flex-1 flex-col gap-1 text-xs font-medium text-ink-2 sm:flex-none">
        ترتیب
        <select name="sort" defaultValue={sort || "updated"} className={select}>
          {Object.entries(LIST_SORTS).map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="btn btn-secondary h-10 px-4 text-sm">
        اعمال
      </button>
      {active && (
        <Link href={q ? `/plugins?q=${encodeURIComponent(q)}` : "/plugins"} className="self-center text-sm">
          حذف فیلترها
        </Link>
      )}
    </form>
  );
}
