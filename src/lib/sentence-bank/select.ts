import { isTrackableWord, normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { isImportantWord } from "@/lib/today/important-words";
import { isDue } from "@/lib/word-mastery/schedule";
import type { MasteryState } from "@/lib/word-mastery/schedule";

/**
 * Sentence bank: which of the sentences a learner has typed come back today. Pure — the loader reads
 * the learner's finished lessons and their sentence_mastery rows, this only chooses.
 *
 * Since 2026-10-23 the day's test no longer calls `selectSentenceReview` / `selectTodaySentences`: it
 * asks only about the passage and the story finished today (see today-exam.ts). They stay here, with
 * their tests, for the day sentences of earlier days come back; the weekly check (weekly.ts) still
 * uses the constants and `spreadAcrossLessons`.
 *
 * A day's batch is small on purpose (three), never a pile: the learner is not shown how many are
 * waiting, so a gap of weeks is not a debt, and a sentence left unreviewed for a long time is simply
 * asked again like any other due one — once, with its text hidden, after which the ordinary ladder
 * takes over from the result.
 */

/** Sentences in one day's batch. */
export const DAILY_REVIEW_COUNT = 3;
/** A sentence with fewer words than this ("Hi, Tom!") is not worth a hidden-text review. */
export const MIN_REVIEW_WORDS = 4;
/** At most this many from one lesson in a batch, so a batch is a spread of what the learner has done and not a replay of one story. */
export const MAX_PER_LESSON = 2;
/** From a lesson finished TODAY the exam may ask a little more: that lesson is what the day's exam is about. */
export const MAX_TODAY_PER_LESSON = 3;

/**
 * How many sentences are still to be asked today. When the day's "remember N sentences" row was dealt,
 * what it still wants (its target minus what it has counted, which only the day's review adds to);
 * otherwise the day's batch minus the sentences already asked today. The weekly check's answers are
 * not counted either way: they would use up the day's batch before the learner opened it.
 */
export function sentencesStillToAsk(
  quest: { target: number; progress: number } | undefined,
  reviewedToday: number,
): number {
  if (quest) return Math.max(0, quest.target - quest.progress);
  return Math.max(0, DAILY_REVIEW_COUNT - reviewedToday);
}

/** One sentence the learner typed, from a lesson or story they finished. */
export interface SentenceCandidate {
  id: string;
  lessonId: string;
  /** Position in its lesson. */
  orderIndex: number;
  en: string;
  /** The learner-local day ("YYYY-MM-DD") they finished the sentence's lesson. */
  completedOn: string;
}

/** Why a sentence is in the batch: it came due on its schedule, it holds a word the learner finds hard, it is simply one to revisit, or it comes from a lesson the learner finished today. */
export type ReviewReason = "due" | "weak" | "spread" | "today";

export interface ReviewItem<T extends SentenceCandidate = SentenceCandidate> {
  sentence: T;
  /** 0 for a sentence never asked back. */
  strength: number;
  reason: ReviewReason;
}

export interface ReviewSelection<T extends SentenceCandidate = SentenceCandidate> {
  items: ReviewItem<T>[];
  /** More sentences would be ready after these (for an optional "3 more"). Deliberately a yes/no and never a number: there is no counter of what is waiting. */
  more: boolean;
}

export interface SelectOptions {
  /** The learner-local "today", "YYYY-MM-DD". */
  todayISO: string;
  /** The learner's weak words, normalized (lower case, see normalizeMistakeWord). A sentence holding one is asked before an ordinary one. */
  weakWords?: ReadonlySet<string>;
  /** How many sentences to return; DAILY_REVIEW_COUNT by default. */
  cap?: number;
  maxPerLesson?: number;
  /** Sentences to leave out — the ones already asked in this visit, when a second batch is wanted. */
  exclude?: ReadonlySet<string>;
}

const NO_WORDS: ReadonlySet<string> = new Set();

function wordsOf(en: string): string[] {
  return en.split(/\s+/).filter(isTrackableWord).map(normalizeMistakeWord);
}

/** How many words a sentence has (tokens with a letter in them: a lone dash does not count). */
export function reviewWordCount(en: string): number {
  return en.split(/\s+/).filter(isTrackableWord).length;
}

/** How many different words of the sentence are both content words and on the learner's weak list ("and" and "into" never count). */
function weakWordCount(en: string, weakWords: ReadonlySet<string>): number {
  const found = new Set<string>();
  for (const word of wordsOf(en)) {
    if (weakWords.has(word) && isImportantWord(word)) found.add(word);
  }
  return found.size;
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Newest finished lesson first, then the lesson itself, then the sentence's place in it — a total order, so the same pool always gives the same batch. */
function compareRecent(a: SentenceCandidate, b: SentenceCandidate): number {
  return (
    compareText(b.completedOn, a.completedOn) ||
    compareText(a.lessonId, b.lessonId) ||
    a.orderIndex - b.orderIndex ||
    compareText(a.id, b.id)
  );
}

/** One from each lesson in turn (newest lesson first, each lesson in its own order), then the next from each, and so on — a spread over the learner's lessons. */
export function spreadAcrossLessons<T extends SentenceCandidate>(sentences: readonly T[]): T[] {
  const lessons = new Map<string, T[]>();
  for (const sentence of sentences) {
    const list = lessons.get(sentence.lessonId);
    if (list) list.push(sentence);
    else lessons.set(sentence.lessonId, [sentence]);
  }
  const ordered = [...lessons.values()]
    .map((list) => list.sort(compareRecent))
    .sort((a, b) => compareRecent(a[0]!, b[0]!));
  const spread: T[] = [];
  for (let round = 0; spread.length < sentences.length; round++) {
    for (const list of ordered) {
      const sentence = list[round];
      if (sentence) spread.push(sentence);
    }
  }
  return spread;
}

/**
 * Sentences never asked back, in the order they are taken: the ones holding the learner's weak
 * words first (the ones holding the most first), then every other one spread over their lessons.
 */
function orderFresh<T extends SentenceCandidate>(
  fresh: readonly T[],
  weakWords: ReadonlySet<string>,
): ReviewItem<T>[] {
  const weak: { sentence: T; held: number }[] = [];
  const ordinary: T[] = [];
  for (const sentence of fresh) {
    const held = weakWords.size > 0 ? weakWordCount(sentence.en, weakWords) : 0;
    if (held > 0) weak.push({ sentence, held });
    else ordinary.push(sentence);
  }
  weak.sort((a, b) => b.held - a.held || compareRecent(a.sentence, b.sentence));
  return [
    ...weak.map(({ sentence }): ReviewItem<T> => ({ sentence, strength: 0, reason: "weak" })),
    ...spreadAcrossLessons(ordinary).map((sentence): ReviewItem<T> => ({
      sentence,
      strength: 0,
      reason: "spread",
    })),
  ];
}

/** The first `cap` of `ready`, taking no more than `maxPerLesson` from any one lesson. */
function takeWithLessonCap<T extends SentenceCandidate>(
  ready: readonly ReviewItem<T>[],
  cap: number,
  maxPerLesson: number,
): ReviewItem<T>[] {
  const perLesson = new Map<string, number>();
  const items: ReviewItem<T>[] = [];
  for (const item of ready) {
    if (items.length >= cap) break;
    const taken = perLesson.get(item.sentence.lessonId) ?? 0;
    if (taken >= maxPerLesson) continue;
    perLesson.set(item.sentence.lessonId, taken + 1);
    items.push(item);
  }
  return items;
}

/**
 * Today's batch, in this order:
 *  1. sentences that came due on their schedule, the longest waiting first (a missed one is due
 *     tomorrow, so it is back at once);
 *  2. sentences never asked back that hold one of the learner's weak words, the ones with the most
 *     first;
 *  3. every other sentence never asked back, spread over the learner's finished lessons, the newest
 *     lesson first.
 * Only sentences of MIN_REVIEW_WORDS words or more from a lesson finished on an EARLIER day are
 * considered (what was typed an hour ago is not yet a memory to test), a sentence scheduled for a
 * later day stays out, and no lesson gives more than MAX_PER_LESSON to one batch. Fewer than `cap`
 * come back when fewer qualify — a learner with one finished lesson is asked two sentences, not
 * three, and one with nothing to ask gets an empty batch (the caller then shows no row at all).
 */
export function selectSentenceReview<T extends SentenceCandidate>(
  candidates: readonly T[],
  states: ReadonlyMap<string, MasteryState>,
  options: SelectOptions,
): ReviewSelection<T> {
  const { todayISO } = options;
  const cap = Math.max(0, Math.trunc(options.cap ?? DAILY_REVIEW_COUNT));
  const maxPerLesson = Math.max(1, Math.trunc(options.maxPerLesson ?? MAX_PER_LESSON));
  const weakWords = options.weakWords ?? NO_WORDS;

  const due: { sentence: T; state: MasteryState }[] = [];
  const fresh: T[] = [];
  const seen = new Set<string>();
  for (const sentence of candidates) {
    if (seen.has(sentence.id) || options.exclude?.has(sentence.id)) continue;
    seen.add(sentence.id);
    if (!(sentence.completedOn < todayISO)) continue;
    if (reviewWordCount(sentence.en) < MIN_REVIEW_WORDS) continue;
    const state = states.get(sentence.id);
    if (!state) fresh.push(sentence);
    else if (isDue(state, todayISO)) due.push({ sentence, state });
  }

  due.sort(
    (a, b) =>
      compareText(a.state.dueOn, b.state.dueOn) ||
      a.state.strength - b.state.strength ||
      compareRecent(a.sentence, b.sentence),
  );

  const ready: ReviewItem<T>[] = [
    ...due.map(({ sentence, state }): ReviewItem<T> => ({
      sentence,
      strength: state.strength,
      reason: "due",
    })),
    ...orderFresh(fresh, weakWords),
  ];

  const items = takeWithLessonCap(ready, cap, maxPerLesson);
  return { items, more: ready.length > items.length };
}

/**
 * The sentences of the lessons the learner finished TODAY that the day's exam may ask. The exam is
 * about what they just learned as much as about what they learned before, so these are exactly the
 * ones `selectSentenceReview` leaves out: MIN_REVIEW_WORDS words or more, never asked back yet (one
 * already on the schedule is not new any more), the ones holding the learner's weak words first,
 * then a spread over those lessons, no more than MAX_TODAY_PER_LESSON from one. Each comes back as
 * reason "today" at strength 0; once answered it joins the schedule like any sentence (due tomorrow).
 */
export function selectTodaySentences<T extends SentenceCandidate>(
  candidates: readonly T[],
  states: ReadonlyMap<string, MasteryState>,
  options: SelectOptions,
): ReviewItem<T>[] {
  const cap = Math.max(0, Math.trunc(options.cap ?? DAILY_REVIEW_COUNT));
  const maxPerLesson = Math.max(1, Math.trunc(options.maxPerLesson ?? MAX_TODAY_PER_LESSON));
  const weakWords = options.weakWords ?? NO_WORDS;

  const fresh: T[] = [];
  const seen = new Set<string>();
  for (const sentence of candidates) {
    if (seen.has(sentence.id) || options.exclude?.has(sentence.id)) continue;
    seen.add(sentence.id);
    if (sentence.completedOn !== options.todayISO) continue;
    if (reviewWordCount(sentence.en) < MIN_REVIEW_WORDS) continue;
    if (states.has(sentence.id)) continue;
    fresh.push(sentence);
  }
  const ready = orderFresh(fresh, weakWords).map((item): ReviewItem<T> => ({
    ...item,
    reason: "today",
  }));
  return takeWithLessonCap(ready, cap, maxPerLesson);
}
