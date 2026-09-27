import Link from "next/link";
import type { ReactNode } from "react";

import { Icon } from "@/components/icon";
import { cx } from "@/components/site/ui";

export { cx };

export function PageHeader({
  title,
  description,
  action,
  back,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back && (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-ink-2 no-underline hover:text-brand">
            <Icon name="arrow-left" size={16} className="rotate-180" />
            {back.label}
          </Link>
        )}
        <h1 className="text-2xl leading-[1.6] font-bold">{title}</h1>
        {description && <p className="mt-1 text-sm leading-[1.8] text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={cx(
        "mb-6 rounded-sm px-4 py-3 text-sm leading-[1.8] font-medium",
        error ? "bg-error-bg text-error" : "bg-success-bg text-success",
      )}
    >
      {error ?? ok}
    </p>
  );
}

export function Card({ title, description, children, className }: { title?: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cx("rounded-xl border border-line bg-white p-5 sm:p-6", className)}>
      {title && <h2 className="text-lg leading-[1.7] font-bold">{title}</h2>}
      {description && <p className="mt-1 text-sm leading-[1.8] text-muted">{description}</p>}
      <div className={title || description ? "mt-5" : undefined}>{children}</div>
    </section>
  );
}

export function Field({
  label,
  name,
  defaultValue,
  hint,
  required,
  type = "text",
  dir,
  multiline,
  rows = 4,
  maxLength,
  placeholder,
  counter,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  hint?: string;
  required?: boolean;
  type?: string;
  dir?: "ltr" | "rtl";
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  /** Show a recommended length, e.g. for meta titles. */
  counter?: number;
}) {
  const id = `f-${name}`;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="field-label">
        {label} {required && <span className="text-error">*</span>}
      </label>
      {multiline ? (
        <textarea
          id={id}
          name={name}
          rows={rows}
          required={required}
          maxLength={maxLength}
          placeholder={placeholder}
          dir={dir}
          defaultValue={defaultValue ?? ""}
          className="field"
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          maxLength={maxLength}
          placeholder={placeholder}
          dir={dir}
          defaultValue={defaultValue ?? ""}
          className="field"
        />
      )}
      {(hint || counter) && (
        <p className="text-xs leading-[1.8] text-muted">
          {hint}
          {counter ? `${hint ? " — " : ""}طول پیشنهادی: حداکثر ${counter} کاراکتر` : ""}
        </p>
      )}
    </div>
  );
}

export function Checkbox({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-medium text-ink">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-[18px] accent-brand" />
      {label}
    </label>
  );
}

export function Select({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
}) {
  const id = `f-${name}`;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select id={id} name={name} defaultValue={defaultValue} className="field cursor-pointer">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: "gray" | "blue" | "green" | "amber" }) {
  const tones = {
    gray: "bg-page text-ink-2 border-line",
    blue: "bg-soft text-brand-hover border-soft",
    green: "bg-success-bg text-success border-success-bg",
    amber: "bg-warning-bg text-warning border-warning-bg",
  };
  return <span className={cx("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs leading-[1.8] font-medium", tones[tone])}>{children}</span>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-md border border-dashed border-line-strong bg-white p-8 text-center text-sm text-muted">{children}</p>;
}

export function ImageField({ label, name, current, hint }: { label: string; name: string; current?: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="field-label">{label}</span>
      {current && (
        <div className="flex items-center gap-4">
          <img src={current} alt="" className="h-20 w-32 rounded-sm border border-line object-cover" />
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-error">
            <input type="checkbox" name={`${name}_remove`} className="accent-error" />
            حذف تصویر
          </label>
        </div>
      )}
      <input
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        className="text-sm file:me-3 file:cursor-pointer file:rounded-sm file:border file:border-control file:bg-white file:px-4 file:py-2 file:font-sans file:text-sm"
      />
      <p className="text-xs leading-[1.8] text-muted">{hint ?? "JPG، PNG، WebP یا AVIF — حداکثر ۵ مگابایت."}</p>
    </div>
  );
}

export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
