import { buildTodayItems } from "@/lib/sentence-bank/items";
import type { ReviewScreenItem } from "@/lib/sentence-bank/items";
import { REVIEW_SPARES } from "@/lib/sentence-bank/review";
import { MIN_REVIEW_WORDS, reviewWordCount } from "@/lib/sentence-bank/select";
import type { SentenceCandidate } from "@/lib/sentence-bank/select";
import { stableHash } from "@/lib/sentence-bank/today-exam";
import { addDaysISO } from "@/lib/word-mastery/schedule";

/**
 * Sentence bank: the weekly check. Once the learner has finished three of the general stories (the
 * Stories section — the daily lessons are for writing, and one lesson alone is already twelve
 * sentences, which would make a single lesson a whole test), they are asked up to eight sentences of
 * those stories — the ones that hold each story's TARGET words (weekly-targets.ts), nothing padded
 * in when there are fewer — each one heard and typed whole from memory — exactly the day's test, with
 * its one help (the first letters) and its calm correction after every answer — and are told ONE
 * honest thing: how many they remembered. No level is claimed from it (a few sentences are a sample
 * of one week of writing, not a measure of English), no number is shown for a check that asked fewer than five, and
 * the result is shown for the week after the check and not longer. Until the three stories are
 * finished the check is shown locked, with how many are still missing. Pure — the loader reads the
 * learner's last check and their finished stories.
 */

/** Sentences a weekly check asks, at most. */
export const WEEKLY_CHECK_SIZE = 8;
/** General stories the learner finishes (within the last seven days, before today) to open the check. */
export const WEEKLY_STORIES_NEEDED = 3;
/** Fewer than this is not a check, and a check that asked fewer shows no number. */
export const WEEKLY_CHECK_MIN = 5;
/** At most this many from one story (three asked and one spare), so the eight are a spread over the stories. */
export const WEEKLY_MAX_PER_LESSON = 4;
/** Sentences read beyond the eight, so one that cannot be asked (no stored clip) is replaced instead of shortening the check. */
export const WEEKLY_CHECK_SPARES = REVIEW_SPARES;
/** A check is about the last seven days of writing, and comes at most once in seven days. */
export const WEEKLY_DAYS = 7;
/** About half a minute a sentence for eight, typed whole: what the card says it takes. */
export const WEEKLY_CHECK_MINUTES = 4;
/** Where the check lives. */
export const WEEKLY_CHECK_HREF = "/learn/today/check";

/** What the last weekly check found. */
export interface LastCheck {
  /** The learner-local day it was taken. */
  checkedOn: string;
  asked: number;
  remembered: number;
  /** Sentences the learner wrote in the week it was about. */
  written: number;
}

export type WeeklyLine =
  | { kind: "due"; size: number; minutes: number }
  | {
      /** Not enough finished yet: `have` of the `need` stories, and whether tomorrow is enough. */
      kind: "locked";
      have: number;
      need: number;
      tomorrow: boolean;
    }
  | {
      kind: "result";
      written: number;
      asked: number;
      remembered: number;
      /** remembered over asked, rounded. */
      percent: number;
    };

/** Whole days from `fromISO` to `toISO` ("YYYY-MM-DD"), negative when `toISO` is earlier. */
export function daysBetweenISO(fromISO: string, toISO: string): number {
  return Math.round(
    (Date.parse(`${toISO}T00:00:00Z`) - Date.parse(`${fromISO}T00:00:00Z`)) / 86_400_000,
  );
}

/**
 * The one card Today's box shows about the weekly check, or nothing:
 *  - a week or more after the last check (or with none yet) it is ready when the learner has finished
 *    three general stories on earlier days in the last week, and locked until they have;
 *  - locked, it says whether tomorrow will be enough (a story finished today is asked a day later);
 *  - for the seven days after a check it shows its result, when the check asked at least five;
 *  - otherwise nothing.
 * `stories` is how many stories count now and `storiesTomorrow` how many will count tomorrow (see
 * weeklyStoryCounts).
 */
export function weeklyLine(input: {
  last: LastCheck | null;
  todayISO: string;
  stories: number;
  storiesTomorrow: number;
}): WeeklyLine | null {
  const { last, todayISO } = input;
  const since = last ? daysBetweenISO(last.checkedOn, todayISO) : null;
  if (since === null || since >= WEEKLY_DAYS) {
    if (input.stories >= WEEKLY_STORIES_NEEDED) {
      return { kind: "due", size: WEEKLY_CHECK_SIZE, minutes: WEEKLY_CHECK_MINUTES };
    }
    return {
      kind: "locked",
      have: Math.min(Math.max(0, input.stories), WEEKLY_STORIES_NEEDED),
      need: WEEKLY_STORIES_NEEDED,
      tomorrow: input.storiesTomorrow >= WEEKLY_STORIES_NEEDED,
    };
  }
  if (last && since >= 0 && last.asked >= WEEKLY_CHECK_MIN) {
    return {
      kind: "result",
      written: last.written,
      asked: last.asked,
      remembered: last.remembered,
      percent: Math.round((last.remembered / last.asked) * 100),
    };
  }
  return null;
}

