// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  cleanPlaceName,
  describeUserAgent,
  deviceLabel,
  formatDuration,
  isOpenNow,
  placeLabel,
  sanitizeActions,
  sanitizeLanguage,
  sanitizeLeaves,
  sanitizeTimeZone,
  sanitizeVisibleSeconds,
  sourceFromCookie,
  stayedSeconds,
  summarizeVisits,
} from "./visits";
import type { VisitRecord } from "./visits";

const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 13; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";
const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const IPHONE_FACEBOOK =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/460.0.0.0]";
const ANDROID_INSTAGRAM =
  "Mozilla/5.0 (Linux; Android 13; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.0.0 Mobile Safari/537.36 Instagram 330.0.0.0 Android";
const WINDOWS_EDGE =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0";
const ANDROID_TABLET =
  "Mozilla/5.0 (Linux; Android 12; SM-X200) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

test("describeUserAgent: a phone, a tablet and a computer, with the system and the browser", () => {
  assert.deepEqual(describeUserAgent(ANDROID_CHROME), {
    device: "mobile",
    os: "Android",
    browser: "Chrome",
  });
  assert.deepEqual(describeUserAgent(IPHONE_SAFARI), {
    device: "mobile",
    os: "iOS",
    browser: "Safari",
  });
  assert.deepEqual(describeUserAgent(WINDOWS_EDGE), {
    device: "desktop",
    os: "Windows",
    browser: "Edge",
  });
  assert.deepEqual(describeUserAgent(ANDROID_TABLET), {
    device: "tablet",
    os: "Android",
    browser: "Chrome",
  });
});

test("describeUserAgent: names the in-app browsers a link is opened from", () => {
  assert.equal(describeUserAgent(IPHONE_FACEBOOK).browser, "Facebook app");
  assert.equal(describeUserAgent(ANDROID_INSTAGRAM).browser, "Instagram app");
});

test("describeUserAgent: nothing known for a missing user agent, and nothing blows up on junk", () => {
  assert.deepEqual(describeUserAgent(null), { device: null, os: null, browser: null });
  assert.deepEqual(describeUserAgent(""), { device: null, os: null, browser: null });
  assert.equal(describeUserAgent("x".repeat(5000)).browser, null);
});

test("cleanPlaceName: decodes percent-encoding, strips control characters, bounds the length", () => {
  assert.equal(cleanPlaceName("Z%C3%BCrich"), "Zürich");
  assert.equal(cleanPlaceName("  Baghdad "), "Baghdad");
  assert.equal(cleanPlaceName("Bagh\u0000dad\n"), "Baghdad");
  assert.equal(cleanPlaceName("100%"), "100%");
  assert.equal(cleanPlaceName("   "), null);
  assert.equal(cleanPlaceName(null), null);
  assert.equal(cleanPlaceName("a".repeat(500))?.length, 80);
});

test("sourceFromCookie: the source tag of the first-touch cookie, null for anything else", () => {
  assert.equal(sourceFromCookie("facebook~social~launch"), "facebook");
  assert.equal(sourceFromCookie("direct~~"), "direct");
  assert.equal(sourceFromCookie("not a cookie"), null);
  assert.equal(sourceFromCookie(null), null);
});

test("sanitizers: a time zone, a language, counters and actions only ever take their own shape", () => {
  assert.equal(sanitizeTimeZone("Africa/Cairo"), "Africa/Cairo");
  assert.equal(
    sanitizeTimeZone("America/Argentina/Buenos_Aires"),
    "America/Argentina/Buenos_Aires",
  );
  assert.equal(sanitizeTimeZone("<script>"), null);
  assert.equal(sanitizeTimeZone(5), null);

  assert.equal(sanitizeLanguage("ar-EG"), "ar-EG");
  assert.equal(sanitizeLanguage("en"), "en");
  assert.equal(sanitizeLanguage("ar-EG; drop table"), null);
  assert.equal(sanitizeLanguage("x".repeat(40)), null);

  assert.equal(sanitizeVisibleSeconds(125.4), 125);
  assert.equal(sanitizeVisibleSeconds(-5), 0);
  assert.equal(sanitizeVisibleSeconds(10 ** 9), 86_400);
  assert.equal(sanitizeVisibleSeconds("12"), 0);
  assert.equal(sanitizeVisibleSeconds(Number.NaN), 0);
  assert.equal(sanitizeLeaves(3), 3);
  assert.equal(sanitizeLeaves(5_000), 1_000);

  assert.deepEqual(sanitizeActions(["copy_code", "hack", "copy_id", "copy_code"]), [
    "copy_id",
    "copy_code",
  ]);
  assert.deepEqual(sanitizeActions("copy_id"), []);
  assert.deepEqual(sanitizeActions(undefined), []);
});

