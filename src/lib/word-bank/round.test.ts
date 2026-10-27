import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BANK_CANDIDATE_POOL,
  OTHER_SENTENCE_WORDS,
  bankOutcome,
  blankWord,
  buildBankRoundWord,
  countKey,
  firstMet,
  firstTimeKey,
  isAskable,
  pickOtherSentence,
  pickTranslation,
  sameSentence,
  summarizeBankRound,
} from "@/lib/word-bank/round";
import type { BankRoundResult } from "@/lib/word-bank/round";
import type { BankWordState } from "@/lib/word-bank/select";
import { BLANK_TOKEN } from "@/types/word-lists";

function state(overrides: Partial<BankWordState> = {}): BankWordState {
  return {
    word: "aunt",
    strength: 0,
    dueOn: "2026-10-27",
    lastReviewedOn: "2026-10-24",
    source: "story",
    lessonId: "story-1",
    lessonTitle: "Dad Learns to Text",
    ar: "العمة أو الخالة\nأخت والدك أو والدتك.",
    homeSentence: "My aunt called me three times before breakfast.",
    firstSeenOn: "2026-10-24",
    ...overrides,
  };
}

describe("blankWord", () => {
  it("leaves the word out of the sentence, whatever its capitals", () => {
    assert.equal(
      blankWord("My aunt gives me cookies when I visit her", "aunt"),
      `My ${BLANK_TOKEN} gives me cookies when I visit her`,
    );
    assert.equal(blankWord("Aunt Sara called.", "aunt"), `${BLANK_TOKEN} Sara called.`);
    assert.equal(blankWord("I miss my aunt.", "aunt"), `I miss my ${BLANK_TOKEN}.`);
  });

  it("only blanks the word as a whole word", () => {
    assert.equal(blankWord("Leaving my apartment felt daunting.", "aunt"), null);
    assert.equal(blankWord("My aunts are kind.", "aunt"), null);
    assert.equal(blankWord("My aunt's house is big.", "aunt"), null);
  });

  it("gives up on a sentence that holds the word twice, since the second would be the answer", () => {
    assert.equal(blankWord("The aunt told the aunt.", "aunt"), null);
  });

  it("is null when the sentence does not hold the word", () => {
    assert.equal(blankWord("We went to the market.", "aunt"), null);
  });
});

describe("pickOtherSentence", () => {
  const catalog = [
    "We visited my aunt in Basra last summer.",
    "My aunt called me three times before breakfast.",
    "Aunt.",
    "The aunt told the aunt a long and quiet story today.",
    "Leaving my apartment felt daunting for the whole family.",
    "She is the aunt of the girl who lives next door to us all.",
    "We went to the market.",
  ];

  it("never picks the home sentence, one with the word twice, a too short or too long one", () => {
    const pick = pickOtherSentence("aunt", catalog, {
      exclude: ["My aunt called me three times before breakfast."],
      seed: "aunt:2026-10-27",
    });
    assert.ok(
      pick === "We visited my aunt in Basra last summer." ||
        pick === "She is the aunt of the girl who lives next door to us all.",
      String(pick),
    );
  });

  it("compares the home sentence without regard to capitals or spacing", () => {
    const pick = pickOtherSentence("aunt", ["We visited my aunt in Basra last summer."], {
      exclude: ["we  visited my AUNT in basra last summer."],
      seed: "x",
    });
    assert.equal(pick, null);
  });

  it("is the same sentence every time for the same word and day, and can differ between days", () => {
    const first = pickOtherSentence("aunt", catalog, { seed: "aunt:2026-10-27" });
    assert.equal(pickOtherSentence("aunt", catalog, { seed: "aunt:2026-10-27" }), first);
    const picks = new Set(
      Array.from({ length: 30 }, (_unused, day) =>
        pickOtherSentence("aunt", catalog, { seed: `aunt:2026-11-${day}` }),
      ),
    );
    assert.ok(picks.size > 1);
  });

  it("is null when the catalog has no usable sentence for the word", () => {
    assert.equal(pickOtherSentence("aunt", ["We went to the market."], { seed: "s" }), null);
    assert.equal(pickOtherSentence("aunt", [], { seed: "s" }), null);
  });

  it("keeps sentences inside the readable length", () => {
    assert.ok(OTHER_SENTENCE_WORDS.min < OTHER_SENTENCE_WORDS.max);
    const tooLong = `My aunt ${"and a very long story ".repeat(5)}ends here.`;
    assert.equal(pickOtherSentence("aunt", [tooLong], { seed: "s" }), null);
  });
});

