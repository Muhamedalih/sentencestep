import assert from "node:assert/strict";
import test from "node:test";

import {
  compareDictation,
  dictationAccuracy,
  dictationBlanks,
  dictationMistakes,
  firstLetterHint,
  levenshtein,
  normalizeDictationWords,
  normalizedIndexesToRaw,
  dictationAudioWords,
  wrongLetterPositions,
} from "@/lib/features/dictation";

test("normalizeDictationWords: case, punctuation and apostrophes never matter", () => {
  assert.deepEqual(normalizeDictationWords("She said, “Don't go!”"), ["she", "said", "dont", "go"]);
});

test("normalizeDictationWords: hyphens split words and pure punctuation tokens vanish", () => {
  assert.deepEqual(normalizeDictationWords("A well-known plan — really"), [
    "a",
    "well",
    "known",
    "plan",
    "really",
  ]);
});

test("levenshtein: basic distances", () => {
  assert.equal(levenshtein("kitten", "sitting"), 3);
  assert.equal(levenshtein("", "abc"), 3);
  assert.equal(levenshtein("same", "same"), 0);
});

test("compareDictation: an exact answer (ignoring case and punctuation) is exact with full accuracy", () => {
  const result = compareDictation("I ordered a black coffee.", "i ordered A black coffee");
  assert.equal(result.exact, true);
  assert.equal(result.errorChars, 0);
  assert.equal(dictationAccuracy(result), 1);
  assert.deepEqual(dictationMistakes(result), []);
});

test("compareDictation: a one-letter typo is 'close', still reported as a mistake with the wrong position", () => {
  const result = compareDictation("The waiter brought tea", "The waiter brougt tea");
  assert.equal(result.exact, false);
  const brought = result.words.find((word) => word.target === "brought");
  assert.equal(brought?.status, "close");
  // One dropped letter marks exactly one position, not everything after it.
  assert.equal(brought?.errorIndexes.length, 1);
  assert.ok(dictationAccuracy(result) < 1);
  assert.ok(dictationAccuracy(result) > 0.8);
  assert.deepEqual(dictationMistakes(result), [
    { word: "brought", errorIndexes: brought?.errorIndexes ?? [] },
  ]);
});

test("compareDictation: a completely different word is 'wrong'", () => {
  const result = compareDictation("I like coffee", "I like banana");
  const coffee = result.words.find((word) => word.target === "coffee");
  assert.equal(coffee?.status, "wrong");
});

test("compareDictation: a skipped word is 'missing' and does not misalign the words after it", () => {
  const result = compareDictation("we waited an hour for a table", "we waited hour for a table");
  const statuses = Object.fromEntries(result.words.map((word) => [word.target, word.status]));
  assert.equal(statuses.an, "missing");
  assert.equal(statuses.hour, "correct");
  assert.equal(statuses.table, "correct");
  assert.equal(
    result.typedWords.every((word) => word.status === "correct"),
    true,
  );
});

test("compareDictation: extra typed words are flagged and cost accuracy", () => {
  const result = compareDictation("open the door", "open the big door");
  assert.equal(result.exact, false);
  assert.deepEqual(
    result.typedWords.map((word) => word.status),
    ["correct", "correct", "extra", "correct"],
  );
  assert.ok(dictationAccuracy(result) < 1);
});

test("compareDictation: typing nothing scores zero and marks every word missing", () => {
  const result = compareDictation("good morning", "");
  assert.equal(result.correctChars, 0);
  assert.equal(dictationAccuracy(result), 0);
  assert.ok(result.words.every((word) => word.status === "missing"));
});

test("dictationAccuracy: no graded letters is not a failure", () => {
  assert.equal(dictationAccuracy({ correctChars: 0, errorChars: 0 }), 1);
});

test("normalizedIndexesToRaw: skips punctuation the normalization removed", () => {
  // "don't" -> "dont": normalized index 3 ('t') is raw index 4.
  assert.deepEqual(normalizedIndexesToRaw("don't", [0, 3]), [0, 4]);
});

test("dictationBlanks: one letter count per word, punctuation ignored", () => {
  assert.deepEqual(dictationBlanks("I don't know."), [1, 4, 4]);
});

test("firstLetterHint: first letter then a dot per remaining letter", () => {
  assert.equal(firstLetterHint("Good morning"), "g··· m······");
});

test("compareDictation: a paired typed word remembers what it was matched against", () => {
  const result = compareDictation("I had to reply to everything", "I had to replie to everything");
  const replie = result.typedWords.find((word) => word.text === "replie");
  assert.equal(replie?.status, "wrong");
  assert.equal(replie?.against, "reply");
  // Exact matches and extra words have nothing to be compared against.
  assert.equal(result.typedWords[0]?.against, undefined);
  const withExtra = compareDictation("good morning", "good very morning");
  assert.equal(withExtra.typedWords.find((word) => word.text === "very")?.against, undefined);
});

test("wrongLetterPositions: marks the letters that differ in both directions", () => {
  // "replie" typed for "reply": the typed "i" and "e" are wrong, the missed letter in "reply" is its "y".
  assert.deepEqual(wrongLetterPositions("replie", "reply"), [4, 5]);
  assert.deepEqual(wrongLetterPositions("reply", "replie"), [4]);
  // One dropped letter marks that one letter, not everything after it.
  assert.deepEqual(wrongLetterPositions("everything", "everthing"), [4]);
  assert.deepEqual(wrongLetterPositions("cat", "cat"), []);
});

test("dictationAudioWords: one entry per blank, hyphenated words share their compound's key", () => {
  const sentence = "Even during meetings, I kept a well-known - habit.";
  const keys = dictationAudioWords(sentence);
  assert.equal(keys.length, dictationBlanks(sentence).length);
  assert.deepEqual(keys, [
    "even",
    "during",
    "meetings",
    "i",
    "kept",
    "a",
    "well-known",
    "well-known",
    "habit",
  ]);
});

test("dictationAudioWords: keeps apostrophes inside a word and stays aligned with the blanks", () => {
  const sentence = "Don't worry, it's fine.";
  assert.deepEqual(dictationAudioWords(sentence), ["don't", "worry", "it's", "fine"]);
  assert.equal(dictationAudioWords(sentence).length, dictationBlanks(sentence).length);
});
