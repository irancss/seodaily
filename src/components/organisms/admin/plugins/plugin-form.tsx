"use client";

import { useActionState, useEffect, useState } from "react";

import { SubmitButton } from "@/components/atoms";
import { Card } from "@/components/molecules";
import type { GalleryImage } from "@/db/plugins-schema";
import type { BlockDocument } from "@/modules/blocks/schema";
import { savePluginAction, type FormState } from "@/modules/plugins/actions";
import { META_FIELDS, META_FIELD_LABEL, type MetaField } from "@/modules/plugins/labels";
import { toast } from "@/lib/toast";

import { BlockEditor } from "../block-editor/block-editor";
import { submitWithoutReset } from "../block-editor/no-reset-submit";
import { ImageUploadButton, SingleImageField } from "./image-upload";

export type PluginFormData = {
  id: number;
  revision: number;
  name: string;
  slug: string;
  excerpt: string;
  contentDraft: BlockDocument | null;
  primaryCategoryId: number | null;
  iconUrl: string;
  iconSource: string;
  gallery: GalleryImage[];
  meta: Record<MetaField, string>;
  manualFields: string[];
  provenance: Record<string, string>;
  seoTitle: string;
  seoDescription: string;
  seoH1: string;
  canonicalUrl: string;
  noindex: boolean;
  ogImage: string;
  autoUpdate: boolean;
  allowPrerelease: boolean;
  discontinued: boolean;
  discontinuedNote: string;
  relatedIds: number[];
  categoryIds: number[];
};

const initial: FormState = { status: "idle" };

function Text({ name, label, defaultValue, hint, dir, maxLength, counter, required, multiline }: { name: string; label: string; defaultValue: string; hint?: string; dir?: "ltr"; maxLength?: number; counter?: number; required?: boolean; multiline?: boolean }) {
  const [value, setValue] = useState(defaultValue);
  const id = `pf-${name}`;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="field-label">
        {label} {required && <span className="text-error">*</span>}
      </label>
      {multiline ? (
        <textarea id={id} name={name} rows={3} className="field" value={value} maxLength={maxLength} onChange={(e) => setValue(e.target.value)} />
      ) : (
        <input id={id} name={name} className="field" dir={dir} value={value} maxLength={maxLength} required={required} onChange={(e) => setValue(e.target.value)} />
      )}
      {(hint || counter) && (
        <p className="flex justify-between gap-3 text-xs leading-[1.8] text-muted">
          <span>{hint}</span>
          {counter && (
            <span className={value.length > counter ? "text-warning" : undefined}>
              {value.length.toLocaleString("fa-IR")} / {counter.toLocaleString("fa-IR")}
            </span>
          )}
        </p>
      )}
    </div>
  );
}

function Toggle({ name, label, defaultChecked, hint }: { name: string; label: string; defaultChecked: boolean; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 size-[18px] accent-brand" />
      <span>
        <span className="font-medium text-ink">{label}</span>
        {hint && <span className="block text-xs leading-[1.8] text-muted">{hint}</span>}
      </span>
    </label>
  );
}

