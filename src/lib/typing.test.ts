import { test } from "node:test";
import assert from "node:assert/strict";

import {
  calculateAccuracy,
  calculateWpm,
  getCurrentWordIndex,
  getLetterStates,
  isCorrectChar,
  isValidPrefixEdit,
  locateWordAtCharIndex,
  tokenize,
} from "./typing";

// --- isCorrectChar: the entire definition of "did the learner type the right character" ---
//
// Every case here passes already-resolved characters — exactly what a
// native <input>'s `value` (or `KeyboardEvent.key`) contains — never a
// KeyboardEvent.code (a physical key position). That's the whole point:
// this function has no way to even see a physical key position, so it
// cannot regress into comparing the wrong thing.
//
// Case-insensitive by design (see the function's own doc comment): the
// learner is graded on which letters they typed, not on capitalization.

test("isCorrectChar: lowercase target, lowercase input, same letter → correct", () => {
  assert.equal(isCorrectChar("a", 0, "a"), true);
});

test("isCorrectChar: lowercase target, uppercase input, same letter → correct (case-insensitive)", () => {
  assert.equal(isCorrectChar("a", 0, "A"), true);
});

test("isCorrectChar: uppercase target, lowercase input, same letter → correct (case-insensitive)", () => {
  assert.equal(isCorrectChar("A", 0, "a"), true);
});

test("isCorrectChar: uppercase target, uppercase input, same letter → correct", () => {
  assert.equal(isCorrectChar("A", 0, "A"), true);
});

test("isCorrectChar: mixed-case input matches a target of any single case, letter by letter", () => {
  const target = "Nothing is easy at first";
  // "nOtHiNg" typed against target "Nothing" — every position is the right
  // letter in some case, so every position must be correct.
  const typedMixed = "nOtHiNg";
  for (let i = 0; i < typedMixed.length; i += 1) {
    assert.equal(isCorrectChar(target, i, typedMixed[i]!), true, `position ${i}`);
  }
});

test("isCorrectChar: a genuinely different letter is still rejected regardless of case", () => {
  // Target "Nothing is easy at first" — 'z'/'Z' is a genuinely different
  // character at this position (which is 'r'), not a casing difference,
  // and must stay wrong regardless of the case it's typed in.
  const target = "Nothing is easy at first";
  assert.equal(target.charAt(21), "r");
  assert.equal(isCorrectChar(target, 21, "z"), false);
  assert.equal(isCorrectChar(target, 21, "Z"), false);
});

test("isCorrectChar: expected space, actual space → correct", () => {
  assert.equal(isCorrectChar("I am", 1, " "), true);
});

test("isCorrectChar: expected space, actual a non-space → incorrect", () => {
  assert.equal(isCorrectChar("I am", 1, "x"), false);
});

test("isCorrectChar: matching punctuation inside a sentence → correct", () => {
  assert.equal(isCorrectChar("Hi, there", 2, ","), true);
});

test("isCorrectChar: mismatched punctuation → incorrect", () => {
  assert.equal(isCorrectChar("Hi, there", 2, "."), false);
});

test("isCorrectChar: checks the character at the given index, not just position 0", () => {
  const target = "Hi, my name is Sarah";
  assert.equal(isCorrectChar(target, 4, "m"), true);
  assert.equal(isCorrectChar(target, 4, "M"), true); // case-insensitive
  assert.equal(isCorrectChar(target, 4, "x"), false); // different letter
});

test("isCorrectChar: alternate keyboard layout — the generated character is what's compared, never a physical key position", () => {
  // Simulates what a real <input>'s onChange receives: on an AZERTY
  // layout, the physical key at the US-QWERTY "A" position (KeyboardEvent
  // .code === "KeyA") actually generates the character "q"
  // (KeyboardEvent.key === "q", and that's what a native <input>'s value
  // would contain). If the lesson's target expects "q" at this position,
  // that keystroke must be accepted — this function only ever sees the
  // generated character string, so there's no physical-key-code path that
  // could reject it.
  const target = "qwerty";
  const azertyGeneratedChar = "q"; // what the <input> actually received
  assert.equal(isCorrectChar(target, 0, azertyGeneratedChar), true);

  // And the reverse: if the layout generates a character the lesson does
  // NOT expect at this position, that's a genuine mismatch — correctly
  // rejected, exactly like any other wrong character.
  assert.equal(isCorrectChar(target, 0, "a"), false);
});

test("isCorrectChar: a non-Latin character from a non-English active layout is correctly rejected against Latin target text", () => {
  // A learner whose OS keyboard layout is set to Arabic (a very real case
  // for this app's audience) has every keystroke generate Arabic
  // characters, not English ones — a native <input> resolves that exactly
  // as the "generated character" it is, and it's correctly not equal to the
  // expected Latin letter. This is the input genuinely being wrong, not the
  // comparison logic misbehaving.
  assert.equal(isCorrectChar("hello", 0, "ه"), false);
});

