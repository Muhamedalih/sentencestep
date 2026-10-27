import assert from "node:assert/strict";
import test from "node:test";

import { BANK_ROUND_SIZE, bankBand, selectBankRound, summarizeBank } from "@/lib/word-bank/select";
import type { BankWordState } from "@/lib/word-bank/select";

const TODAY = "2026-10-27";

function word(
  name: string,
  strength: number,
  dueOn: string,
  extra: Partial<BankWordState> = {},
): BankWordState {
  return {
    word: name,
    strength,
    dueOn,
    lastReviewedOn: "2026-10-20",
    source: "story",
    lessonId: "story-121",
    lessonTitle: "Dad Learns to Text",
    ar: "",
    homeSentence: null,
    firstSeenOn: "2026-10-20",
    ...extra,
  };
}

test("a round is five words, the size of Today's words step", () => {
  assert.equal(BANK_ROUND_SIZE, 5);
});

test("only the words due today or earlier are asked; a word met today is due tomorrow", () => {
  const round = selectBankRound(
    [
      word("aunt", 1, "2026-10-27"),
      word("cousin", 2, "2026-10-28"),
      word("niece", 0, "2026-10-26"),
    ],
    TODAY,
  );
  assert.deepEqual(
    round.words.map((entry) => entry.word),
    ["niece", "aunt"],
  );
  assert.equal(round.more, false);
});

test("the word that has waited longest comes first, then the weakest, then alphabetical", () => {
  const round = selectBankRound(
    [
      word("delta", 3, "2026-10-25"),
      word("bravo", 1, "2026-10-26"),
      word("alpha", 1, "2026-10-26"),
      word("charlie", 0, "2026-10-26"),
      word("echo", 0, "2026-10-20"),
    ],
    TODAY,
  );
  assert.deepEqual(
    round.words.map((entry) => entry.word),
    ["echo", "delta", "charlie", "alpha", "bravo"],
  );
});

test("a round is capped at five and says only whether more are waiting", () => {
  const states = Array.from({ length: 8 }, (_, index) => word(`word${index}`, 1, "2026-10-26"));
  const round = selectBankRound(states, TODAY);
  assert.equal(round.words.length, 5);
  assert.equal(round.more, true);
  assert.deepEqual(Object.keys(round).sort(), ["more", "words"]);
  const exactly = selectBankRound(states.slice(0, 5), TODAY);
  assert.equal(exactly.words.length, 5);
  assert.equal(exactly.more, false);
});

test("a different size, and nothing due, give the right rounds", () => {
  const states = [word("a1", 1, "2026-10-26"), word("b2", 1, "2026-10-26")];
  assert.equal(selectBankRound(states, TODAY, 1).words.length, 1);
  assert.equal(selectBankRound(states, TODAY, 1).more, true);
  assert.equal(selectBankRound(states, TODAY, 0).words.length, 0);
  assert.deepEqual(selectBankRound([], TODAY), { words: [], more: false });
  assert.deepEqual(selectBankRound([word("later", 4, "2026-11-10")], TODAY), {
    words: [],
    more: false,
  });
});

test("the same bank always gives the same round, whatever order it was read in", () => {
  const states = [word("zulu", 1, "2026-10-26"), word("alpha", 1, "2026-10-26")];
  const forward = selectBankRound(states, TODAY).words.map((entry) => entry.word);
  const backward = selectBankRound([...states].reverse(), TODAY).words.map((entry) => entry.word);
  assert.deepEqual(forward, backward);
  assert.deepEqual(forward, ["alpha", "zulu"]);
});

test("a word stands fresh at 0-1, consolidating at 2-3 and stable at 4-5", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(bankBand), [
    "fresh",
    "fresh",
    "consolidating",
    "consolidating",
    "stable",
    "stable",
  ]);
});

test("the bank reads as a whole: bands and the number due today", () => {
  const summary = summarizeBank(
    [
      word("a", 0, "2026-10-26"),
      word("b", 1, "2026-10-28"),
      word("c", 2, "2026-10-27"),
      word("d", 3, "2026-11-03"),
      word("e", 4, "2026-11-20"),
      word("f", 5, "2026-12-01"),
    ],
    TODAY,
  );
  assert.deepEqual(summary, { total: 6, stable: 2, consolidating: 2, fresh: 2, due: 2 });
  assert.deepEqual(summarizeBank([], TODAY), {
    total: 0,
    stable: 0,
    consolidating: 0,
    fresh: 0,
    due: 0,
  });
});
