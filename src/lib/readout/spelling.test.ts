import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { lengthBucket, spellingFeatures, spellingReport } from "./spelling";
import type { WordStat } from "./spelling";

describe("spellingFeatures", () => {
  it("finds the patterns a word has", () => {
    assert.deepEqual(spellingFeatures("little"), ["double_consonant", "silent_e"]);
    assert.deepEqual(spellingFeatures("night"), ["gh"]);
    assert.deepEqual(spellingFeatures("knife"), ["silent_e", "silent_start"]);
    assert.deepEqual(spellingFeatures("climb"), ["silent_mb"]);
    assert.deepEqual(spellingFeatures("would"), ["ould", "vowel_pair"]);
    assert.deepEqual(spellingFeatures("station"), ["tion"]);
    assert.deepEqual(spellingFeatures("don't"), ["contraction"]);
    assert.deepEqual(spellingFeatures("walked"), ["ending_ed_ing"]);
  });

  it("finds nothing in a plain word, and ignores case", () => {
    assert.deepEqual(spellingFeatures("dog"), []);
    assert.deepEqual(spellingFeatures("DOG"), []);
    assert.deepEqual(spellingFeatures("Night"), ["gh"]);
  });

  it("counts a final e only after a consonant, in words of four letters or more", () => {
    assert.ok(spellingFeatures("make").includes("silent_e"));
    assert.ok(!spellingFeatures("see").includes("silent_e"));
    assert.ok(!spellingFeatures("the").includes("silent_e"));
    assert.ok(!spellingFeatures("free").includes("silent_e"));
  });

  it("does not take a doubled vowel for a doubled consonant", () => {
    assert.deepEqual(spellingFeatures("book"), ["double_vowel"]);
    assert.ok(!spellingFeatures("book").includes("double_consonant"));
  });
});

describe("lengthBucket", () => {
  it("counts letters, not the apostrophe", () => {
    assert.equal(lengthBucket("dog"), "3-4");
    assert.equal(lengthBucket("don't"), "3-4");
    assert.equal(lengthBucket("house"), "5-6");
    assert.equal(lengthBucket("because"), "7-8");
    assert.equal(lengthBucket("beautiful"), "9+");
  });
});

const stat = (word: string, exposed: number, wrong: number, repeat = 0): WordStat => ({
  word,
  exposed,
  wrong,
  repeat,
});

describe("spellingReport", () => {
  it("compares a feature with plain words of the same length, not with all words", () => {
    // Plain 5-6 letter words: 10% wrong. Doubled-consonant 5-6 letter words: 20% wrong. Plain 9+ words:
    // 40% wrong, which must not make the doubled-consonant words look easy.
    const plain56 = ["plant", "water", "story", "money", "stand"].map((w) => stat(w, 1000, 100));
    const double56 = ["little", "yellow", "happy", "summer", "lesson"].map((w) =>
      stat(w, 1000, 200),
    );
    const plain9 = ["wonderful"].map((w) => stat(w, 1000, 400));
    const report = spellingReport([...plain56, ...double56, ...plain9], 3);

    assert.equal(report.baseline["5-6"].wrong / report.baseline["5-6"].exposed, 0.1);
    const row = report.rows.find((r) => r.id === "double_consonant");
    assert.ok(row);
    assert.equal(row!.words, 5);
    assert.equal(row!.rate, 0.2);
    assert.equal(row!.ratio, 2);
  });

  it("shows a feature only from the minimum number of words", () => {
    const words = [stat("plant", 100, 10), stat("night", 100, 30), stat("light", 100, 30)];
    assert.equal(spellingReport(words, 3).rows.length, 0);
    assert.equal(spellingReport(words, 2).rows.find((r) => r.id === "gh")?.words, 2);
  });

  it("says how many of the wrong learners got it wrong again", () => {
    const words = [stat("night", 100, 20, 5), stat("light", 100, 20, 15), stat("plant", 100, 10)];
    const row = spellingReport(words, 2).rows.find((r) => r.id === "gh");
    assert.equal(row!.repeatShare, 0.5);
  });

  it("has no ratio without plain words to compare with, and sorts the hardest first", () => {
    const none = spellingReport([stat("night", 100, 20), stat("light", 100, 20)], 2);
    assert.equal(none.rows[0]!.ratio, null);

    const words = [
      stat("plant", 1000, 100),
      stat("night", 1000, 300),
      stat("light", 1000, 300),
      stat("books", 1000, 150),
      stat("moons", 1000, 150),
    ];
    const rows = spellingReport(words, 2).rows;
    assert.deepEqual(
      rows.map((r) => r.id),
      ["gh", "double_vowel"],
    );
  });
});
