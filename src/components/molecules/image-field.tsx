export function ImageField({ label, name, current, hint, logoPreview }: { label: string; name: string; current?: string; hint?: string; logoPreview?: "light" | "dark" }) {
  const id = `image-${name}`;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {current && (
        <div className="flex items-center gap-4">
          <img src={current} alt="" className={`h-20 w-32 rounded-sm border border-line ${logoPreview ? `object-contain p-2 ${logoPreview === "dark" ? "bg-inverse" : "bg-white"}` : "object-cover"}`} />
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-error">
            <input type="checkbox" name={`${name}_remove`} className="accent-error" />
            حذف تصویر
          </label>
        </div>
      )}
      <input
        id={id}
        type="file"
        name={name}
        aria-describedby={`${id}-hint`}
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        className="text-sm file:me-3 file:cursor-pointer file:rounded-sm file:border file:border-control file:bg-white file:px-4 file:py-2 file:font-sans file:text-sm"
      />
      <p id={`${id}-hint`} className="text-xs leading-[1.8] text-muted">{hint ?? "JPG، PNG، WebP یا AVIF — حداکثر ۵ مگابایت."}</p>
    </div>
  );
}
