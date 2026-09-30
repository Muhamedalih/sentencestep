import assert from "node:assert/strict";
import test from "node:test";

import {
  compareDictation,
  dictationAccuracy,
  dictationMistakes,
  dictationView,
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

/** Flattens a view into readable text: a typed letter, "_" for a blank slot, "+" for an extra letter, the mark itself, " " for a space. */
function draw(view: ReturnType<typeof dictationView>): string {
  return view.tokens
    .map((token) =>
      token.kind === "space"
        ? " "
        : token.cells
            .map((cell) =>
              cell.kind === "slot" ? (cell.typed ?? "_") : cell.kind === "extra" ? "+" : cell.char,
            )
            .join(""),
    )
    .join("");
}

test("dictationView: a blank per letter, punctuation and spaces kept where they are printed", () => {
  const view = dictationView("I don't know.", "");
  assert.equal(draw(view), "_ ___'_ ____.");
  assert.deepEqual(view.extraWords, []);
  assert.equal(view.typingWord, false);
  assert.deepEqual(view.cursor, { word: 0, letter: 0 });
});

test("dictationView: typed letters fill the blanks of their word and the cursor follows", () => {
  const view = dictationView("I don't know.", "I do");
  assert.equal(draw(view), "I do_'_ ____.");
  assert.deepEqual(view.cursor, { word: 1, letter: 2 });
  assert.equal(view.typingWord, true);
});

test("dictationView: a finished word sends the cursor to the next word; a space does too", () => {
  assert.deepEqual(dictationView("I don't know.", "I").cursor, { word: 1, letter: 0 });
  assert.deepEqual(dictationView("I don't know.", "I ").cursor, { word: 1, letter: 0 });
  assert.equal(dictationView("I don't know.", "I ").typingWord, false);
});

test("dictationView: typed punctuation is ignored and the printed punctuation stays put", () => {
  assert.equal(draw(dictationView("I don't know.", "I dont")), "I don't ____.");
  assert.equal(draw(dictationView("I don't know.", "I don't")), "I don't ____.");
});

test("dictationView: extra letters sit right after their word, extra words after the sentence", () => {
  assert.equal(draw(dictationView("good day.", "gooood")), "gooo++ ___.");
  const view = dictationView("good day", "good day again now");
  assert.deepEqual(view.extraWords, ["again", "now"]);
  assert.deepEqual(view.cursor, { word: 1, letter: 2 });
});

test("dictationView: a hyphenated compound is two words however the learner separates them", () => {
  const target = "A well-known plan";
  assert.equal(draw(dictationView(target, "a well known")), "a well-known ____");
  assert.equal(draw(dictationView(target, "a well-known")), "a well-known ____");
  assert.equal(draw(dictationView(target, "a well-kno")), "a well-kno__ ____");
  const tokens = dictationView(target, "").tokens.filter((token) => token.kind === "word");
  assert.deepEqual(
    tokens.map((token) => (token.kind === "word" ? token.firstWord : null)),
    [0, 1, 3],
  );
});

test("dictationView: a sentence with no letters has no cursor and an empty target just echoes", () => {
  assert.equal(dictationView("— ...", "").cursor, null);
  const echo = dictationView("", "hello wor");
  assert.deepEqual(echo.extraWords, ["hello", "wor"]);
  assert.equal(echo.typingWord, true);
  assert.deepEqual(echo.tokens, []);
});

test("dictationView: the cursor rests on the last slot once every word is complete", () => {
  assert.deepEqual(dictationView("good day", "good day").cursor, { word: 1, letter: 2 });
  assert.deepEqual(dictationView("good day", "good dayyy").cursor, { word: 1, letter: 2 });
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

/** How many graded words a sentence has, according to the view (its highest word index + 1). */
function viewWordCount(sentence: string): number {
  let count = 0;
  for (const token of dictationView(sentence, "").tokens) {
    if (token.kind !== "word") continue;
    for (const cell of token.cells)
      if (cell.kind === "slot") count = Math.max(count, cell.word + 1);
  }
  return count;
}

test("dictationAudioWords: one entry per graded word, hyphenated words share their compound's key", () => {
  const sentence = "Even during meetings, I kept a well-known - habit.";
  const keys = dictationAudioWords(sentence);
  assert.equal(keys.length, viewWordCount(sentence));
  assert.equal(keys.length, normalizeDictationWords(sentence).length);
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

test("dictationAudioWords: keeps apostrophes inside a word and stays aligned with the view's words", () => {
  const sentence = "Don't worry, it's fine.";
  assert.deepEqual(dictationAudioWords(sentence), ["don't", "worry", "it's", "fine"]);
  assert.equal(dictationAudioWords(sentence).length, viewWordCount(sentence));
});
