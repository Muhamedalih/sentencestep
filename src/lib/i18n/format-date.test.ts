// Run with `npm run test:i18n`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { formatLongDate } from "./format-date";

const NOV_4 = "2026-11-04T12:09:00.000Z";

test("formatLongDate: writes out the month name in each interface language", () => {
  const english = formatLongDate(NOV_4, null);
  assert.ok(english.includes("November") && english.includes("2026"), english);

  const spanish = formatLongDate(NOV_4, "es");
  assert.ok(spanish.includes("noviembre") && spanish.includes("2026"), spanish);

  const turkish = formatLongDate(NOV_4, "tr");
  assert.ok(turkish.includes("Kasım") && turkish.includes("2026"), turkish);

  const arabic = formatLongDate(NOV_4, "ar");
  assert.ok(arabic.includes("نوفمبر") && arabic.includes("2026"), arabic);
});

test("formatLongDate: Arabic keeps Latin digits and the day is not mistaken for the month", () => {
  const arabic = formatLongDate(NOV_4, "ar");
  assert.match(arabic, /\b4\b/);
  assert.doesNotMatch(arabic, /[٠-٩]/);
  assert.doesNotMatch(arabic, /\b11\b/);
});

test("formatLongDate: a visitor with no support language gets the English form", () => {
  assert.equal(formatLongDate(NOV_4, undefined), formatLongDate(NOV_4, null));
});

test("formatLongDate: the date is the UTC one, whatever the machine's time zone", () => {
  assert.ok(formatLongDate("2026-11-04T23:30:00.000Z", null).includes("4"));
  assert.ok(formatLongDate("2026-11-05T00:30:00.000Z", null).includes("5"));
});

test("formatLongDate: accepts a Date or a timestamp, and returns an unreadable value as it was given", () => {
  assert.equal(formatLongDate(new Date(NOV_4), "es"), formatLongDate(NOV_4, "es"));
  assert.equal(formatLongDate(Date.parse(NOV_4), "es"), formatLongDate(NOV_4, "es"));
  assert.equal(formatLongDate("not a date", "es"), "not a date");
});
