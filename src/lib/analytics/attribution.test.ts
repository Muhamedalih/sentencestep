// Run with `npm run test:analytics`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  attributionProperties,
  decodeFirstTouch,
  detectInAppBrowser,
  encodeFirstTouch,
  firstTouchFrom,
  sanitizeTag,
  sourceFromReferrer,
} from "./attribution";

const OWN = "sentencestep.com";

test("sanitizeTag: keeps lowercase ascii tags and drops everything else", () => {
  assert.equal(sanitizeTag("Facebook"), "facebook");
  assert.equal(sanitizeTag("egypt group #1"), "egypt-group-1");
  assert.equal(sanitizeTag("  --x--  "), "x");
  assert.equal(sanitizeTag("مجموعة"), null);
  assert.equal(sanitizeTag(""), null);
  assert.equal(sanitizeTag(null), null);
  assert.equal(sanitizeTag("a".repeat(80))?.length, 32);
});

test("detectInAppBrowser: recognises the Facebook and Instagram built-in browsers", () => {
  assert.equal(
    detectInAppBrowser(
      "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 [FB_IAB/FB4A;FBAV/450.0]",
    ),
    "facebook",
  );
  assert.equal(
    detectInAppBrowser("Mozilla/5.0 (iPhone) Mobile/15E148 [FBAN/FBIOS;FBAV/440.0]"),
    "facebook",
  );
  assert.equal(
    detectInAppBrowser("Mozilla/5.0 (iPhone) Mobile/15E148 Instagram 320.0.0"),
    "instagram",
  );
  assert.equal(
    detectInAppBrowser("Mozilla/5.0 (Windows NT 10.0) Chrome/120.0 Safari/537.36"),
    null,
  );
  assert.equal(detectInAppBrowser(null), null);
});

test("sourceFromReferrer: names the well-known sources", () => {
  assert.equal(sourceFromReferrer("https://lm.facebook.com/", OWN), "facebook");
  assert.equal(sourceFromReferrer("https://l.instagram.com/?u=x", OWN), "instagram");
  assert.equal(sourceFromReferrer("https://www.google.com.eg/", OWN), "google");
  assert.equal(sourceFromReferrer("https://www.bing.com/search?q=x", OWN), "bing");
  assert.equal(sourceFromReferrer("https://t.me/somegroup", OWN), "telegram");
  assert.equal(sourceFromReferrer("android-app://com.facebook.katana", OWN), "facebook");
  assert.equal(sourceFromReferrer("android-app://com.google.android.gm", OWN), "gmail");
  assert.equal(sourceFromReferrer("android-app://com.example.thing", OWN), "android-app");
});

test("sourceFromReferrer: an unknown site is named by its host", () => {
  assert.equal(
    sourceFromReferrer("https://www.some-blog.example.org/post", OWN),
    "some-blog-example-org",
  );
});

test("sourceFromReferrer: the site itself, Google sign-in, nothing and junk are not sources", () => {
  assert.equal(sourceFromReferrer("", OWN), null);
  assert.equal(sourceFromReferrer("https://sentencestep.com/learn", OWN), null);
  assert.equal(sourceFromReferrer("https://www.sentencestep.com/", OWN), null);
  assert.equal(sourceFromReferrer("https://staging.sentencestep.com/", OWN), null);
  assert.equal(sourceFromReferrer("https://accounts.google.com/o/oauth2", OWN), null);
  assert.equal(sourceFromReferrer("not a url", OWN), null);
  assert.equal(sourceFromReferrer("javascript:alert(1)", OWN), null);
});

test("firstTouchFrom: a utm_source beats the referrer, which beats the built-in browser", () => {
  const withTags = firstTouchFrom({
    search: "?utm_source=Facebook&utm_medium=Group&utm_campaign=egypt-1&fbclid=abc",
    referrer: "https://www.google.com/",
    ownHost: OWN,
    userAgent: "Mozilla/5.0 [FBAN/FBIOS]",
  });
  assert.deepEqual(withTags, { source: "facebook", medium: "group", campaign: "egypt-1" });

  const fromReferrer = firstTouchFrom({
    search: "",
    referrer: "https://l.instagram.com/",
    ownHost: OWN,
    userAgent: "Mozilla/5.0 Chrome",
  });
  assert.deepEqual(fromReferrer, { source: "instagram", medium: null, campaign: null });

  const fromInApp = firstTouchFrom({
    search: "",
    referrer: "",
    ownHost: OWN,
    userAgent: "Mozilla/5.0 [FBAN/FBIOS]",
  });
  assert.equal(fromInApp.source, "facebook");

  const direct = firstTouchFrom({
    search: "",
    referrer: "",
    ownHost: OWN,
    userAgent: "Mozilla/5.0",
  });
  assert.equal(direct.source, "direct");
});

test("encodeFirstTouch and decodeFirstTouch round-trip", () => {
  const touch = { source: "facebook", medium: "group", campaign: "egypt-1" };
  assert.equal(encodeFirstTouch(touch), "facebook~group~egypt-1");
  assert.deepEqual(decodeFirstTouch(encodeFirstTouch(touch)), touch);

  const bare = { source: "direct", medium: null, campaign: null };
  assert.equal(encodeFirstTouch(bare), "direct~~");
  assert.deepEqual(decodeFirstTouch("direct~~"), bare);
});

test("decodeFirstTouch: a cookie is client input, so anything unexpected is rejected", () => {
  assert.equal(decodeFirstTouch(undefined), null);
  assert.equal(decodeFirstTouch(""), null);
  assert.equal(decodeFirstTouch("facebook"), null);
  assert.equal(decodeFirstTouch("facebook~a~b~c"), null);
  assert.equal(decodeFirstTouch("Face Book~~"), null);
  assert.equal(decodeFirstTouch("<script>~~"), null);
  assert.equal(decodeFirstTouch(`${"a".repeat(33)}~~`), null);
});

test("attributionProperties: includes only what is known", () => {
  assert.deepEqual(
    attributionProperties({
      cookie: "facebook~group~egypt-1",
      userAgent: "Mozilla/5.0 [FBAN/FBIOS]",
      country: "eg",
    }),
    { source: "facebook", medium: "group", campaign: "egypt-1", inApp: "facebook", country: "eg" },
  );
  assert.deepEqual(
    attributionProperties({ cookie: "direct~~", userAgent: "Chrome", country: null }),
    {
      source: "direct",
    },
  );
  assert.deepEqual(
    attributionProperties({ cookie: "bad cookie", userAgent: null, country: "EGYPT" }),
    {},
  );
});
