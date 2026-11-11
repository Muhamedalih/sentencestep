import { STRONG_STRENGTH, addDaysISO, isDue } from "@/lib/word-mastery/schedule";
import { BANK_ROUND_SIZE } from "@/lib/word-bank/select";
import type { BankWordState } from "@/lib/word-bank/select";
import type { BankSource } from "@/lib/word-bank/types";

/**
 * Words bank («كلماتي»): the three shelves a learner's words stand on, and the day's round. Pure — the
 * loader reads the learner's `learner_words` rows, this only sorts them. Nothing here is stored: a
 * shelf is worked out from the rows each time, so the rule can change without touching a learner's
 * data.
 *
 * The owner's condition for the section is that words never pile up until the learner stops
 * reviewing. Four rules keep that:
 *  - a day asks at most `BANK_DAILY_CAP` words, whatever is due (a week away comes back to five, not
 *    thirty-five);
 *  - at most `BANK_ACTIVE_CAP` words are being learned at once («قيد التثبيت»). The rest wait
 *    («بالانتظار»), are never asked and never counted as due, and move up by themselves, oldest first,
 *    as words become stable;
 *  - a stable word (strength `STRONG_STRENGTH` or more) has left the daily round for good;
 *  - (in the database function, see record_learner_word_review) a word typed right the first time it
 *    is met starts higher, so it needs fewer reviews.
 */

/** Words being learned at once. */
export const BANK_ACTIVE_CAP = 20;
/**
 * The strength a word enters the bank at when its very first answer is clean (the database function
 * does it: see 20250357000000_learner_words_clean_start.sql). Two steps up, so two reviews make it
 * stable instead of three.
 */
export const BANK_CLEAN_START_STRENGTH = 2;
/** Words asked in one day, over every round of that day. */
export const BANK_DAILY_CAP = BANK_ROUND_SIZE;

export type BankShelf = "stable" | "active" | "waiting";

export interface BankShelves {
  stable: BankWordState[];
  active: BankWordState[];
  waiting: BankWordState[];
}

/** Oldest first, then by spelling, so two reads of the same bank shelve it the same way. */
function byFirstSeen(a: BankWordState, b: BankWordState): number {
  return a.firstSeenOn.localeCompare(b.firstSeenOn) || a.word.localeCompare(b.word);
}

/**
 * Puts every word on its shelf. The words that are not stable yet are taken oldest first: the first
 * `cap` are being learned, the rest wait. A word that is being learned stays there until it is stable
 * (no older word can appear later), so a word never drops back to waiting.
 */
export function shelveBank(
  states: readonly BankWordState[],
  cap: number = BANK_ACTIVE_CAP,
): BankShelves {
  const room = Math.max(0, Math.trunc(cap));
  const stable: BankWordState[] = [];
  const learning: BankWordState[] = [];
  for (const state of states) {
    (state.strength >= STRONG_STRENGTH ? stable : learning).push(state);
  }
  learning.sort(byFirstSeen);
  stable.sort(byFirstSeen);
  return { stable, active: learning.slice(0, room), waiting: learning.slice(room) };
}

/** Which shelf each word stands on, by spelling. */
export function shelfByWord(shelves: BankShelves): Map<string, BankShelf> {
  const map = new Map<string, BankShelf>();
  for (const shelf of ["stable", "active", "waiting"] as const) {
    for (const state of shelves[shelf]) map.set(state.word, shelf);
  }
  return map;
}

/**
 * How many of the learner's words were already asked today in a round: answered today and first met
 * on an earlier day (a word met for the first time today was typed in its lesson, not in a round).
 */
export function reviewedToday(states: readonly BankWordState[], todayISO: string): number {
  let count = 0;
  for (const state of states) {
    if (state.lastReviewedOn === todayISO && state.firstSeenOn < todayISO) count += 1;
  }
  return count;
}

export interface BankDay {
  /** Every word being learned that is due, in the order a round asks them (longest waiting first, then weakest, then by spelling). */
  due: BankWordState[];
  /** How many more words today may still ask (the daily cap less what was already asked today). */
  left: number;
  /** The words of today's next round: the first `left` of `due`. */
  round: BankWordState[];
  /** Words already asked today. */
  asked: number;
}

