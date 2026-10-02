/**
 * Spaced repetition for Word Lists words ("Smart word practice").
 *
 * Every word a learner practices gets a STRENGTH from 0 to 5 and a due date.
 * A clean answer when the word is due moves it up one step and pushes the next
 * review out along 1 / 3 / 7 / 16 / 30 days; a miss sends it straight back to 0
 * and due tomorrow. Pure and dependency-free (dates are "YYYY-MM-DD" strings in
 * the learner's own calendar), so the exact same rules run in the unit tests,
 * on the server and — mirrored statement for statement — in the
 * `record_word_review` SQL function (see 20250323000000_word_mastery.sql). The
 * two are kept in step by word-mastery/schedule.test.ts and by that function's
 * own doc comment, since SQL and TypeScript cannot share one literal.
 *
 * Deliberately the same family as the app's other schedules (mistakes and
 * Vocabulary Recall use 1/3/7/16): short, hand-picked, roughly doubling — and
 * a miss resets rather than nudges, so a word that is still shaky keeps coming
 * back instead of drifting toward "mastered" on a technicality.
 */

/** How a word went in one practice visit. */
export const WORD_OUTCOMES = ["clean", "assisted", "missed"] as const;
export type WordOutcome = (typeof WORD_OUTCOMES)[number];

export function isWordOutcome(value: unknown): value is WordOutcome {
  return typeof value === "string" && (WORD_OUTCOMES as readonly string[]).includes(value);
}

/** The top of the scale: a word at 5 has passed the 30-day review and is "mastered". */
export const MAX_STRENGTH = 5;

/** Days until a word is next due once it has REACHED strength 1..5 (index 0 is strength 1). */
export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 16, 30] as const;

/** Strength 4 and above (the 16-day step and beyond) counts as "strong" in the library. */
export const STRONG_STRENGTH = 4;

/** One continue / review visit never asks for more than this many words — bite-sized on purpose. */
export const SESSION_MAX_WORDS = 20;

/** How many due words one "Review" visit takes at a time. */
export const REVIEW_SESSION_WORDS = 12;

export interface MasteryState {
  /** 0 (new, or sent back by a miss) to MAX_STRENGTH. */
  strength: number;
  /** The learner-local date this word is next due on, "YYYY-MM-DD". */
  dueOn: string;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isISODate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day)
  );
}

