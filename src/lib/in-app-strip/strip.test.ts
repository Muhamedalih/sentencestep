import assert from "node:assert/strict";
import test from "node:test";

import {
  buildExternalUrl,
  buildIntentUrl,
  decideStrip,
  isInAppBrowserName,
  isStripPage,
  isStripPlatform,
  newBucket,
  parseBucket,
  parseForcedStrip,
  stripPlatformFrom,
} from "@/lib/in-app-strip/strip";

const FACEBOOK_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/470.0.0.0;]";
const INSTAGRAM_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21F90 Instagram 340.0.0.0";
const CHROME_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36";
const CHROME_DESKTOP =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const decide = (overrides: Partial<Parameters<typeof decideStrip>[0]> = {}) =>
  decideStrip({
    userAgent: FACEBOOK_ANDROID,
    forcedParam: null,
    access: false,
    share: 50,
    bucket: 10,
    ...overrides,
  });

test("the platform comes from the user agent, and anything else is treated like an iPhone (steps)", () => {
  assert.equal(stripPlatformFrom(FACEBOOK_ANDROID), "android");
  assert.equal(stripPlatformFrom(INSTAGRAM_IPHONE), "ios");
  assert.equal(stripPlatformFrom(CHROME_DESKTOP), "other");
  assert.equal(stripPlatformFrom(null), "other");
});

test("a bucket is a whole number from 0 to 99 and nothing else", () => {
  assert.equal(parseBucket("0"), 0);
  assert.equal(parseBucket("7"), 7);
  assert.equal(parseBucket("99"), 99);
  for (const bad of ["100", "-1", "07x", "1.5", "", " 5", "٣", null, undefined]) {
    assert.equal(parseBucket(bad), null, `${String(bad)} is not a bucket`);
  }
  assert.equal(newBucket(0), 0);
  assert.equal(newBucket(0.999999), 99);
  assert.equal(newBucket(0.5), 50);
  assert.equal(newBucket(1.5), 99);
  assert.equal(newBucket(-1), 0);
});

test("the preview parameter: on, or one of the four named versions", () => {
  assert.deepEqual(parseForcedStrip("on"), { app: null, platform: null });
  assert.deepEqual(parseForcedStrip("facebook-android"), { app: "facebook", platform: "android" });
  assert.deepEqual(parseForcedStrip("instagram-ios"), { app: "instagram", platform: "ios" });
  for (const bad of ["facebook", "facebook-windows", "tiktok-ios", "ON", "", null, undefined]) {
    assert.equal(parseForcedStrip(bad), null, `${String(bad)} is not a version`);
  }
});

test("the names that arrive from the browser are checked against the known ones", () => {
  assert.equal(isInAppBrowserName("facebook"), true);
  assert.equal(isInAppBrowserName("instagram"), true);
  assert.equal(isInAppBrowserName("tiktok"), false);
  assert.equal(isStripPlatform("ios"), true);
  assert.equal(isStripPlatform("windows"), false);
  assert.equal(isStripPage("login"), true);
  assert.equal(isStripPage("upgrade"), false);
});

test("a visitor outside Facebook's and Instagram's browsers is never concerned, whatever the share or the cookie", () => {
  assert.equal(decide({ userAgent: CHROME_ANDROID, share: 100, bucket: 0 }), null);
  assert.equal(decide({ userAgent: CHROME_DESKTOP, share: 100, bucket: 0, access: true }), null);
  assert.equal(decide({ userAgent: null }), null);
});

test("in an in-app browser the share decides, by the visitor's bucket", () => {
  const inside = decide({ share: 50, bucket: 49 });
  assert.equal(inside?.show, true);
  assert.equal(inside?.app, "facebook");
  assert.equal(inside?.platform, "android");
  assert.equal(inside?.forced, false);
  assert.equal(decide({ share: 50, bucket: 50 })?.show, false);
  assert.equal(decide({ share: 100, bucket: 99 })?.show, true);
  // A bigger share only adds visitors: nobody who had it loses it.
  for (let bucket = 0; bucket < 100; bucket++) {
    if (decide({ share: 30, bucket })?.show)
      assert.equal(decide({ share: 60, bucket })?.show, true);
  }
});

