import "server-only";

import { unstable_cache } from "next/cache";

/** Every public read is tagged with this; admin mutations expire it with updateTag(). */
export const CONTENT_TAG = "content";

/**
 * Caches a database read across requests until the admin changes content (or an
 * hour passes, as a safety net). Results are JSON-serialised, so Date columns
 * come back as strings — public pages do not rely on them.
 */
export function cached<A extends unknown[], R>(fn: (...args: A) => Promise<R>, key: string) {
  return unstable_cache(fn, [key], { tags: [CONTENT_TAG], revalidate: 3600 });
}
