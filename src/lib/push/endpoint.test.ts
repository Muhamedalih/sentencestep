// Run with `npm run test:security`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { isAllowedPushEndpoint, isPlausiblePushKey } from "./endpoint";

test("isAllowedPushEndpoint: the real push services are accepted", () => {
  for (const endpoint of [
    "https://fcm.googleapis.com/fcm/send/abc:APA91b",
    "https://fcm.googleapis.com/wp/abc",
    "https://updates.push.services.mozilla.com/wpush/v2/gAAAA",
    "https://web.push.apple.com/QGxx",
    "https://wns2-par02p.notify.windows.com/w/?token=abc",
    "https://android.googleapis.com/gcm/send/abc",
  ]) {
    assert.equal(isAllowedPushEndpoint(endpoint), true, endpoint);
  }
});

test("isAllowedPushEndpoint: internal, plain-http and look-alike addresses are refused", () => {
  for (const endpoint of [
    "http://fcm.googleapis.com/fcm/send/abc",
    "https://169.254.169.254/latest/meta-data/",
    "https://localhost/x",
    "https://app-blue:3000/api/health",
    "https://evil.example/fcm.googleapis.com",
    "https://fcm.googleapis.com.evil.example/x",
    "https://evilfcm.googleapis.com.attacker.io/x",
    "https://notfcm.googleapis.com@evil.example/x",
    "https://user:pw@fcm.googleapis.com/x",
    "https://fcm.googleapis.com:8443/x",
    "ftp://fcm.googleapis.com/x",
    "javascript:alert(1)",
    "",
    "not a url",
  ]) {
    assert.equal(isAllowedPushEndpoint(endpoint), false, endpoint);
  }
});

test("isAllowedPushEndpoint: non-strings and over-long values are refused", () => {
  assert.equal(isAllowedPushEndpoint(undefined), false);
  assert.equal(isAllowedPushEndpoint(null), false);
  assert.equal(isAllowedPushEndpoint({}), false);
  assert.equal(isAllowedPushEndpoint(`https://fcm.googleapis.com/${"a".repeat(3000)}`), false);
});

test("isPlausiblePushKey: base64url text of a sane size only", () => {
  assert.equal(isPlausiblePushKey("BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTp", 200), true);
  assert.equal(isPlausiblePushKey("tBHItJI5svbpez7KI4CCXg==", 200), true);
  assert.equal(isPlausiblePushKey("<script>", 200), false);
  assert.equal(isPlausiblePushKey("", 200), false);
  assert.equal(isPlausiblePushKey("a".repeat(300), 200), false);
  assert.equal(isPlausiblePushKey(42, 200), false);
});
