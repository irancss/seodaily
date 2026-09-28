"use client";

import { useActionState, useEffect, useRef } from "react";

import { Icon } from "@/components/atoms";
import { trackOnce } from "@/lib/analytics";
import { toast } from "@/lib/toast";
import { SERVICE_CHOICE_LABELS } from "@/modules/leads/constants";

import { submitConsultation, type ContactState } from "@/modules/leads/submit-action";

const initial: ContactState = { status: "idle" };

function Required() {
  return (
    <span aria-hidden="true" className="text-error">
      *
    </span>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="flex items-center gap-1.5 text-sm leading-[1.8] font-medium text-error">
      <Icon name="alert" size={16} />
      {message}
    </p>
  );
}

export function ContactForm({ budgets, defaultService }: { budgets: string[]; defaultService?: string }) {
  const [state, action, pending] = useActionState(submitConsultation, initial);
  const successRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const view = useRef({});
  const v = state.values ?? {};
  const e = state.errors ?? {};

  useEffect(() => {
    if (state.status === "success") {
      successRef.current?.focus();
      toast.success("درخواست مشاوره ثبت شد. به‌زودی با شما تماس می‌گیریم.", { silent: true });
      if (state.lead) trackOnce(state, "lead", { event: "generate_lead", form: "contact", service: state.lead.service });
    }
    if (state.status === "error") {
      errorRef.current?.focus();
      if (state.message) toast.error(state.message, { silent: true });
    }
  }, [state]);

  if (state.status === "success") {
    return (
      <div ref={successRef} tabIndex={-1} role="status" className="flex flex-col items-start gap-4 rounded-md bg-success-bg p-6 outline-none">
        <span className="flex size-12 items-center justify-center rounded-full bg-white text-success">
          <Icon name="check" size={24} />
        </span>
        <h3 className="t-h3 text-success">درخواست شما ثبت شد</h3>
        <p className="text-base leading-[1.9] text-ink-2">
          اطلاعات اولیه بررسی می‌شود و در صورت نیاز برای تکمیل اطلاعات با شما تماس گرفته می‌شود.
        </p>
      </div>
    );
  }

  const selectedService = v.service || defaultService || "web-design-seo";

  return (
    <form
      action={action}
      noValidate
      aria-labelledby="cf-title"
      onInput={() => trackOnce(view.current, "form_start", { event: "form_start", form: "contact" })}
      className="mt-6 flex flex-col gap-5 lg:mt-8 lg:gap-6"
    >
      {state.status === "error" && state.message && (
        <p ref={errorRef} tabIndex={-1} role="alert" className="rounded-sm bg-error-bg px-4 py-3 text-sm leading-[1.8] font-medium text-error outline-none">
          {state.message}
        </p>
      )}

      {/* Honeypot for bots: no visible or readable text (so nothing leaks into search snippets), out of the tab order and hidden from assistive tech. */}
      <div aria-hidden="true" className="sr-only">
        <input id="cf-fax" name="company_fax" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid items-start gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="cf-name" className="field-label">
            نام و نام خانوادگی <Required />
          </label>
          <input
            id="cf-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            aria-required="true"
            aria-invalid={e.name ? true : undefined}
            aria-describedby={e.name ? "cf-name-error" : undefined}
            defaultValue={v.name}
            className="field"
          />
          <FieldError id="cf-name-error" message={e.name} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="cf-phone" className="field-label">
            شماره تماس <Required />
          </label>
          <input
            id="cf-phone"
            name="phone"
            type="tel"
            dir="ltr"
            inputMode="tel"
            autoComplete="tel"
            placeholder="09xx xxx xxxx"
            required
            aria-required="true"
            aria-invalid={e.phone ? true : undefined}
            aria-describedby={e.phone ? "cf-phone-error" : undefined}
            defaultValue={v.phone}
            className="field text-right placeholder:text-right"
          />
          <FieldError id="cf-phone-error" message={e.phone} />
        </div>
      </div>

      <div className="grid items-start gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="cf-business" className="field-label">
            نام کسب‌وکار
          </label>
          <input id="cf-business" name="business" type="text" autoComplete="organization" defaultValue={v.business} className="field" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="cf-website" className="field-label">
            آدرس وب‌سایت
          </label>
          <input
            id="cf-website"
            name="website"
            type="text"
            dir="ltr"
            inputMode="url"
            autoComplete="url"
            placeholder="example.com"
            aria-invalid={e.website ? true : undefined}
            aria-describedby={e.website ? "cf-website-error" : undefined}
            defaultValue={v.website}
            className="field text-right placeholder:text-right"
          />
          <FieldError id="cf-website-error" message={e.website} />
        </div>
      </div>

      <fieldset aria-describedby={e.service ? "cf-service-error" : undefined} className="m-0 min-w-0 border-0 p-0">
        <legend className="field-label p-0">
          نوع خدمت <Required />
        </legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3">
          {Object.entries(SERVICE_CHOICE_LABELS).map(([value, label]) => (
            <label
              key={value}
              className="flex min-h-[52px] cursor-pointer items-center gap-3 rounded-sm border border-control bg-white px-3.5 py-3 text-base leading-normal font-medium text-ink has-[:checked]:border-brand has-[:checked]:bg-soft"
            >
              <input
                type="radio"
                name="service"
                value={value}
                required
                defaultChecked={selectedService === value}
                className="m-0 size-[18px] shrink-0 accent-brand"
              />
              {label}
            </label>
          ))}
        </div>
        <div className="mt-2">
          <FieldError id="cf-service-error" message={e.service} />
        </div>
      </fieldset>

      {budgets.length > 0 && (
        <div className="flex flex-col gap-2">
          <label htmlFor="cf-budget" className="field-label">
            بودجه تقریبی
          </label>
          <div className="relative">
            <select id="cf-budget" name="budget" defaultValue={v.budget ?? ""} className="field cursor-pointer appearance-none pl-11">
              <option value="">انتخاب کنید</option>
              {budgets.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <Icon name="chevron-down" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="cf-desc" className="field-label">
          توضیح پروژه
        </label>
        <textarea
          id="cf-desc"
          name="description"
          rows={5}
          maxLength={4000}
          placeholder="مثلاً نوع کسب‌وکار، هدف از سایت یا وضعیت فعلی آن"
          aria-invalid={e.description ? true : undefined}
          defaultValue={v.description}
          className="field"
        />
        <FieldError id="cf-desc-error" message={e.description} />
      </div>

      <div className="mt-1 flex flex-col gap-4 lg:mt-2">
        <button type="submit" disabled={pending} className="btn btn-primary h-[52px] w-full shadow-brand lg:h-14">
          {pending ? "در حال ارسال…" : "ارسال درخواست مشاوره"}
          {!pending && <Icon name="arrow-left" />}
        </button>
        <p className="flex items-start gap-2 text-sm leading-[1.8] text-muted lg:items-center lg:justify-center lg:text-center">
          <Icon name="lock" size={16} className="mt-1 shrink-0 lg:mt-0" />
          اطلاعات ارسالی فقط برای بررسی درخواست شما استفاده می‌شود.
        </p>
      </div>
    </form>
  );
}
