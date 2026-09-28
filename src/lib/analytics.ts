// The site's measurement events, pushed to window.dataLayer. Google Tag
// Manager (when a container ID is set in the admin) forwards them to GA4 or
// ads tags; without it they stay in the page and cost nothing.
//
// Only the fields below can be sent: never names, phone numbers, messages or
// other personal data. Event names follow GA4's recommended ones where they
// exist (generate_lead).

export type AnalyticsEvent =
  /** Lead intent: a click on a tel: link. `placement` says which one. */
  | { event: "phone_click"; placement: Placement }
  /** Lead intent: a click on a link to the contact page or the calculator. */
  | { event: "cta_click"; placement: Placement; target: "contact" | "pricing" }
  /** Engagement: first field of a lead form used, once per page view. */
  | { event: "form_start"; form: LeadForm }
  /** Engagement: first choice made in a calculator tab, once per tab and page view. */
  | { event: "pricing_start"; service: string }
  /** Conversion: the server stored a new lead (not a retry of the same one). */
  | { event: "generate_lead"; form: LeadForm; service: string; estimate_total_toman?: number };

export type LeadForm = "contact" | "estimate";
export type Placement = "header" | "menu" | "hero" | "content" | "cta" | "footer" | "floating";

const ALLOWED_KEYS = new Set(["event", "placement", "target", "form", "service", "estimate_total_toman"]);

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/** The event as it is pushed: unknown keys dropped, values reduced to short plain strings/numbers. */
export function toDataLayer(event: AnalyticsEvent): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(event)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    if (typeof value === "number" && Number.isFinite(value)) out[key] = Math.round(value);
    else if (typeof value === "string" && /^[\w-]{1,40}$/.test(value)) out[key] = value;
  }
  return out;
}

export function track(event: AnalyticsEvent) {
  if (typeof window === "undefined") return;
  (window.dataLayer ??= []).push(toDataLayer(event));
}

const sent = new WeakMap<object, Set<string>>();

/**
 * Tracks an event at most once for `key` within `scope`: a component ref (once
 * per page view, however many keystrokes) or a form action result (once per
 * submission, however often its effect runs).
 */
export function trackOnce(scope: object, key: string, event: AnalyticsEvent) {
  let keys = sent.get(scope);
  if (!keys) sent.set(scope, (keys = new Set()));
  if (keys.has(key)) return;
  keys.add(key);
  track(event);
}

/** The analytics target of a same-site link to the contact page or the calculator, or null. */
export function ctaTarget(href: string, currentPath: string): "contact" | "pricing" | null {
  const match = /^\/(contact|pricing)\/?(?:[?#]|$)/.exec(href);
  if (!match) return null;
  // A link to the page you are on (a tab or an anchor) is navigation, not intent.
  const path = href.split(/[?#]/)[0].replace(/\/$/, "");
  return path === currentPath.replace(/\/$/, "") ? null : (match[1] as "contact" | "pricing");
}

/** Where on the page a link sits, from the nearest landmark or marked block. */
export function placementOf(el: Element): Placement {
  const marked = el.closest<HTMLElement>("[data-placement]")?.dataset.placement;
  if (marked) return marked as Placement;
  if (el.closest(".fab-call")) return "floating";
  if (el.closest("dialog")) return "menu";
  if (el.closest("header")) return "header";
  if (el.closest("footer")) return "footer";
  if (el.closest("main > section:first-child")) return "hero";
  return "content";
}
