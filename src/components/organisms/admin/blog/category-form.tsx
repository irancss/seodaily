"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/molecules";
import { saveBlogCategory } from "@/modules/blog/actions";
import type { CategoryData } from "@/modules/blog/types";
import { SingleImageField } from "../plugins/image-upload";
export function BlogCategoryForm({ category }: { category: { id: number; version: number; title: string; slug: string; sortOrder: number; enabled: boolean; data: CategoryData } }) {
  const [image, setImage] = useState(category.data.image), [ogImage, setOgImage] = useState(category.data.ogImage);
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const router = useRouter();
  return <Card title={category.id ? category.title : "دسته جدید"}><form className="grid gap-4" onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement; fd.set("operation", submitter?.value || "save"); if (submitter?.value === "archive" && !confirm("حذف امن دسته بدون مقاله و حفظ آدرس آن؟")) return; setBusy(true); try { const r = await saveBlogCategory(fd); setMessage(r.ok ? "ذخیره شد." : r.error); if (r.ok) router.refresh(); } finally { setBusy(false); } }}>
    <input type="hidden" name="id" value={category.id} /><input type="hidden" name="version" value={category.version} />
    <div className="grid gap-4 sm:grid-cols-2">{[["title", "نام دسته", category.title], ["slug", "نامک", category.slug], ["h1", "عنوان صفحه H1", category.data.h1], ["description", "توضیح دسته", category.data.description], ["imageAlt", "متن جایگزین تصویر", category.data.imageAlt], ["seoTitle", "عنوان SEO", category.data.seoTitle], ["seoDescription", "توضیح SEO", category.data.seoDescription], ["canonicalUrl", "canonical اختیاری", category.data.canonicalUrl], ["ogTitle", "عنوان OG", category.data.ogTitle], ["ogDescription", "توضیح OG", category.data.ogDescription]].map(([name, label, value]) => <label key={name} className="grid gap-2 text-sm">{label}<input className="field" name={name} defaultValue={value} required={name === "title" || name === "slug"} /></label>)}</div>
    <SingleImageField name="image" label="تصویر دسته" value={image} onChange={setImage} /><SingleImageField name="ogImage" label="تصویر OG اختیاری" value={ogImage} onChange={setOgImage} />
    <label className="text-sm">ترتیب نمایش<input className="field max-w-32" type="number" name="sortOrder" defaultValue={category.sortOrder} min={0} max={10000} /></label><label className="text-sm"><input type="checkbox" name="enabled" defaultChecked={category.enabled} /> فعال</label><label className="text-sm"><input type="checkbox" name="noindex" defaultChecked={category.data.noindex} /> noindex</label>
    <p role="status" className="text-sm">{message}</p><div className="flex gap-3"><button disabled={busy} className="btn btn-primary h-11 px-5" value="save">ذخیره دسته</button>{category.id > 0 && <button disabled={busy} className="btn btn-secondary h-11 px-5" value="archive">حذف امن دسته</button>}</div>
  </form></Card>;
}
