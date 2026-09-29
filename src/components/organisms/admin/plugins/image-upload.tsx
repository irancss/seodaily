"use client";

import { useRef, useState } from "react";

import { uploadBlockImage } from "@/modules/blocks/actions";
import { toast } from "@/lib/toast";

export type UploadedImage = { src: string; width?: number; height?: number };

async function measure(file: File): Promise<{ width?: number; height?: number }> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return {};
  }
}

/** Uploads images to the site's media one at a time (keeps each request under the upload limit). */
export function ImageUploadButton({ label, multiple, onUploaded }: { label: string; multiple?: boolean; onUploaded: (image: UploadedImage) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    for (const file of Array.from(files).slice(0, 20)) {
      const fd = new FormData();
      fd.set("file", file);
      const size = await measure(file);
      if (size.width) fd.set("width", String(size.width));
      if (size.height) fd.set("height", String(size.height));
      try {
        const result = await uploadBlockImage(fd);
        if (result.ok) onUploaded({ src: result.src, width: result.width, height: result.height });
        else toast.error(`${file.name}: ${result.error}`);
      } catch {
        toast.error(`${file.name}: بارگذاری انجام نشد.`);
      }
    }
    setBusy(false);
    if (input.current) input.current.value = "";
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => upload(e.target.files)}
      />
      <button type="button" className="btn btn-secondary h-10 px-4 text-sm" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? "در حال بارگذاری…" : label}
      </button>
    </>
  );
}

/** A single image field (icon, OG image, category image) kept in a hidden input. */
export function SingleImageField({ name, label, value, onChange, hint }: { name: string; label: string; value: string; onChange: (src: string) => void; hint?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="field-label">{label}</span>
      {hint && <p className="text-xs leading-[1.8] text-muted">{hint}</p>}
      <input type="hidden" name={name} value={value} />
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
           
          <img src={value} alt="" className="size-16 rounded-lg border border-line object-cover" />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-lg border border-dashed border-line-strong text-xs text-muted">بدون تصویر</span>
        )}
        <ImageUploadButton label={value ? "تعویض" : "بارگذاری"} onUploaded={(img) => onChange(img.src)} />
        {value && (
          <button type="button" className="text-sm text-error hover:underline" onClick={() => onChange("")}>
            حذف
          </button>
        )}
      </div>
    </div>
  );
}
