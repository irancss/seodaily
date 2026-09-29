"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/molecules";
import { BlockEditor } from "../block-editor/block-editor";
import { SingleImageField } from "../plugins/image-upload";
import { LinkPicker } from "../block-editor/link-picker";
import { saveArticleAction } from "@/modules/blog/actions";
import { readingMinutes } from "@/modules/blog/content";
import { STATUS_LABELS, type ArticleDraft } from "@/modules/blog/types";
import type { BlockDocument } from "@/modules/blocks/schema";
import { suggestArticleLinks, type LinkSuggestion } from "@/modules/blog/suggestions";

type Choice = { id: number; title: string };
export function ArticleForm({ id, initial, version: initialVersion, status: initialStatus, categories, services, articles, wordsPerMinute, scheduledFor, scheduleError }: { id: number; initial: ArticleDraft; version: number; status: string; categories: Choice[]; services: Choice[]; articles: Choice[]; wordsPerMinute: number; scheduledFor: string | null; scheduleError: string }) {
  const [draft, setDraft] = useState(initial);
  const [version, setVersion] = useState(initialVersion);
  const [status, setStatus] = useState(initialStatus);
  const [schedule, setSchedule] = useState(scheduledFor ? new Date(new Date(scheduledFor).getTime() + 12600_000).toISOString().slice(0, 16) : "");
  const [message, setMessage] = useState(scheduleError);
  const [error, setError] = useState(Boolean(scheduleError));
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([]);
  const inFlight = useRef(false);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const dirty = JSON.stringify(draft) !== saved;
  const update = useCallback(<K extends keyof ArticleDraft>(key: K, value: ArticleDraft[K]) => setDraft((prev) => ({ ...prev, [key]: value })), []);
  const onDocumentChange = useCallback((content: BlockDocument) => update("content", content), [update]);
  const run = useCallback(async (operation: string) => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true);
    const snapshot = JSON.stringify(draft);
    try {
      // TipTap attributes may have null prototypes: send the versioned JSON contract,
      // never temporary React client references, across the server-action boundary.
      const result = await saveArticleAction(id, version, operation, snapshot, schedule);
      if (result.ok) {
        setSaved(snapshot); setVersion(result.version); setStatus(result.status); setError(false);
        setMessage(operation === "save" ? "پیش‌نویس ذخیره شد؛ نسخه عمومی تغییر نکرد." : "عملیات انجام شد.");
      } else { setError(true); setMessage(result.error); }
    } catch { setError(true); setMessage("ارتباط برقرار نشد؛ نوشته شما حفظ شده است. دوباره ذخیره کنید."); }
    finally { inFlight.current = false; setBusy(false); }
  }, [draft, id, version, schedule]);
  useEffect(() => {
    if (!dirty || error || ["trash", "archived"].includes(status)) return;
    const timer = setTimeout(() => { void run("save"); }, 1800);
    return () => clearTimeout(timer);
  }, [dirty, error, run, status]);
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    const click = (e: MouseEvent) => {
      if (!dirty || e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const link = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!link || link.getAttribute("target") === "_blank" || link.getAttribute("href")?.startsWith("#")) return;
      if (!confirm("تغییرات ذخیره‌نشده دارید. بدون ذخیره خارج شوید؟")) { e.preventDefault(); e.stopPropagation(); }
    };
    window.addEventListener("beforeunload", guard); document.addEventListener("click", click, true);
    return () => { window.removeEventListener("beforeunload", guard); document.removeEventListener("click", click, true); };
  }, [dirty]);
  const text = (key: keyof ArticleDraft, label: string, multiline = false) => <label className="grid gap-2 text-sm" key={key}>{label}{multiline ? <textarea className="field min-h-24" name={key} value={String(draft[key] ?? "")} onChange={(e) => update(key, e.target.value as never)} /> : <input className="field" name={key} value={String(draft[key] ?? "")} onChange={(e) => update(key, e.target.value as never)} />}{["seoTitle", "seoDescription"].includes(key) && <span className="text-xs text-muted">{String(draft[key]).length.toLocaleString("fa-IR")} نویسه — راهنمای خوانایی؛ تضمین رتبه نیست.</span>}</label>;
  const selection = (key: "categoryId" | "primaryServiceId", label: string, choices: Choice[]) => <label className="grid gap-2 text-sm">{label}<select className="field" name={key} value={draft[key] ?? ""} onChange={(e) => update(key, Number(e.target.value) || null)}><option value="">انتخاب کنید</option>{choices.map((c) => <option value={c.id} key={c.id}>{c.title}</option>)}</select></label>;
  return <div className="grid min-w-0 gap-6">
    <Card title="وضعیت انتشار">
      <p className="mb-3 text-sm">نویسنده: سئو دیلی · وضعیت: {STATUS_LABELS[status]} · نسخه {version.toLocaleString("fa-IR")}</p>
      <p role={error ? "alert" : "status"} className={`mb-4 text-sm ${error ? "text-error" : "text-muted"}`}>{busy ? "در حال ذخیره…" : dirty && !error ? "تغییرات ذخیره‌نشده؛ ذخیره خودکار تا چند لحظه دیگر" : message || "پیش‌نویس ذخیره است."}</p>
      <div className="flex flex-wrap gap-2">{[["save", "ذخیره پیش‌نویس"], ["publish", "انتشار"], ["archive", "آرشیو"], ["trash", "انتقال به زباله‌دان"], ["restore", "بازگردانی به پیش‌نویس"], ["cancel", "لغو زمان‌بندی"]].map(([op, label]) => <button key={op} type="button" disabled={busy} className="btn btn-secondary min-h-11 px-4 text-sm" onClick={() => { if (["trash", "archive"].includes(op) && !confirm("مقاله از نمایش عمومی خارج می‌شود و آدرس آن رزرو می‌ماند. ادامه؟")) return; void run(op); }}>{label}</button>)}
        <Link href={`/admin/blog/${id}/preview`} target="_blank" className="btn btn-secondary min-h-11 px-4 text-sm">پیش‌نمایش نسخه ذخیره‌شده</Link>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-3"><label className="grid gap-2 text-sm">زمان انتشار — تاریخ میلادی، ساعت تهران<input type="datetime-local" name="schedule" className="field" dir="ltr" value={schedule} onChange={(e) => setSchedule(e.target.value)} /></label><button type="button" className="btn btn-primary h-11 px-4" disabled={busy} onClick={() => void run("schedule")}>زمان‌بندی انتشار</button></div>
      <p className="mt-2 text-xs text-muted">ویرایش بعد از زمان‌بندی، برنامه قبلی را لغو می‌کند؛ پس از پایان ویرایش دوباره زمان‌بندی کنید.</p>
    </Card>
    <Card title="مقاله"><div className="grid gap-5 sm:grid-cols-2">{text("title", "عنوان مقاله / H1")}{text("slug", "نامک مقاله")}{selection("categoryId", "دسته اصلی", categories)}{selection("primaryServiceId", "خدمت اصلی مرتبط", services)}</div><div className="mt-5">{text("excerpt", "خلاصه", true)}</div></Card>
    <Card title="تصویر شاخص"><SingleImageField name="image" label="تصویر شاخص (برای انتشار الزامی)" value={draft.image} onChange={(v) => update("image", v)} hint="ابعاد واقعی هنگام انتشار از فایل خوانده می‌شود؛ تصویر بدون برش نمایش داده می‌شود." /><div className="mt-4">{text("imageAlt", "متن جایگزین تصویر")}</div></Card>
    <Card title="محتوا"><button type="button" className="btn btn-secondary mb-4 h-10 px-4 text-sm" onClick={async () => { try { const items = await suggestArticleLinks(id, JSON.stringify(draft)); setSuggestions(items); if (!items.length) setMessage("پیشنهاد مرتبط تازه‌ای پیدا نشد."); } catch { setMessage("دریافت پیشنهادها انجام نشد."); } }}>پیشنهاد لینک بر اساس دسته، خدمت و عنوان</button><BlockEditor name="content" label="محتوای مقاله" initial={initial.content} onDocumentChange={onDocumentChange} suggestions={suggestions} /></Card>
    <Card title="زمان مطالعه"><p className="mb-3 text-sm">محاسبه خودکار: {readingMinutes(draft.content, wordsPerMinute).toLocaleString("fa-IR")} دقیقه · نمایش نهایی: {(draft.readingOverride ?? readingMinutes(draft.content, wordsPerMinute)).toLocaleString("fa-IR")} دقیقه</p><label className="grid gap-2 text-sm">مقدار دستی (خالی = خودکار)<input className="field max-w-48" type="number" min={1} max={240} name="readingOverride" value={draft.readingOverride ?? ""} onChange={(e) => update("readingOverride", Number(e.target.value) || null)} /></label></Card>
    <Card title="لینک‌سازی و مطالب مرتبط"><p className="mb-4 text-sm text-muted">از دکمه «لینک» در ابزار ادیتور، متن انتخاب‌شده را به خدمت یا مقاله وصل کنید؛ لینک بدون تأیید شما درج نمی‌شود.</p><fieldset className="flex flex-wrap gap-4"><legend className="mb-3 text-sm">خدمات ثانویه</legend>{services.map((s) => <label className="text-sm" key={s.id}><input type="checkbox" checked={draft.serviceIds.includes(s.id)} onChange={(e) => update("serviceIds", e.target.checked ? [...draft.serviceIds, s.id] : draft.serviceIds.filter((v) => v !== s.id))} /> {s.title}</label>)}</fieldset>
      <label className="my-4 grid gap-2 text-sm">انتخاب مقالات مرتبط<select className="field" value={draft.relatedMode} onChange={(e) => update("relatedMode", e.target.value as "auto" | "manual")}><option value="auto">خودکار: دسته یا خدمت مشترک</option><option value="manual">دستی: به ترتیب انتخاب</option></select></label>
      {draft.relatedMode === "manual" && <div className="grid gap-2">{articles.filter((a) => a.id !== id).map((a) => <label key={a.id} className="text-sm"><input type="checkbox" checked={draft.relatedIds.includes(a.id)} onChange={(e) => update("relatedIds", e.target.checked ? [...draft.relatedIds, a.id] : draft.relatedIds.filter((v) => v !== a.id))} /> {draft.relatedIds.includes(a.id) ? `${draft.relatedIds.indexOf(a.id) + 1}. ` : ""}{a.title}</label>)}</div>}
    </Card>
    <Card title="دعوت به اقدام انتهای مقاله"><label className="text-sm"><input type="checkbox" checked={draft.endCta} onChange={(e) => update("endCta", e.target.checked)} /> نمایش CTA انتهایی</label>{draft.endCta && <div className="mt-4 grid gap-4">{text("ctaTitle", "عنوان CTA")}{text("ctaText", "توضیح CTA")}{text("ctaLabel", "متن دکمه")}<LinkPicker value={draft.ctaHref} onChange={(href) => update("ctaHref", href)} />{draft.primaryServiceId && <button type="button" className="btn btn-secondary h-11 px-4" onClick={() => update("ctaHref", `entity:service:${draft.primaryServiceId}`)}>انتخاب خدمت اصلی به‌عنوان مقصد</button>}</div>}</Card>
    <Card title="سئو و اشتراک‌گذاری"><div className="grid gap-5 sm:grid-cols-2">{text("seoTitle", "عنوان SEO")}{text("seoDescription", "توضیحات SEO", true)}{text("ogTitle", "عنوان Open Graph")}{text("ogDescription", "توضیحات Open Graph", true)}{text("canonicalUrl", "canonical پیشرفته (پیش‌فرض: خود مقاله)")}</div><label className="my-4 block text-sm"><input type="checkbox" checked={draft.noindex} onChange={(e) => update("noindex", e.target.checked)} /> جلوگیری از ایندکس (noindex)</label><SingleImageField name="ogImage" label="تصویر Open Graph اختیاری" value={draft.ogImage} onChange={(v) => update("ogImage", v)} hint="اگر خالی باشد همان تصویر شاخص استفاده می‌شود." /></Card>
  </div>;
}