test("no share, no bucket: the visitor is known as being in an in-app browser but is not shown the strip", () => {
  assert.equal(decide({ share: 0, bucket: 5 })?.show, false);
  assert.equal(decide({ share: 50, bucket: null })?.show, false);
  assert.equal(decide({ share: 50, bucket: null })?.bucket, null);
  assert.equal(decide({ userAgent: INSTAGRAM_IPHONE, share: 100, bucket: 3 })?.app, "instagram");
  assert.equal(decide({ userAgent: INSTAGRAM_IPHONE, share: 100, bucket: 3 })?.platform, "ios");
});

test("?in_app_strip=on pins the strip for a real in-app browser, whatever the share, and does nothing elsewhere", () => {
  const pinned = decide({ forcedParam: "on", share: 0, bucket: null });
  assert.equal(pinned?.show, true);
  assert.equal(pinned?.forced, true);
  assert.equal(pinned?.app, "facebook");
  assert.equal(decide({ forcedParam: "on", userAgent: CHROME_ANDROID, access: true }), null);
});

test("a named version is for looking at: open to a real in-app browser or to whoever the permission is open to", () => {
  const preview = decide({
    forcedParam: "instagram-ios",
    userAgent: CHROME_DESKTOP,
    access: true,
    share: 0,
  });
  assert.deepEqual(
    {
      app: preview?.app,
      platform: preview?.platform,
      show: preview?.show,
      forced: preview?.forced,
    },
    { app: "instagram", platform: "ios", show: true, forced: true },
  );
  assert.equal(
    decide({ forcedParam: "instagram-ios", userAgent: CHROME_DESKTOP, access: false }),
    null,
  );
  // Inside a real in-app browser the named version works for anyone (it is how a phone tries both).
  assert.equal(
    decide({ forcedParam: "facebook-ios", userAgent: FACEBOOK_ANDROID, access: false })?.platform,
    "ios",
  );
});

test("the Android link is an intent for Chrome that falls back to the address itself", () => {
  const link = buildIntentUrl("https://sentencestep.com/register?next=%2Fupgrade&ias=12#top");
  assert.equal(
    link,
    "intent://sentencestep.com/register?next=%2Fupgrade&ias=12#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=https%3A%2F%2Fsentencestep.com%2Fregister%3Fnext%3D%252Fupgrade%26ias%3D12%23top;end",
  );
  assert.equal(
    buildIntentUrl("http://localhost:3000/login"),
    "intent://localhost:3000/login#Intent;scheme=http;package=com.android.chrome;S.browser_fallback_url=http%3A%2F%2Flocalhost%3A3000%2Flogin;end",
  );
  assert.equal(buildIntentUrl("javascript:alert(1)"), null);
  assert.equal(buildIntentUrl("not a url"), null);
});

test("the address to open elsewhere carries the bucket and where the visitor came from, never the preview parameter", () => {
  const touch = { source: "facebook", medium: "social", campaign: "oct-post" };
  assert.equal(
    buildExternalUrl({
      href: "https://sentencestep.com/register?in_app_strip=on&next=%2Fupgrade",
      bucket: 7,
      firstTouch: touch,
    }),
    "https://sentencestep.com/register?next=%2Fupgrade&ias=7&utm_source=facebook&utm_medium=social&utm_campaign=oct-post",
  );
  // What the address already says wins over the cookie, and a source of "direct" says nothing.
  assert.equal(
    buildExternalUrl({
      href: "https://sentencestep.com/login?utm_source=group-12",
      bucket: null,
      firstTouch: touch,
    }),
    "https://sentencestep.com/login?utm_source=group-12&utm_medium=social&utm_campaign=oct-post",
  );
  assert.equal(
    buildExternalUrl({
      href: "https://sentencestep.com/register",
      bucket: 99,
      firstTouch: { source: "direct", medium: null, campaign: null },
    }),
    "https://sentencestep.com/register?ias=99",
  );
  assert.equal(
    buildExternalUrl({ href: "https://sentencestep.com/register", bucket: null, firstTouch: null }),
    "https://sentencestep.com/register",
  );
});
