import { extractContentWords } from "@/lib/admin/curriculum-recycling";
import { isTrackableWord } from "@/lib/mistakes/normalize";
import { tokenize } from "@/lib/typing";

/**
 * Stories Curriculum Context — a read-only editorial reference for the
 * admin Stories editor. Unlike Normal's Curriculum Recycling panel (see
 * curriculum-recycling.ts), this deliberately has no role-aware banding, no
 * "healthy/light/high reuse" label, and no advisory flags: Stories don't
 * have establish/build/integrate roles (see 20250147000000_stories_units.sql
 * — role stays null for every Story on purpose), and forcing that model
 * onto Stories is explicitly out of scope for this feature. This module
 * only answers the three reference questions Stories authoring actually
 * benefits from: what Level/Unit is this Story in, what Stories came before
 * it at this Level, and how much of its vocabulary already appeared earlier
 * (in Stories at this Level, or in Normal lessons at or below this Level).
 * Nothing here is a score, a quota, or a requirement — see
 * StoryCurriculumContext's doc comment.
 *
 * Reuses extractContentWords (curriculum-recycling.ts) rather than a second
 * tokenization implementation — a word's identity here is the exact same
 * identity Normal's panel and the Mistakes system already use it under.
 *
 * Also computes plain difficulty context (sentence count, average words per
 * sentence, vs. this Level's typical range, vs. this Story's immediate
 * same-Level neighbors) — see StoryDifficultyContext. This is a genuinely
 * different measurement from the vocabulary analysis above and deliberately
 * does NOT reuse extractContentWords: that function strips function words
 * to measure curriculum vocabulary identity, which would silently shrink
 * "average words per sentence" into something no longer meaning "how long
 * does this sentence read." Word counting here uses the same
 * tokenize/isTrackableWord primitives, just without the content-word
 * filter, so every real word counts, exactly like a reader would count it.
 */

export interface StoryContextLesson {
  id: string;
  title: string;
  level: number;
  orderIndex: number;
  unitId: string | null;
  unitTitle: string | null;
  unitObjective: string | null;
  sentences: { en: string }[];
}

export interface NormalContextLesson {
  level: number;
  sentences: { en: string }[];
}

export interface StoryCurriculumContext {
  storyId: string;
  title: string;
  level: number;
  unit: { id: string; title: string; objective: string } | null;
  /** Every Story at the same Level that comes earlier in the level-then-order sequence — answers "what Stories come before it at this Level?" Not capped; the panel decides how much of this to render. */
  precedingStoriesAtLevel: { id: string; title: string }[];
  totalContentWords: number;
  /** How many of this Story's content words already appeared in an earlier same-Level Story. Reference information only — never a target or a requirement. */
  overlapWithEarlierStoriesAtLevel: number;
  /** How many of this Story's content words already appeared in a published Normal lesson at or below this Level. */
  overlapWithNormalVocabulary: number;
  /** A small, capped, alphabetized sample of the actual words shared with Normal-mode vocabulary — a skimmable example for a human, never a score or a checklist. */
  sampleSharedWithNormal: string[];
  difficulty: StoryDifficultyContext;
}

/** Display-only — never stored, never a numeric score, never called a "grade." */
export type DifficultyComparison = "below-typical" | "around-typical" | "above-typical";

export interface StoryDifficultyStats {
  title: string;
  sentenceCount: number;
  averageWordsPerSentence: number;
}

export interface StoryDifficultyContext {
  currentStory: {
    sentenceCount: number;
    averageWordsPerSentence: number;
    sentenceCountComparison: DifficultyComparison;
    wordsPerSentenceComparison: DifficultyComparison;
  };
  /** Computed across every published Story at this Level (this Story included) — a stable reference point that doesn't shift depending on which Story's page you're viewing. */
  sameLevel: {
    averageSentenceCount: number;
    averageWordsPerSentence: number;
  };
  /** null exactly when this is the first published Story at this Level. */
  previousAtLevel: StoryDifficultyStats | null;
  /** null exactly when this is the most recent published Story at this Level. */
  nextAtLevel: StoryDifficultyStats | null;
}

const MAX_SAMPLE_WORDS = 8;
/** How far a value can sit from the Level average before it reads as "below"/"above" rather than "around" typical — a rough band for a plain-language label, not a scored threshold. */
const TYPICAL_BAND = 0.15;

/**
 * Plain, readable word count for one sentence — every real word, including
 * function words ("the", "a", "is"...), unlike extractContentWords which
 * deliberately excludes those for the vocabulary-recycling analysis above.
 * Reuses the same tokenize/isTrackableWord primitives (so punctuation-only
 * tokens and stray spaces are excluded the same way everywhere else in this
 * codebase already excludes them) without extractContentWords' function-word
 * filter or its normalization into a Set.
 */
function countWords(en: string): number {
  let count = 0;
  for (const token of tokenize(en)) {
    if (token === " " || !isTrackableWord(token)) continue;
    count++;
  }
  return count;
}

function averageWordsPerSentence(sentences: { en: string }[]): number {
  if (sentences.length === 0) return 0;
  const total = sentences.reduce((sum, sentence) => sum + countWords(sentence.en), 0);
  return total / sentences.length;
}

function compareToTypical(value: number, typical: number): DifficultyComparison {
  if (typical <= 0) return "around-typical";
  if (value < typical * (1 - TYPICAL_BAND)) return "below-typical";
  if (value > typical * (1 + TYPICAL_BAND)) return "above-typical";
  return "around-typical";
}

