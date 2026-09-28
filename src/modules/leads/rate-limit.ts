import "server-only";

import { slidingWindow } from "@/lib/rate-limit";

export { clientIp } from "@/lib/rate-limit";

// Shared by the public lead forms: a handful of submissions per address per window.
const MAX_PER_WINDOW = 5;
const submissions = slidingWindow(10 * 60 * 1000);

export function rateLimited(key: string) {
  return submissions.hit(key) > MAX_PER_WINDOW;
}

export const RATE_LIMIT_MESSAGE = "تعداد درخواست‌ها زیاد است. لطفاً چند دقیقه بعد دوباره تلاش کنید.";
