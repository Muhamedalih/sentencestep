import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { QuestType } from "@/lib/features/catalog";
import type { DailyQuest, TodayQuestInfo } from "@/lib/features/quests";

import {
  isTodayMode,
  showsNewHome,
  splitToday,
  testCardState,
  todayRedoHref,
  todayTaskRepeatHref,
  todayTotals,
} from "./home-layout";
import { sentenceTestAvailable } from "./quests";

function info(
  kind: TodayQuestInfo["kind"],
  overrides: Partial<TodayQuestInfo> = {},
): TodayQuestInfo {
  return {
    kind,
    title: "",
    supportTitle: null,
    levelCode: null,
    minutes: 5,
    href: `/learn/${kind}`,
    redoHref: null,
    accuracy: null,
    paid: false,
    ...overrides,
  };
}

function quest(
  slot: number,
  type: QuestType,
  kind: TodayQuestInfo["kind"] | null,
  overrides: Partial<DailyQuest> = {},
  infoOverrides: Partial<TodayQuestInfo> = {},
): DailyQuest {
  return {
    slot,
    type,
    target: 1,
    progress: 0,
    xp: 10,
    completed: false,
    ...(kind ? { today: info(kind, infoOverrides) } : {}),
    ...overrides,
  };
}

const day = (overrides: { listen?: Partial<DailyQuest>; story?: Partial<DailyQuest> } = {}) => [
  quest(10, "passages", "listen", { xp: 15, ...overrides.listen }, { href: "/learn/passages/p1" }),
  quest(11, "lessons", "story", overrides.story ?? {}, { href: "/learn/stories/s1" }),
  quest(12, "masterWords", "words", {}, { href: "/learn/today/go?step=words" }),
  quest(13, "sentenceReview", "sentences"),
];

describe("showsNewHome", () => {
  const all = {
    signedIn: true,
    newHome: true,
    todaySession: true,
    hasEngagement: true,
    classic: false,
  };

  it("needs a signed-in learner, the permission, Today's session and the day's cards", () => {
    assert.equal(showsNewHome(all), true);
    assert.equal(showsNewHome({ ...all, signedIn: false }), false);
    assert.equal(showsNewHome({ ...all, newHome: false }), false);
    assert.equal(showsNewHome({ ...all, todaySession: false }), false);
    assert.equal(showsNewHome({ ...all, hasEngagement: false }), false);
  });

  it("?classic=1 is the way back to the current Home", () => {
    assert.equal(showsNewHome({ ...all, classic: true }), false);
  });
});

describe("splitToday", () => {
  it("puts the three tasks in the box and the self-test on its own card", () => {
    const { tasks, test } = splitToday(day());
    assert.deepEqual(
      tasks.map((entry) => entry.slot),
      [10, 11, 12],
    );
    assert.equal(test?.slot, 13);
  });

  it("has no card on a day without a test, and never mistakes a random quest for one", () => {
    const quests = day().slice(0, 3);
    assert.equal(splitToday(quests).test, null);
    assert.equal(splitToday([quest(1, "lessons", null)]).test, null);
  });
});

describe("isTodayMode", () => {
  it("is true only for quests tied to a passage, story or words", () => {
    assert.equal(isTodayMode(day()), true);
    assert.equal(isTodayMode([quest(1, "lessons", null), quest(2, "sentences", null)]), false);
    assert.equal(isTodayMode([]), false);
  });
});

describe("todayTotals", () => {
  it("counts the three tasks and what they pay, leaving the test out", () => {
    const { tasks } = splitToday(day());
    assert.deepEqual(todayTotals(tasks), { done: 0, total: 3, totalXp: 35, earnedXp: 0 });
  });

  it("counts a finished task as paid only when its XP was really paid", () => {
    const paid = quest(10, "passages", "listen", { xp: 15, completed: true }, { paid: true });
    const unpaid = quest(11, "lessons", "story", { completed: true }, { paid: false });
    const words = quest(12, "masterWords", "words");
    assert.deepEqual(todayTotals([paid, unpaid, words]), {
      done: 2,
      total: 3,
      totalXp: 35,
      earnedXp: 15,
    });
  });
});

