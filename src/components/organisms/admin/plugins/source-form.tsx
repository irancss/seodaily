"use client";

import { startTransition, useActionState, useId } from "react";

import { SubmitButton } from "@/components/atoms";
import { ADAPTER_LABEL } from "@/modules/plugins/labels";
import { saveSourceAction, testSourceAction, type TestResult } from "@/modules/plugins/source-actions";

export type SourceValues = {
  id?: number;
  url: string;
  adapter: string;
  versionSelector: string;
  versionAttribute: string;
  versionRegex: string;
  downloadSelector: string;
  downloadUrl: string;
  priority: number;
  enabled: boolean;
  notes: string;
};

const EMPTY: SourceValues = { url: "", adapter: "auto", versionSelector: "", versionAttribute: "", versionRegex: "", downloadSelector: "", downloadUrl: "", priority: 10, enabled: true, notes: "" };

function Input({ label, name, value, hint, ltr = true, required }: { label: string; name: string; value: string | number; hint?: string; ltr?: boolean; required?: boolean }) {
  const id = useId();
  return (
    <label className="flex flex-col gap-1.5 text-sm" htmlFor={id}>
      <span className="font-medium">
        {label} {required && <span className="text-error">*</span>}
      </span>
      <input id={id} name={name} defaultValue={value} required={required} dir={ltr ? "ltr" : undefined} className="field h-10" />
      {hint && <span className="text-xs leading-[1.8] text-muted">{hint}</span>}
    </label>
  );
}

/** One source: URL, adapter, manual rules, and a dry-run test that shows what would be chosen and why. */
export function SourceForm({ pluginId, allowPrerelease, source = EMPTY }: { pluginId: number; allowPrerelease: boolean; source?: SourceValues }) {
  const [test, runTest, testing] = useActionState<TestResult | null, FormData>(testSourceAction, null);
  const o = test?.observation;
  return (
    <form action={saveSourceAction} className="flex flex-col gap-4">
      <input type="hidden" name="pluginId" value={pluginId} />
      {source.id && <input type="hidden" name="id" value={source.id} />}
      {allowPrerelease && <input type="hidden" name="allowPrerelease" value="true" />}
      <Input label="نشانی صفحه منبع" name="url" value={source.url} required hint="صفحه عمومی افزونه در منبع؛ برای WordPress.org و GitHub داده رسمی خوانده می‌شود." />
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px]">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">نوع منبع</span>
          <select name="adapter" defaultValue={source.adapter} className="field h-10 py-0">
            {Object.entries(ADAPTER_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <Input label="اولویت اعتماد" name="priority" value={source.priority} hint="عدد کمتر = مطمئن‌تر؛ فقط بین نسخه‌های برابر." />
      </div>
      <details className="rounded-lg border border-line p-3 text-sm" open={Boolean(source.versionSelector || source.downloadSelector || source.downloadUrl || source.versionRegex)}>
        <summary className="cursor-pointer font-medium">تنظیم دستی (وقتی تشخیص خودکار کافی نیست)</summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input label="selector نسخه (CSS)" name="versionSelector" value={source.versionSelector} hint="مثلاً .product-version یا table tr:nth-child(2) td" />
          <Input label="ویژگی (attribute) نسخه" name="versionAttribute" value={source.versionAttribute} hint="خالی = متن عنصر؛ مثلاً content" />
          <Input label="regex نسخه" name="versionRegex" value={source.versionRegex} hint="اولین گروه، نسخه است؛ حداکثر ۲۰۰ نویسه. مثال: Version\s*([\d.]+)" />
          <Input label="selector لینک دانلود (CSS)" name="downloadSelector" value={source.downloadSelector} hint="عنصری که href فایل را دارد" />
        </div>
        <div className="mt-4">
          <Input label="لینک مستقیم دانلود" name="downloadUrl" value={source.downloadUrl} hint="اگر لینک ثابت است. {version} با نسخه خوانده‌شده جایگزین می‌شود. دسترسی/ورود محافظت‌شده دور زده نمی‌شود." />
        </div>
      </details>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">یادداشت داخلی</span>
        <textarea name="notes" defaultValue={source.notes} rows={2} maxLength={1000} className="field" placeholder="مثلاً: مجوز میزبانی از فروشنده گرفته شده است (تاریخ)" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="enabled" defaultChecked={source.enabled} className="size-4" />
        منبع فعال است
      </label>
      <div className="flex flex-wrap gap-2">
        <SubmitButton>{source.id ? "ذخیره منبع" : "افزودن منبع"}</SubmitButton>
        {/* Not a form action: React would reset the form afterwards and drop what the admin typed. */}
        <button
          type="button"
          disabled={testing}
          onClick={(e) => {
            const form = e.currentTarget.form;
            if (form?.reportValidity()) startTransition(() => runTest(new FormData(form)));
          }}
          className="btn btn-secondary h-11 px-5 text-sm"
        >
          {testing ? "در حال خواندن صفحه…" : "آزمایش منبع (بدون دانلود فایل)"}
        </button>
      </div>
      {test && (
        <div role="status" className={`rounded-lg p-4 text-sm leading-[1.9] ${test.ok ? "bg-success-bg" : "bg-warning-bg"}`}>
          {test.error && <p className="text-error">{test.error}</p>}
          {o && (
            <dl className="grid gap-1">
              <div className="flex gap-2">
                <dt className="text-muted">نتیجه:</dt>
                <dd className="font-semibold">{o.result === "ok" ? "قابل استفاده" : o.result === "manual_setup_required" ? "MANUAL_SETUP_REQUIRED — تنظیم دستی لازم است" : o.result}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-muted">روش:</dt>
                <dd>{ADAPTER_LABEL[o.adapter] ?? o.adapter}</dd>
              </div>
              {o.version && (
                <div className="flex gap-2">
                  <dt className="text-muted">نسخه:</dt>
                  <dd dir="ltr">{o.version}</dd>
                </div>
              )}
              {o.downloadUrl && (
                <div className="flex gap-2">
                  <dt className="text-muted">فایل:</dt>
                  <dd dir="ltr" className="break-all">
                    {o.downloadUrl}
                  </dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="text-muted">اطمینان:</dt>
                <dd>{o.confidence}٪</dd>
              </div>
              {o.evidence.length > 0 && (
                <div>
                  <dt className="text-muted">دلایل:</dt>
                  <dd>
                    <ul className="list-disc ps-5">
                      {o.evidence.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
              {o.error && (
                <div className="flex gap-2">
                  <dt className="text-muted">خطا:</dt>
                  <dd className="text-error">{o.error}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      )}
    </form>
  );
}