// --- isValidPrefixEdit: the guard behind backspace / deletion ---
//
// Also case-insensitive, for the same reason as isCorrectChar: `typed` can
// legitimately hold a different case than `target` at any position (the
// learner typed "n" for a target "N"), so a case-sensitive prefix check
// here would wrongly reject a backspace down to text that was already
// accepted as correct.

test("isValidPrefixEdit: a trailing backspace always leaves a valid prefix", () => {
  const target = "Hello world";
  assert.equal(isValidPrefixEdit(target, "Hello worl"), true);
  assert.equal(isValidPrefixEdit(target, "Hell"), true);
  assert.equal(isValidPrefixEdit(target, ""), true);
});

test("isValidPrefixEdit: repeated backspace down to empty is always valid", () => {
  const target = "Hi";
  assert.equal(isValidPrefixEdit(target, "H"), true);
  assert.equal(isValidPrefixEdit(target, ""), true);
});

test("isValidPrefixEdit: a mid-string edit that breaks the prefix is rejected", () => {
  // e.g. clicking into the middle of the input and deleting a character
  // there, producing something that is no longer a genuine prefix of the
  // target sentence.
  const target = "Hello world";
  assert.equal(isValidPrefixEdit(target, "Hllo worl"), false);
});

test("isValidPrefixEdit: a same-length replacement that is still a valid prefix is accepted", () => {
  const target = "Hello world";
  assert.equal(isValidPrefixEdit(target, "Hello"), true);
});

test("isValidPrefixEdit: a typed prefix in a different case than the target is still valid (case-insensitive)", () => {
  const target = "Nothing is easy at first";
  assert.equal(isValidPrefixEdit(target, "nothing"), true);
  assert.equal(isValidPrefixEdit(target, "NOTHING IS"), true);
  assert.equal(isValidPrefixEdit(target, "nOtHiNg Is"), true);
});

// --- Full end-to-end character-by-character walk of a complete sentence ---
//
// Simulates typing a whole sentence with mixed capitalization, proving
// isCorrectChar accepts every position and the sentence completes exactly
// at the target's length — the same loop useTypingEngine runs internally.

test("full sentence: mixed-case input is accepted letter by letter and completes at the target's length", () => {
  const target = "Nothing is easy at first";
  const typedMixedCase = "nOtHiNg Is EaSy At FiRsT";
  assert.equal(typedMixedCase.length, target.length);

  let typed = "";
  for (let i = 0; i < typedMixedCase.length; i += 1) {
    assert.equal(isCorrectChar(target, i, typedMixedCase[i]!), true, `position ${i}`);
    typed += typedMixedCase[i];
  }
  assert.equal(typed.length, target.length);
});

test("full sentence: an all-uppercase retype of a title-case target is accepted throughout", () => {
  const target = "Nothing is easy at first";
  const typedUpper = target.toUpperCase();
  for (let i = 0; i < typedUpper.length; i += 1) {
    assert.equal(isCorrectChar(target, i, typedUpper[i]!), true, `position ${i}`);
  }
});

test("full sentence: a wrong letter partway through is rejected without derailing the rest", () => {
  const target = "Nothing is easy at first";
  // "Nothing is easy at firzt" — 'z' for 's' in "first" (index 22).
  assert.equal(target.charAt(22), "s");
  assert.equal(isCorrectChar(target, 22, "z"), false);
  // The correct letter at that same position still succeeds afterward.
  assert.equal(isCorrectChar(target, 22, "s"), true);
});

// --- getLetterStates: rendering derived from typed/errorIndex, sanity-checked alongside the above ---

test("getLetterStates: reflects correct/current/pending positions", () => {
  const states = getLetterStates("Hi", "H", null);
  assert.deepEqual(states, ["correct", "current"]);
});

test("getLetterStates: an active errorIndex marks that position as error even though nothing was accepted there yet", () => {
  const states = getLetterStates("Hi there", "H", 1);
  assert.deepEqual(states, [
    "correct",
    "error",
    "pending",
    "pending",
    "pending",
    "pending",
    "pending",
    "pending",
  ]);
});

test("getLetterStates: full completion marks every position correct", () => {
  const states = getLetterStates("Hi", "Hi", null);
  assert.deepEqual(states, ["correct", "correct"]);
});

// The moving underline (typing-text.tsx) renders on whichever character has
// state "current" — it has no index of its own, it just reads this array.
// These two cases are exactly what keeps it synchronized: "current" is
// always target[typed.length], including when that position is a space.
test("getLetterStates: the current position is always exactly typed.length, even at a space", () => {
  const target = "Hi there";
  const states = getLetterStates(target, "Hi", null);
  assert.equal(target.charAt(2), " ");
  assert.equal(states[2], "current");
});

