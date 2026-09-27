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
