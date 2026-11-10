import { test } from "node:test";
import assert from "node:assert/strict";

import {
  INITIAL_KEYBOARD_HINT,
  KEYBOARD_HINT_MAX,
  advanceKeyboardHint,
  isArabicLetter,
  isSpeechFailure,
} from "./help";
import type { KeyboardHintKey, KeyboardHintState } from "./help";

const wrong = (char: string): KeyboardHintKey => ({ type: "wrong", char });
const correct: KeyboardHintKey = { type: "correct" };

function run(keys: KeyboardHintKey[], from: KeyboardHintState = INITIAL_KEYBOARD_HINT) {
  return keys.reduce(advanceKeyboardHint, from);
}

test("only Arabic letters count: not Latin letters, digits, punctuation, spaces or Arabic punctuation", () => {
  for (const char of ["ب", "ل", "ع", "ي", "ء", "ة"]) assert.equal(isArabicLetter(char), true, char);
  for (const char of ["a", "Z", "5", " ", ",", ".", "،", "؟", "٣", "", "بل"]) {
    assert.equal(isArabicLetter(char), false, JSON.stringify(char));
  }
});

test("one wrong Arabic letter is not enough; the second in a row shows the hint", () => {
  const one = run([wrong("ب")]);
  assert.equal(one.visible, false);
  assert.equal(one.run, 1);
  const two = run([wrong("ب"), wrong("ل")]);
  assert.equal(two.visible, true);
  assert.equal(two.shown, 1);
});

test("a wrong key that is not an Arabic letter breaks the run: it is an ordinary typo", () => {
  const state = run([wrong("ب"), wrong("x"), wrong("ل")]);
  assert.equal(state.visible, false);
  assert.equal(state.run, 1);
});

test("a right letter hides the hint and clears the run", () => {
  const shown = run([wrong("ب"), wrong("ل")]);
  const after = advanceKeyboardHint(shown, correct);
  assert.equal(after.visible, false);
  assert.equal(after.run, 0);
  assert.equal(after.shown, 1);
  // One wrong Arabic letter, then a right one, then another wrong one: the run started over.
  assert.equal(run([wrong("ب"), correct, wrong("ل")]).visible, false);
});

test("it shows at most twice in a lesson, and never while it is already showing", () => {
  let state = run([wrong("ب"), wrong("ل")]);
  assert.equal(state.shown, 1);
  state = run([wrong("ع"), wrong("ي"), wrong("ء")], state);
  assert.equal(state.shown, 1, "still showing: a longer run does not count it again");
  state = run([correct, wrong("ب"), wrong("ل")], state);
  assert.equal(state.visible, true);
  assert.equal(state.shown, 2);
  state = run([correct, wrong("ب"), wrong("ل"), wrong("ع")], state);
  assert.equal(state.visible, false);
  assert.equal(state.shown, KEYBOARD_HINT_MAX);
});

test("a state that did not change is returned as is, so nothing re-renders", () => {
  assert.equal(advanceKeyboardHint(INITIAL_KEYBOARD_HINT, correct), INITIAL_KEYBOARD_HINT);
  assert.equal(advanceKeyboardHint(INITIAL_KEYBOARD_HINT, wrong("x")), INITIAL_KEYBOARD_HINT);
});

test("a speech error is a failure unless the utterance was cut off on purpose or blocked until a tap", () => {
  for (const error of ["synthesis-failed", "synthesis-unavailable", "audio-hardware", "network"]) {
    assert.equal(isSpeechFailure(error), true, error);
  }
  for (const error of ["interrupted", "canceled", "not-allowed"]) {
    assert.equal(isSpeechFailure(error), false, error);
  }
  assert.equal(isSpeechFailure(undefined), true);
});
