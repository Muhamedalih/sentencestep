import { isTrackableWord, normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { tokenize } from "@/lib/typing";
import type { LessonRole } from "@/types/database";

/**
 * Curriculum Recycling — a read-only editorial aid for the admin lesson
 * editor (Part 3 of the SentenceStep Curriculum Architecture work). Shows
 * an author how much of a Normal lesson's vocabulary is genuinely new
 * versus already present earlier in the curriculum, using the exact word
 * identity the Mistakes system already tracks words under (see
 * normalizeMistakeWord/isTrackableWord). This is advisory only — nothing
 * here reads as pass/fail, and nothing here is wired into saveLesson or
 * validateLessonInput. It never blocks publishing.
 *
 * Isolated feature: safe to delete this file, content-queries.ts's
 * getNormalCurriculumForRecycling, and the CurriculumRecyclingPanel
 * component (and its one call site in the lesson editor page) without
 * affecting lesson saving, playback, or any other admin/learner behavior —
 * same convention as src/lib/admin/stories-quality.ts.
 */

// --- Content-word extraction ---------------------------------------------

/**
 * Closed-class function words excluded from "content vocabulary" — the same
 * kind of small, fixed exclusion list src/lib/admin/stories-quality.ts's
 * COMMON_NON_NAMES already uses for its own heuristic (there, filtering
 * capitalized function words out of a character-name guess; here, filtering
 * them out of a content-word count). Deliberately narrow: articles,
 * pronouns, the primary auxiliaries, and the most common prepositions/
 * conjunctions. Anything not in this list — every verb, noun, adjective,
 * and adverb — counts as a content word, whether or not a learner is
 * assumed to know it yet.
 */
const FUNCTION_WORDS = new Set([
  "a",
  "an",
  "the",
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "me",
  "him",
  "her",
  "us",
  "them",
  "my",
  "your",
  "his",
  "its",
  "our",
  "their",
  "mine",
  "yours",
  "hers",
  "ours",
  "theirs",
  "is",
  "am",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "do",
  "does",
  "did",
  "doing",
  "done",
  "have",
  "has",
  "had",
  "having",
  "will",
  "would",
  "shall",
  "should",
  "can",
  "could",
  "may",
  "might",
  "must",
  "to",
  "of",
  "in",
  "on",
  "at",
  "by",
  "for",
  "with",
  "about",
  "against",
  "between",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "from",
  "up",
  "down",
  "out",
  "off",
  "over",
  "under",
  "again",
  "then",
  "once",
  "and",
  "but",
  "or",
  "if",
  "because",
  "as",
  "that",
  "this",
  "these",
  "those",
  "not",
  "no",
  "so",
]);

/**
 * Unique, normalized content words found in the given sentences. Reuses the
 * same tokenize/normalizeMistakeWord/isTrackableWord primitives the
 * Mistakes system already relies on (see buildWordOrderIndex in
 * src/lib/mistakes/ordering.ts), so a word's identity here is exactly the
 * identity Mistakes already tracks it under — deliberately identity-based,
 * not lemma/stem-based ("walked" and "walk" count as different words). That
 * matches normalizeMistakeWord's own design rather than introducing a
 * second, divergent notion of "the same word," and keeps this a plain word-
 * identity computation, not an NLP pipeline: no stemming, no synonym
 * detection, no semantic comparison (see the audit's explicit rejection of
 * "job" = "work"-style assumptions).
 *
 * Occurrence count is deliberately discarded (a Set, not a count map) — the
 * panel's numbers are about how many distinct words are new vs. reused, not
 * how many times a word is retyped within one lesson.
 */
export function extractContentWords(sentences: { en: string }[]): Set<string> {
  const words = new Set<string>();
  for (const sentence of sentences) {
    for (const token of tokenize(sentence.en)) {
      if (token === " " || !isTrackableWord(token)) continue;
      const normalized = normalizeMistakeWord(token);
      if (FUNCTION_WORDS.has(normalized)) continue;
      words.add(normalized);
    }
  }
  return words;
}

// --- Recycling report -------------------------------------------------

export interface CurriculumLessonInput {
  id: string;
  title: string;
  level: number;
  orderIndex: number;
  unitId: string | null;
  unitTitle: string | null;
  unitObjective: string | null;
  unitOrderIndex: number | null;
  role: LessonRole | null;
  sentences: { en: string }[];
}

export interface RecyclingReport {
  lessonId: string;
  title: string;
  level: number;
  orderIndex: number;
  role: LessonRole | null;
  unit: { id: string; title: string; objective: string; orderIndex: number } | null;
  /** True when nothing precedes this lesson in the published curriculum at all — every content word is necessarily new. */
  isFirstPublishedLesson: boolean;
  /** True when this is the first lesson (in curriculum order) belonging to its unit — there is nothing earlier in the unit to compare against. */
  isFirstInUnit: boolean;
  newCount: number;
  reusedCount: number;
  totalCount: number;
  /** null only when totalCount is 0 (a lesson with no trackable content words yet). */
  reusedSharePercent: number | null;
  previousLesson: { id: string; title: string; overlapCount: number } | null;
  /** null when isFirstInUnit or the lesson has no unit — otherwise, overlap with the union of this lesson's own earlier unit-mates. */
  unitPriorOverlapCount: number | null;
}

/**
 * Computes a lesson's recycling report against everything published
 * *before* it in the given curriculum order — never against a later lesson,
 * and never against a lesson at a higher level, since neither would ever
 * have been in the learner's actual path by the time they reach this
 * lesson. `curriculum` must already be sorted level-then-order (see
 * getNormalCurriculumForRecycling); this function does not re-sort it, so
 * it stays a pure, cheap computation over data the caller fetched once.
 *
 * Every lesson's content-word set is computed at most once, up front, and
 * reused for every comparison below it — O(lessons) tokenization work per
 * report, not O(lessons²), which stays trivial at this curriculum's size
 * (a handful of short sentences per lesson, a few dozen lessons) without
 * needing anything more elaborate.
 */
export function computeRecyclingReport(
  lessonId: string,
  curriculum: CurriculumLessonInput[],
): RecyclingReport | null {
  const index = curriculum.findIndex((lesson) => lesson.id === lessonId);
  if (index === -1) return null;

  const wordsByLessonId = new Map<string, Set<string>>();
  function wordsFor(lesson: CurriculumLessonInput): Set<string> {
    const cached = wordsByLessonId.get(lesson.id);
    if (cached) return cached;
    const words = extractContentWords(lesson.sentences);
    wordsByLessonId.set(lesson.id, words);
    return words;
  }

  const target = curriculum[index]!;
  const targetWords = wordsFor(target);
  const priorLessons = curriculum.slice(0, index);

  const priorWords = new Set<string>();
  for (const lesson of priorLessons) for (const word of wordsFor(lesson)) priorWords.add(word);

  let reusedCount = 0;
  for (const word of targetWords) if (priorWords.has(word)) reusedCount++;
  const totalCount = targetWords.size;
  const newCount = totalCount - reusedCount;
  const reusedSharePercent = totalCount > 0 ? Math.round((reusedCount / totalCount) * 100) : null;

  const previousLessonRow = index > 0 ? curriculum[index - 1]! : null;
  const previousLesson = previousLessonRow
    ? {
        id: previousLessonRow.id,
        title: previousLessonRow.title,
        overlapCount: [...targetWords].filter((word) => wordsFor(previousLessonRow).has(word))
          .length,
      }
    : null;

  const priorInUnit = target.unitId
    ? priorLessons.filter((lesson) => lesson.unitId === target.unitId)
    : [];
  const isFirstInUnit = target.unitId === null || priorInUnit.length === 0;
  let unitPriorOverlapCount: number | null = null;
  if (!isFirstInUnit) {
    const unitPriorWords = new Set<string>();
    for (const lesson of priorInUnit) for (const word of wordsFor(lesson)) unitPriorWords.add(word);
    unitPriorOverlapCount = [...targetWords].filter((word) => unitPriorWords.has(word)).length;
  }

  return {
    lessonId: target.id,
    title: target.title,
    level: target.level,
    orderIndex: target.orderIndex,
    role: target.role,
    unit:
      target.unitId && target.unitTitle && target.unitObjective && target.unitOrderIndex !== null
        ? {
            id: target.unitId,
            title: target.unitTitle,
            objective: target.unitObjective,
            orderIndex: target.unitOrderIndex,
          }
        : null,
    isFirstPublishedLesson: index === 0,
    isFirstInUnit,
    newCount,
    reusedCount,
    totalCount,
    reusedSharePercent,
    previousLesson,
    unitPriorOverlapCount,
  };
}

// --- Role-aware, advisory-only interpretation -----------------------------

export type ReuseLabel = "Light reuse" | "Healthy reuse" | "High reuse";

export interface ReuseAdvisory {
  /** null only when reusedSharePercent is null (no trackable content words yet). */
  label: ReuseLabel | null;
  /** Neutral, non-blocking editorial notes — never "pass"/"fail"/"must fix"/"blocked" language, and never an instruction to force a specific word in. */
  notes: string[];
}

/**
 * Rough, descriptive-only bands used purely to attach a scannable word to a
 * percentage — NOT a validation rule. Nothing reads this to block, warn-as-
 * error, or gate publishing (see saveLesson/validateLessonInput, neither of
 * which imports this module). Bands differ by role because "high reuse" for
 * an Establish lesson would mean something different than for an Integrate
 * lesson — see the Curriculum Architecture audit's explicit rejection of one
 * universal threshold. A human author is expected to read past the label to
 * the actual numbers and notes, not treat the label itself as a verdict.
 */
function reuseLabel(role: LessonRole | null, sharePercent: number | null): ReuseLabel | null {
  if (sharePercent === null) return null;
  if (role === "integrate") {
    if (sharePercent < 35) return "Light reuse";
    if (sharePercent < 60) return "Healthy reuse";
    return "High reuse";
  }
  if (role === "build") {
    if (sharePercent < 15) return "Light reuse";
    if (sharePercent < 50) return "Healthy reuse";
    return "High reuse";
  }
  // Establish, or a lesson with no role assigned yet: light reuse is the
  // expected, unremarkable case, never a shortfall.
  if (sharePercent < 20) return "Light reuse";
  if (sharePercent < 45) return "Healthy reuse";
  return "High reuse";
}

/**
 * Turns a RecyclingReport into the label + editorial notes the panel
 * renders. Every note here is guidance for a human to consider, never an
 * instruction to insert a specific word — see the audit's explicit warning
 * against forcing vocabulary overlap where it would read as unnatural.
 */
export function buildReuseAdvisory(report: RecyclingReport): ReuseAdvisory {
  const notes: string[] = [];

  if (report.isFirstPublishedLesson) {
    notes.push(
      "First lesson in the published curriculum — every content word here is necessarily new.",
    );
  } else if (report.role === "establish") {
    notes.push(
      "First lesson of its unit — high new vocabulary and light reuse are both expected here.",
    );
  }

  if (
    report.role === "build" &&
    report.previousLesson &&
    report.previousLesson.overlapCount === 0
  ) {
    notes.push(
      `No direct vocabulary overlap with the previous lesson ("${report.previousLesson.title}"). Consider whether a natural callback would strengthen the progression.`,
    );
  }

  if (
    report.role === "integrate" &&
    report.reusedSharePercent !== null &&
    report.reusedSharePercent < 35
  ) {
    notes.push(
      "This Integrate lesson's reused-vocabulary share is lower than typical for its role — Integrate lessons usually lean more heavily on language from earlier in the unit.",
    );
  }

  return { label: reuseLabel(report.role, report.reusedSharePercent), notes };
}

// --- Spiral threads (editorial reference only — not stored anywhere) ------

export interface SpiralThread {
  label: string;
  /** 1-based position in the published Normal curriculum's level-then-order sequence — matches orderIndex for today's 12-lesson library. */
  positions: number[];
}

/**
 * The five recurring language threads the SentenceStep Curriculum
 * Architecture audit found already happening, unplanned, across the 12
 * published Normal lessons — see that report's Recycling / Spiral Model
 * section. Purely an editorial reference surfaced by the panel below; there
 * is no `threads` table and no per-lesson thread field anywhere in the
 * schema (see Part 2's migration). These are five fixed facts about the
 * current lessons' actual text, hand-transcribed from the audit — not
 * curriculum metadata an author maintains, and not a requirement that any
 * future lesson use one of them.
 */
export const SPIRAL_THREADS: SpiralThread[] = [
  { label: "felt X", positions: [1, 3, 7, 9, 12] },
  { label: "work", positions: [1, 2, 6, 7, 11] },
  { label: "online", positions: [4, 8, 11] },
  { label: "friend / message", positions: [3, 10, 12] },
  { label: "decide / regret", positions: [6, 7, 9, 11, 12] },
];

function formatLessonList(positions: number[]): string {
  if (positions.length === 1) return `Lesson ${positions[0]}`;
  const last = positions[positions.length - 1];
  return `Lessons ${positions.slice(0, -1).join(", ")} and ${last}`;
}

/**
 * The subset of SPIRAL_THREADS that already touched some lesson strictly
 * before `position`, worded for display (e.g. "online — previously used in
 * Lessons 4 and 8"). A thread with no occurrence yet before this position is
 * omitted entirely — this is a reminder of what already exists to build on,
 * not a checklist, so there is nothing useful to say about a thread that
 * hasn't started yet.
 */
export function spiralThreadsBefore(position: number): { label: string; text: string }[] {
  const result: { label: string; text: string }[] = [];
  for (const thread of SPIRAL_THREADS) {
    const priorPositions = thread.positions.filter((p) => p < position);
    if (priorPositions.length === 0) continue;
    result.push({
      label: thread.label,
      text: `${thread.label} — previously used in ${formatLessonList(priorPositions)}`,
    });
  }
  return result;
}
