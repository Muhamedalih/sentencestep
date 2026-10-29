import type { DailyQuest, TodayQuestInfo } from "@/lib/features/quests";

import { requiredQuests, sentenceQuest } from "./quests";

/**
 * The new Home page (permission `newHome`, see src/components/home-today): the pure decisions it
 * makes, apart from the screens. Nothing here reads anything.
 */

/**
 * Whether Home draws the Today-first page for this visit. It needs everything it is made of: a
 * signed-in learner (a guest keeps the current Home), Today's session (the page IS Today's tasks),
 * the permission itself, and the day's cards having been started (the first visit of a browser has no
 * time zone yet, so they were not — that one visit shows the current Home). `classic` is the owner's
 * way back to the current Home while the new one is open for them (`?classic=1`).
 */
export function showsNewHome(input: {
  signedIn: boolean;
  newHome: boolean;
  todaySession: boolean;
  hasEngagement: boolean;
  classic: boolean;
}): boolean {
  return (
    input.signedIn && input.newHome && input.todaySession && input.hasEngagement && !input.classic
  );
}

/** Today's quests split the way the page draws them: the three tasks in the box, the self-test on a card of its own. */
export function splitToday(quests: readonly DailyQuest[]): {
  tasks: DailyQuest[];
  test: DailyQuest | null;
} {
  return { tasks: requiredQuests(quests), test: sentenceQuest(quests) ?? null };
}

export type TestCardState = "hidden" | "locked" | "open";

/**
 * What the self-test card on the new Home shows. It is on the page from the first moment, so the
 * learner sees what finishing the day's tasks earns: locked (slightly blurred, with the line that says
 * so) until the three tasks are done, as long as the day can have a test at all; then the card itself,
 * if a test was dealt, else nothing. A test already finished stays as it is, whatever the tasks say.
 */
export function testCardState(input: {
  tasks: readonly DailyQuest[];
  test: DailyQuest | null;
  /** The day can have a test for this learner (see sentenceTestAvailable). */
  available: boolean;
}): TestCardState {
  if (input.test?.completed) return "open";
  if (!input.tasks.every((task) => task.completed)) {
    return input.available || input.test ? "locked" : "hidden";
  }
  return input.test ? "open" : "hidden";
}

/** Whether the quests are Today's (each tied to a passage, story or word round) and not the random mix a learner without Today gets. */
export function isTodayMode(quests: readonly DailyQuest[]): boolean {
  return quests.some((quest) => quest.today !== undefined);
}

export interface TodayTotals {
  done: number;
  total: number;
  /** What finishing the three tasks pays. */
  totalXp: number;
  /** What has really been paid today (a task finished before its row was dealt shows as done but pays nothing). */
  earnedXp: number;
}

/** The ring and the reward line of the tasks box: the three tasks only (the self-test is an extra). */
export function todayTotals(tasks: readonly DailyQuest[]): TodayTotals {
  return {
    done: tasks.filter((quest) => quest.completed).length,
    total: tasks.length,
    totalXp: tasks.reduce((sum, quest) => sum + quest.xp, 0),
    earnedXp: tasks.reduce(
      (sum, quest) => sum + (quest.completed && quest.today?.paid ? quest.xp : 0),
      0,
    ),
  };
}

/**
 * Where "Redo today's lessons" goes once the day is done: the passage or story finished today,
 * started again in order (`?today=1&redo=1`), else the words step. Null when there is nothing to redo.
 */
export function todayRedoHref(quests: readonly DailyQuest[]): string | null {
  const redo = quests.find((quest) => quest.today?.redoHref && quest.today.kind !== "words");
  if (redo?.today?.redoHref) return `${redo.today.redoHref}?today=1&redo=1`;
  return quests.find((quest) => quest.today?.kind === "words")?.today?.href ?? null;
}

/**
 * Where a task's repeat button goes: its own lesson again. Once the task is finished today that is the
 * lesson in redo mode (the link «Redo today's lessons» takes for it, see todayRedoHref); until then it is
 * the lesson the row opens. The words round is one page either way.
 */
export function todayTaskRepeatHref(info: TodayQuestInfo, done: boolean): string {
  if (done && info.redoHref && info.kind !== "words") return `${info.redoHref}?today=1&redo=1`;
  return info.href;
}
