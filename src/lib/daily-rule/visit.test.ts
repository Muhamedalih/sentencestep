import assert from "node:assert/strict";
import test from "node:test";

import {
  isEmptyVisit,
  planRedoVisit,
  planRuleVisit,
  type RuleStateRow,
  type SourceSentence,
} from "@/lib/daily-rule/visit";

const TODAY = "2026-10-28";

function sentence(id: string, text: string): SourceSentence {
  return { id, text, audioUrl: `https://clips.example/${id}.mp3` };
}

/** Three sentences that show he/she/it + -s and nothing that another rule would claim first. */
const STORY_S_FORM: SourceSentence[] = [
  sentence("s1", "She works here."),
  sentence("s2", "It starts at nine."),
  sentence("s3", "He lives there."),
];

const POOL_BE: SourceSentence[] = [
  sentence("p1", "I am happy."),
  sentence("p2", "They are here."),
  sentence("p3", "It is cold."),
];

function state(ruleId: string, strength: number, dueOn: string): RuleStateRow {
  return { ruleId, strength, dueOn };
}

test("a rule the story shows is taught from that story: notice two sentences, type three", () => {
  const visit = planRuleVisit({
    today: TODAY,
    states: [],
    source: STORY_S_FORM,
    recallPool: [],
    seed: "u1",
  });
  assert.equal(visit.learn?.ruleId, "a1-04");
  assert.equal(visit.learn?.source, "story");
  assert.equal(visit.learn?.notice.length, 2);
  assert.equal(visit.learn?.items.length, 3);
  assert.equal(visit.recall.length, 0);
  assert.equal(visit.held, 0);
  assert.equal(visit.pause, null);
  for (const item of visit.learn!.items) {
    assert.equal(item.ruleId, "a1-04");
    assert.ok(
      item.before + item.answer + item.after === item.text,
      "the blank rebuilds the sentence",
    );
  }
});

test("with fewer than three sentences the rule is not taught from this story", () => {
  const visit = planRuleVisit({
    today: TODAY,
    states: [],
    source: STORY_S_FORM.slice(0, 2),
    recallPool: [],
    seed: "u1",
  });
  assert.equal(visit.learn, null);
  assert.equal(visit.pause, "no-text");
  assert.ok(isEmptyVisit(visit));
});

test("a rule due for review is asked as a question from the learner's own finished texts, not from today's story", () => {
  const visit = planRuleVisit({
    today: TODAY,
    states: [state("a1-01", 1, "2026-10-27")],
    source: STORY_S_FORM,
    recallPool: POOL_BE,
    seed: "u1",
  });
  assert.equal(visit.recall.length, 1);
  assert.equal(visit.recall[0]!.kind, "recall");
  assert.equal(visit.recall[0]!.ruleId, "a1-01");
  assert.ok(POOL_BE.some((s) => s.id === visit.recall[0]!.item.sentenceId));
  assert.equal(visit.learn?.ruleId, "a1-04", "the story's own rule is still taught");
});

test("a rule not due yet is not asked today", () => {
  const visit = planRuleVisit({
    today: TODAY,
    states: [state("a1-01", 1, "2026-10-29")],
    source: [],
    recallPool: POOL_BE,
    seed: "u1",
  });
  assert.deepEqual(visit.recall, []);
});

test("three or more rules due: catch up first, no new rule today", () => {
  const visit = planRuleVisit({
    today: TODAY,
    states: [
      state("a1-01", 1, "2026-10-26"),
      state("a1-02", 1, "2026-10-27"),
      state("a1-03", 0, "2026-10-28"),
    ],
    source: STORY_S_FORM,
    recallPool: [...POOL_BE, sentence("p4", "The cat is under the table.")],
    seed: "u1",
  });
  assert.equal(visit.learn, null);
  assert.equal(visit.pause, "catch-up");
  assert.equal(visit.recall.length, 2, "at most two questions even when more are due");
  assert.equal(visit.recall[0]!.ruleId, "a1-01", "the oldest due rule comes first");
});

test("a rule due for review in the story is taught as a review, after the new ones", () => {
  // a1-04 is already on the learner's ladder (strength 1, due today): the story shows it again.
  const visit = planRuleVisit({
    today: TODAY,
    states: [state("a1-04", 1, TODAY)],
    source: STORY_S_FORM,
    recallPool: [],
    seed: "u1",
  });
  assert.equal(visit.learn?.ruleId, "a1-04");
  assert.equal(visit.learn?.source, "review");
});