describe("buildBankRoundWord", () => {
  const none = { otherSentence: null, clip: null };
  const other = "We visited my aunt in Basra last summer.";

  it("asks a new or just-missed word by its meaning, in its home sentence", () => {
    const word = buildBankRoundWord(state({ strength: 0 }), {
      ...none,
      clip: "https://c/aunt.mp3",
    });
    assert.equal(word.form, "meaning");
    assert.equal(word.prompt, `My ${BLANK_TOKEN} called me three times before breakfast.`);
    assert.equal(word.audioUrl, "https://c/aunt.mp3");
    assert.equal(word.homeSentence, "My aunt called me three times before breakfast.");
  });

  it("falls back to the lone blank when the home sentence is missing or cannot be blanked", () => {
    assert.equal(buildBankRoundWord(state({ homeSentence: null }), none).prompt, BLANK_TOKEN);
    assert.equal(
      buildBankRoundWord(state({ homeSentence: "She has no relatives." }), none).prompt,
      BLANK_TOKEN,
    );
  });

  it("asks a word of strength 2-3 in another sentence when one exists, else by its meaning", () => {
    const context = buildBankRoundWord(state({ strength: 2 }), {
      otherSentence: other,
      clip: null,
    });
    assert.equal(context.form, "context");
    assert.equal(context.prompt, `We visited my ${BLANK_TOKEN} in Basra last summer.`);
    assert.equal(buildBankRoundWord(state({ strength: 3 }), none).form, "meaning");
  });

  it("asks a word of strength 4-5 by its sound, stepping down without a clip", () => {
    const audio = buildBankRoundWord(state({ strength: 4 }), { otherSentence: other, clip: "u" });
    assert.equal(audio.form, "audio");
    assert.equal(audio.prompt, BLANK_TOKEN);
    assert.equal(audio.audioUrl, "u");
    assert.equal(
      buildBankRoundWord(state({ strength: 5 }), { otherSentence: other, clip: null }).form,
      "context",
    );
    assert.equal(buildBankRoundWord(state({ strength: 5 }), none).form, "meaning");
  });
});

describe("isAskable", () => {
  it("rejects a meaning question with nothing on the screen", () => {
    const bare = buildBankRoundWord(state({ ar: "", homeSentence: null }), {
      otherSentence: null,
      clip: null,
    });
    assert.equal(isAskable(bare), false);
  });

  it("accepts a meaning question with a meaning or a sentence, and every other form", () => {
    const withMeaning = buildBankRoundWord(state({ homeSentence: null }), {
      otherSentence: null,
      clip: null,
    });
    assert.equal(isAskable(withMeaning), true);
    const withSentence = buildBankRoundWord(state({ ar: "" }), { otherSentence: null, clip: null });
    assert.equal(isAskable(withSentence), true);
    const audio = buildBankRoundWord(state({ ar: "", homeSentence: null, strength: 4 }), {
      otherSentence: null,
      clip: "u",
    });
    assert.equal(isAskable(audio), true);
  });

  it("looks at far more words than a round holds", () => {
    assert.ok(BANK_CANDIDATE_POOL >= 10);
  });
});

describe("bankOutcome", () => {
  it("reports wrong as missed, right with the help as assisted, right alone as clean", () => {
    assert.equal(bankOutcome({ correct: false, helped: false }), "missed");
    assert.equal(bankOutcome({ correct: false, helped: true }), "missed");
    assert.equal(bankOutcome({ correct: true, helped: true }), "assisted");
    assert.equal(bankOutcome({ correct: true, helped: false }), "clean");
  });
});

