"use client";

import { useState } from "react";

import { Icon } from "@/components/atoms";

type FieldDef = { key: string; label: string; multiline?: boolean; dir?: "ltr" };

/**
 * Editable list of rows (e.g. FAQ items, process steps). Serialises to a hidden
 * JSON input named `name`.
 */
export function Repeater({
  name,
  label,
  hint,
  fields,
  initial,
  addLabel = "افزودن مورد",
  max = 50,
}: {
  name: string;
  label: string;
  hint?: string;
  fields: FieldDef[];
  initial: Record<string, string>[];
  addLabel?: string;
  max?: number;
}) {
  const blank = () => Object.fromEntries(fields.map((f) => [f.key, ""]));
  const [items, setItems] = useState<Record<string, string>[]>(initial);

  const update = (i: number, key: string, value: string) =>
    setItems((list) => list.map((row, j) => (j === i ? { ...row, [key]: value } : row)));
  const move = (i: number, d: -1 | 1) =>
    setItems((list) => {
      const next = [...list];
      const j = i + d;
      if (j < 0 || j >= next.length) return list;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="field-label p-0">{label}</legend>
      {hint && <p className="mt-1 text-xs leading-[1.8] text-muted">{hint}</p>}
      <input type="hidden" name={name} value={JSON.stringify(items)} />
      <ol className="mt-3 flex flex-col gap-3">
        {items.map((row, i) => (
          <li key={i} className="rounded-md border border-line bg-page p-3">
            <div className="flex items-start gap-3">
              <span className="mt-3 w-6 shrink-0 text-center text-sm font-bold text-brand">{i + 1}</span>
              <div className="grid min-w-0 grow gap-2">
                {fields.map((f) => {
                  const common = {
                    "aria-label": `${f.label} ${i + 1}`,
                    placeholder: f.label,
                    value: row[f.key] ?? "",
                    dir: f.dir,
                    className: "field bg-white",
                  };
                  return f.multiline ? (
                    <textarea key={f.key} rows={2} {...common} onChange={(e) => update(i, f.key, e.target.value)} />
                  ) : (
                    <input key={f.key} type="text" {...common} onChange={(e) => update(i, f.key, e.target.value)} />
                  );
                })}
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button type="button" aria-label="بالا" onClick={() => move(i, -1)} disabled={i === 0} className="flex size-8 items-center justify-center rounded-sm border border-line bg-white text-ink-2 disabled:opacity-40">
                  <Icon name="chevron-down" size={16} className="rotate-180" />
                </button>
                <button type="button" aria-label="پایین" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="flex size-8 items-center justify-center rounded-sm border border-line bg-white text-ink-2 disabled:opacity-40">
                  <Icon name="chevron-down" size={16} />
                </button>
                <button type="button" aria-label="حذف" onClick={() => setItems((list) => list.filter((_, j) => j !== i))} className="flex size-8 items-center justify-center rounded-sm border border-line bg-white text-error">
                  <Icon name="close" size={16} />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ol>
      {items.length < max && (
        <button type="button" onClick={() => setItems((list) => [...list, blank()])} className="btn btn-secondary mt-3 h-10 px-4 text-sm">
          <Icon name="plus" size={16} />
          {addLabel}
        </button>
      )}
    </fieldset>
  );
}
