"use client";

import { useId } from "react";

import { Icon } from "@/components/atoms/icon";
import { cx } from "@/lib/utils";
import { formatPrice, parseAmount, parseDigits } from "@/modules/pricing/format";
import { PRICE_MAX } from "@/modules/pricing/types";

// Small controlled inputs for the pricing editor, which posts its whole state
// as JSON (so none of these has a `name`).

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  rows = 2,
  hint,
  list,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  hint?: string;
  /** id of a <datalist> with suggestions. */
  list?: string;
}) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {multiline ? (
        <textarea id={id} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="field bg-white" />
      ) : (
        <input id={id} type="text" value={value} placeholder={placeholder} list={list} onChange={(e) => onChange(e.target.value)} className="field bg-white" />
      )}
      {hint && <p className="text-xs leading-[1.8] text-muted">{hint}</p>}
    </div>
  );
}

/** Toman amount; shows how it will read on the site («توافقی» for 0). */
export function PriceInput({ label, value, onChange, max = PRICE_MAX }: { label: string; value: number; onChange: (value: number) => void; max?: number }) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        dir="ltr"
        placeholder="0"
        value={value ? String(value) : ""}
        onChange={(e) => onChange(Math.min(max, parseAmount(e.target.value)))}
        aria-describedby={`${id}-shown`}
        className="field bg-white text-right placeholder:text-right"
      />
      <p id={`${id}-shown`} className={cx("text-xs leading-[1.8]", value ? "font-semibold text-brand-hover" : "text-muted")}>
        {value ? formatPrice(value) : "توافقی (بدون قیمت)"}
      </p>
    </div>
  );
}

export function CountInput({ label, value, onChange, max }: { label: string; value: number; onChange: (value: number) => void; max: number }) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        dir="ltr"
        value={String(value)}
        onChange={(e) => onChange(Math.min(max, parseDigits(e.target.value) ?? 0))}
        className="field bg-white text-right"
      />
    </div>
  );
}

export function CheckboxInput({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-[18px] accent-brand" />
      {label}
    </label>
  );
}

/** Up / down / remove buttons of a list row. */
export function RowTools({
  index,
  count,
  name,
  onMove,
  onRemove,
  confirm,
}: {
  index: number;
  count: number;
  /** What the row is, for the button labels (e.g. «گزینه ۲»). */
  name: string;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
  /** Ask before removing. */
  confirm?: string;
}) {
  const button = "flex size-9 cursor-pointer items-center justify-center rounded-sm border border-line bg-white text-ink-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className="flex shrink-0 flex-col gap-1">
      <button type="button" aria-label={`انتقال ${name} به بالا`} disabled={index === 0} onClick={() => onMove(-1)} className={button}>
        <Icon name="chevron-down" size={16} className="rotate-180" />
      </button>
      <button type="button" aria-label={`انتقال ${name} به پایین`} disabled={index === count - 1} onClick={() => onMove(1)} className={button}>
        <Icon name="chevron-down" size={16} />
      </button>
      <button
        type="button"
        aria-label={`حذف ${name}`}
        onClick={() => {
          if (!confirm || window.confirm(confirm)) onRemove();
        }}
        className={cx(button, "text-error hover:text-error")}
      >
        <Icon name="trash" size={16} />
      </button>
    </div>
  );
}

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="btn btn-secondary h-10 self-start px-4 text-sm">
      <Icon name="plus" size={16} />
      {label}
    </button>
  );
}

export function moveItem<T>(list: T[], index: number, delta: number) {
  const j = index + delta;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[index], next[j]] = [next[j], next[index]];
  return next;
}

/** Id for a new plan, group or option (letters, digits and dashes only). */
export function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
