// Run with `npm test`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  AFTER_PAYMENT_MAX_AGE_SECONDS,
  firstParam,
  safeLessonPath,
  upgradeSignInHref,
} from "./after-payment";

test("safeLessonPath: accepts a lesson page of each mode", () => {
  for (const path of [
    "/learn/normal/normal-7",
    "/learn/stories/story-6",
    "/learn/conversation/conversation-1",
    "/learn/normal/onboarding-beginner",
    "/learn/stories/a_b-c9",
  ]) {
    assert.equal(safeLessonPath(path), path, path);
  }
});

test("safeLessonPath: accepts a passage and each page a locked word list can stop a learner at", () => {
  for (const path of [
    "/learn/passages/ten-minutes-a-day",
    "/learn/passages/the_escape_room",
    "/learn/word-lists/family",
    "/learn/word-lists/family/learn",
    "/learn/word-lists/family/words",
  ]) {
    assert.equal(safeLessonPath(path), path, path);
  }
});

test("safeLessonPath: refuses what is not exactly one of those pages", () => {
  for (const bad of [
    "/learn/passages",
    "/learn/passages/",
    "/learn/passages/a/extra",
    "/learn/passages/a?next=/x",
    "/learn/passages/../../admin",
    "/learn/passages/-dash",
    "/learn/word-lists",
    "/learn/word-lists/family/practice",
    "/learn/word-lists/family/learn/extra",
    "/learn/word-lists/family/words#top",
    "/learn/library/some-book",
    "/learn/today/go",
    "/learn/cards/x",
  ]) {
    assert.equal(safeLessonPath(bad), null, bad);
  }
});

test("the remembered place lasts a day, as long as a Binance Pay order can still be paid", () => {
  assert.equal(AFTER_PAYMENT_MAX_AGE_SECONDS, 24 * 60 * 60);
});

test("safeLessonPath: refuses anything that is not a plain lesson page", () => {
  for (const bad of [
    "",
    "/",
    "/learn",
    "/learn/",
    "/learn/normal",
    "/learn/normal/",
    "/learn/settings/x",
    "/learn/normal/normal-7/extra",
    "/learn/normal/normal-7?next=/x",
    "/learn/normal/normal-7#top",
    "//evil.example/learn/normal/x",
    "https://evil.example/learn/normal/normal-7",
    "javascript:alert(1)",
    "/learn/normal/../../admin",
    "/learn/normal/%2e%2e",
    "/learn/normal/-starts-with-dash",
    "/learn/normal/" + "a".repeat(200),
    "/upgrade",
    "/admin",
  ]) {
    assert.equal(safeLessonPath(bad), null, bad);
  }
});

test("safeLessonPath: values that are not strings are refused", () => {
  for (const bad of [undefined, null, 5, {}, ["/learn/normal/normal-7"]]) {
    assert.equal(safeLessonPath(bad), null);
  }
});

test("firstParam: takes the first of a list, or the value itself", () => {
  assert.equal(firstParam("a"), "a");
  assert.equal(firstParam(["a", "b"]), "a");
  assert.equal(firstParam(undefined), undefined);
  assert.equal(firstParam([]), undefined);
});

test("upgradeSignInHref: with no lesson, sign-in leads back to the plans page", () => {
  const href = upgradeSignInHref();
  assert.equal(new URL(href, "https://sentencestep.com").pathname, "/login");
  assert.equal(new URL(href, "https://sentencestep.com").searchParams.get("next"), "/upgrade");
  assert.equal(upgradeSignInHref(null), href);
});

test("upgradeSignInHref: with a lesson, the plans page it returns to still remembers the lesson", () => {
  const href = upgradeSignInHref("/learn/normal/normal-7");
  const next = new URL(href, "https://sentencestep.com").searchParams.get("next");
  assert.equal(next, "/upgrade?next=%2Flearn%2Fnormal%2Fnormal-7");
  const lesson = new URL(String(next), "https://sentencestep.com").searchParams.get("next");
  assert.equal(safeLessonPath(lesson), "/learn/normal/normal-7");
});

test("upgradeSignInHref: anything that is not a lesson page is ignored", () => {
  assert.equal(upgradeSignInHref("https://evil.example/x"), upgradeSignInHref());
  assert.equal(upgradeSignInHref("/admin"), upgradeSignInHref());
});

test("the plans-page address a lock builds carries the page back, whatever the page is", () => {
  for (const path of [
    "/learn/normal/normal-3",
    "/learn/passages/ten-minutes-a-day",
    "/learn/word-lists/family",
    "/learn/word-lists/family/learn",
    "/learn/word-lists/family/words",
  ]) {
    const upgrade = `/upgrade?next=${encodeURIComponent(path)}`;
    const next = new URL(upgrade, "https://sentencestep.com").searchParams.get("next");
    assert.equal(safeLessonPath(next), path, path);
    // Signed out, the sign-in detour keeps it too.
    const back = new URL(upgradeSignInHref(path), "https://sentencestep.com").searchParams.get(
      "next",
    );
    const inner = new URL(String(back), "https://sentencestep.com").searchParams.get("next");
    assert.equal(safeLessonPath(inner), path, path);
  }
});