test("getLetterStates: current position advances past a completed space to the next letter", () => {
  const target = "Hi there";
  const states = getLetterStates(target, "Hi ", null);
  assert.equal(target.charAt(3), "t");
  assert.equal(states[2], "correct");
  assert.equal(states[3], "current");
});

// --- tokenize: sanity check, unrelated to the bug but shares this module ---

test("tokenize: splits words and single spaces without losing internal punctuation", () => {
  assert.deepEqual(tokenize("Hi, world"), ["Hi,", " ", "world"]);
});

// --- calculateWpm: (correct chars / 5) / elapsed minutes — the standard convention ---

test("calculateWpm: 25 correct characters in 30 seconds is 10 WPM", () => {
  assert.equal(calculateWpm(25, 30_000), 10);
});

test("calculateWpm: zero elapsed time is 0, not Infinity or NaN", () => {
  assert.equal(calculateWpm(5, 0), 0);
});

test("calculateWpm: zero correct characters is 0 regardless of elapsed time", () => {
  assert.equal(calculateWpm(0, 10_000), 0);
});

// --- calculateAccuracy: correct keystrokes / total keystroke attempts ---

test("calculateAccuracy: all correct keystrokes is 100", () => {
  assert.equal(calculateAccuracy(20, 20), 100);
});

test("calculateAccuracy: half correct is 50", () => {
  assert.equal(calculateAccuracy(10, 20), 50);
});

test("calculateAccuracy: zero attempts is 100, not 0 — no data yet isn't the same as failing", () => {
  assert.equal(calculateAccuracy(0, 0), 100);
});

// --- getCurrentWordIndex: shared by the word-translation card and the word-level underline ---

test("getCurrentWordIndex: at the very first character, the current word is index 0", () => {
  assert.equal(getCurrentWordIndex("I like to read books", 0), 0);
});

test("getCurrentWordIndex: mid-word, still the same word index", () => {
  // "I " typed (length 2) — now typing the "l" of "like".
  assert.equal(getCurrentWordIndex("I like to read books", 2), 1);
});

test("getCurrentWordIndex: landing exactly on a space anticipates the next word", () => {
  // "I" typed (length 1) — cursor is now at the space before "like".
  assert.equal(getCurrentWordIndex("I like to read books", 1), 1);
});

test("getCurrentWordIndex: advances correctly through every word of a sentence", () => {
  const target = "I like to read books";
  assert.equal(getCurrentWordIndex(target, 0), 0); // "I"
  assert.equal(getCurrentWordIndex(target, 6), 2); // "to" (after "I like ")
  assert.equal(getCurrentWordIndex(target, 9), 3); // "read" (after "I like to ")
});

test("getCurrentWordIndex: at the end of the sentence, stays on the last word", () => {
  const target = "I like to read books";
  assert.equal(getCurrentWordIndex(target, target.length), 4); // "books"
});

test("getCurrentWordIndex: a single-word sentence is always index 0", () => {
  assert.equal(getCurrentWordIndex("Hello", 0), 0);
  assert.equal(getCurrentWordIndex("Hello", 5), 0);
});

// --- locateWordAtCharIndex: converts a whole-sentence errorIndex into a word + word-relative offset ---
// (Fix Your Mistakes' red-letter hint — see TypingSentence's mistake tracking.)

test("locateWordAtCharIndex: first character of the first word has a zero start offset", () => {
  const target = "I like to read books";
  assert.deepEqual(locateWordAtCharIndex(target, 0), { word: "I", startOffset: 0 });
});

test("locateWordAtCharIndex: a mid-word index resolves to that word and its own start offset", () => {
  const target = "I like to read books";
  // "like" starts at index 2; index 4 is its 'k'.
  assert.deepEqual(locateWordAtCharIndex(target, 4), { word: "like", startOffset: 2 });
});

test("locateWordAtCharIndex: an index landing on a space returns null — a space is never part of a word", () => {
  const target = "I like to read books";
  assert.equal(target.charAt(1), " ");
  assert.equal(locateWordAtCharIndex(target, 1), null);
});

test("locateWordAtCharIndex: internal punctuation stays part of the word, same as tokenize", () => {
  const target = "Hi, world";
  assert.deepEqual(locateWordAtCharIndex(target, 2), { word: "Hi,", startOffset: 0 }); // the comma itself
  assert.deepEqual(locateWordAtCharIndex(target, 4), { word: "world", startOffset: 4 });
});

test("locateWordAtCharIndex: the last word of a sentence resolves correctly", () => {
  const target = "I like to read books";
  assert.deepEqual(locateWordAtCharIndex(target, target.length - 1), {
    word: "books",
    startOffset: 15,
  });
});
