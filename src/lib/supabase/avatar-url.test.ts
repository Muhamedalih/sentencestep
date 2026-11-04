import assert from "node:assert/strict";
import { test } from "node:test";

import { googleAvatarUrl } from "./avatar-url";

const PHOTO = "https://lh3.googleusercontent.com/a/ACg8ocK=s96-c";

test("a Google profile picture is taken from avatar_url, or from picture", () => {
  assert.equal(googleAvatarUrl({ avatar_url: PHOTO }), PHOTO);
  assert.equal(googleAvatarUrl({ picture: PHOTO }), PHOTO);
  assert.equal(googleAvatarUrl({ avatar_url: PHOTO, picture: "https://example.com/x.png" }), PHOTO);
});

test("nothing is drawn for a learner without a picture", () => {
  assert.equal(googleAvatarUrl(undefined), null);
  assert.equal(googleAvatarUrl({}), null);
  assert.equal(googleAvatarUrl({ avatar_url: 42 }), null);
  assert.equal(googleAvatarUrl({ avatar_url: "" }), null);
});

test("only an https address on Google's own picture host is accepted", () => {
  assert.equal(googleAvatarUrl({ avatar_url: "https://example.com/me.png" }), null);
  assert.equal(googleAvatarUrl({ avatar_url: "http://lh3.googleusercontent.com/a/x" }), null);
  assert.equal(googleAvatarUrl({ avatar_url: "https://googleusercontent.com.evil.test/a" }), null);
  assert.equal(googleAvatarUrl({ avatar_url: "javascript:alert(1)" }), null);
  assert.equal(googleAvatarUrl({ avatar_url: "not a url" }), null);
});
