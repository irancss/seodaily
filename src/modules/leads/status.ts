import type { LeadStatus } from "@/db/schema";

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "جدید",
  in_progress: "در حال پیگیری",
  done: "انجام‌شده",
  archived: "بایگانی",
};

export const STATUS_TONES: Record<LeadStatus, "blue" | "amber" | "green" | "gray"> = {
  new: "blue",
  in_progress: "amber",
  done: "green",
  archived: "gray",
};
