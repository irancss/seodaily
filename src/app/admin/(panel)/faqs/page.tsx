import { asc, eq } from "drizzle-orm";
import Link from "next/link";

import { ConfirmButton, SubmitButton } from "@/components/atoms";
import { Card, Field, Flash, PageHeader } from "@/components/molecules";
import { cx } from "@/lib/utils";
import { db, schema } from "@/db";
import { FAQ_PAGES, type FaqPage } from "@/db/schema";

import { deleteFaq, saveFaq } from "@/modules/faqs/actions";

export const metadata = { title: "سؤال‌های متداول" };

const LABELS: Record<FaqPage, string> = { home: "صفحه اصلی", services: "خدمات", "web-design": "طراحی سایت", seo: "سئو" };

type Props = { searchParams: Promise<{ page?: string; ok?: string; error?: string }> };

export default async function FaqsAdmin({ searchParams }: Props) {
  const sp = await searchParams;
  const page = FAQ_PAGES.includes(sp.page as FaqPage) ? (sp.page as FaqPage) : "home";
  const items = await db.select().from(schema.faqs).where(eq(schema.faqs.page, page)).orderBy(asc(schema.faqs.sortOrder), asc(schema.faqs.id));
  const nextOrder = (items.at(-1)?.sortOrder ?? 0) + 1;

  return (
    <>
      <PageHeader title="سؤال‌های متداول" description="سؤال‌های هر صفحه؛ سؤال‌های هر زیرخدمت داخل فرم همان خدمت ویرایش می‌شوند. این سؤال‌ها با اسکیمای FAQPage برای گوگل هم ارسال می‌شوند." />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="mb-6 flex flex-wrap gap-2">
        {FAQ_PAGES.map((p) => (
          <Link
            key={p}
            href={`/admin/faqs?page=${p}`}
            className={cx("rounded-full border px-4 py-1.5 text-sm font-medium no-underline", p === page ? "border-brand bg-brand text-white hover:text-white" : "border-line bg-white text-ink-2")}
          >
            {LABELS[p]}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {items.map((f) => (
          <Card key={f.id}>
            <form action={saveFaq} className="grid gap-4">
              <input type="hidden" name="id" value={f.id} />
              <input type="hidden" name="page" value={page} />
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px]">
                <Field label="سؤال" name="question" defaultValue={f.question} required />
                <Field label="ترتیب" name="sortOrder" type="number" defaultValue={f.sortOrder} />
              </div>
              <Field label="پاسخ" name="answer" defaultValue={f.answer} multiline rows={3} required />
              <div><SubmitButton /></div>
            </form>
            <form action={deleteFaq} className="mt-3">
              <input type="hidden" name="id" value={f.id} />
              <input type="hidden" name="page" value={page} />
              <ConfirmButton message="این سؤال حذف شود؟" />
            </form>
          </Card>
        ))}

        <Card title={`سؤال جدید — ${LABELS[page]}`}>
          <form action={saveFaq} className="grid gap-4">
            <input type="hidden" name="page" value={page} />
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px]">
              <Field label="سؤال" name="question" required />
              <Field label="ترتیب" name="sortOrder" type="number" defaultValue={nextOrder} />
            </div>
            <Field label="پاسخ" name="answer" multiline rows={3} required />
            <div><SubmitButton>افزودن سؤال</SubmitButton></div>
          </form>
        </Card>
      </div>
    </>
  );
}
