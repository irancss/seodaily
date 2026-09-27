export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/** Two-digit Persian-friendly step number (the font renders Farsi digits). */
export function stepNo(index: number) {
  return String(index + 1).padStart(2, "0");
}

export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

/** Route params arrive percent-encoded for non-ASCII (e.g. Persian) slugs. */
export function decodeSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}
