// Run with `npm run test:admin`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { ADMIN_TIME_ZONE, formatAdminDateTime } from "./format-date-time";

// Newer ICU versions put a narrow no-break space before AM/PM; compare as plain spaces.
const plain = (text: string) => text.replace(/\s/g, " ");

test("the admin shows Baghdad time: 3 hours ahead of UTC", () => {
  assert.equal(ADMIN_TIME_ZONE, "Asia/Baghdad");
  // The rating that read 8:56 AM in Admin > Ratings and 11:56 on the sheet.
  assert.equal(plain(formatAdminDateTime("2026-10-10T08:56:27Z")), "Oct 10, 2026, 11:56 AM");
});

test("a late-evening UTC moment lands on the next day in Baghdad", () => {
  assert.equal(plain(formatAdminDateTime("2026-10-09T21:30:00Z")), "Oct 10, 2026, 12:30 AM");
});

test("the offset is the same all year (Iraq has no daylight saving)", () => {
  assert.equal(plain(formatAdminDateTime("2026-01-15T09:00:00Z")), "Jan 15, 2026, 12:00 PM");
  assert.equal(plain(formatAdminDateTime("2026-07-15T09:00:00Z")), "Jul 15, 2026, 12:00 PM");
});

test("an offset in the timestamp itself (as the database returns it) reads the same", () => {
  assert.equal(plain(formatAdminDateTime("2026-10-10T08:56:27+00:00")), "Oct 10, 2026, 11:56 AM");
  assert.equal(plain(formatAdminDateTime("2026-10-10T11:56:27+03:00")), "Oct 10, 2026, 11:56 AM");
});