describe("todayRedoHref", () => {
  it("restarts the passage or story finished today, in order", () => {
    const quests = [
      quest(10, "passages", "listen", { completed: true }, { redoHref: "/learn/passages/p1" }),
      quest(11, "lessons", "story", { completed: true }, { redoHref: "/learn/stories/s1" }),
      quest(
        12,
        "masterWords",
        "words",
        { completed: true },
        { href: "/learn/today/go?step=words" },
      ),
    ];
    assert.equal(todayRedoHref(quests), "/learn/passages/p1?today=1&redo=1");
  });

  it("falls back to the words step, and to nothing when there is nothing to redo", () => {
    assert.equal(
      todayRedoHref([
        quest(12, "masterWords", "words", {}, { href: "/learn/today/go?step=words" }),
      ]),
      "/learn/today/go?step=words",
    );
    assert.equal(todayRedoHref([]), null);
  });
});

describe("todayTaskRepeatHref", () => {
  it("opens a task finished today in redo mode, as the day's redo does", () => {
    const listen = info("listen", { redoHref: "/learn/passages/p1" });
    const story = info("story", { redoHref: "/learn/stories/s1" });
    assert.equal(todayTaskRepeatHref(listen, true), "/learn/passages/p1?today=1&redo=1");
    assert.equal(todayTaskRepeatHref(story, true), "/learn/stories/s1?today=1&redo=1");
  });

  it("opens an unfinished task's lesson as the row does, without redo", () => {
    const story = info("story", { href: "/learn/stories/s1?today=1" });
    assert.equal(todayTaskRepeatHref(story, false), "/learn/stories/s1?today=1");
  });

  it("opens the words round again, finished or not", () => {
    const words = info("words", { href: "/learn/today/words", redoHref: "/learn/today/words" });
    assert.equal(todayTaskRepeatHref(words, true), "/learn/today/words");
    assert.equal(todayTaskRepeatHref(words, false), "/learn/today/words");
  });

  it("falls back to the row's lesson when a finished task has no lesson to redo", () => {
    const listen = info("listen", { href: "/learn/passages/p2?today=1" });
    assert.equal(todayTaskRepeatHref(listen, true), "/learn/passages/p2?today=1");
  });
});

describe("testCardState", () => {
  const done = { completed: true, progress: 1 };
  const finished = day({ listen: done, story: done }).map((entry) =>
    entry.slot === 12 ? { ...entry, ...done } : entry,
  );

  it("is a locked card from the first moment, before any task is done, even when no test was dealt yet", () => {
    const { tasks } = splitToday(day().filter((entry) => entry.slot !== 13));
    assert.equal(testCardState({ tasks, test: null, available: true }), "locked");
  });

  it("stays locked while one task is left, even when a test row exists", () => {
    const quests = day({ listen: done, story: done });
    const { tasks, test } = splitToday(quests);
    assert.equal(testCardState({ tasks, test, available: true }), "locked");
  });

  it("opens once all three tasks are done and a test was dealt, and is nothing when none was", () => {
    const { tasks, test } = splitToday(finished);
    assert.equal(testCardState({ tasks, test, available: true }), "open");
    const without = splitToday(finished.filter((entry) => entry.slot !== 13));
    assert.equal(testCardState({ tasks: without.tasks, test: null, available: true }), "hidden");
  });

  it("is not drawn at all for a learner the test is not open to", () => {
    const { tasks } = splitToday(day().filter((entry) => entry.slot !== 13));
    assert.equal(testCardState({ tasks, test: null, available: false }), "hidden");
  });

  it("keeps a test that is already finished, whatever the tasks say", () => {
    const quests = day().map((entry) => (entry.slot === 13 ? { ...entry, ...done } : entry));
    const { tasks, test } = splitToday(quests);
    assert.equal(testCardState({ tasks, test, available: true }), "open");
  });
});

describe("sentenceTestAvailable", () => {
  const features = (sentenceBank: boolean, quests: boolean, type: boolean) => ({
    rollouts: { sentenceBank },
    quests: {
      enabled: quests,
      types: { sentenceReview: { enabled: type } } as Record<QuestType, { enabled: boolean }>,
    },
  });

  it("needs the sentence bank, quests and the test's own quest type all on", () => {
    assert.equal(sentenceTestAvailable(features(true, true, true)), true);
    assert.equal(sentenceTestAvailable(features(false, true, true)), false);
    assert.equal(sentenceTestAvailable(features(true, false, true)), false);
    assert.equal(sentenceTestAvailable(features(true, true, false)), false);
  });
});
