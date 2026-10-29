import assert from "node:assert/strict";
import test from "node:test";

import type { RuleSpec } from "@/lib/daily-rule/ladder";
import { ruleById } from "@/lib/daily-rule/levels";
import {
  MAX_AHEAD,
  NEW_RULE_WINDOW,
  RECALL_LIMIT,
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

/** A small ladder out of real rules, in the order given (the order of the syllabus is tested elsewhere). */
function ladder(...ids: string[]): RuleSpec[] {
  return ids.map((id, index) => ({ ...ruleById(id)!, order: index + 1 }));
}

/** he/she/it + -s, am/is/are, a/an/the, my/your, this/that, in/on/under, plural: seven rules, taught in this order. */
const LADDER = ladder("a1-04", "a1-01", "a1-02", "a1-03", "a1-06", "a1-08", "a1-10");

/** Three sentences that show he/she/it + -s and nothing that another rule of the ladder would claim first. */
const STORY_S_FORM: SourceSentence[] = [
  sentence("s1", "She works here."),
  sentence("s2", "It starts at nine."),
  sentence("s3", "He lives there."),
];

/** Three sentences that show a / an / the. */
const STORY_ARTICLE: SourceSentence[] = [
  sentence("a1", "It is an apple."),
  sentence("a2", "She has an orange."),
  sentence("a3", "He is an artist."),
];

/** Three sentences that show the plural, the last rule of the ladder. */
const STORY_PLURAL: SourceSentence[] = [
  sentence("n1", "Two cars are here."),
  sentence("n2", "I see three birds."),
  sentence("n3", "The boys have five books."),
];

const POOL_BE: SourceSentence[] = [
  sentence("p1", "I am happy."),
  sentence("p2", "They are here."),
  sentence("p3", "It is cold."),
];

function state(ruleId: string, strength: number, dueOn: string): RuleStateRow {
  return { ruleId, strength, dueOn };
}

function plan(partial: Partial<Parameters<typeof planRuleVisit>[0]>) {
  return planRuleVisit({
    today: TODAY,
    states: [],
    source: [],
    recallPool: [],
    seed: "u1",
    ladder: LADDER,
    ...partial,
  });
}

test("a rule the story shows is taught from that story: notice two sentences, type three", () => {
  const visit = plan({ source: STORY_S_FORM });
  assert.equal(visit.learn?.ruleId, "a1-04");
  assert.equal(visit.learn?.source, "story");
  assert.equal(visit.learn?.noticeFrom, "story");
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
    assert.ok(item.audioUrl, "a sentence of the story has its recording");
  }
});

test("when the story does not show the next rule, it is taught from its prepared sentences", () => {
  const visit = plan({ source: STORY_S_FORM.slice(0, 2) });
  assert.equal(visit.learn?.ruleId, "a1-04", "the next rule of the syllabus, whatever was read");
  assert.equal(visit.learn?.noticeFrom, "examples");
  assert.equal(visit.learn?.notice.length, 2);
  assert.equal(visit.learn?.items.length, 3);
  assert.equal(visit.pause, null);
  for (const item of [...visit.learn!.notice, ...visit.learn!.items]) {
    assert.match(item.sentenceId, /^prep:a1-04:\d$/);
    assert.equal(
      item.audioUrl,
      undefined,
      "a prepared sentence has no recording until one is stored",
    );
    assert.ok(item.before + item.answer + item.after === item.text);
  }
  const typed = visit.learn!.items.map((item) => item.sentenceId);
  assert.equal(new Set(typed).size, 3);
  assert.ok(visit.learn!.notice.every((item) => !typed.includes(item.sentenceId)));
});

test("with no text at all the course still goes on with the next rule", () => {
  const visit = plan({});
  assert.equal(visit.learn?.ruleId, "a1-04");
  assert.equal(visit.learn?.noticeFrom, "examples");
  assert.ok(!isEmptyVisit(visit));
});

