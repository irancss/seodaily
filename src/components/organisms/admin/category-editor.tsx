import { SubmitButton } from "@/components/atoms";
import { Field } from "@/components/molecules";
import type { Category } from "@/db/schema";
import { saveCategory } from "@/modules/services/actions";

/** Collapsible title/description form for one main service (category). */
export function CategoryEditor({ category: cat }: { category: Category }) {
  return (
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
  );
}
