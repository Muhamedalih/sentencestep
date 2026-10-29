import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { QuestType } from "@/lib/features/catalog";
import {
  eventsForAudience,
  passagePartQuestEvents,
  questEventsForLesson,
} from "@/lib/features/quests";
import type { DailyQuest, QuestEvent } from "@/lib/features/quests";

import {
  TODAY_QUEST_SLOT_BASE,
  TODAY_SENTENCE_SLOT,
  isOptionalQuest,
  questsByStep,
  requiredQuests,
  sentenceQuest,
  sentenceQuestRow,
  todayQuestRows,
  todayQuestSlot,
} from "./quests";

const settings = {
  sentences: { target: 15, xp: 10 },
  lessons: { target: 2, xp: 10 },
  accuracy: { target: 1, xp: 15 },
  masterWords: { target: 5, xp: 10 },
  dictation: { target: 5, xp: 15 },
  dailySession: { target: 1, xp: 15 },
  passages: { target: 3, xp: 15 },
  sentenceReview: { target: 3, xp: 10 },
} satisfies Record<QuestType, { target: number; xp: number }>;

describe("todayQuestRows", () => {
  it("deals passages, one lesson and master words in slots 10-12 with the tuned XP", () => {
    assert.deepEqual(todayQuestRows(settings, true), [
      { slot: 10, type: "passages", target: 1, xp: 15 },
      { slot: 11, type: "lessons", target: 1, xp: 10 },
      { slot: 12, type: "masterWords", target: 5, xp: 10 },
    ]);
  });

  it("with the honest ticks open, one passage and one story whatever the pool says; without them, the pool's targets", () => {
    const tuned = { ...settings, passages: { target: 5, xp: 15 }, lessons: { target: 4, xp: 10 } };
    assert.deepEqual(
      todayQuestRows(tuned, true).map((row) => row.target),
      [1, 1, 5],
    );
    assert.deepEqual(
      todayQuestRows(tuned, false).map((row) => row.target),
      [5, 1, 5],
    );
  });

  it("keeps the slots clear of the random mix (0-2)", () => {
    assert.ok(todayQuestSlot("listen") >= TODAY_QUEST_SLOT_BASE);
  });
});

function quest(slot: number, type: QuestType, progress = 0, completed = false): DailyQuest {
  return { slot, type, target: 3, progress, xp: 10, completed };
}

describe("questsByStep", () => {
  it("maps Today's rows to their steps and ignores the random ones", () => {
    const byStep = questsByStep([
      quest(0, "lessons", 1),
      quest(10, "passages", 2),
      quest(11, "lessons", 0),
      quest(12, "masterWords", 3, true),
    ]);
    assert.equal(byStep.listen?.progress, 2);
    assert.equal(byStep.story?.slot, 11);
    assert.equal(byStep.words?.completed, true);
  });

  it("does not map a row in a Today slot with the wrong type", () => {
    assert.deepEqual(questsByStep([quest(10, "sentences")]), {});
  });
});

const bank = {
  sentenceReview: { enabled: true, target: 3, xp: 10 },
} as Record<QuestType, { enabled: boolean; target: number; xp: number }>;

/** What the database does with one event: every row of its type advances, capped at its target. */
function advance(rows: readonly DailyQuest[], events: readonly QuestEvent[]): DailyQuest[] {
  return events.reduce<DailyQuest[]>(
    (state, event) =>
      state.map((row) => {
        if (row.type !== event.type) return row;
        const progress = Math.min(row.target, row.progress + event.amount);
        return { ...row, progress, completed: row.completed || progress >= row.target };
      }),
    [...rows],
  );
}

function todayRows(): DailyQuest[] {
  return todayQuestRows(settings, true).map((row) => ({ ...row, progress: 0, completed: false }));
}

describe("Today's three tasks count only their own activity", () => {
  it("for a learner with Today, a regular lesson, passage parts and flashcard words tick nothing", () => {
    const events: QuestEvent[] = [
      ...questEventsForLesson({ sentenceCount: 9, accuracy: 0.97 }),
      ...passagePartQuestEvents({ passageCompleted: false, honestTicks: true }),
      ...passagePartQuestEvents({ passageCompleted: false, honestTicks: true }),
      ...passagePartQuestEvents({ passageCompleted: false, honestTicks: true }),
      { type: "masterWords", amount: 5 },
    ];
    const rows = advance(todayRows(), eventsForAudience(events, true));
    assert.deepEqual(
      rows.map((row) => row.progress),
      [0, 0, 0],
    );
  });

  it("for a learner with Today, a finished story, a finished passage and the words round each tick their own task", () => {
    const events: QuestEvent[] = [
      ...questEventsForLesson({ sentenceCount: 9, accuracy: 0.5, story: true }),
      ...passagePartQuestEvents({ passageCompleted: true, honestTicks: true }),
      { type: "masterWords", amount: 5, audience: "today" },
    ];
    const rows = advance(todayRows(), eventsForAudience(events, true));
    assert.deepEqual(
      rows.map((row) => row.completed),
      [true, true, true],
    );
  });

  it("for a learner without Today, the random mix counts every lesson and part, and Today's events nothing", () => {
    const random: DailyQuest[] = [
      { slot: 0, type: "lessons", target: 2, progress: 0, xp: 10, completed: false },
      { slot: 1, type: "passages", target: 3, progress: 0, xp: 15, completed: false },
    ];
    const events: QuestEvent[] = [
      ...questEventsForLesson({ sentenceCount: 9, accuracy: 0.5, story: true }),
      ...passagePartQuestEvents({ passageCompleted: false, honestTicks: true }),
      ...passagePartQuestEvents({ passageCompleted: false, honestTicks: true }),
      ...passagePartQuestEvents({ passageCompleted: true, honestTicks: true }),
    ];
    const rows = advance(random, eventsForAudience(events, false));
    // The story counts once, as a lesson of the random mix; its Today copy is not counted again.
    assert.equal(rows[0]?.progress, 1);
    assert.equal(rows[0]?.completed, false);
    assert.equal(rows[1]?.completed, true);
  });
});

