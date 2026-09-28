"use client";

import { useActionState, useEffect, useId, useRef, type InputHTMLAttributes } from "react";

import { Icon } from "@/components/atoms/icon";
import { trackOnce } from "@/lib/analytics";
import { toast } from "@/lib/toast";
import { cx } from "@/lib/utils";
import { submitEstimate, type EstimateState } from "@/modules/pricing/actions";
import type { EstimateResult } from "@/modules/pricing/estimate";
import { formatNumber, formatPrice, formatTotal } from "@/modules/pricing/format";

/** Picked items and the live total, on the dark summary card. */
export function EstimateSummary({ estimate, label, note }: { estimate: EstimateResult; label: string; note: string }) {
  const { items, total, negotiable } = estimate;
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg leading-[1.7] font-bold">خلاصه برآورد</h3>
        <span className="chip px-3 py-0.5 text-xs">{label}</span>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm leading-[1.8] text-inverse-muted">هنوز گزینه‌ای انتخاب نشده است؛ هزینه هر گزینه‌ای که انتخاب کنید اینجا اضافه می‌شود.</p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-white/10 lg:max-h-[34vh] lg:overflow-y-auto lg:pe-1">
          {items.map((item, i) => (
            <li key={`${i}-${item.group}-${item.label}`} className="flex items-start justify-between gap-4 py-2.5 text-sm leading-[1.8]">
              <span className="min-w-0">
                <span className="block text-xs text-inverse-muted">{item.group}</span>
                <span className="font-medium text-white">{item.label}</span>
                {item.qty > 1 && item.unitPrice > 0 && (
                  <span className="block text-xs text-inverse-muted">
                    {formatNumber(item.qty)} × {formatPrice(item.unitPrice)}
                  </span>
                )}
              </span>
              <span className={cx("shrink-0 font-semibold", item.amount > 0 ? "text-white" : "text-inverse-muted")}>{formatPrice(item.amount)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 border-t border-white/10 pt-4" aria-live="polite" aria-atomic="true">
        <p className="text-sm text-inverse-muted">جمع برآورد</p>
        <p className="mt-1 text-[26px] leading-[1.5] font-bold lg:text-[28px]">
          <span className="text-gradient">{formatTotal(total)}</span>
        </p>
        {negotiable && total > 0 && (
          <p className="mt-1 text-xs leading-[1.8] text-inverse-muted">به‌اضافه موارد «توافقی» که پس از بررسی قیمت‌گذاری می‌شوند.</p>
        )}
      </div>
      {note && <p className="mt-3 text-xs leading-[1.8] text-inverse-muted">{note}</p>}
    </>
  );
}

type FieldProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  multiline?: boolean;
} & Pick<InputHTMLAttributes<HTMLInputElement>, "name" | "type" | "inputMode" | "autoComplete" | "dir" | "placeholder" | "defaultValue" | "className">;

function Field({ id, label, required, error, multiline, className, ...input }: FieldProps) {
  const common = {
    id,
    required,
    "aria-required": required || undefined,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  };
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="field-label text-white">
        {label}{" "}
        {required && (
          <span aria-hidden="true" className="text-red-300">
            *
          </span>
        )}
      </label>
      {multiline ? (
        <textarea {...common} name={input.name} rows={3} maxLength={2000} defaultValue={input.defaultValue} className="field" />
      ) : (
        <input {...common} {...input} className={cx("field", className)} />
      )}
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-sm leading-[1.8] font-medium text-red-300">
          <Icon name="alert" size={16} />
          {error}
        </p>
      )}
    </div>
  );
}

const initialState: EstimateState = { status: "idle" };

type FormProps = {
  service: string;
  /** JSON of the picks; the server recomputes the prices from it. */
  selection: string;
  /** Client-side check before sending; shows the calculator's errors when false. */
  validate: () => boolean;
  /** Problem with the estimate as a whole (nothing picked, stale plan). */
  estimateError?: string;
  onReset: () => void;
};

