import assert from "node:assert/strict";
import test from "node:test";

import { signupLandingHref } from "./href";

test("a normal lesson and a story become the lesson player's own path", () => {
  assert.equal(signupLandingHref("normal", "normal-1"), "/learn/normal/normal-1");
  assert.equal(signupLandingHref("stories", "story-81"), "/learn/stories/story-81");
});

test("anything that is not a plain lesson id gives no path", () => {
  assert.equal(signupLandingHref("normal", ""), null);
  assert.equal(signupLandingHref("normal", "../admin"), null);
  assert.equal(signupLandingHref("normal", "a/b"), null);
  assert.equal(signupLandingHref("normal", "x?next=//evil.com"), null);
  assert.equal(signupLandingHref("normal", "a".repeat(101)), null);
  assert.equal(signupLandingHref("conversation", "x"), null);
  assert.equal(signupLandingHref("//evil.com", "x"), null);
});
