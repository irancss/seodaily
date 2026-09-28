"use client";

import { useEffect, useId, useState } from "react";

import { searchLinkTargets, type LinkTarget } from "@/modules/blocks/actions";
import { isSafeHref } from "@/modules/blocks/schema";

/**
 * Chooses a link target: an internal page from a search (stored as
 * entity:type:id, so renames never break it) or a typed URL.
 */
export function LinkPicker({ value, onChange, autoFocus }: { value: string; onChange: (href: string, label?: string) => void; autoFocus?: boolean }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LinkTarget[]>([]);
  const [url, setUrl] = useState(value.startsWith("entity:") ? "" : value);

  useEffect(() => {
    let live = true;
    const timer = setTimeout(() => {
      searchLinkTargets(query)
        .then((r) => live && setResults(r))
        .catch(() => live && setResults([]));
    }, 200);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [query]);

  const urlValid = !url || isSafeHref(url);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-q`} className="text-sm font-medium text-ink">
          جست‌وجوی صفحه داخلی
        </label>
        <input id={`${id}-q`} className="field h-10" value={query} autoFocus={autoFocus} onChange={(e) => setQuery(e.target.value)} placeholder="نام افزونه، دسته یا صفحه" />
        <ul className="max-h-48 overflow-y-auto rounded-md border border-line" aria-label="نتیجه‌ها">
          {results.map((r) => (
            <li key={r.href}>
              <button
                type="button"
                onClick={() => onChange(r.href, r.label)}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-right text-sm hover:bg-soft ${r.href === value ? "bg-soft font-semibold" : ""}`}
              >
                <span>{r.label}</span>
                <span className="text-xs text-muted">{r.kind}</span>
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="px-3 py-2 text-sm text-muted">موردی پیدا نشد.</li>}
        </ul>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-url`} className="text-sm font-medium text-ink">
          یا آدرس کامل (https://…، /مسیر، mailto:، tel:)
        </label>
        <div className="flex gap-2">
          <input
            id={`${id}-url`}
            dir="ltr"
            className="field h-10 grow"
            value={url}
            aria-invalid={urlValid ? undefined : true}
            onChange={(e) => setUrl(e.target.value.trim())}
            placeholder="https://"
          />
          <button type="button" className="btn btn-secondary h-10 px-4 text-sm" disabled={!url || !urlValid} onClick={() => onChange(url)}>
            ثبت
          </button>
        </div>
        {!urlValid && <p className="text-xs text-error">این آدرس مجاز نیست.</p>}
      </div>
    </div>
  );
}