test("one of the next three rules comes first when the story shows it", () => {
  assert.equal(NEW_RULE_WINDOW, 3);
  const visit = plan({ source: STORY_ARTICLE });
  assert.equal(visit.learn?.ruleId, "a1-02", "the third rule, because the story shows it");
  assert.equal(visit.learn?.noticeFrom, "story");
});

test("a rule beyond the next three is not taught early", () => {
  const visit = plan({ source: STORY_PLURAL });
  assert.equal(
    visit.learn?.ruleId,
    "a1-04",
    "the plural is the seventh rule: the next one comes first",
  );
  assert.equal(visit.learn?.noticeFrom, "examples");
});

test("the first rule that is not met cannot be passed over more than twice", () => {
  assert.equal(MAX_AHEAD, 2);
  // a1-01 and a1-02 are met, a1-04 is not: two rules already stand ahead of it.
  const states = [state("a1-01", 1, "2026-11-20"), state("a1-02", 1, "2026-11-20")];
  const visit = plan({ states, source: STORY_ARTICLE });
  assert.equal(
    visit.learn?.ruleId,
    "a1-04",
    "the story shows nothing of it, but it is the next rule",
  );
  // With one rule ahead, the story may still bring a later one first.
  const one = plan({ states: [state("a1-01", 1, "2026-11-20")], source: STORY_ARTICLE });
  assert.equal(one.learn?.ruleId, "a1-02");
});

test("a rule due for review is asked as a question from the learner's own finished texts, not from today's story", () => {
  const visit = plan({
    states: [state("a1-01", 1, "2026-10-27")],
    source: STORY_S_FORM,
    recallPool: POOL_BE,
  });
  assert.equal(visit.recall.length, 1);
  assert.equal(visit.recall[0]!.kind, "recall");
  assert.equal(visit.recall[0]!.ruleId, "a1-01");
  assert.ok(POOL_BE.some((s) => s.id === visit.recall[0]!.item.sentenceId));
  assert.equal(visit.learn?.ruleId, "a1-04", "the story's own rule is still taught");
});

test("a due rule the learner's texts do not show is asked from one of its prepared sentences", () => {
  const visit = plan({ states: [state("a1-01", 1, "2026-10-27")], recallPool: [] });
  assert.equal(visit.recall.length, 1);
  assert.match(visit.recall[0]!.item.sentenceId, /^prep:a1-01:\d$/);
  assert.equal(visit.recall[0]!.item.audioUrl, undefined);
});

test("a rule not due yet is not asked today", () => {
  const visit = plan({ states: [state("a1-01", 1, "2026-10-29")], recallPool: POOL_BE });
  assert.deepEqual(visit.recall, []);
});

test("five or more rules due: catch up first, no new rule today, at most four questions", () => {
  assert.equal(RECALL_LIMIT, 4);
  const states = [
    state("a1-01", 1, "2026-10-26"),
    state("a1-02", 1, "2026-10-27"),
    state("a1-03", 0, "2026-10-28"),
    state("a1-06", 0, "2026-10-28"),
    state("a1-08", 0, "2026-10-28"),
  ];
  const visit = plan({ states, source: STORY_S_FORM, recallPool: POOL_BE });
  assert.equal(visit.learn, null);
  assert.equal(visit.pause, "catch-up");
  assert.equal(visit.recall.length, 4, "at most four questions even when more are due");
  assert.equal(visit.recall[0]!.ruleId, "a1-01", "the oldest due rule comes first");
});

test("four rules due still leave room for the new rule", () => {
  const states = [
    state("a1-01", 1, "2026-10-26"),
    state("a1-02", 1, "2026-10-27"),
    state("a1-03", 0, "2026-10-28"),
    state("a1-06", 0, "2026-10-28"),
  ];
  const visit = plan({ states, source: STORY_S_FORM, recallPool: POOL_BE });
  assert.equal(visit.pause, null);
  assert.equal(visit.learn?.ruleId, "a1-04");
  assert.equal(visit.recall.length, 4);
});

