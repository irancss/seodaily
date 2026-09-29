import "server-only";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { CONTENT_TAG } from "@/lib/cache";

export function str(form: FormData, key: string, max = 5000) {
  return String(form.get(key) ?? "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, max);
}

export function bool(form: FormData, key: string) {
  return form.get(key) === "on" || form.get(key) === "true";
}

export function int(form: FormData, key: string, fallback = 0) {
  const n = Number.parseInt(String(form.get(key) ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Lines of a textarea, trimmed, blanks dropped. */
export function lines(form: FormData, key: string) {
  return str(form, key, 20000)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/** A JSON array posted by the Repeater component; keeps only rows with any value. */
export function rows<K extends string>(form: FormData, key: string, fields: readonly K[]): Record<K, string>[] {
  try {
    const parsed = JSON.parse(String(form.get(key) ?? "[]"));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row) => {
        const out = {} as Record<K, string>;
        for (const f of fields) out[f] = String(row?.[f] ?? "").trim().slice(0, 4000);
        return out;
      })
      .filter((row) => fields.some((f) => row[f] !== ""));
  } catch {
    return [];
  }
}

const SLUG_RE = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;

/** URL slug from user input or a title. Persian letters are kept (UTF-8 URLs). */
export function toSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[‌\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isSlug(value: string) {
  return SLUG_RE.test(value);
}

/** Expire the public cache, then go back with a flash message. */
export function saved(path: string, message = "تغییرات ذخیره شد."): never {
  updateTag(CONTENT_TAG);
  redirect(`${path}${path.includes("?") ? "&" : "?"}ok=${encodeURIComponent(message)}`);
}

export function failed(path: string, message: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
}

export { isUniqueViolation } from "./db-errors";
