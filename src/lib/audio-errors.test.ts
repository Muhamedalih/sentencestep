import assert from "node:assert/strict";
import test from "node:test";

import { describePlaybackFailure, isAutoplayBlockedError } from "@/lib/audio-errors";

test("isAutoplayBlockedError: only a NotAllowedError counts as the autoplay policy", () => {
  assert.equal(isAutoplayBlockedError(new DOMException("blocked", "NotAllowedError")), true);
  assert.equal(isAutoplayBlockedError({ name: "NotAllowedError" }), true);
  assert.equal(isAutoplayBlockedError(new DOMException("bad file", "NotSupportedError")), false);
  assert.equal(isAutoplayBlockedError(new Error("boom")), false);
  assert.equal(isAutoplayBlockedError(null), false);
  assert.equal(isAutoplayBlockedError("NotAllowedError"), false);
});

test("describePlaybackFailure: names the error and its message", () => {
  assert.equal(
    describePlaybackFailure(new DOMException("play() failed", "NotAllowedError")),
    "NotAllowedError: play() failed",
  );
  assert.equal(
    describePlaybackFailure({ code: 4, message: "Format error" }),
    "media error 4: Format error",
  );
  assert.equal(describePlaybackFailure("nope"), "nope");
});
