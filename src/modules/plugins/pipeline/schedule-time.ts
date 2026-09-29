// Nightly check at 03:00 Asia/Tehran, whatever the host's zone. Times are
// stored in UTC; the Tehran calendar date of the slot is the dedupe key, so
// several workers or restarts queue one run per day, and after an outage only
// the most recent missed slot runs (no replay of every lost night).

export const SCHEDULE_ZONE = "Asia/Tehran";
export const SCHEDULE_HOUR = 3;

function parts(at: Date) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: SCHEDULE_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZoneName: "longOffset",
  }).formatToParts(at);
  const get = (t: string) => f.find((p) => p.type === t)?.value ?? "";
  const off = /GMT([+-])(\d{2}):?(\d{2})?/.exec(get("timeZoneName"));
  const offsetMin = off ? (off[1] === "-" ? -1 : 1) * (Number(off[2]) * 60 + Number(off[3] ?? 0)) : 0;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")), minute: Number(get("minute")), offsetMin };
}

/** The Tehran date of the latest 03:00 slot at or before `now`. */
export function latestSlot(now: Date): string {
  const p = parts(now);
  if (p.hour >= SCHEDULE_HOUR) return p.date;
  return parts(new Date(now.getTime() - 24 * 3600_000)).date;
}

/** UTC instant of 03:00 Tehran on the given Tehran date. */
export function slotInstant(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, SCHEDULE_HOUR, 0));
  return new Date(guess.getTime() - parts(guess).offsetMin * 60_000);
}

export function nextSlot(now: Date): Date {
  const today = slotInstant(parts(now).date);
  return today.getTime() > now.getTime() ? today : slotInstant(parts(new Date(today.getTime() + 25 * 3600_000)).date);
}
