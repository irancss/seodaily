import { ConfirmButton, CountedField, Repeater, SubmitButton } from "@/components/admin/client";
import { Card, Checkbox, Field, ImageField, Select } from "@/components/admin/ui";
import { ICON_NAMES } from "@/components/icon";
import type { Category, Service } from "@/db/schema";

import { deleteService, saveService } from "./actions";

export function ServiceForm({
  service,
  categories,
  all,
}: {
  service?: Service;
  categories: Category[];
  all: { slug: string; title: string }[];
}) {
  const s = service;
  return (
    <>
      <form action={saveService} className="flex flex-col gap-6">
        {s && <input type="hidden" name="id" value={s.id} />}

        <Card title="اطلاعات اصلی">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="عنوان خدمت" name="title" defaultValue={s?.title} required />
            <Field label="نامک (آدرس صفحه)" name="slug" defaultValue={s?.slug} dir="ltr" hint="خالی بماند از روی عنوان ساخته می‌شود. مثال: technical-seo" />
            <Select label="خدمت اصلی" name="category" defaultValue={s?.category} options={categories.map((c) => ({ value: c.slug, label: c.title }))} />
            <Field label="عنوان انگلیسی (اختیاری)" name="englishTitle" defaultValue={s?.englishTitle} dir="ltr" />
            <Select label="آیکون" name="icon" defaultValue={s?.icon ?? "layers"} options={ICON_NAMES.map((n) => ({ value: n, label: n }))} />
            <Field label="ترتیب نمایش" name="sortOrder" type="number" defaultValue={s?.sortOrder ?? 0} />
          </div>
          <div className="mt-5 grid gap-5">
            <Field label="خلاصه (در کارت‌ها و فهرست خدمات)" name="summary" defaultValue={s?.summary} multiline rows={2} />
            <Field label="توضیح بالای صفحه" name="heroDescription" defaultValue={s?.heroDescription} multiline rows={3} hint="۲ تا ۳ جمله: این خدمت شامل چه کاری است و برای چه کسب‌وکاری مناسب است." />
            <ImageField label="تصویر خدمت (اختیاری)" name="image" current={s?.imageUrl || undefined} />
            <Checkbox label="منتشر شود" name="published" defaultChecked={s?.published ?? true} />
          </div>
        </Card>

        <Card title="سئو" description="اگر خالی بماند، عنوان و خلاصه خدمت استفاده می‌شود.">
          <div className="grid gap-5">
            <CountedField label="عنوان سئو (Title)" name="metaTitle" defaultValue={s?.metaTitle} limit={60} />
            <CountedField label="توضیحات متا (Meta description)" name="metaDescription" defaultValue={s?.metaDescription} limit={160} multiline />
          </div>
        </Card>

        <Card title="مشکل‌هایی که حل می‌کند">
          <div className="grid gap-5">
            <Field label="پاراگراف معرفی" name="problemIntro" defaultValue={s?.problemIntro} multiline rows={3} />
            <Field label="مشکل‌های رایج (هر خط یک مورد)" name="problems" defaultValue={s?.problems.join("\n")} multiline rows={4} />
          </div>
        </Card>

        <Card title="این خدمت شامل چه مواردی است؟">
          <div className="grid gap-5">
            <Field label="یک جمله درباره دامنه خدمت" name="includesIntro" defaultValue={s?.includesIntro} />
            <Repeater name="includes" label="موارد" fields={[{ key: "title", label: "عنوان" }, { key: "description", label: "توضیح کوتاه" }]} initial={s?.includes ?? []} />
          </div>
        </Card>

        <Card title="روند اجرای پروژه" description="بین ۳ تا ۶ مرحله.">
          <Repeater name="process" label="مراحل" max={6} fields={[{ key: "title", label: "عنوان مرحله" }, { key: "description", label: "توضیح کوتاه", multiline: true }]} initial={s?.process ?? []} addLabel="افزودن مرحله" />
        </Card>

        <Card title="مناسب چه کسب‌وکارهایی است؟">
          <div className="grid gap-5">
            <Field label="پاراگراف معرفی" name="forWhoIntro" defaultValue={s?.forWhoIntro} multiline rows={3} />
            <Field label="چه زمانی سراغ این خدمت بیایید؟ (هر خط یک مورد)" name="situations" defaultValue={s?.situations.join("\n")} multiline rows={3} />
            <Field label="انواع کسب‌وکار (هر خط یک مورد)" name="businessTypes" defaultValue={s?.businessTypes.join("\n")} multiline rows={3} />
          </div>
        </Card>

        <Card title="خروجی‌های تحویلی">
          <div className="grid gap-5">
            <Field label="یک جمله درباره شکل تحویل" name="deliverablesIntro" defaultValue={s?.deliverablesIntro} />
            <Repeater name="deliverables" label="خروجی‌ها" fields={[{ key: "title", label: "عنوان" }, { key: "description", label: "توضیح", multiline: true }]} initial={s?.deliverables ?? []} />
          </div>
        </Card>

        <Card title="سؤال‌های متداول این خدمت">
          <Repeater name="faqs" label="سؤال‌ها" fields={[{ key: "question", label: "سؤال" }, { key: "answer", label: "پاسخ", multiline: true }]} initial={s?.faqs ?? []} addLabel="افزودن سؤال" />
        </Card>

        <Card title="خدمات مرتبط">
          <div className="grid gap-2 sm:grid-cols-2">
            {all
              .filter((o) => o.slug !== s?.slug)
              .map((o) => (
                <label key={o.slug} className="inline-flex cursor-pointer items-center gap-3 text-sm">
                  <input type="checkbox" name="relatedSlugs" value={o.slug} defaultChecked={s?.relatedSlugs.includes(o.slug)} className="size-[18px] accent-brand" />
                  {o.title}
                </label>
              ))}
          </div>
        </Card>

        <div className="sticky bottom-0 z-10 -mx-4 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-md sm:border">
          <SubmitButton>{s ? "ذخیره تغییرات" : "ایجاد خدمت"}</SubmitButton>
        </div>
      </form>

      {s && (
        <form action={deleteService} className="mt-6">
          <input type="hidden" name="id" value={s.id} />
          <ConfirmButton message="این خدمت و صفحه آن حذف شود؟">حذف خدمت</ConfirmButton>
        </form>
      )}
    </>
  );
}
