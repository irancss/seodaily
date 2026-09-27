"use client";

import { useState } from "react";

/** Text input with a live character count, for meta titles and descriptions. */
export function CountedField({
  label,
  name,
  defaultValue,
  limit,
  multiline,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  limit: number;
  multiline?: boolean;
  hint?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const id = `f-${name}`;
  const over = value.length > limit;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {multiline ? (
        <textarea id={id} name={name} rows={3} value={value} onChange={(e) => setValue(e.target.value)} className="field" />
      ) : (
        <input id={id} name={name} type="text" value={value} onChange={(e) => setValue(e.target.value)} className="field" />
      )}
      <p className="flex justify-between gap-4 text-xs leading-[1.8] text-muted">
        <span>{hint}</span>
        <span className={over ? "font-semibold text-warning" : undefined}>
          {value.length} / {limit}
        </span>
      </p>
    </div>
  );
}