describe("summarizeBankRound", () => {
  const result = (
    word: string,
    outcome: BankRoundResult["outcome"],
    strength: number | null,
    advanced: boolean,
  ): BankRoundResult => ({ word, outcome, strength, advanced });

  it("counts how each first answer went and the words carried up to stable", () => {
    const summary = summarizeBankRound([
      result("aunt", "clean", 4, true),
      result("borrow", "clean", 2, true),
      result("quiet", "assisted", 3, false),
      result("tidy", "missed", 0, false),
      result("fence", "clean", 5, true),
    ]);
    assert.deepEqual(summary, { asked: 5, clean: 3, assisted: 1, missed: 1, stabilized: 2 });
  });

  it("does not count a word that was already stable, or one the bank never answered", () => {
    const summary = summarizeBankRound([
      result("aunt", "clean", 5, false),
      result("borrow", "clean", null, false),
    ]);
    assert.equal(summary.stabilized, 0);
    assert.equal(summarizeBankRound([]).asked, 0);
  });
});

describe("sameSentence and pickTranslation", () => {
  it("compares sentences without regard to capitals or spacing", () => {
    assert.equal(sameSentence("My aunt  called.", "my AUNT called."), true);
    assert.equal(sameSentence("My aunt called.", "My uncle called."), false);
  });

  it("gives Arabic readers the Arabic line and Spanish and Turkish readers their own language", () => {
    const line = { en: "My aunt called.", ar: "اتصلت بي عمتي.", supportText: "Mi tía llamó." };
    assert.equal(pickTranslation(line, "ar"), "اتصلت بي عمتي.");
    assert.equal(pickTranslation(line, null), "اتصلت بي عمتي.");
    assert.equal(pickTranslation(line, "es"), "Mi tía llamó.");
  });

  it("shows nothing rather than the English line itself when a language has no translation yet", () => {
    const fallback = {
      en: "My aunt called.",
      ar: "اتصلت بي عمتي.",
      supportText: "My aunt called.",
    };
    assert.equal(pickTranslation(fallback, "tr"), null);
    assert.equal(pickTranslation({ en: "My aunt called.", ar: "اتصلت بي عمتي." }, "es"), null);
    assert.equal(pickTranslation({ en: "My aunt called.", ar: "  " }, "ar"), null);
  });
});

describe("wording keys", () => {
  it("picks one, two or many for a count of words", () => {
    assert.deepEqual([1, 2, 3, 5].map(countKey), ["one", "two", "many", "many"]);
  });

  it("says nothing discouraging when no word was right the first time", () => {
    const base = { asked: 5, clean: 0, assisted: 2, missed: 3, stabilized: 0 };
    assert.equal(firstTimeKey(base), "none");
    assert.equal(firstTimeKey({ ...base, clean: 4, assisted: 0, missed: 1 }), "some");
    assert.equal(firstTimeKey({ ...base, clean: 5, assisted: 0, missed: 0 }), "all");
    assert.equal(
      firstTimeKey({ asked: 0, clean: 0, assisted: 0, missed: 0, stabilized: 0 }),
      "none",
    );
  });
});

describe("firstMet", () => {
  it("names today, yesterday, a weekday within the week, or the date", () => {
    assert.deepEqual(firstMet("2026-10-27", "2026-10-27"), { kind: "today" });
    assert.deepEqual(firstMet("2026-10-26", "2026-10-27"), { kind: "yesterday" });
    // 2026-10-24 is a Saturday.
    assert.deepEqual(firstMet("2026-10-24", "2026-10-27"), { kind: "weekday", weekday: 6 });
    assert.deepEqual(firstMet("2026-10-21", "2026-10-27"), { kind: "weekday", weekday: 3 });
    assert.deepEqual(firstMet("2026-10-20", "2026-10-27"), { kind: "date" });
    assert.deepEqual(firstMet("2026-09-27", "2026-10-27"), { kind: "date" });
  });

  it("treats a date it cannot read, or one in the future, as today", () => {
    assert.deepEqual(firstMet("garbage", "2026-10-27"), { kind: "today" });
    assert.deepEqual(firstMet("2026-10-28", "2026-10-27"), { kind: "today" });
  });
});