describe("passagePartQuestEvents", () => {
  it("every part counts toward the passages quest; the finish also counts for Today with the honest ticks open", () => {
    assert.deepEqual(passagePartQuestEvents({ passageCompleted: false, honestTicks: true }), [
      { type: "passages", amount: 1 },
    ]);
    assert.deepEqual(passagePartQuestEvents({ passageCompleted: true, honestTicks: false }), [
      { type: "passages", amount: 1 },
    ]);
    assert.deepEqual(passagePartQuestEvents({ passageCompleted: true, honestTicks: true }), [
      { type: "passages", amount: 1 },
      { type: "passages", amount: 1, audience: "today" },
    ]);
  });

  it("one passage event per part the database says is new; nothing new, nothing counted", () => {
    const two = passagePartQuestEvents({ parts: 2, passageCompleted: true, honestTicks: true });
    assert.deepEqual(two, [
      { type: "passages", amount: 1 },
      { type: "passages", amount: 1 },
      { type: "passages", amount: 1, audience: "today" },
    ]);
    const none = passagePartQuestEvents({ parts: 0, passageCompleted: false, honestTicks: true });
    assert.deepEqual(none, []);
  });
});

describe("the sentence review row", () => {
  it("is Today's optional fourth slot, right after the three steps", () => {
    assert.equal(TODAY_SENTENCE_SLOT, 13);
    assert.equal(TODAY_SENTENCE_SLOT, TODAY_QUEST_SLOT_BASE + 3);
  });

  it("asks for as many sentences as are ready, up to the tuned target, with the tuned XP", () => {
    assert.deepEqual(sentenceQuestRow(bank, 3), {
      slot: 13,
      type: "sentenceReview",
      target: 3,
      xp: 10,
    });
    assert.equal(sentenceQuestRow(bank, 2)?.target, 2);
    assert.equal(sentenceQuestRow(bank, 1)?.target, 1);
    assert.equal(sentenceQuestRow(bank, 9)?.target, 3);
    const tuned = { sentenceReview: { enabled: true, target: 5, xp: 20 } } as typeof bank;
    assert.deepEqual(sentenceQuestRow(tuned, 4), {
      slot: 13,
      type: "sentenceReview",
      target: 4,
      xp: 20,
    });
  });

  it("is never dealt when nothing is ready or the admin switched the type off", () => {
    assert.equal(sentenceQuestRow(bank, 0), null);
    assert.equal(sentenceQuestRow(bank, -1), null);
    const off = { sentenceReview: { enabled: false, target: 3, xp: 10 } } as typeof bank;
    assert.equal(sentenceQuestRow(off, 3), null);
  });

  it("is found in the day's rows only in its own slot with its own type, and is not one of the three steps", () => {
    const rows = [
      quest(10, "passages"),
      quest(11, "lessons"),
      quest(12, "masterWords"),
      quest(13, "sentenceReview", 1),
    ];
    assert.equal(sentenceQuest(rows)?.progress, 1);
    assert.equal(sentenceQuest(rows.slice(0, 3)), undefined);
    assert.equal(sentenceQuest([quest(13, "sentences")]), undefined);
    assert.equal(sentenceQuest([quest(12, "sentenceReview")]), undefined);
    // The three steps never pick it up.
    assert.deepEqual(Object.keys(questsByStep(rows)).sort(), ["listen", "story", "words"]);
  });

  it("is an extra: the day is done when the three steps are, whether or not the exam was taken", () => {
    const rows = [
      quest(10, "passages"),
      quest(11, "lessons"),
      quest(12, "masterWords"),
      quest(13, "sentenceReview"),
    ];
    assert.equal(isOptionalQuest(rows[3]!), true);
    assert.equal(isOptionalQuest(rows[0]!), false);
    assert.deepEqual(
      requiredQuests(rows).map((row) => row.slot),
      [10, 11, 12],
    );
    assert.deepEqual(requiredQuests([]), []);
  });
});
