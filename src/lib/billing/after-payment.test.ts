// Run with `npm test`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { firstParam, safeLessonPath } from "./after-payment";

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