/** Contact fields that send the estimate as a request, and the thank-you state. */
export function EstimateForm({ service, selection, validate, estimateError, onReset }: FormProps) {
  const [state, action, pending] = useActionState(submitEstimate, initialState);
  const id = useId();
  const messageRef = useRef<HTMLParagraphElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const view = useRef({});
  const v = state.values ?? {};
  const e = state.errors ?? {};

  useEffect(() => {
    if (state.status === "success") {
      successRef.current?.focus();
      toast.success("درخواست شما ثبت شد. به‌زودی برای هماهنگی تماس می‌گیریم.", { silent: true });
      if (state.lead) {
        trackOnce(state, "lead", { event: "generate_lead", form: "estimate", service, estimate_total_toman: state.total });
      }
    }
    if (state.status === "error") {
      messageRef.current?.focus();
      if (state.message) toast.error(state.message, { silent: true });
    }
  }, [state, service]);

  if (state.status === "success") {
    return (
      <div ref={successRef} tabIndex={-1} role="status" className="mt-6 flex flex-col items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-5 outline-none">
        <span aria-hidden="true" className="icon-gradient size-11 rounded-full">
          <Icon name="check" size={22} />
        </span>
        <p className="text-lg leading-[1.7] font-bold">درخواست شما ثبت شد</p>
        <p className="text-sm leading-[1.9] text-inverse-muted">
          برآورد ثبت‌شده: <strong className="font-semibold text-white">{formatTotal(state.total ?? 0)}</strong>. جزئیات را بررسی می‌کنیم و برای ارسال پیش‌فاکتور با شما تماس می‌گیریم.
        </p>
        <button type="button" onClick={onReset} className="btn btn-glass h-11 px-5 text-sm">
          برآورد جدید
        </button>
      </div>
    );
  }

  const message = state.status === "error" ? state.message : estimateError;
  return (
    <form
      action={action}
      noValidate
      onSubmit={(event) => {
        if (!validate()) event.preventDefault();
      }}
      onInput={() => trackOnce(view.current, "form_start", { event: "form_start", form: "estimate" })}
      className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-6"
    >
      <div>
        <p className="text-base leading-[1.7] font-bold">ثبت درخواست</p>
        <p className="mt-0.5 text-xs leading-[1.8] text-inverse-muted">برای دریافت پیش‌فاکتور، اطلاعات تماس خود را وارد کنید.</p>
      </div>
      {message && (
        <p ref={messageRef} tabIndex={-1} role="alert" className="rounded-md bg-red-500/15 px-4 py-3 text-sm leading-[1.8] font-medium text-red-200 outline-none">
          {message}
        </p>
      )}
      <input type="hidden" name="service" value={service} />
      <input type="hidden" name="selection" value={selection} />
      {/* Honeypot for bots: no visible or readable text (so nothing leaks into search snippets), out of the tab order and hidden from assistive tech. */}
      <div aria-hidden="true" className="sr-only">
        <input id={`${id}-fax`} name="company_fax" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Field id={`${id}-name`} name="name" label="نام و نام خانوادگی" required autoComplete="name" defaultValue={v.name} error={e.name} />
      <Field
        id={`${id}-phone`}
        name="phone"
        label="شماره تماس"
        required
        type="tel"
        inputMode="tel"
        dir="ltr"
        autoComplete="tel"
        placeholder="09xx xxx xxxx"
        defaultValue={v.phone}
        error={e.phone}
        className="text-right placeholder:text-right"
      />
      <details open={Boolean(v.business || v.note || e.business || e.note)}>
        <summary className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-sky-200 hover:text-white">
          <Icon name="plus" size={16} />
          نام کسب‌وکار و توضیحات (اختیاری)
        </summary>
        <div className="mt-3 flex flex-col gap-4">
          <Field id={`${id}-business`} name="business" label="نام کسب‌وکار" autoComplete="organization" defaultValue={v.business} error={e.business} />
          <Field id={`${id}-note`} name="note" label="توضیحات" multiline defaultValue={v.note} error={e.note} />
        </div>
      </details>

      <button type="submit" disabled={pending} className="btn btn-white h-12 w-full">
        {pending ? "در حال ثبت…" : "ثبت درخواست برآورد"}
        {!pending && <Icon name="arrow-left" />}
      </button>
      <p className="flex items-start gap-2 text-xs leading-[1.8] text-inverse-muted">
        <Icon name="lock" size={14} className="mt-0.5 shrink-0" />
        اطلاعات شما فقط برای بررسی همین درخواست استفاده می‌شود.
      </p>
    </form>
  );
}
