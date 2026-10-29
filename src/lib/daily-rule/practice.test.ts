import assert from "node:assert/strict";
import test from "node:test";

import { ruleById } from "@/lib/daily-rule/levels";
import { isEmptyVisit, planPracticeVisit, type SourceSentence } from "@/lib/daily-rule/visit";

function sentence(id: string, text: string): SourceSentence {
  return { id, text, audioUrl: `https://clips.example/${id}.mp3`, voiceId: "voice-a" };
}

const RULE = ruleById("a1-04")!;

/** Ten sentences that show he / she / it + -s. */
const POOL: SourceSentence[] = [
  sentence("p1", "She works here."),
  sentence("p2", "It starts at nine."),
  sentence("p3", "He lives there."),
  sentence("p4", "She wants some tea."),
  sentence("p5", "He likes music."),
  sentence("p6", "It needs water."),
  sentence("p7", "She plays chess."),
  sentence("p8", "He reads books."),
  sentence("p9", "She cooks dinner."),
  sentence("p10", "It rains today."),
];

function ids(seed: string, pool: readonly SourceSentence[] = POOL): string[] {
  const visit = planPracticeVisit({ rule: RULE, pool, seed });
  return visit!.learn!.items.map((item) => item.sentenceId);
}

test("a practice is three typed sentences of the rule, with no card to read first", () => {
  const visit = planPracticeVisit({ rule: RULE, pool: POOL, seed: "u1|2026-10-29|a1-04" });
  assert.ok(visit);
  assert.equal(visit.learn?.ruleId, "a1-04");
  assert.equal(visit.learn?.source, "review");
  assert.equal(visit.learn?.noticeFrom, "story");
  assert.deepEqual(visit.learn?.notice, []);
  assert.equal(visit.learn?.items.length, 3);
  assert.deepEqual(visit.recall, []);
  assert.equal(isEmptyVisit(visit), false);
  for (const item of visit.learn!.items) {
    assert.equal(item.ruleId, "a1-04");
    assert.equal(item.before + item.answer + item.after, item.text);
    assert.match(item.audioUrl ?? "", /^https:\/\/clips\.example\//);
    assert.equal(item.voiceId, "voice-a", "the narrator travels with the sentence");
  }
});

test("the three sentences are three different sentences", () => {
  for (const seed of ["a", "b", "c", "d"]) {
    assert.equal(new Set(ids(seed)).size, 3, seed);
  }
});

test("the same learner, rule and day get the same three; other days can get others", () => {
  assert.deepEqual(ids("u1|2026-10-29|a1-04"), ids("u1|2026-10-29|a1-04"));
  const picks = new Set(
    ["d1", "d2", "d3", "d4", "d5", "d6"].map((day) => ids(`u1|${day}|a1-04`).join()),
  );
  assert.ok(picks.size > 1, "ten sentences give more than one possible three");
});

test("fewer than three sentences of the learner's texts that show the rule: three prepared sentences instead", () => {
  const others = [
    sentence("o1", "I am happy."),
    sentence("o2", "They are here."),
    sentence("o3", "It is cold."),
  ];
  for (const pool of [POOL.slice(0, 2), [], others]) {
    const visit = planPracticeVisit({ rule: RULE, pool, seed: "u1" });
    assert.ok(visit);
    assert.equal(visit.learn?.noticeFrom, "examples");
    assert.equal(visit.learn?.items.length, 3);
    assert.equal(new Set(visit.learn?.items.map((item) => item.sentenceId)).size, 3);
    for (const item of visit.learn!.items) {
      assert.match(item.sentenceId, /^prep:a1-04:\d$/);
      assert.equal(item.audioUrl, undefined);
      assert.equal(item.before + item.answer + item.after, item.text);
    }
  }
});

test("the prepared sentences of a practice take turns from day to day", () => {
  const picks = new Set(
    ["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8"].map((day) =>
      planPracticeVisit({ rule: RULE, pool: [], seed: `u1|${day}|a1-04` })!
        .learn!.items.map((item) => item.sentenceId)
        .join(),
    ),
  );
  assert.ok(picks.size > 1, "six sentences give more than one possible three");
});

test("a rule with no text that shows it and no prepared sentence is no practice", () => {
  const unwritten = { ...RULE, id: "zz-no-teaching" };
  assert.equal(planPracticeVisit({ rule: unwritten, pool: [], seed: "u1" }), null);
});

test("a sentence longer than the level allows is not asked", () => {
  const long = sentence(
    "long",
    "She works in a small office near the old station every day of the week.",
  );
  const pool = [...POOL.slice(0, 2), long];
  assert.equal(
    planPracticeVisit({ rule: RULE, pool, seed: "u1" })?.learn?.noticeFrom,
    "examples",
    "the long sentence does not count, so the texts hold only two",
  );
  const wide = planPracticeVisit({ rule: RULE, pool, seed: "u1", maxWords: 22 });
  assert.equal(wide?.learn?.noticeFrom, "story");
  assert.equal(wide?.learn?.items.length, 3);
});
