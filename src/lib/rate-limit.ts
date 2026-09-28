import "server-only";

import { headers } from "next/headers";

/**
 * In-memory sliding-window counter (one app process). `hit` records an event
 * for a key; `count` reads without recording. Old keys are pruned so the map
 * stays bounded even when keys are made up by the client.
 */
export function slidingWindow(windowMs: number, maxKeys = 10_000) {
  const events = new Map<string, number[]>();
  const recent = (key: string, now: number) => (events.get(key) ?? []).filter((t) => now - t < windowMs);

  function prune(now: number) {
    for (const [k, v] of events) if (v.every((t) => now - t >= windowMs)) events.delete(k);
    // Still full of live keys: drop the oldest ones.
    for (const k of events.keys()) {
      if (events.size <= maxKeys) break;
      events.delete(k);
    }
  }

  return {
    count: (key: string) => recent(key, Date.now()).length,
    hit(key: string) {
      const now = Date.now();
      const list = [...recent(key, now), now];
      events.delete(key);
      events.set(key, list);
      if (events.size > maxKeys) prune(now);
      return list.length;
    },
    reset: (key: string) => void events.delete(key),
  };
}

/**
 * Address of the visitor. nginx sets X-Real-IP to the connecting address and
 * appends it to X-Forwarded-For, so only those values can be trusted: the
 * first X-Forwarded-For entry is whatever the client sent.
 */
export async function clientIp() {
  const h = await headers();
  const realIp = h.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = h.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean);
  return forwarded?.at(-1) || "unknown";
}
