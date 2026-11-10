import { test } from "node:test";
import assert from "node:assert/strict";

import {
  OPENER_LESSON_IDS,
  OPENER_MAX_SENTENCES,
  inVisitorShare,
  isOpenerLessonId,
  isOpenerStep,
  isOpenerVariant,
  newVisitorToken,
  openerStepNeedsSentence,
  parseSentenceNumber,
  parseSkippedOpeners,
  parseVisitorToken,
  shortOpenerRowId,
  withSkippedOpener,
} from "./shared";
import { defaultRolloutEntry, rolloutBucket } from "../rollouts/config";
import type { RolloutEntry } from "../rollouts/config";

test("the three opening lessons are the three tiers' ids, and only those", () => {
  assert.deepEqual([...OPENER_LESSON_IDS].sort(), [
    "onboarding-advanced",
    "onboarding-beginner",
    "onboarding-intermediate",
  ]);
  assert.equal(isOpenerLessonId("onboarding-beginner"), true);
  assert.equal(isOpenerLessonId("onboarding-short-beginner"), false);
  assert.equal(isOpenerLessonId("normal-1"), false);
});

test("the short text's draft row is named after the opening lesson, and only for an opening lesson", () => {
  assert.equal(shortOpenerRowId("onboarding-beginner"), "onboarding-short-beginner");
  assert.equal(shortOpenerRowId("onboarding-intermediate"), "onboarding-short-intermediate");
  assert.equal(shortOpenerRowId("onboarding-advanced"), "onboarding-short-advanced");
  assert.equal(shortOpenerRowId("onboarding-short-beginner"), null);
  assert.equal(shortOpenerRowId("normal-1"), null);
});

test("a visitor token is 12 lowercase letters or digits; anything else is not one", () => {
  const token = newVisitorToken(() => 0.5);
  assert.equal(token.length, 12);
  assert.equal(parseVisitorToken(token), token);
  assert.equal(parseVisitorToken(newVisitorToken(() => 0.999999)), "999999999999");
  assert.equal(parseVisitorToken(newVisitorToken(() => 0)), "aaaaaaaaaaaa");
  assert.equal(parseVisitorToken(undefined), null);
  assert.equal(parseVisitorToken(""), null);
  assert.equal(parseVisitorToken("ABCDEFGHIJKL"), null);
  assert.equal(parseVisitorToken("abc"), null);
  assert.equal(parseVisitorToken("abcdefghijkl; drop"), null);
});

function everyone(percent: number): RolloutEntry {
  return { mode: "everyone", percent, emails: [] };
}

test("a share of visitors: in only below the share, never without a token, never at 0 or in admin mode", () => {
  const token = "a1b2c3d4e5f6";
  const bucket = rolloutBucket(token, "shortOpener");
  assert.equal(inVisitorShare("shortOpener", everyone(bucket + 1), token), true);
  assert.equal(inVisitorShare("shortOpener", everyone(bucket), token), false);
  assert.equal(inVisitorShare("shortOpener", everyone(100), token), true);
  assert.equal(inVisitorShare("shortOpener", everyone(100), null), true);
  assert.equal(inVisitorShare("shortOpener", everyone(99), null), false);
  assert.equal(inVisitorShare("shortOpener", everyone(50), null), false);
  assert.equal(inVisitorShare("shortOpener", defaultRolloutEntry("shortOpener"), token), false);
  assert.equal(
    inVisitorShare("shortOpener", { mode: "emails", percent: 100, emails: [] }, token),
    false,
  );
});

test("the two opening-lesson tests are cut independently, and a bigger share only adds visitors", () => {
  let differs = 0;
  let nested = true;
  const tokens = Array.from({ length: 400 }, (_, index) =>
    newVisitorToken(() => ((index * 7919) % 1000) / 1000 + 0.0003 * (index % 3)),
  );
  for (const token of tokens) {
    const a = rolloutBucket(token, "shortOpener");
    const b = rolloutBucket(token, "openerSkip");
    if (a !== b) differs += 1;
    if (
      inVisitorShare("shortOpener", everyone(30), token) &&
      !inVisitorShare("shortOpener", everyone(60), token)
    ) {
      nested = false;
    }
  }
  assert.ok(differs > 300, `the two buckets should rarely agree, differed ${differs} of 400`);
  assert.equal(nested, true);
});

test("the skipped-openers cookie: one letter per tier, any order in, tier order out, junk ignored", () => {
  assert.deepEqual(parseSkippedOpeners(undefined), []);
  assert.deepEqual(parseSkippedOpeners(""), []);
  assert.deepEqual(parseSkippedOpeners("b"), ["onboarding-beginner"]);
  assert.deepEqual(parseSkippedOpeners("ai"), ["onboarding-intermediate", "onboarding-advanced"]);
  assert.deepEqual(parseSkippedOpeners("zzz"), []);
  assert.equal(withSkippedOpener(undefined, "onboarding-beginner"), "b");
  assert.equal(withSkippedOpener("b", "onboarding-advanced"), "ba");
  assert.equal(withSkippedOpener("ba", "onboarding-beginner"), "ba");
  assert.equal(withSkippedOpener("b", "normal-1"), "b");
  assert.equal(withSkippedOpener("b", "onboarding-short-beginner"), "b");
});

test("the measurement events accept only known steps and variants, and whole sentence numbers in range", () => {
  for (const step of ["tap", "key", "sentence", "skipped", "keyboard_hint", "audio_failed"]) {
    assert.equal(isOpenerStep(step), true);
  }
  // Which steps carry a sentence number: the ones tied to a sentence, not the whole-lesson ones.
  for (const step of ["sentence", "skipped", "keyboard_hint"] as const) {
    assert.equal(openerStepNeedsSentence(step), true, step);
  }
  for (const step of ["tap", "key", "audio_failed"] as const) {
    assert.equal(openerStepNeedsSentence(step), false, step);
  }
  for (const step of ["", "TAP", "typed", undefined, 3]) assert.equal(isOpenerStep(step), false);
  assert.equal(isOpenerVariant("short"), true);
  assert.equal(isOpenerVariant("classic"), true);
  assert.equal(isOpenerVariant("long"), false);
  assert.equal(parseSentenceNumber(1), 1);
  assert.equal(parseSentenceNumber(OPENER_MAX_SENTENCES), OPENER_MAX_SENTENCES);
  for (const bad of [0, -1, 1.5, OPENER_MAX_SENTENCES + 1, NaN, "2", null, undefined]) {
    assert.equal(parseSentenceNumber(bad), null);
  }
});