test("formatDuration: seconds, minutes and hours in plain words", () => {
  assert.equal(formatDuration(0), "0 s");
  assert.equal(formatDuration(45), "45 s");
  assert.equal(formatDuration(180), "3 min");
  assert.equal(formatDuration(200), "3 min 20 s");
  assert.equal(formatDuration(3_900), "1 h 05 min");
  assert.equal(formatDuration(-4), "0 s");
});

function visit(overrides: Partial<VisitRecord> = {}): VisitRecord {
  return {
    id: "v1",
    orderId: "o1",
    openedAt: "2026-10-20T09:08:00Z",
    lastSeenAt: "2026-10-20T09:12:20Z",
    visibleSeconds: 150,
    leaves: 2,
    country: "iq",
    region: null,
    city: "Baghdad",
    timeZone: "Asia/Baghdad",
    language: "ar",
    device: "mobile",
    os: "Android",
    browser: "Chrome",
    source: "facebook",
    copiedId: false,
    copiedCode: false,
    openedGuide: false,
    ...overrides,
  };
}

test("stayedSeconds and isOpenNow: the span of a visit and whether it is still in front of the learner", () => {
  assert.equal(stayedSeconds(visit()), 260);
  assert.equal(
    stayedSeconds(visit({ openedAt: "2026-10-20T09:00:00Z", lastSeenAt: "2026-10-20T08:00:00Z" })),
    0,
  );
  const now = Date.parse("2026-10-20T09:12:50Z");
  assert.equal(isOpenNow(visit(), now), true);
  assert.equal(isOpenNow(visit(), now + 5 * 60_000), false);
});

test("summarizeVisits: nothing for an order never opened, otherwise first, last and what was done", () => {
  assert.equal(summarizeVisits([], Date.now()), null);

  const summary = summarizeVisits(
    [
      visit({ id: "later", openedAt: "2026-10-20T09:30:00Z", lastSeenAt: "2026-10-20T09:31:00Z" }),
      visit({ id: "earlier", copiedCode: true }),
    ],
    Date.parse("2026-10-20T12:00:00Z"),
  );

  assert.ok(summary);
  assert.equal(summary.count, 2);
  assert.equal(summary.first.id, "earlier");
  assert.equal(summary.last.id, "later");
  assert.equal(summary.openNow, false);
  assert.equal(summary.copiedCode, true);
  assert.equal(summary.copiedId, false);
  assert.deepEqual(
    summary.visits.map((entry) => entry.id),
    ["earlier", "later"],
  );
});

test("placeLabel: the country and city, the time zone when the country is unknown, else says so", () => {
  assert.equal(placeLabel(visit()), "Iraq, Baghdad");
  assert.equal(
    placeLabel(visit({ city: null, region: "Baghdad Governorate" })),
    "Iraq, Baghdad Governorate",
  );
  assert.equal(placeLabel(visit({ city: null, region: null })), "Iraq");
  assert.equal(
    placeLabel(visit({ country: null, city: null, timeZone: "Africa/Cairo" })),
    "Time zone Africa/Cairo",
  );
  assert.equal(
    placeLabel(visit({ country: null, city: null, region: null, timeZone: null })),
    "Location unknown",
  );
});

test("deviceLabel: the kind of device, the system and the browser, as far as they are known", () => {
  assert.equal(deviceLabel(visit()), "Phone · Android · Chrome");
  assert.equal(
    deviceLabel(visit({ device: "desktop", os: "Windows", browser: null })),
    "Computer · Windows",
  );
  assert.equal(deviceLabel(visit({ device: null, os: null, browser: null })), "Device unknown");
});
