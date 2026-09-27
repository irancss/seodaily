import { Checkbox, ConfirmButton, SubmitButton } from "@/components/atoms";
import { Card, Field, ImageField, Select } from "@/components/molecules";
import type { Project } from "@/db/schema";

import { deleteProject, saveProject } from "@/modules/projects/actions";

export function ProjectForm({ project, types }: { project?: Project; types: string[] }) {
  const p = project;
  return (
    <>
      <form action={saveProject} className="flex flex-col gap-6">
        {p && <input type="hidden" name="id" value={p.id} />}
        <Card title="اطلاعات پروژه">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="نام پروژه" name="title" defaultValue={p?.title} required />
            <Field label="نامک (آدرس صفحه)" name="slug" defaultValue={p?.slug} dir="ltr" hint="خالی بماند از روی نام ساخته می‌شود." />
            <div className="flex flex-col gap-2">
              <label htmlFor="f-projectType" className="field-label">نوع پروژه (فیلتر نمونه‌کارها)</label>
              <input id="f-projectType" name="projectType" list="project-types" defaultValue={p?.projectType} placeholder="مثلاً فروشگاهی، شرکتی، خدماتی" className="field" />
              <datalist id="project-types">
                {types.map((t) => <option key={t} value={t} />)}
              </datalist>
            </div>
            <Select
              label="خدمت مرتبط"
              name="category"
              defaultValue={p?.category ?? "web-design"}
              options={[
                { value: "web-design", label: "طراحی سایت" },
                { value: "seo", label: "سئو" },
                { value: "", label: "سایر" },
              ]}
            />
            <Field label="آدرس سایت پروژه (اختیاری)" name="websiteUrl" defaultValue={p?.websiteUrl} dir="ltr" placeholder="https://" />
            <Field label="ترتیب نمایش" name="sortOrder" type="number" defaultValue={p?.sortOrder ?? 0} />
          </div>
          <div className="mt-5 grid gap-5">
            <Field label="توضیح کوتاه (در کارت‌ها و متای صفحه)" name="summary" defaultValue={p?.summary} multiline rows={2} maxLength={400} counter={160} />
            <Field label="توضیح کامل (صفحه پروژه)" name="description" defaultValue={p?.description} multiline rows={6} />
            <ImageField label="تصویر پروژه" name="image" current={p?.imageUrl || undefined} hint="تصویر افقی (مثلاً ۱۶۰۰×۱۰۰۰)، JPG/PNG/WebP، حداکثر ۵ مگابایت." />
            <div className="flex flex-wrap gap-6">
              <Checkbox label="منتشر شود" name="published" defaultChecked={p?.published ?? true} />
              <Checkbox label="ویژه (اول نمایش داده شود)" name="featured" defaultChecked={p?.featured} />
            </div>
          </div>
        </Card>

        <Card title="نمونه‌ی مطالعه موردی" description="اگر فعال شود، این پروژه در بخش «نگاهی دقیق‌تر به یک پروژه» نمایش داده می‌شود.">
          <div className="grid gap-5">
            <Checkbox label="نمایش به‌عنوان مطالعه موردی" name="isCaseStudy" defaultChecked={p?.isCaseStudy} />
            <Field label="مسئله" name="problem" defaultValue={p?.problem} multiline rows={3} />
            <Field label="راهکار" name="solution" defaultValue={p?.solution} multiline rows={3} />
            <Field label="نتیجه" name="result" defaultValue={p?.result} multiline rows={3} hint="فقط بر اساس داده واقعی و تأییدشده." />
          </div>
        </Card>

        <div className="sticky bottom-0 z-10 -mx-4 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-md sm:border">
          <SubmitButton>{p ? "ذخیره تغییرات" : "ایجاد پروژه"}</SubmitButton>
        </div>
      </form>
      {p && (
        <form action={deleteProject} className="mt-6">
          <input type="hidden" name="id" value={p.id} />
          <ConfirmButton message="این پروژه حذف شود؟">حذف پروژه</ConfirmButton>
        </form>
      )}
    </>
  );
}
