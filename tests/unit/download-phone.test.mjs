import assert from "node:assert/strict";
import { test } from "node:test";

import { maskPhone, normalizeIranMobile } from "../../src/modules/downloads/phone.ts";
import { interpretMelipayamak } from "../../src/modules/downloads/sms.ts";

test("PL-T18: every Iranian spelling maps to one E.164 number", () => {
  for (const input of ["09121234567", "+989121234567", "00989121234567", "989121234567", "9121234567", "۰۹۱۲۱۲۳۴۵۶۷", "٠٩١٢١٢٣٤٥٦٧", "0912 123 4567", "(0912)-123-4567"]) {
    assert.equal(normalizeIranMobile(input), "+989121234567", input);
  }
});

test("PL-T18: non-Iranian and malformed numbers are refused", () => {
  for (const input of ["+14155552671", "02112345678", "0912123456", "091212345678", "+44 7700 900123", "abc", "", "0912123456a"]) {
    assert.equal(normalizeIranMobile(input), null, input);
  }
  assert.equal(maskPhone("+989121234567"), "0912***4567");
});

test("PL-T21: a business error with HTTP 200 is not a success", () => {
  assert.deepEqual(interpretMelipayamak({ Value: "5031287655443220000", RetStatus: 1, StrRetStatus: "Ok" }).state, "sent");
  assert.equal(interpretMelipayamak({ Value: "2", RetStatus: 2, StrRetStatus: "..." }).state, "failed");
  assert.match(interpretMelipayamak({ Value: "0", RetStatus: 0 }).error, /نام کاربری/);
  assert.equal(interpretMelipayamak({ Value: "11", RetStatus: 1 }).state, "failed", "RetStatus 1 with a short code is not a message id");
  assert.equal(interpretMelipayamak({}).state, "failed");
});