/** Today's round: the due words among those being learned, never more than the day has left. */
export function bankDay(
  states: readonly BankWordState[],
  todayISO: string,
  options: { dailyCap?: number; activeCap?: number } = {},
): BankDay {
  const dailyCap = Math.max(0, Math.trunc(options.dailyCap ?? BANK_DAILY_CAP));
  const { active } = shelveBank(states, options.activeCap);
  const due = active
    .filter((state) => isDue(state, todayISO))
    .sort(
      (a, b) =>
        a.dueOn.localeCompare(b.dueOn) || a.strength - b.strength || a.word.localeCompare(b.word),
    );
  const asked = reviewedToday(states, todayISO);
  const left = Math.max(0, dailyCap - asked);
  return { due, left, round: due.slice(0, left), asked };
}

/** Where some of today's words came from: one lesson (or, with no title, one kind of source) and how many. */
export interface BankRoundSource {
  source: BankSource;
  lessonTitle: string | null;
  count: number;
}

/** Today's words by where they were first met, the biggest group first. */
export function roundSources(round: readonly BankWordState[]): BankRoundSource[] {
  const groups = new Map<string, BankRoundSource>();
  for (const state of round) {
    const title = state.lessonTitle?.trim() || null;
    const key = title ? `t:${title}` : `s:${state.source}`;
    const group = groups.get(key);
    if (group) group.count += 1;
    else groups.set(key, { source: state.source, lessonTitle: title, count: 1 });
  }
  return [...groups.values()].sort(
    (a, b) =>
      b.count - a.count ||
      (a.lessonTitle ?? "").localeCompare(b.lessonTitle ?? "") ||
      a.source.localeCompare(b.source),
  );
}

/** Everything the section's page shows about a learner's bank. */
export interface BankOverview {
  total: number;
  stable: number;
  active: number;
  waiting: number;
  /** Today's round (at most the daily cap). */
  today: BankWordState[];
  todaySources: BankRoundSource[];
  /** Words already asked today. */
  askedToday: number;
  /** The last day a round was answered (a word answered after the day it was first met), or null. */
  lastReviewedOn: string | null;
  /** With nothing left today: the day the next word being learned is due (tomorrow at the earliest), or null when none is. */
  nextDueOn: string | null;
}

export function bankOverview(
  states: readonly BankWordState[],
  todayISO: string,
  options: { dailyCap?: number; activeCap?: number } = {},
): BankOverview {
  const shelves = shelveBank(states, options.activeCap);
  const day = bankDay(states, todayISO, options);

  let lastReviewedOn: string | null = null;
  for (const state of states) {
    if (state.lastReviewedOn <= state.firstSeenOn) continue;
    if (lastReviewedOn === null || state.lastReviewedOn > lastReviewedOn) {
      lastReviewedOn = state.lastReviewedOn;
    }
  }

  // With the day's words done (or none due), the next round is tomorrow at the earliest: a word that
  // is due today but over the day's cap comes tomorrow too.
  let nextDueOn: string | null = null;
  if (day.round.length === 0) {
    const tomorrow = addDaysISO(todayISO, 1);
    for (const state of shelves.active) {
      const on = state.dueOn > todayISO ? state.dueOn : tomorrow;
      if (nextDueOn === null || on < nextDueOn) nextDueOn = on;
    }
  }

  return {
    total: states.length,
    stable: shelves.stable.length,
    active: shelves.active.length,
    waiting: shelves.waiting.length,
    today: day.round,
    todaySources: roundSources(day.round),
    askedToday: day.asked,
    lastReviewedOn,
    nextDueOn,
  };
}

/** Whole calendar days from `todayISO` to `iso` (negative when `iso` is past). Both are "YYYY-MM-DD". */
export function daysUntil(iso: string, todayISO: string): number {
  const day = 24 * 60 * 60 * 1000;
  return Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${todayISO}T00:00:00Z`)) / day);
}

/** What the Home «كلماتك» card shows of the bank on a day it has words for the learner. */
export interface BankCardData {
  /** Today's words (the daily cap at most). */
  count: number;
  /** The first of them, for the paper cards: the word, its meaning ("" when none) and its lesson's name. */
  words: { word: string; ar: string; title: string | null }[];
  sources: BankRoundSource[];
  /** Every word in the bank, and how many of them are stable. */
  total: number;
  stable: number;
}

/** The card's data from the overview, or null on a day with no words (the card then keeps what it always showed). */
export function bankCardData(overview: BankOverview, cards = 4): BankCardData | null {
  if (overview.today.length === 0) return null;
  return {
    count: overview.today.length,
    words: overview.today.slice(0, cards).map((state) => ({
      word: state.word,
      ar: state.ar,
      title: state.lessonTitle?.trim() || null,
    })),
    sources: overview.todaySources,
    total: overview.total,
    stable: overview.stable,
  };
}
