import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_ROUND_WORDS,
  WORDS_ROUND_SOURCES,
  createWordsRoundLedger,
  isWordsRoundSource,
  parseWordsRoundReport,
  summarizeWordsRound,
  wordsAskedInVisit,
} from "@/lib/words-round/round";
import { resumePoint } from "@/lib/word-mastery/schedule";

test("the sources are the four places a round can be asked", () => {
  assert.deepEqual([...WORDS_ROUND_SOURCES], ["list", "today", "review", "bank"]);
  assert.equal(isWordsRoundSource("list"), true);
  assert.equal(isWordsRoundSource("today"), true);
  assert.equal(isWordsRoundSource("review"), true);
  assert.equal(isWordsRoundSource("bank"), true);
  assert.equal(isWordsRoundSource("cards"), false);
  assert.equal(isWordsRoundSource("LIST"), false);
  assert.equal(isWordsRoundSource(undefined), false);
  assert.equal(isWordsRoundSource(3), false);
});

test("a round is tallied by how each word's first answer went", () => {
  assert.deepEqual(summarizeWordsRound([]), { count: 0, clean: 0, assisted: 0, missed: 0 });
  assert.deepEqual(summarizeWordsRound(["clean", "clean", "assisted", "missed", "clean"]), {
    count: 5,
    clean: 3,
    assisted: 1,
    missed: 1,
  });
});

test("only the first answer to a word counts; the second go after a miss is practice", () => {
  const ledger = createWordsRoundLedger();
  ledger.note("a", "missed");
  ledger.note("b", "clean");
  ledger.note("a", "clean"); // the word came back and landed: still a miss in the report
  ledger.note("c", "assisted");
  ledger.note("b", "missed"); // asked again for any reason: the first answer stands
  assert.deepEqual(ledger.tally(), { count: 3, clean: 1, assisted: 1, missed: 1 });
});

test("a new round starts from nothing", () => {
  const ledger = createWordsRoundLedger();
  ledger.note("a", "missed");
  ledger.reset();
  assert.deepEqual(ledger.tally(), { count: 0, clean: 0, assisted: 0, missed: 0 });
  ledger.note("a", "clean");
  assert.deepEqual(ledger.tally(), { count: 1, clean: 1, assisted: 0, missed: 0 });
});

test("a start report needs a known source and a count of at least one", () => {
  assert.deepEqual(parseWordsRoundReport({ event: "started", source: "list", count: 25 }), {
    event: "started",
    source: "list",
    count: 25,
  });
  assert.deepEqual(parseWordsRoundReport({ event: "started", source: "today", count: 5 }), {
    event: "started",
    source: "today",
    count: 5,
  });
  assert.equal(parseWordsRoundReport({ event: "started", source: "list", count: 0 }), null);
  assert.equal(parseWordsRoundReport({ event: "started", source: "cards", count: 5 }), null);
  assert.deepEqual(parseWordsRoundReport({ event: "started", source: "bank", count: 5 }), {
    event: "started",
    source: "bank",
    count: 5,
  });
  assert.equal(parseWordsRoundReport({ event: "started", count: 5 }), null);
  assert.equal(parseWordsRoundReport({ source: "list", count: 5 }), null);
  assert.equal(parseWordsRoundReport({ event: "paused", source: "list", count: 5 }), null);
});

test("a start report keeps the three known fields and nothing a browser adds", () => {
  const parsed = parseWordsRoundReport({
    event: "started",
    source: "review",
    count: 4,
    wordId: "family-1",
    word: "mother",
  });
  assert.deepEqual(parsed, { event: "started", source: "review", count: 4 });
});

test("a finish report's three outcomes must add up to its count", () => {
  const finished = {
    event: "finished",
    source: "list",
    count: 5,
    clean: 3,
    assisted: 1,
    missed: 1,
  };
  assert.deepEqual(parseWordsRoundReport(finished), finished);
  assert.equal(parseWordsRoundReport({ ...finished, missed: 2 }), null);
  assert.equal(parseWordsRoundReport({ ...finished, clean: 2 }), null);
  assert.equal(parseWordsRoundReport({ ...finished, assisted: undefined }), null);
  assert.equal(
    parseWordsRoundReport({ ...finished, count: 0, clean: 0, assisted: 0, missed: 0 }),
    null,
  );
});

test("numbers that are not whole counts in range are turned away", () => {
  const started = { event: "started", source: "list" };
  assert.equal(parseWordsRoundReport({ ...started, count: 2.5 }), null);
  assert.equal(parseWordsRoundReport({ ...started, count: -1 }), null);
  assert.equal(parseWordsRoundReport({ ...started, count: Number.NaN }), null);
  assert.equal(parseWordsRoundReport({ ...started, count: "5" }), null);
  assert.equal(parseWordsRoundReport({ ...started, count: MAX_ROUND_WORDS + 1 }), null);
  assert.notEqual(parseWordsRoundReport({ ...started, count: MAX_ROUND_WORDS }), null);
  const finished = {
    event: "finished",
    source: "today",
    count: 5,
    clean: 5,
    assisted: 0,
    missed: 0,
  };
  assert.notEqual(parseWordsRoundReport(finished), null);
  assert.equal(parseWordsRoundReport({ ...finished, clean: 6, missed: -1 }), null);
  assert.equal(parseWordsRoundReport({ ...finished, clean: 4.5, assisted: 0.5 }), null);
});

test("anything that is not an object is not a report", () => {
  assert.equal(parseWordsRoundReport(null), null);
  assert.equal(parseWordsRoundReport(undefined), null);
  assert.equal(parseWordsRoundReport("started"), null);
  assert.equal(parseWordsRoundReport(5), null);
  assert.equal(parseWordsRoundReport([]), null);
});

test("a fresh visit asks the whole group; Continue skips what it already finished", () => {
  assert.equal(wordsAskedInVisit(25, null, 5), 25);
  // 25 words in blocks of five, the first eight finished: the visit opens in block 2 (words 6-10)
  // with three of its words finished, so 25 - 5 - 3 = 17 are asked.
  const ids = Array.from({ length: 25 }, (_unused, index) => `w${index + 1}`);
  const finished = new Set(ids.slice(0, 8));
  const resume = resumePoint(ids, finished, 5);
  assert.equal(resume.blockIndex, 1);
  assert.equal(wordsAskedInVisit(25, resume, 5), 17);
  // Nothing finished, and everything finished: both open at the start and ask every word.
  assert.equal(wordsAskedInVisit(25, resumePoint(ids, new Set(), 5), 5), 25);
  assert.equal(wordsAskedInVisit(25, resumePoint(ids, new Set(ids), 5), 5), 25);
});
