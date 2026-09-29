"use client";
import { useState } from "react";
import { saveBlogOptions } from "@/modules/blog/actions";
import type { BlogOptions } from "@/modules/blog/types";
export function BlogOptionsForm({ options, articles }: { options: BlogOptions; articles: { id: number; title: string }[] }) {
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  return <form className="grid max-w-xl gap-5" onSubmit={async (e) => { e.preventDefault(); setBusy(true); try { const result = await saveBlogOptions(new FormData(e.currentTarget)); setMessage(result.ok ? "تنظیمات ذخیره شد." : result.error); } finally { setBusy(false); } }}>
    <label className="grid gap-2 text-sm">مقاله ویژه<select name="featuredId" className="field" defaultValue={options.featuredId ?? ""}><option value="">آخرین مقاله منتشرشده</option>{articles.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}</select></label>
    {([["pageSize", "تعداد مقاله در هر صفحه", 4, 48], ["autoplayMs", "فاصله حرکت اسلایدر (میلی‌ثانیه)", 3000, 20000], ["wordsPerMinute", "تخمین مطالعه (کلمه در دقیقه)", 50, 500], ["relatedCount", "تعداد مقاله مرتبط", 1, 8]] as const).map(([key, label, min, max]) => <label className="grid gap-2 text-sm" key={key}>{label}<input name={key} className="field" type="number" min={min} max={max} defaultValue={options[key]} required /></label>)}
    <p className="text-xs text-muted">این اعداد پیش‌فرض‌های مهندسی و قابل تنظیم‌اند. صفحه اصلی همیشه حداکثر ۸ مقاله آخر را بر اساس زمان اولین انتشار نشان می‌دهد.</p><p role="status">{message}</p><button disabled={busy} className="btn btn-primary h-11">ذخیره تنظیمات بلاگ</button>
  </form>;
}