export function PluginForm({ plugin, categories, options }: { plugin: PluginFormData; categories: { id: number; title: string }[]; options: { id: number; name: string; status: string }[] }) {
  const [state, action] = useActionState(savePluginAction, initial);
  const [checked, setChecked] = useState<number[]>(plugin.categoryIds);
  const [primary, setPrimary] = useState<number | null>(plugin.primaryCategoryId);
  const [icon, setIcon] = useState(plugin.iconUrl);
  const [og, setOg] = useState(plugin.ogImage);
  const [images, setImages] = useState<GalleryImage[]>(plugin.gallery);

  const revision = state.revision ?? plugin.revision;

  useEffect(() => {
    if (state.status === "ok") {
      toast.success(state.message ?? "ذخیره شد.");
      for (const p of state.problems ?? []) toast.info(p);
    } else if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  const primaryOptions = categories.filter((c) => checked.includes(c.id));
  const effectivePrimary = primary && checked.includes(primary) ? primary : (primaryOptions[0]?.id ?? "");

  return (
    <form action={action} onSubmit={submitWithoutReset(action)} method="post" className="grid gap-6">
      <input type="hidden" name="id" value={plugin.id} />
      <input type="hidden" name="revision" value={revision} />

      {state.status === "error" && (
        <p role="alert" className="rounded-md bg-error-bg px-4 py-3 text-sm leading-[1.8] font-medium text-error">
          {state.message}
        </p>
      )}

      <Card title="اطلاعات اصلی">
        <div className="grid gap-5 sm:grid-cols-2">
          <Text name="name" label="نام افزونه (فارسی یا اصلی)" defaultValue={plugin.name} required maxLength={150} />
          <Text name="originalName" label={META_FIELD_LABEL.originalName} defaultValue={plugin.meta.originalName} dir="ltr" maxLength={150} />
          <Text name="slug" label="نامک (آدرس)" defaultValue={plugin.slug} dir="ltr" maxLength={80} hint="آدرس صفحه: /plugins/نامک. تغییر نامک صفحه منتشرشده، آدرس قبلی را با ریدایرکت ۳۰۱ نگه می‌دارد." />
          <Text name="excerpt" label="خلاصه کوتاه" defaultValue={plugin.excerpt} multiline maxLength={400} counter={200} hint="در کارت‌ها و به‌جای توضیحات متا (اگر خالی باشد) استفاده می‌شود." />
        </div>
      </Card>

      <Card title="دسته‌ها" description="چند دسته مجاز است؛ دسته اصلی در مسیر راهنما (breadcrumb) می‌آید. آدرس خود افزونه با دسته عوض نمی‌شود.">
        {categories.length === 0 ? (
          <p className="text-sm text-muted">هنوز دسته‌ای ساخته نشده است. از «دسته‌های افزونه» دسته بسازید.</p>
        ) : (
          <div className="grid gap-4">
            <fieldset className="flex flex-wrap gap-x-5 gap-y-2">
              <legend className="sr-only">دسته‌ها</legend>
              {categories.map((c) => (
                <label key={c.id} className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="categoryIds"
                    value={c.id}
                    checked={checked.includes(c.id)}
                    onChange={(e) => setChecked((prev) => (e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id)))}
                    className="size-[18px] accent-brand"
                  />
                  {c.title}
                </label>
              ))}
            </fieldset>
            <label className="flex max-w-sm flex-col gap-2">
              <span className="field-label">دسته اصلی</span>
              <select name="primaryCategoryId" className="field" value={effectivePrimary} onChange={(e) => setPrimary(Number(e.target.value) || null)} disabled={!primaryOptions.length}>
                {primaryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </Card>

      <Card title="متن معرفی" description="معرفی، امکانات، نصب، به‌روزرسانی، نکات و سازگاری را با تیترهای H2 بنویسید؛ فهرست مطالب صفحه از همین تیترها ساخته می‌شود. متن منابع به‌صورت خودکار کپی نمی‌شود.">
        <BlockEditor name="content" initial={plugin.contentDraft} label="متن صفحه افزونه" placeholder="معرفی افزونه را اینجا بنویسید…" />
      </Card>

      <Card title="تصاویر">
        <div className="grid gap-6">
          <SingleImageField
            name="iconUrl"
            label="آیکون"
            value={icon}
            onChange={setIcon}
            hint={plugin.iconSource === "auto" && icon === plugin.iconUrl && icon ? "این آیکون خودکار از منبع دریافت شده است؛ با بارگذاری تصویر، آیکون دستی جایگزین می‌شود." : "مربعی، حداقل ۲۵۶ پیکسل."}
          />
          <div className="flex flex-col gap-3">
            <span className="field-label">گالری تصاویر</span>
            <input type="hidden" name="gallery" value={JSON.stringify(images)} />
            {images.length > 0 && (
              <ul className="grid gap-3 sm:grid-cols-2">
                {images.map((img, i) => (
                  <li key={img.url} className="flex gap-3 rounded-lg border border-line p-2">
                    { }
                    <img src={img.url} alt="" className="h-16 w-24 shrink-0 rounded object-cover" />
                    <div className="flex grow flex-col gap-1.5">
                      <input
                        className="field h-9 text-sm"
                        aria-label={`متن جایگزین تصویر ${i + 1}`}
                        placeholder="متن جایگزین (alt)"
                        value={img.alt}
                        maxLength={250}
                        onChange={(e) => setImages((list) => list.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
                      />
                      <div className="flex gap-2 text-xs">
                        <button type="button" disabled={i === 0} className="rounded px-2 py-1 hover:bg-soft disabled:opacity-40" onClick={() => setImages((l) => { const n = [...l]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })}>
                          قبلی
                        </button>
                        <button type="button" disabled={i === images.length - 1} className="rounded px-2 py-1 hover:bg-soft disabled:opacity-40" onClick={() => setImages((l) => { const n = [...l]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; return n; })}>
                          بعدی
                        </button>
                        <button type="button" className="rounded px-2 py-1 text-error hover:bg-error-bg" onClick={() => setImages((l) => l.filter((_, j) => j !== i))}>
                          حذف
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div>
              <ImageUploadButton label="افزودن تصویر به گالری" multiple onUploaded={(img) => setImages((l) => (l.length >= 20 ? l : [...l, { url: img.src, alt: "", width: img.width, height: img.height }]))} />
            </div>
          </div>
        </div>
      </Card>

      <Card title="اطلاعات فنی" description="مقداری که شما وارد کنید با بررسی منابع جایگزین نمی‌شود. اگر خالی باشد، مقدار واقعی استخراج‌شده از فایل یا منبع (در صورت وجود) استفاده می‌شود؛ مقدار نامعلوم در سایت نمایش داده نمی‌شود.">
        <div className="grid gap-5 sm:grid-cols-2">
          {META_FIELDS.filter((f) => f !== "originalName").map((f) => (
            <Text
              key={f}
              name={f}
              label={META_FIELD_LABEL[f]}
              defaultValue={plugin.meta[f]}
              dir="ltr"
              maxLength={300}
              hint={plugin.manualFields.includes(f) ? "وارد‌شده توسط مدیر" : plugin.provenance[f] ? `از ${plugin.provenance[f]}` : undefined}
            />
          ))}
        </div>
      </Card>

      <Card title="سئو" description="اگر خالی بمانند، از نام، خلاصه و محتوای واقعی ساخته می‌شوند.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Text name="seoTitle" label="عنوان سئو" defaultValue={plugin.seoTitle} maxLength={120} counter={60} />
          <Text name="seoH1" label="H1 صفحه" defaultValue={plugin.seoH1} maxLength={150} hint="اگر خالی باشد، نام افزونه." />
          <Text name="seoDescription" label="توضیحات متا" defaultValue={plugin.seoDescription} multiline maxLength={300} counter={160} />
          <Text name="canonicalUrl" label="Canonical (اختیاری)" defaultValue={plugin.canonicalUrl} dir="ltr" maxLength={300} hint="خالی = آدرس خود صفحه." />
          <SingleImageField name="ogImage" label="تصویر اشتراک‌گذاری (OG)" value={og} onChange={setOg} hint="اگر خالی باشد، آیکون یا تصویر پیش‌فرض سایت." />
          <Toggle name="noindex" label="noindex (عدم نمایش در نتایج جست‌وجو)" defaultChecked={plugin.noindex} />
        </div>
      </Card>

      <Card title="به‌روزرسانی خودکار و وضعیت">
        <div className="grid gap-4">
          <Toggle name="autoUpdate" label="به‌روزرسانی خودکار" defaultChecked={plugin.autoUpdate} hint="نسخه جدید فقط وقتی خودکار منتشر می‌شود که همه کنترل‌های اجباری موفق باشند؛ وگرنه برای بررسی شما نگه داشته می‌شود." />
          <Toggle name="allowPrerelease" label="پذیرش نسخه‌های پیش‌انتشار (beta/rc)" defaultChecked={plugin.allowPrerelease} hint="پیش‌فرض: فقط نسخه پایدار." />
          <Toggle name="discontinued" label="پشتیبانی این افزونه متوقف شده است" defaultChecked={plugin.discontinued} hint="فقط در پنل ثبت می‌شود؛ در سایت فقط توضیح زیر (اگر بنویسید) نمایش داده می‌شود. قطع شدن یک منبع به معنی توقف افزونه نیست." />
          <Text name="discontinuedNote" label="توضیح برای بازدیدکننده (اختیاری)" defaultValue={plugin.discontinuedNote} multiline maxLength={500} />
        </div>
      </Card>

      <Card title="افزونه‌های مرتبط" description="اگر انتخاب نکنید، افزونه‌های منتشرشده هم‌دسته خودکار نمایش داده می‌شوند.">
        {options.length === 0 ? (
          <p className="text-sm text-muted">افزونه دیگری وجود ندارد.</p>
        ) : (
          <fieldset className="grid max-h-60 gap-2 overflow-y-auto sm:grid-cols-2">
            <legend className="sr-only">افزونه‌های مرتبط</legend>
            {options.map((o) => (
              <label key={o.id} className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" name="relatedIds" value={o.id} defaultChecked={plugin.relatedIds.includes(o.id)} className="size-[18px] accent-brand" />
                {o.name}
                {o.status !== "published" && <span className="text-xs text-muted">(منتشرنشده)</span>}
              </label>
            ))}
          </fieldset>
        )}
      </Card>

      <div className="sticky bottom-3 z-10 flex items-center gap-3 rounded-xl border border-line bg-white/95 p-3 shadow-sm backdrop-blur">
        <SubmitButton>ذخیره پیش‌نویس</SubmitButton>
        <span className="text-xs text-muted">ذخیره، صفحه عمومی را تغییر نمی‌دهد تا «انتشار» را بزنید.</span>
      </div>
    </form>
  );
}
