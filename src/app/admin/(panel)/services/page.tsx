import { asc } from "drizzle-orm";
import Link from "next/link";

import { Badge, EmptyState, Icon, SubmitButton } from "@/components/atoms";
import { Card, Field, Flash, PageHeader } from "@/components/molecules";
import { db, schema } from "@/db";
import { serviceHref } from "@/modules/services/routes";

import { saveCategory } from "@/modules/services/actions";

export const metadata = { title: "خدمات" };

type Props = { searchParams: Promise<{ ok?: string; error?: string }> };

export default async function ServicesAdmin({ searchParams }: Props) {
  const sp = await searchParams;
  const [categories, services] = await Promise.all([
    db.select().from(schema.categories).orderBy(asc(schema.categories.sortOrder)),
    db.select().from(schema.services).orderBy(asc(schema.services.sortOrder), asc(schema.services.id)),
  ]);

  return (
    <>
      <PageHeader
        title="خدمات و زیرخدمات"
        description="دو خدمت اصلی صفحه اختصاصی دارند؛ هر زیرخدمت با قالب صفحه خدمات نمایش داده می‌شود."
        action={
          <Link href="/admin/services/new" className="btn btn-primary h-11 px-5 text-sm">
            <Icon name="plus" size={18} />
            زیرخدمت جدید
          </Link>
        }
      />
      <Flash ok={sp.ok} error={sp.error} />

      <div className="flex flex-col gap-8">
        {categories.map((cat) => {
          const items = services.filter((s) => s.category === cat.slug);
          return (
            <Card key={cat.slug}>
              <details>
                <summary className="flex items-center justify-between gap-4">
                  <span>
                    <span className="text-lg font-bold">{cat.title}</span>
                    <span className="ms-2 text-xs text-muted" dir="ltr">/{cat.slug}</span>
                  </span>
                  <span className="text-sm font-medium text-brand">ویرایش متن خدمت اصلی</span>
                </summary>
                <form action={saveCategory} className="mt-4 grid gap-4 rounded-md bg-page p-4">
                  <input type="hidden" name="slug" value={cat.slug} />
                  <Field label="عنوان" name="title" defaultValue={cat.title} required />
                  <Field label="توضیح (در صفحه اصلی و صفحه خدمات)" name="description" defaultValue={cat.description} multiline rows={3} />
                  <div><SubmitButton /></div>
                </form>
              </details>

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
    </>
  );
}
