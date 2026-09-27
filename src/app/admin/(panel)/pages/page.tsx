import { eq } from "drizzle-orm";
import Link from "next/link";

import { Card, CountedField, Field, Flash, PageHeader } from "@/components/molecules";
import { SubmitButton } from "@/components/atoms";
import { db, schema } from "@/db";
import { getSiteUrl } from "@/modules/seo/metadata";
import { DEFAULT_PAGES, PAGE_KEYS, PAGE_LABELS, type PageKey, type PageText } from "@/modules/settings/queries";

import { savePage } from "@/modules/settings/page-actions";

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
  const [row, base] = await Promise.all([
    db.query.settings.findFirst({ where: eq(schema.settings.key, "pages") }),
    getSiteUrl(),
  ]);
  const stored = (row?.value ?? {}) as Partial<Record<PageKey, Partial<PageText>>>;

  return (
    <>
      <PageHeader
        title="متن و سئوی صفحات"
        description="عنوان سئو (Title)، توضیحات متا و متن‌های اصلی هر صفحه. فیلدی که خالی بماند، متن پیش‌فرض طرح را نشان می‌دهد."
      />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="flex flex-col gap-4">
        {PAGE_KEYS.map((key) => {
          const d = DEFAULT_PAGES[key];
          const v = stored[key] ?? {};
          const val = (f: keyof PageText) => v[f] ?? "";
          const title = val("metaTitle") || d.metaTitle;
          const desc = val("metaDescription") || d.metaDescription;
          return (
            <Card key={key}>
              <details id={key} open={sp.open === key}>
                <summary className="flex items-center justify-between gap-4">
                  <span className="text-lg font-bold">{PAGE_LABELS[key]}</span>
                  <Link href={PATHS[key]} target="_blank" className="text-xs" dir="ltr">
                    {PATHS[key]}
                  </Link>
                </summary>

                {/* Google result preview with the effective values. */}
                <div className="mt-4 rounded-md border border-line bg-page p-4" aria-label="پیش‌نمایش نتیجه گوگل">
                  <p className="truncate text-xs text-muted" dir="ltr">{base}{PATHS[key]}</p>
                  <p className="mt-1 truncate text-lg text-[#1a0dab]">{title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-2">{desc}</p>
                </div>

                <form action={savePage} className="mt-5 grid gap-5">
                  <input type="hidden" name="page" value={key} />
                  <h3 className="text-sm font-bold text-brand">سئو</h3>
                  <CountedField label="عنوان سئو (Title)" name="metaTitle" defaultValue={val("metaTitle")} limit={60} hint={`پیش‌فرض: ${d.metaTitle}`} />
                  <CountedField label="توضیحات متا (Meta description)" name="metaDescription" defaultValue={val("metaDescription")} limit={160} multiline hint="پیشنهاد: ۱۲۰ تا ۱۶۰ کاراکتر" />

                  <h3 className="mt-2 text-sm font-bold text-brand">متن بالای صفحه</h3>
                  <Field label="برچسب" name="badge" defaultValue={val("badge")} placeholder={d.badge} />
                  <Field label="عنوان اصلی (H1)" name="title" defaultValue={val("title")} placeholder={d.title} />
                  <Field label="زیرعنوان" name="subtitle" defaultValue={val("subtitle")} placeholder={d.subtitle} multiline rows={3} />

                  <h3 className="mt-2 text-sm font-bold text-brand">{key === "contact" ? "بخش راه‌های ارتباطی" : "بخش دعوت به اقدام (پایین صفحه)"}</h3>
                  <Field label="عنوان" name="ctaTitle" defaultValue={val("ctaTitle")} placeholder={d.ctaTitle} />
                  <Field label="متن" name="ctaText" defaultValue={val("ctaText")} placeholder={d.ctaText} multiline rows={2} />
                  <div><SubmitButton /></div>
                </form>
              </details>
            </Card>
          );
        })}
      </div>
    </>
  );
}