function toDifficultyStats(story: StoryContextLesson): StoryDifficultyStats {
  return {
    title: story.title,
    sentenceCount: story.sentences.length,
    averageWordsPerSentence: averageWordsPerSentence(story.sentences),
  };
}

/**
 * `sameLevelStories` must be every published Story at `target`'s Level, in
 * level-then-order sequence (a slice of the same array computeStoryCurriculumContext
 * already works with) — `precedingAtLevel`/`followingAtLevel` are this
 * function's own responsibility to derive from it, never from the full
 * cross-level array, so a Level boundary can never leak a wrong-Level
 * neighbor in either direction.
 */
function computeDifficultyContext(
  target: StoryContextLesson,
  sameLevelStories: StoryContextLesson[],
): StoryDifficultyContext {
  const indexAtLevel = sameLevelStories.findIndex((story) => story.id === target.id);

  const sameLevelSentenceCounts = sameLevelStories.map((story) => story.sentences.length);
  const sameLevelWordAverages = sameLevelStories.map((story) =>
    averageWordsPerSentence(story.sentences),
  );
  const levelAverageSentenceCount =
    sameLevelSentenceCounts.reduce((sum, count) => sum + count, 0) / sameLevelStories.length;
  // Mean of each Story's own average — every Story counts once, regardless
  // of how many sentences it has, so one unusually long Story can't pull
  // the Level average toward itself.
  const levelAverageWordsPerSentence =
    sameLevelWordAverages.reduce((sum, average) => sum + average, 0) / sameLevelStories.length;

  const currentSentenceCount = target.sentences.length;
  const currentAverageWords = averageWordsPerSentence(target.sentences);

  const previous = indexAtLevel > 0 ? sameLevelStories[indexAtLevel - 1] : undefined;
  const next =
    indexAtLevel !== -1 && indexAtLevel < sameLevelStories.length - 1
      ? sameLevelStories[indexAtLevel + 1]
      : undefined;

  return {
    currentStory: {
      sentenceCount: currentSentenceCount,
      averageWordsPerSentence: currentAverageWords,
      sentenceCountComparison: compareToTypical(currentSentenceCount, levelAverageSentenceCount),
      wordsPerSentenceComparison: compareToTypical(
        currentAverageWords,
        levelAverageWordsPerSentence,
      ),
    },
    sameLevel: {
      averageSentenceCount: levelAverageSentenceCount,
      averageWordsPerSentence: levelAverageWordsPerSentence,
    },
    previousAtLevel: previous ? toDifficultyStats(previous) : null,
    nextAtLevel: next ? toDifficultyStats(next) : null,
  };
}

/**
 * Computes one Story's curriculum context against everything published
 * *before* it at the same Level (for the Stories-side comparison) and
 * everything published in Normal at or below its Level (for the
 * cross-mode comparison) — never against a later Story, and never against
 * Normal content at a higher Level than this Story.
 *
 * `storiesOrdered` must already be sorted level-then-order (see
 * getStoriesCurriculumForAdvisory) — this function does not re-sort it.
 * `normalLessons` can be in any order; it's filtered by level internally.
 */
export function computeStoryCurriculumContext(
  storyId: string,
  storiesOrdered: StoryContextLesson[],
  normalLessons: NormalContextLesson[],
): StoryCurriculumContext | null {
  const index = storiesOrdered.findIndex((story) => story.id === storyId);
  if (index === -1) return null;
  const target = storiesOrdered[index]!;

  const targetWords = extractContentWords(target.sentences);

  const precedingStoriesAtLevel = storiesOrdered
    .slice(0, index)
    .filter((story) => story.level === target.level);

  // Every published Story at this Level, in level-then-order sequence —
  // filtered from the full cross-level array (never assumed contiguous),
  // so a neighbor lookup can never cross into a different Level.
  const sameLevelStories = storiesOrdered.filter((story) => story.level === target.level);
  const difficulty = computeDifficultyContext(target, sameLevelStories);

  const storyPriorWords = new Set<string>();
  for (const story of precedingStoriesAtLevel) {
    for (const word of extractContentWords(story.sentences)) storyPriorWords.add(word);
  }
  let overlapWithEarlierStoriesAtLevel = 0;
  for (const word of targetWords) if (storyPriorWords.has(word)) overlapWithEarlierStoriesAtLevel++;

  const normalWordsAtOrBelowLevel = new Set<string>();
  for (const lesson of normalLessons) {
    if (lesson.level > target.level) continue;
    for (const word of extractContentWords(lesson.sentences)) normalWordsAtOrBelowLevel.add(word);
  }
  const sampleSharedWithNormal: string[] = [];
  let overlapWithNormalVocabulary = 0;
  for (const word of targetWords) {
    if (normalWordsAtOrBelowLevel.has(word)) {
      overlapWithNormalVocabulary++;
      if (sampleSharedWithNormal.length < MAX_SAMPLE_WORDS) sampleSharedWithNormal.push(word);
    }
  }

  return {
    storyId: target.id,
    title: target.title,
    level: target.level,
    unit:
      target.unitId && target.unitTitle && target.unitObjective
        ? { id: target.unitId, title: target.unitTitle, objective: target.unitObjective }
        : null,
    precedingStoriesAtLevel: precedingStoriesAtLevel.map((story) => ({
      id: story.id,
      title: story.title,
    })),
    totalContentWords: targetWords.size,
    overlapWithEarlierStoriesAtLevel,
    overlapWithNormalVocabulary,
    sampleSharedWithNormal: sampleSharedWithNormal.sort(),
    difficulty,
  };
}