/**
 * How many stories open the check now, and how many will tomorrow (when today's story has become a
 * memory and the oldest day has left the week). `finished` is lesson id → the learner-local day they
 * first finished it, for the stories only.
 */
export function weeklyStoryCounts(
  finished: ReadonlyMap<string, string>,
  todayISO: string,
): { stories: number; storiesTomorrow: number } {
  const tomorrowISO = addDaysISO(todayISO, 1);
  const from = addDaysISO(todayISO, -WEEKLY_DAYS);
  const fromTomorrow = addDaysISO(tomorrowISO, -WEEKLY_DAYS);
  let stories = 0;
  let storiesTomorrow = 0;
  for (const day of finished.values()) {
    if (day >= from && day < todayISO) stories += 1;
    if (day >= fromTomorrow && day < tomorrowISO) storiesTomorrow += 1;
  }
  return { stories, storiesTomorrow };
}

export interface WeeklySelection<T extends SentenceCandidate> {
  /**
   * The sentences to ask, spread over the week's stories (newest first): the first WEEKLY_CHECK_SIZE
   * are the check, the (up to WEEKLY_CHECK_SPARES) after them stand in for one that cannot be asked.
   */
  items: T[];
  /** Every sentence of the stories finished in the week — what "you wrote N sentences" counts. */
  written: number;
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * The sentences of the weekly check: those of stories finished in the last seven days, before today
 * (what was typed an hour ago is not yet a memory), of MIN_REVIEW_WORDS words or more, one from each
 * story in turn (the newest story first), at most WEEKLY_MAX_PER_LESSON from one. Inside a story the
 * day decides which lines come first (the same stable hash the day's test uses), so the check is a
 * spread over each story and not always its opening lines. Whether they are on the learner's schedule
 * does not matter: the check asks what they wrote, not what is due. The caller hands in stories only.
 * Fewer than WEEKLY_CHECK_MIN askable sentences means there is no check.
 */
export function selectWeeklyCheck<T extends SentenceCandidate>(
  candidates: readonly T[],
  todayISO: string,
  /** When given, only these sentences may be asked (the target-word ones, see weekly-targets.ts); `written` still counts them all. */
  only?: ReadonlySet<string>,
): WeeklySelection<T> {
  const from = addDaysISO(todayISO, -WEEKLY_DAYS);
  const week: T[] = [];
  const seen = new Set<string>();
  for (const sentence of candidates) {
    if (seen.has(sentence.id)) continue;
    seen.add(sentence.id);
    if (sentence.completedOn >= from && sentence.completedOn < todayISO) week.push(sentence);
  }

  const lessons = new Map<string, T[]>();
  for (const sentence of week) {
    if (reviewWordCount(sentence.en) < MIN_REVIEW_WORDS) continue;
    if (only && !only.has(sentence.id)) continue;
    const list = lessons.get(sentence.lessonId);
    if (list) list.push(sentence);
    else lessons.set(sentence.lessonId, [sentence]);
  }
  const ordered = [...lessons.entries()]
    .map(([lessonId, list]) => ({
      lessonId,
      completedOn: list.reduce(
        (latest, sentence) => (sentence.completedOn > latest ? sentence.completedOn : latest),
        "",
      ),
      list: [...list].sort(
        (a, b) =>
          stableHash(`${todayISO}|${a.id}`) - stableHash(`${todayISO}|${b.id}`) ||
          a.orderIndex - b.orderIndex ||
          compareText(a.id, b.id),
      ),
    }))
    .sort(
      (a, b) => compareText(b.completedOn, a.completedOn) || compareText(a.lessonId, b.lessonId),
    );

  const limit = WEEKLY_CHECK_SIZE + WEEKLY_CHECK_SPARES;
  const items: T[] = [];
  for (let round = 0; round < WEEKLY_MAX_PER_LESSON && items.length < limit; round++) {
    for (const { list } of ordered) {
      const sentence = list[round];
      if (sentence && items.length < limit) items.push(sentence);
    }
  }
  return { items, written: week.length };
}

/**
 * The check's sentences as the review screen draws them: built by the very function that builds the
 * day's test, so every one is heard and typed whole, with its meaning in the learner's language shown
 * after the answer when it has one. A sentence with no stored clip is left out (the exam never reads
 * a sentence in the browser's voice and never makes a clip), in the order they were selected.
 */
export function buildCheckItems(
  selected: readonly SentenceCandidate[],
  prompts: ReadonlyMap<string, string>,
  clips: ReadonlyMap<string, string>,
): ReviewScreenItem[] {
  return buildTodayItems({
    lines: selected.map((sentence) => ({
      id: sentence.id,
      lessonId: sentence.lessonId,
      source: "story" as const,
      orderIndex: sentence.orderIndex,
      en: sentence.en,
    })),
    prompts,
    clips,
  });
}

/** The honest figures a finished check adds up to: right with no help, out of what was asked. */
export function checkFigures(results: readonly { outcome: "clean" | "assisted" | "missed" }[]): {
  asked: number;
  remembered: number;
} {
  return {
    asked: results.length,
    remembered: results.filter((result) => result.outcome === "clean").length,
  };
}
