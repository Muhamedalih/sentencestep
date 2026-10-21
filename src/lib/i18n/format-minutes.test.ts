import { test } from "node:test";
import assert from "node:assert/strict";

import { ar } from "./dictionary/ar";
import { en } from "./dictionary/en";
import { es } from "./dictionary/es";
import { tr } from "./dictionary/tr";
import { formatMinuteCount } from "./format-minutes";
import { formatReminderTime } from "./format-reminder-time";

test("formatMinuteCount: Arabic uses its own form for one, two, three to ten, and eleven or more", () => {
  assert.equal(formatMinuteCount(ar.sessionEnd, "ar", 1), "دقيقة واحدة");
  assert.equal(formatMinuteCount(ar.sessionEnd, "ar", 2), "دقيقتين");
  assert.equal(formatMinuteCount(ar.sessionEnd, "ar", 3), "3 دقائق");
  assert.equal(formatMinuteCount(ar.sessionEnd, "ar", 7), "7 دقائق");
  assert.equal(formatMinuteCount(ar.sessionEnd, "ar", 10), "10 دقائق");
  assert.equal(formatMinuteCount(ar.sessionEnd, "ar", 11), "11 دقيقة");
});

test("formatMinuteCount: English, Spanish and Turkish only tell one from more", () => {
  assert.equal(formatMinuteCount(en.sessionEnd, null, 1), "1 minute");
  assert.equal(formatMinuteCount(en.sessionEnd, null, 7), "7 minutes");
  assert.equal(formatMinuteCount(es.sessionEnd, "es", 1), "1 minuto");
  assert.equal(formatMinuteCount(es.sessionEnd, "es", 5), "5 minutos");
  assert.equal(formatMinuteCount(tr.sessionEnd, "tr", 1), "1 dakika");
  assert.equal(formatMinuteCount(tr.sessionEnd, "tr", 5), "5 dakika");
});

test("formatReminderTime: Arabic and English use a 12-hour clock with their own marker", () => {
  assert.equal(formatReminderTime(20, "ar"), "8:00 م");
  assert.equal(formatReminderTime(21, "ar"), "9:00 م");
  assert.equal(formatReminderTime(9, "ar"), "9:00 ص");
  assert.equal(formatReminderTime(0, "ar"), "12:00 ص");
  assert.equal(formatReminderTime(12, "ar"), "12:00 م");
  assert.equal(formatReminderTime(20, null), "8:00 PM");
  assert.equal(formatReminderTime(8, null), "8:00 AM");
});

test("formatReminderTime: Spanish and Turkish use a 24-hour clock", () => {
  assert.equal(formatReminderTime(20, "es"), "20:00");
  assert.equal(formatReminderTime(9, "tr"), "09:00");
});