test("a rule due for review in the story is taught as a review once every rule of the ladder is met", () => {
  const states = LADDER.map((rule) =>
    state(rule.id, 1, rule.id === "a1-04" ? TODAY : "2026-12-01"),
  );
  const visit = plan({ states, source: STORY_S_FORM });
  assert.equal(visit.learn?.ruleId, "a1-04");
  assert.equal(visit.learn?.source, "review");
  assert.equal(visit.learn?.noticeFrom, "story");
});

test("a learner who has met every rule, with nothing due, has an empty visit", () => {
  const states = LADDER.map((rule) => state(rule.id, 3, "2026-12-01"));
  const visit = plan({ states, source: STORY_S_FORM });
  assert.ok(isEmptyVisit(visit));
  assert.equal(visit.pause, "no-text");
});

test("rules of another level that the learner has met are still asked when due, and never taught", () => {
  const extra = ladder("a1-05");
  const visit = plan({
    extra,
    states: [state("a1-05", 1, "2026-10-27")],
    recallPool: [sentence("e1", "We live here.")],
  });
  assert.equal(visit.recall[0]?.ruleId, "a1-05");
  assert.equal(visit.learn?.ruleId, "a1-04");
  // The held count is the ladder's own.
  const held = plan({ extra, states: [state("a1-05", 4, "2026-12-01")] });
  assert.equal(held.held, 0);
});

test("once five rules are held, a held rule of the same family comes back as a contrast question", () => {
  const held = [
    state("a1-01", 3, "2026-11-10"),
    state("a1-02", 3, "2026-11-10"),
    state("a1-03", 3, "2026-11-10"),
    state("a1-06", 4, "2026-11-20"),
    state("a1-08", 3, "2026-11-10"),
  ];
  const visit = plan({
    states: held,
    source: STORY_S_FORM,
    recallPool: [sentence("p5", "The cat is under the table.")],
  });
  assert.equal(visit.held, 5);
  assert.equal(visit.learn?.ruleId, "a1-04");
  const mix = visit.recall.find((task) => task.kind === "interleave");
  assert.ok(mix, "an interleaved question is asked");
  assert.ok(["a1-01", "a1-02", "a1-03", "a1-06", "a1-08"].includes(mix!.ruleId));
});

test("a question never repeats a sentence of today's story when another sentence exists", () => {
  const visit = plan({
    states: [state("a1-01", 1, "2026-10-27")],
    source: [...STORY_S_FORM, sentence("p1", "I am happy.")],
    recallPool: [sentence("p1", "I am happy."), sentence("p9", "We are at home.")],
  });
  assert.equal(visit.recall[0]!.item.sentenceId, "p9");
});

test("the same learner on the same day gets the same questions; another day, possibly others", () => {
  const input = {
    states: [state("a1-01", 1, "2026-10-27")],
    recallPool: [] as SourceSentence[],
    seed: "user-7",
  };
  const first = plan(input).recall[0]!.item.sentenceId;
  const again = plan(input).recall[0]!.item.sentenceId;
  assert.equal(first, again);
  const days = new Set(
    ["2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"].map(
      (today) =>
        plan({ ...input, today, states: [state("a1-01", 1, "2026-10-20")] }).recall[0]!.item
          .sentenceId,
    ),
  );
  assert.ok(days.size > 1, "the six prepared sentences of the rule take turns");
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
    ladder: LADDER,
  });
  assert.equal(visit.learn?.ruleId, "a1-04");
  assert.equal(visit.learn?.source, "story");
  assert.equal(visit.learn?.noticeFrom, "story");
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
    ladder: LADDER,
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
    ladder: LADDER,
  });
  assert.ok(isEmptyVisit(visit));
});

test("a rule first seen today is repeated from its prepared sentences when its text no longer shows it", () => {
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
    ladder: LADDER,
  });
  assert.equal(visit.learn?.ruleId, "a1-04");
  assert.equal(visit.learn?.noticeFrom, "examples");
});
