import Link from "next/link";

import { SubmitButton } from "@/components/atoms";
import { Card, CountedField, Field } from "@/components/molecules";
import { plainText } from "@/lib/utils";
import { savePage } from "@/modules/settings/page-actions";
import type { PageKey, PageText } from "@/modules/settings/types";

type Props = {
  pageKey: PageKey;
  label: string;
  /** Public path of the page, e.g. "/seo". */
  path: string;
  /** Site origin used in the Google preview. */
  siteUrl: string;
  defaults: PageText;
  values: Partial<PageText>;
  open: boolean;
};

/** Collapsible SEO + copy editor for one site page, with a Google result preview. */
export function PageTextEditor({ pageKey, label, path, siteUrl, defaults: d, values: v, open }: Props) {
  const val = (f: keyof PageText) => v[f] ?? "";
  const title = val("metaTitle") || d.metaTitle;
  const desc = val("metaDescription") || d.metaDescription;
  return (
    <Card>
      <details id={pageKey} open={open}>
        <summary className="flex items-center justify-between gap-4">
          <span className="text-lg font-bold">{label}</span>
          <Link href={path} target="_blank" className="text-xs" dir="ltr">
            {path}
          </Link>
        </summary>

        {/* Google result preview with the effective values. */}
        <div className="mt-4 rounded-md border border-line bg-page p-4" aria-label="پیش‌نمایش نتیجه گوگل">
          <p className="truncate text-xs text-muted" dir="ltr">{siteUrl}{path}</p>
          <p className="mt-1 truncate text-lg text-[#1a0dab]">{plainText(title)}</p>
          <p className="mt-1 line-clamp-2 text-sm text-ink-2">{desc}</p>
        </div>

        <form action={savePage} className="mt-5 grid gap-5">
          <input type="hidden" name="page" value={pageKey} />
          <h3 className="text-sm font-bold text-brand">سئو</h3>
          <CountedField label="عنوان سئو (Title)" name="metaTitle" defaultValue={val("metaTitle")} limit={60} hint={`پیش‌فرض: ${d.metaTitle}`} />
          <CountedField label="توضیحات متا (Meta description)" name="metaDescription" defaultValue={val("metaDescription")} limit={160} multiline hint="پیشنهاد: ۱۲۰ تا ۱۶۰ کاراکتر" />

          <h3 className="mt-2 text-sm font-bold text-brand">متن بالای صفحه</h3>
          <Field label="برچسب" name="badge" defaultValue={val("badge")} placeholder={d.badge} />
          <Field
            label="عنوان اصلی (H1)"
            name="title"
            defaultValue={val("title")}
            placeholder={d.title}
            hint="برای رنگی (گرادیانی) شدن یک یا چند کلمه، آن را بین دو ستاره بنویسید؛ مثلاً: سایت *اصولی* بساز"
          />
          <Field label="زیرعنوان" name="subtitle" defaultValue={val("subtitle")} placeholder={d.subtitle} multiline rows={3} />

          <h3 className="mt-2 text-sm font-bold text-brand">{pageKey === "contact" ? "بخش راه‌های ارتباطی" : "بخش دعوت به اقدام (پایین صفحه)"}</h3>
          <Field label="عنوان" name="ctaTitle" defaultValue={val("ctaTitle")} placeholder={d.ctaTitle} hint="کلمه‌ای که بین دو ستاره بیاید (*کلمه*) رنگی نمایش داده می‌شود." />
          <Field label="متن" name="ctaText" defaultValue={val("ctaText")} placeholder={d.ctaText} multiline rows={2} />
          <div><SubmitButton /></div>
        </form>
      </details>
    </Card>
  );
}
