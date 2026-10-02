import assert from "node:assert/strict";
import test from "node:test";

import {
  applyDictationInput,
  applyStrictDictationInput,
  compareDictation,
  dictationAccuracy,
  dictationLetterCount,
  dictationMistakes,
  dictationStars,
  dictationTypedPrefix,
  dictationView,
  dictationWordLengths,
  firstLetterHint,
  isDictationComplete,
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

test("dictationWordLengths: letters per graded word, punctuation and hyphens not counted", () => {
  assert.deepEqual(dictationWordLengths("I don't know."), [1, 4, 4]);
  assert.deepEqual(dictationWordLengths("A well-known — plan"), [1, 4, 5, 4]);
});

/** Types `keys` one at a time the way a keyboard would, starting from nothing. */
function typeAll(target: string, keys: string, from = ""): string {
  let value = from;
  for (const key of Array.from(keys)) value = applyDictationInput(target, value, value + key);
  return value;
}

test("applyDictationInput: a full word hands over to the next one by itself, right or wrong", () => {
  assert.equal(typeAll("I had to go", "I"), "I ");
  assert.equal(typeAll("I had to go", "Ihad"), "I had ");
  // A wrong letter still counts toward the word's length.
  assert.equal(typeAll("I had to go", "Ihxd"), "I hxd ");
  assert.equal(typeAll("I had to go", "Ihadtogo"), "I had to go");
});

test("applyDictationInput: nothing can be typed past the end of the sentence", () => {
  assert.equal(typeAll("I had to go", "Ihadtogoxyz"), "I had to go");
  // The last word gets no trailing space.
  assert.equal(typeAll("I had to go", "Ihadto"), "I had to ");
});

test("applyDictationInput: punctuation is dropped and the learner's own spaces are optional", () => {
  assert.equal(typeAll("I don't know.", "Idon't"), "I dont ");
  assert.equal(typeAll("I don't know.", "I don't know."), "I dont know");
  assert.equal(typeAll("I don't know.", "I  "), "I ");
});

test("applyDictationInput: a space or hyphen typed early moves on, but never from an empty word", () => {
  assert.equal(typeAll("good morning", "go "), "go ");
  assert.equal(typeAll("good morning", "go-m"), "go m");
  assert.equal(typeAll("good morning", " "), "");
  assert.equal(typeAll("good morning", "go  "), "go ");
});

test("applyDictationInput: a hyphenated compound is two words for the hand-over", () => {
  assert.equal(typeAll("A well-known plan", "Awellknown"), "A well known ");
  assert.equal(typeAll("A well-known plan", "Awell-known"), "A well known ");
});

test("applyDictationInput: Backspace over the automatic hand-over also removes the last letter", () => {
  assert.equal(applyDictationInput("I had to go", "I ", "I"), "");
  assert.equal(applyDictationInput("I had to go", "I had ", "I had"), "I ha");
  // An early manual space: only the space goes.
  assert.equal(applyDictationInput("good morning", "go ", "go"), "go");
  // Plain deletion inside a word, and over the last word (no hand-over to undo).
  assert.equal(applyDictationInput("I had to go", "I ha", "I h"), "I h");
  assert.equal(applyDictationInput("I had to go", "I had to go", "I had to g"), "I had to g");
});

test("applyDictationInput: a letter typed after backspacing into a full word starts the next word", () => {
  assert.equal(applyDictationInput("I had to go", "I had", "I hadx"), "I had x");
});

test("applyDictationInput: edits that aren't adding or deleting at the end are ignored", () => {
  assert.equal(applyDictationInput("I had to go", "I had ", "I xhad "), "I had ");
  assert.equal(applyDictationInput("I had to go", "I had ", "x"), "I had ");
  assert.equal(applyDictationInput("I had to go", "I had ", ""), "");
});

test("applyDictationInput: with no target everything is accepted as typed", () => {
  assert.equal(applyDictationInput("", "hel", "hello wor"), "hello wor");
});

/** Types `keys` one character at a time through the letter-by-letter rules; returns the answer and every rejected key with where it was aimed. */
function typeStrict(target: string, keys: string) {
  let value = "";
  const rejected: { char: string; word: number; letter: number }[] = [];
  for (const key of Array.from(keys)) {
    const step = applyStrictDictationInput(target, value, value + key);
    value = step.value;
    if (step.rejected !== null && step.at !== null) {
      rejected.push({ char: step.rejected, ...step.at });
    }
  }
  return { value, rejected };
}

test("applyStrictDictationInput: correct letters are accepted, case never matters, words hand over by themselves", () => {
  assert.equal(typeStrict("I had to go", "I").value, "I ");
  assert.equal(typeStrict("I had to go", "ihad").value, "i had ");
  assert.equal(typeStrict("I had to go", "IHADTOGO").value, "I HAD TO GO");
  assert.deepEqual(typeStrict("I had to go", "ihadtogo").rejected, []);
});

test("applyStrictDictationInput: a wrong letter is turned away, says where it was aimed, and the answer stays as it was", () => {
  const { value, rejected } = typeStrict("I had to go", "Iha" + "x");
  assert.equal(value, "I ha");
  assert.deepEqual(rejected, [{ char: "x", word: 1, letter: 2 }]);
  // The learner can simply try again.
  assert.equal(typeStrict("I had to go", "Ihaxd").value, "I had ");
  assert.equal(typeStrict("I had to go", "Ihaxd").rejected.length, 1);
});

test("applyStrictDictationInput: guessing never gets ahead — every wrong letter is reported, in order", () => {
  const { value, rejected } = typeStrict("cat", "xyzc" + "qat");
  assert.equal(value, "cat");
  assert.deepEqual(
    rejected.map((entry) => entry.char),
    ["x", "y", "z", "q"],
  );
  assert.ok(rejected.every((entry) => entry.word === 0));
  assert.deepEqual(
    rejected.map((entry) => entry.letter),
    [0, 0, 0, 1],
  );
});

test("applyStrictDictationInput: punctuation is never typed and the habitual space after a word does nothing", () => {
  assert.equal(typeStrict("I don't know.", "Idon't").value, "I dont ");
  assert.equal(typeStrict("I don't know.", "Idon't").rejected.length, 0);
  assert.equal(typeStrict("I don't know.", "I k").rejected.length, 1);
  assert.equal(typeStrict("good morning", "good morning").rejected.length, 0);
  assert.equal(typeStrict("good morning", "good morning").value, "good morning");
  // A leading space is nothing.
  assert.equal(typeStrict("good morning", " g").value, "g");
});

test("applyStrictDictationInput: a space or hyphen in the middle of a word skips ahead, which is a wrong letter", () => {
  const spaced = typeStrict("good morning", "go ");
  assert.equal(spaced.value, "go");
  assert.deepEqual(spaced.rejected, [{ char: " ", word: 0, letter: 2 }]);
  assert.equal(typeStrict("good morning", "go-").rejected.length, 1);
});

test("applyStrictDictationInput: a hyphenated compound is two words and the hyphen between them needs no key", () => {
  assert.equal(typeStrict("A well-known plan", "Awellknown").value, "A well known ");
  assert.equal(typeStrict("A well-known plan", "Awell-known").rejected.length, 0);
});

test("applyStrictDictationInput: nothing can be typed past the end of the sentence", () => {
  assert.equal(typeStrict("I had to go", "Ihadtogoxyz").value, "I had to go");
  assert.equal(typeStrict("I had to go", "Ihadtogoxyz").rejected.length, 0);
});

test("applyStrictDictationInput: several characters arriving at once stop at the first wrong one", () => {
  const step = applyStrictDictationInput("good morning", "", "gox");
  assert.equal(step.value, "go");
  assert.equal(step.rejected, "x");
  assert.deepEqual(step.at, { word: 0, letter: 2 });
});

test("applyStrictDictationInput: Backspace and edits behave as they do in the exam", () => {
  assert.equal(applyStrictDictationInput("I had to go", "I ", "I").value, "");
  assert.equal(applyStrictDictationInput("I had to go", "I ha", "I h").value, "I h");
  assert.equal(applyStrictDictationInput("I had to go", "I had ", "I xhad ").value, "I had ");
  assert.equal(applyStrictDictationInput("I had to go", "I had ", "I had ").rejected, null);
});

test("isDictationComplete: only once the last letter of the last word is in", () => {
  assert.equal(isDictationComplete("I had to go.", "I had to g"), false);
  assert.equal(isDictationComplete("I had to go.", "I had to go"), true);
  assert.equal(isDictationComplete("I had to go.", ""), false);
  // Nothing to type means nothing to complete.
  assert.equal(isDictationComplete("...", ""), false);
});

test("dictationLetterCount: letters only, however the answer is spaced", () => {
  assert.equal(dictationLetterCount(""), 0);
  assert.equal(dictationLetterCount("I had "), 4);
  assert.equal(dictationLetterCount("I dont know"), 9);
});

test("dictationTypedPrefix: carries a finished-word answer over to the normal typing view's buffer", () => {
  assert.equal(dictationTypedPrefix("I don't know.", ""), "");
  assert.equal(dictationTypedPrefix("I don't know.", "I "), "I ");
  assert.equal(dictationTypedPrefix("I don't know.", "I do"), "I do");
  // The apostrophe is skipped over by the engine, the space after the finished word is typed.
  assert.equal(dictationTypedPrefix("I don't know.", "I dont "), "I don't ");
  assert.equal(dictationTypedPrefix("I don't know.", "I dont k"), "I don't k");
});

test("dictationTypedPrefix: punctuation after a finished word is passed over together with the space", () => {
  // The engine passes over an opening quote as soon as the space before it is typed.
  assert.equal(dictationTypedPrefix('He said, "Hello" to me.', "He said "), 'He said, "');
  // Punctuation right after the last typed letter is passed over at once, as the engine does.
  assert.equal(
    dictationTypedPrefix('He said, "Hello" to me.', "He said hello"),
    'He said, "Hello"',
  );
  assert.equal(dictationTypedPrefix("A well-known plan", "A well "), "A well-");
  assert.equal(dictationTypedPrefix("A well-known plan", "A well k"), "A well-k");
});

test("dictationTypedPrefix: always a genuine prefix the typing engine accepts, for every point of a letter-by-letter answer", () => {
  const target = "She said, \"Don't go — it's well-known!\"";
  let value = "";
  for (const key of Array.from("shesaiddontgoitswellknown")) {
    value = applyStrictDictationInput(target, value, value + key).value;
    const prefix = dictationTypedPrefix(target, value);
    assert.ok(
      target.toLowerCase().startsWith(prefix.toLowerCase()),
      `"${prefix}" is not a prefix of the target after "${value}"`,
    );
  }
});

test("dictationStars: each help costs a star, each third wrong letter costs a star, never below one", () => {
  assert.equal(dictationStars(0, 0), 3);
  // A slip or two is not a loss.
  assert.equal(dictationStars(1, 0), 3);
  assert.equal(dictationStars(2, 0), 3);
  assert.equal(dictationStars(3, 0), 2);
  assert.equal(dictationStars(5, 0), 2);
  assert.equal(dictationStars(6, 0), 1);
  assert.equal(dictationStars(0, 1), 2);
  assert.equal(dictationStars(2, 1), 2);
  assert.equal(dictationStars(3, 1), 1);
  assert.equal(dictationStars(0, 2), 1);
  assert.equal(dictationStars(40, 9), 1);
});