/** `iso` plus `days` calendar days, as "YYYY-MM-DD". Pure date arithmetic in UTC, so a daylight-saving change can never shift it. */
export function addDaysISO(iso: string, days: number): string {
  const match = ISO_DATE.exec(iso);
  if (!match) throw new Error(`Not a YYYY-MM-DD date: ${iso}`);
  const [, year, month, day] = match;
  const moved = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day) + days));
  const y = String(moved.getUTCFullYear()).padStart(4, "0");
  const m = String(moved.getUTCMonth() + 1).padStart(2, "0");
  const d = String(moved.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Days until the next review for a word standing at `strength`. Strength 0 (new, or just missed) comes back tomorrow, like strength 1. */
export function intervalDays(strength: number): number {
  const clamped = Math.min(MAX_STRENGTH, Math.max(0, Math.trunc(strength)));
  return clamped === 0 ? REVIEW_INTERVAL_DAYS[0] : REVIEW_INTERVAL_DAYS[clamped - 1]!;
}

/** A word with no record is new, which counts as due: it is the learner's turn to meet it. */
export function isDue(state: MasteryState | null | undefined, todayISO: string): boolean {
  return !state || state.dueOn <= todayISO;
}

export interface OutcomeResult {
  state: MasteryState;
  /** True when the word moved UP a step — the moment worth crediting (a quest, a badge). */
  advanced: boolean;
  /** False when the visit was an early review: the schedule was left exactly as it was. */
  scheduled: boolean;
}

/**
 * What one practice visit does to a word.
 *
 *  - missed: back to strength 0, due tomorrow. Bad news is always recorded,
 *    even for a word that was not due yet.
 *  - clean (first try, no help): one step up, due after that step's interval.
 *  - assisted (a hint, but no miss): holds its strength and comes back after
 *    the same interval — it was not recalled cleanly, so it does not climb.
 *
 * A clean or assisted visit to a word that is NOT due yet (practicing the whole
 * group again the same day) changes nothing: otherwise repeating a group five
 * times would walk every word to "mastered" in a single afternoon.
 */
export function applyOutcome(
  previous: MasteryState | null | undefined,
  outcome: WordOutcome,
  todayISO: string,
): OutcomeResult {
  const before = previous?.strength ?? 0;

  if (outcome === "missed") {
    return {
      state: { strength: 0, dueOn: addDaysISO(todayISO, 1) },
      advanced: false,
      scheduled: true,
    };
  }

  if (previous && !isDue(previous, todayISO)) {
    return { state: { ...previous }, advanced: false, scheduled: false };
  }

  const strength = outcome === "clean" ? Math.min(before + 1, MAX_STRENGTH) : before;
  return {
    state: { strength, dueOn: addDaysISO(todayISO, intervalDays(strength)) },
    advanced: strength > before,
    scheduled: true,
  };
}

/** What a learner has done with a word this visit, as the practice screen tracks it. */
export interface WordAttempt {
  /** At least one wrong answer (or "I don't know") on this word, or enough hints to count as one (see HINTS_BEFORE_MISS). */
  missed: boolean;
  /** How many hints were taken. */
  hints: number;
}

/**
 * Each hint costs a star, and the second one is where help stops being a nudge:
 * needing two letters means the word was not recalled, so from then on it counts
 * as a miss — one star, back to strength 0 — even when it is finally typed right.
 * A single hint only holds the word where it is.
 */
export const HINTS_BEFORE_MISS = 2;

/** The word counts as missed: a wrong answer, "I don't know", or too many hints. */
export function countsAsMissed(attempt: WordAttempt): boolean {
  return attempt.missed || attempt.hints >= HINTS_BEFORE_MISS;
}

export function outcomeFor(attempt: WordAttempt): WordOutcome {
  if (countsAsMissed(attempt)) return "missed";
  return attempt.hints > 0 ? "assisted" : "clean";
}

/**
 * The 1–3 stars a word is worth right now, simple enough to show live: three
 * for a clean answer, two once a hint has been taken, one after a miss (or a
 * second hint). The same three steps decide what happens to the schedule (up,
 * hold, back), so the stars the learner sees are the stakes they are playing for.
 */
export function wordStars(attempt: WordAttempt): 1 | 2 | 3 {
  if (countsAsMissed(attempt)) return 1;
  return attempt.hints > 0 ? 2 : 3;
}

/**
 * Takes one more hint. `lapsed` is true for the hint that tips the word into
 * counting as a miss, so the screen reports that miss to the schedule exactly
 * once, at the moment it happens (like a wrong answer).
 */
export function withHint(attempt: WordAttempt): { attempt: WordAttempt; lapsed: boolean } {
  const next: WordAttempt = { missed: attempt.missed, hints: attempt.hints + 1 };
  const lapsed = !countsAsMissed(attempt) && countsAsMissed(next);
  return { attempt: lapsed ? { ...next, missed: true } : next, lapsed };
}

export type WordStatus = "new" | "due" | "scheduled";

export function classifyWord(state: MasteryState | null | undefined, todayISO: string): WordStatus {
  if (!state) return "new";
  return state.dueOn <= todayISO ? "due" : "scheduled";
}

export interface ContinuePick<T> {
  /** The words to practice now: due ones first (weakest first), then new ones in the group's own order. */
  words: T[];
  newCount: number;
  dueCount: number;
  /** Words already scheduled for a later day — left out of a Continue visit. */
  scheduledCount: number;
}

/**
 * "Continue": instead of starting at word 1 every time, pick up where the
 * learner left off — the words that are due for a review (weakest first, so the
 * shaky ones are asked while attention is fresh) followed by the words they have
 * not met yet, in the order the group teaches them. Words scheduled for a later
 * day are skipped; they are not ready to be asked again. Capped so one visit
 * stays short.
 */
export function selectContinueWords<T extends { id: string }>(
  words: readonly T[],
  states: ReadonlyMap<string, MasteryState>,
  todayISO: string,
  max: number = SESSION_MAX_WORDS,
): ContinuePick<T> {
  const due: { word: T; index: number; state: MasteryState }[] = [];
  const fresh: T[] = [];
  let scheduledCount = 0;

  words.forEach((word, index) => {
    const state = states.get(word.id);
    switch (classifyWord(state, todayISO)) {
      case "new":
        fresh.push(word);
        break;
      case "due":
        due.push({ word, index, state: state! });
        break;
      case "scheduled":
        scheduledCount += 1;
        break;
    }
  });

  due.sort(
    (a, b) =>
      a.state.strength - b.state.strength ||
      (a.state.dueOn < b.state.dueOn ? -1 : a.state.dueOn > b.state.dueOn ? 1 : 0) ||
      a.index - b.index,
  );

  const ordered = [...due.map((entry) => entry.word), ...fresh].slice(0, Math.max(0, max));
  const taken = new Set(ordered.map((word) => word.id));
  return {
    words: ordered,
    newCount: fresh.filter((word) => taken.has(word.id)).length,
    dueCount: due.filter((entry) => taken.has(entry.word.id)).length,
    scheduledCount,
  };
}

/** Which words a group's practice asks: Continue (what is due or new — the default) or Practice all (`?scope=all`). */
export type PracticeScope = "continue" | "all";

/** Reads the `scope` of the practice URL: only `all` is Practice all, anything else is Continue. */
export function practiceScope(raw: string | null | undefined): PracticeScope {
  return raw === "all" ? "all" : "continue";
}

/**
 * Names one visit to a group's practice, for the React `key` of the practice
 * screen. A running visit keeps the words it opened with: the page that renders
 * it is sent again after every answer, and a Continue list changes with every
 * answer (selectContinueWords skips what has just been scheduled), so following
 * it would move the screen to another word mid-typing. A different group, or
 * Practice all instead of Continue, is a different visit and has to start fresh —
 * which is exactly what a new key does, and a re-render of the same visit must
 * not.
 */
export function practiceVisitKey(groupId: string, scope: PracticeScope): string {
  return `${groupId}:${scope}`;
}

export interface GroupMastery {
  total: number;
  /** Words the learner has never practiced. */
  newCount: number;
  /** Words due for a review today (not counting new ones). */
  dueCount: number;
  /** Words at strength STRONG_STRENGTH or more. */
  strongCount: number;
  /** 0–100: how far the group is from every word at full strength. Moves a little with every word that climbs. */
  percent: number;
}

export function summarizeGroupMastery(
  wordIds: readonly string[],
  states: ReadonlyMap<string, MasteryState>,
  todayISO: string,
): GroupMastery {
  let newCount = 0;
  let dueCount = 0;
  let strongCount = 0;
  let strengthSum = 0;
  for (const id of wordIds) {
    const state = states.get(id);
    if (!state) {
      newCount += 1;
      continue;
    }
    strengthSum += state.strength;
    if (state.strength >= STRONG_STRENGTH) strongCount += 1;
    if (state.dueOn <= todayISO) dueCount += 1;
  }
  const total = wordIds.length;
  const percent = total === 0 ? 0 : Math.round((strengthSum / (MAX_STRENGTH * total)) * 100);
  return { total, newCount, dueCount, strongCount, percent };
}

/** The word ids due today, weakest first (then longest overdue) — the order a review visit asks them in. */
export function dueWordIds(states: ReadonlyMap<string, MasteryState>, todayISO: string): string[] {
  return [...states.entries()]
    .filter(([, state]) => state.dueOn <= todayISO)
    .sort(
      ([, a], [, b]) =>
        a.strength - b.strength || (a.dueOn < b.dueOn ? -1 : a.dueOn > b.dueOn ? 1 : 0),
    )
    .map(([id]) => id);
}
