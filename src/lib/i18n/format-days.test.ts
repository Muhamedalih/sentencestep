import { test } from "node:test";
import assert from "node:assert/strict";

import { ar } from "./dictionary/ar";
import { en } from "./dictionary/en";
import { es } from "./dictionary/es";
import { tr } from "./dictionary/tr";
import { formatDayCount } from "./format-days";

test("formatDayCount: Arabic uses its own form for one, two, three to ten, and eleven or more", () => {
  assert.equal(formatDayCount(ar.premium, "ar", 1), "يوم واحد");
  assert.equal(formatDayCount(ar.premium, "ar", 2), "يومين");
  assert.equal(formatDayCount(ar.premium, "ar", 7), "7 أيام");
  assert.equal(formatDayCount(ar.premium, "ar", 10), "10 أيام");
  assert.equal(formatDayCount(ar.premium, "ar", 11), "11 يومًا");
  assert.equal(formatDayCount(ar.premium, "ar", 14), "14 يومًا");
});

test("formatDayCount: English, Spanish and Turkish only tell one from more", () => {
  assert.equal(formatDayCount(en.premium, null, 1), "1 day");
  assert.equal(formatDayCount(en.premium, null, 7), "7 days");
  assert.equal(formatDayCount(es.premium, "es", 1), "1 día");
  assert.equal(formatDayCount(es.premium, "es", 14), "14 días");
  assert.equal(formatDayCount(tr.premium, "tr", 1), "1 gün");
  assert.equal(formatDayCount(tr.premium, "tr", 14), "14 gün");
});
