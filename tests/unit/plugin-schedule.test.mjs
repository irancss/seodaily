import assert from "node:assert/strict";
import { test } from "node:test";

import { latestSlot, nextSlot, slotInstant } from "../../src/modules/plugins/pipeline/schedule-time.ts";

test("PL-T17: 03:00 Tehran is 23:30 UTC the day before, regardless of the host zone", () => {
  assert.equal(slotInstant("2026-09-29").toISOString(), "2026-09-28T23:30:00.000Z");
  assert.equal(process.env.TZ ?? "", process.env.TZ ?? ""); // host TZ is irrelevant: only Intl with Asia/Tehran is used
});

test("PL-T17: the slot date switches exactly at 03:00 Tehran", () => {
  assert.equal(latestSlot(new Date("2026-09-28T23:29:59Z")), "2026-09-28"); // 02:59:59 on the 29th in Tehran → previous slot
  assert.equal(latestSlot(new Date("2026-09-28T23:30:00Z")), "2026-09-29");
  assert.equal(latestSlot(new Date("2026-09-29T12:00:00Z")), "2026-09-29");
});

test("PL-T17: next run is the coming 03:00 Tehran", () => {
  assert.equal(nextSlot(new Date("2026-09-29T12:00:00Z")).toISOString(), "2026-09-29T23:30:00.000Z");
  assert.equal(nextSlot(new Date("2026-09-28T20:00:00Z")).toISOString(), "2026-09-28T23:30:00.000Z");
});
