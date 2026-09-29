"use client";

import { useActionState, useEffect, useState } from "react";

import { SubmitButton } from "@/components/atoms";
import { Card, Field } from "@/components/molecules";
import type { BlockDocument } from "@/modules/blocks/schema";
import { saveCategoryAction, type FormState } from "@/modules/plugins/actions";
import { toast } from "@/lib/toast";

import { BlockEditor } from "../block-editor/block-editor";
import { submitWithoutReset } from "../block-editor/no-reset-submit";
import { SingleImageField } from "./image-upload";

export type CategoryFormData = {
  id: number | null;
  title: string;
  slug: string;
  h1: string;
  description: BlockDocument | null;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl?: string;
  noindex?: boolean;
  imageUrl: string;
  sortOrder: number;
  published: boolean;
};

export function CategoryForm({ category }: { category: CategoryFormData }) {
  const [state, action] = useActionState(saveCategoryAction, { status: "idle" } as FormState);
  const [image, setImage] = useState(category.imageUrl);
  useEffect(() => {
    if (state.status === "ok") {
      toast.success(state.message ?? "ذخیره شد.");
      for (const p of state.problems ?? []) toast.info(p);
    } else if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={action} onSubmit={submitWithoutReset(action)} method="post" className="grid gap-6">
      {category.id && <input type="hidden" name="id" value={category.id} />}
      {state.status === "error" && (
        <p role="alert" className="rounded-md bg-error-bg px-4 py-3 text-sm font-medium text-error">
          {state.message}
        </p>
      )}
      <Card title="دسته">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="عنوان" name="title" defaultValue={category.title} required maxLength={120} />
          <Field label="نامک (آدرس)" name="slug" defaultValue={category.slug} dir="ltr" maxLength={80} hint="آدرس: /plugins/نامک — هم‌سطح افزونه‌ها؛ نامک تکراری پذیرفته نمی‌شود." />
          <Field label="H1 صفحه دسته" name="h1" defaultValue={category.h1} maxLength={150} hint="اگر خالی باشد: «افزونه‌های {عنوان}»." />
          <Field label="ترتیب" name="sortOrder" type="number" defaultValue={category.sortOrder} />
        </div>
        <label className="mt-5 inline-flex items-center gap-3 text-sm font-medium">
          <input type="checkbox" name="published" defaultChecked={category.published} className="size-[18px] accent-brand" />
          نمایش در سایت
        </label>
      </Card>
      <Card title="توضیح دسته" description="بالای فهرست افزونه‌های این دسته نمایش داده می‌شود. دسته بدون افزونه منتشرشده noindex است.">
        <BlockEditor name="description" initial={category.description} label="توضیح" />
      </Card>
      <Card title="سئو و تصویر">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="عنوان سئو" name="seoTitle" defaultValue={category.seoTitle} maxLength={120} counter={60} />
          <Field label="توضیحات متا" name="seoDescription" defaultValue={category.seoDescription} multiline rows={3} maxLength={300} counter={160} />
          <SingleImageField name="imageUrl" label="تصویر دسته (اختیاری)" value={image} onChange={setImage} />
          <Field label="نشانی canonical (اختیاری)" name="canonicalUrl" defaultValue={category.canonicalUrl ?? ""} dir="ltr" maxLength={300} />
        </div>
        <label className="mt-5 inline-flex items-center gap-3 text-sm font-medium">
          <input type="checkbox" name="noindex" defaultChecked={category.noindex} className="size-[18px] accent-brand" />
          جلوگیری از ایندکس این دسته در موتورهای جستجو
        </label>
      </Card>
      <div>
        <SubmitButton>ذخیره دسته</SubmitButton>
      </div>
    </form>
  );
}
