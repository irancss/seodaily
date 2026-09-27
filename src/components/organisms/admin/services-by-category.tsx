import Link from "next/link";

import { Badge, EmptyState, Icon } from "@/components/atoms";
import { Card } from "@/components/molecules";
import type { Category, Service } from "@/db/schema";
import { serviceHref } from "@/modules/services/routes";

import { CategoryEditor } from "./category-editor";

/** One card per main service with its editor and the list of its sub-services. */
export function ServicesByCategory({ categories, services }: { categories: Category[]; services: Service[] }) {
  return (
    <div className="flex flex-col gap-8">
      {categories.map((cat) => {
        const items = services.filter((s) => s.category === cat.slug);
        return (
          <Card key={cat.slug}>
            <CategoryEditor category={cat} />

            {items.length === 0 ? (
              <div className="mt-4"><EmptyState>هنوز زیرخدمتی ثبت نشده است.</EmptyState></div>
            ) : (
              <ul className="mt-4 divide-y divide-line border-t border-line">
                {items.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <Link href={`/admin/services/${s.id}`} className="flex items-center gap-3 font-medium text-ink no-underline hover:text-brand">
                      <span className="flex size-9 items-center justify-center rounded-sm bg-soft text-brand"><Icon name={s.icon} size={18} /></span>
                      {s.title}
                    </Link>
                    <span className="flex items-center gap-3">
                      {!s.published && <Badge tone="amber">پیش‌نویس</Badge>}
                      <span className="text-xs text-muted">ترتیب: {s.sortOrder}</span>
                      {s.published && (
                        <Link href={serviceHref(s.slug)} target="_blank" className="text-xs">مشاهده</Link>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}
    </div>
  );
}
