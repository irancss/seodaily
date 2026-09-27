"use client";

import { useId, useState, type ReactNode } from "react";

import { Icon } from "@/components/atoms/icon";
import { cx } from "@/lib/utils";
import { formatNumber, formatPrice, parseDigits } from "@/modules/pricing/format";
import type { EstimateSelection, PricingGroup } from "@/modules/pricing/types";

type Choice = EstimateSelection["choices"][string] | undefined;

type Props = {
  group: PricingGroup;
  /** Keeps radio names apart between the service panels. */
  scope: string;
  value: Choice;
  onChange: (value: Choice) => void;
  error?: string;
  /** Unit of the quantity the option prices are multiplied by (e.g. «مقاله»). */
  perUnit?: string;
  /** For a count-only quantity: titles of the groups priced per unit. */
  dependents?: string[];
};

/** One calculator question as a card: radio or checkbox tiles, or a quantity stepper. */
export function OptionGroup({ group, scope, value, onChange, error, perUnit, dependents }: Props) {
  const id = useId();
  const titleId = `${id}-title`;
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy = [group.help && helpId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cx("rounded-xl border bg-white p-5 shadow-sm transition-colors lg:p-6", error ? "border-error" : "border-line")}>
      <fieldset aria-describedby={describedBy} className="m-0 min-w-0 border-0 p-0">
        <legend className="w-full p-0">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span id={titleId} className="text-lg leading-[1.7] font-bold text-ink">
              {group.title}
            </span>
            {group.type === "single" && group.required && (
              <span className="rounded-full bg-soft px-2.5 text-xs leading-[1.9] font-semibold text-brand-hover">الزامی</span>
            )}
            {group.type === "multi" && <span className="text-xs leading-[1.9] text-muted">چند گزینه قابل انتخاب است</span>}
            {perUnit && <span className="text-xs leading-[1.9] text-muted">قیمت‌ها برای هر {perUnit}</span>}
          </span>
        </legend>
        {group.help && (
          <p id={helpId} className="mt-1 text-sm leading-[1.8] text-ink-2">
            {group.help}
          </p>
        )}
        <div className="mt-4">
          {group.type === "quantity" ? (
            <QuantityField group={group} value={value} onChange={onChange} titleId={titleId} dependents={dependents} />
          ) : (
            <OptionTiles group={group} scope={scope} value={value} onChange={onChange} perUnit={perUnit} />
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-3 flex items-center gap-1.5 text-sm leading-[1.8] font-medium text-error">
            <Icon name="alert" size={16} />
            {error}
          </p>
        )}
      </fieldset>
    </div>
  );
}

function OptionTiles({ group, scope, value, onChange, perUnit }: Pick<Props, "group" | "scope" | "value" | "onChange" | "perUnit">) {
  const single = group.type === "single";
  const picked = single ? (typeof value === "string" ? [value] : []) : Array.isArray(value) ? value : [];

  function toggle(optionId: string, checked: boolean) {
    if (single) onChange(optionId);
    else onChange(checked ? [...picked, optionId] : picked.filter((p) => p !== optionId));
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {group.options.map((o) => {
          const checked = picked.includes(o.id);
          return (
            <label
              key={o.id}
              className={cx(
                "flex h-full cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors",
                checked ? "border-brand bg-soft" : "border-line bg-white hover:border-brand/50",
              )}
            >
              <input
                type={single ? "radio" : "checkbox"}
                name={`${scope}-${group.id}`}
                value={o.id}
                checked={checked}
                onChange={(e) => toggle(o.id, e.target.checked)}
                className="mt-1 size-[18px] shrink-0 accent-brand"
              />
              <span className="flex min-w-0 grow flex-col gap-1">
                <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <span className="leading-[1.7] font-semibold text-ink">{o.label}</span>
                  <span className={cx("text-sm font-semibold whitespace-nowrap", o.price > 0 ? "text-brand-hover" : "text-muted")}>
                    {formatPrice(o.price)}
                    {perUnit && o.price > 0 ? ` / ${perUnit}` : ""}
                  </span>
                </span>
                {o.description && <span className="text-sm leading-[1.8] text-ink-2">{o.description}</span>}
              </span>
            </label>
          );
        })}
      </div>
      {single && !group.required && picked.length > 0 && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="mt-3 inline-flex min-h-10 cursor-pointer items-center gap-1.5 text-sm font-medium text-ink-2 underline underline-offset-4 hover:text-brand"
        >
          <Icon name="close" size={14} />
          لغو انتخاب
        </button>
      )}
    </>
  );
}

function StepButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-md border border-line bg-white text-ink transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function QuantityField({
  group,
  value,
  onChange,
  titleId,
  dependents,
}: Pick<Props, "group" | "value" | "onChange" | "dependents"> & { titleId: string }) {
  const qty = typeof value === "number" ? value : group.defaultQty;
  // What is typed may be empty or out of range for a moment; the estimate only
  // follows valid numbers, and leaving the field snaps it back into range.
  const [draft, setDraft] = useState(String(qty));
  const [shown, setShown] = useState(qty);
  if (qty !== shown) {
    setShown(qty);
    setDraft(String(qty));
  }

  const clamp = (n: number) => Math.min(group.max, Math.max(group.min, n));
  const step = (delta: number) => onChange(clamp(qty + delta));
  const unit = group.unitLabel;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <StepButton label={`افزایش ${group.title}`} disabled={qty >= group.max} onClick={() => step(1)}>
          <Icon name="plus" size={18} />
        </StepButton>
        <input
          type="text"
          inputMode="numeric"
          dir="ltr"
          autoComplete="off"
          role="spinbutton"
          aria-labelledby={titleId}
          aria-valuemin={group.min}
          aria-valuemax={group.max}
          aria-valuenow={qty}
          aria-valuetext={`${formatNumber(qty)} ${unit}`.trim()}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            const n = parseDigits(e.target.value);
            if (n !== null && n >= group.min && n <= group.max) onChange(n);
          }}
          onBlur={() => {
            const n = parseDigits(draft);
            const next = n === null ? qty : clamp(n);
            setDraft(String(next));
            if (next !== qty) onChange(next);
          }}
          onKeyDown={(e) => {
            if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
            e.preventDefault();
            step(e.key === "ArrowUp" ? 1 : -1);
          }}
          className="field h-12 w-20 px-2 text-center text-lg font-bold"
        />
        <StepButton label={`کاهش ${group.title}`} disabled={qty <= group.min} onClick={() => step(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M5 12h14" />
          </svg>
        </StepButton>
        {unit && <span className="ms-1 text-sm font-medium text-ink-2">{unit}</span>}
      </div>
      <p className="text-sm leading-[1.8] text-ink-2">
        {dependents && dependents.length > 0 ? (
          <>
            قیمت {dependents.map((d) => `«${d}»`).join(" و ")} برای هر {unit || "واحد"} حساب می‌شود.
          </>
        ) : group.unitPrice > 0 ? (
          <>
            هر {unit || "واحد"}: {formatPrice(group.unitPrice)}
            {qty > 0 && <span className="block font-bold text-ink">{formatPrice(group.unitPrice * qty)}</span>}
          </>
        ) : (
          <>قیمت: توافقی</>
        )}
      </p>
    </div>
  );
}