test("once five rules are held, a held rule of the same family comes back as a contrast question", () => {
  const held = [
    state("a1-02", 3, "2026-11-10"),
    state("a1-03", 3, "2026-11-10"),
    state("a1-06", 4, "2026-11-20"),
    state("a1-08", 3, "2026-11-10"),
    state("a1-10", 3, "2026-11-10"),
  ];
  const visit = planRuleVisit({
    today: TODAY,
    states: held,
    source: STORY_S_FORM,
    recallPool: [sentence("p5", "The cat is under the table.")],
    seed: "u1",
  });
  assert.equal(visit.held, 5);
  assert.equal(visit.learn?.ruleId, "a1-04");
  const mix = visit.recall.find((task) => task.kind === "interleave");
  assert.ok(mix, "an interleaved question is asked");
  assert.ok(["a1-02", "a1-03", "a1-06", "a1-08", "a1-10"].includes(mix!.ruleId));
});

test("a question never repeats a sentence of today's story when another sentence exists", () => {
  const visit = planRuleVisit({
    today: TODAY,
    states: [state("a1-01", 1, "2026-10-27")],
    source: [...STORY_S_FORM, sentence("p1", "I am happy.")],
    recallPool: [sentence("p1", "I am happy."), sentence("p9", "We are at home.")],
    seed: "u1",
  });
  assert.equal(visit.recall[0]!.item.sentenceId, "p9");
});

test("the same learner on the same day gets the same questions; another day, possibly others", () => {
  const input = {
    today: TODAY,
    states: [state("a1-01", 1, "2026-10-27")],
    source: [] as SourceSentence[],
    recallPool: [
      sentence("p1", "I am happy."),
      sentence("p2", "They are here."),
      sentence("p3", "It is cold."),
    ],
    seed: "user-7",
  };
  const first = planRuleVisit(input).recall[0]!.item.sentenceId;
  const again = planRuleVisit(input).recall[0]!.item.sentenceId;
  assert.equal(first, again);
});

test("a learner with nothing due and no text gets an empty visit", () => {
  const visit = planRuleVisit({ today: TODAY, states: [], source: [], recallPool: [], seed: "u1" });
  assert.ok(isEmptyVisit(visit));
  assert.equal(visit.pause, "no-text");
});

test("the repeat of today's session shows the card of the rule first seen today, from the text that shows it", () => {
  const states: RuleStateRow[] = [
    {
      ruleId: "a1-04",
      strength: 0,
      dueOn: "2026-10-29",
      lastReviewedOn: TODAY,
      firstSeenOn: TODAY,
    },
  ];
  const visit = planRedoVisit({
    today: TODAY,
    states,
    source: STORY_S_FORM,
    recallPool: [],
    seed: "u1",
  });
  assert.equal(visit.learn?.ruleId, "a1-04");
  assert.equal(visit.learn?.source, "story");
  assert.equal(visit.learn?.items.length, 3);
  assert.equal(visit.recall.length, 0);
  assert.equal(visit.pause, null);
});

test("the repeat asks again the rules reviewed today, and teaches nothing that was not new today", () => {
  const states: RuleStateRow[] = [
    {
      ruleId: "a1-01",
      strength: 2,
      dueOn: "2026-11-01",
      lastReviewedOn: TODAY,
      firstSeenOn: "2026-10-20",
    },
  ];
  const visit = planRedoVisit({
    today: TODAY,
    states,
    source: [],
    recallPool: POOL_BE,
    seed: "u1",
  });
  assert.equal(visit.learn, null);
  assert.deepEqual(
    visit.recall.map((task) => task.ruleId),
    ["a1-01"],
  );
});

test("nothing answered today means nothing to repeat", () => {
  const states: RuleStateRow[] = [
    {
      ruleId: "a1-01",
      strength: 2,
      dueOn: "2026-11-01",
      lastReviewedOn: "2026-10-27",
      firstSeenOn: "2026-10-20",
    },
  ];
  const visit = planRedoVisit({
    today: TODAY,
    states,
    source: STORY_S_FORM,
    recallPool: POOL_BE,
    seed: "u1",
  });
  assert.ok(isEmptyVisit(visit));
});

test("a rule first seen today is not repeated as a card when its text no longer shows it", () => {
  const states: RuleStateRow[] = [
    {
      ruleId: "a1-04",
      strength: 0,
      dueOn: "2026-10-29",
      lastReviewedOn: TODAY,
      firstSeenOn: TODAY,
    },
  ];
  const visit = planRedoVisit({
    today: TODAY,
    states,
    source: STORY_S_FORM.slice(0, 2),
    recallPool: [],
    seed: "u1",
  });
  assert.equal(visit.learn, null);
});
