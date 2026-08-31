import type { Lesson, Sentence } from "@/types/content";
import { MIN_STORY_SENTENCE_COUNT } from "@/lib/admin/validation";
import { deriveStoryVocabulary } from "@/lib/content/story-vocabulary";

/**
 * Stories-specific content-quality audit tooling (isolated feature — safe to
 * delete this whole file, and the "quality" tab/report that calls it,
 * without affecting story playback, validation, or any other Stories
 * feature). This is deliberately NOT a hard publishing gate: subjective
 * quality (is this ending satisfying, is this character behaving
 * naturally) stays advisory, surfaced for a human editor to review, the
 * same way admin/library-validation.ts's checks stay separate from the
 * hard structural rules in admin/validation.ts. See MIN_STORY_SENTENCE_COUNT
 * for the one structural floor that *is* enforced.
 *
 * Every check here is a heuristic, not a judgment — it flags candidates for
 * human review, and a flag is not proof of a real problem. Nothing in this
 * module rewrites content or blocks anything from publishing.
 */

export interface StoryQualityFlags {
  lessonId: string;
  title: string;
  sentenceCount: number;
  duplicateSentences: string[];
  /** English text of sentences that read as "stated" feelings/facts rather than shown behavior — see TELLING_PATTERNS. */
  tellingSentences: string[];
  /** True when the story's final sentence matches a generic, low-information ending pattern — see WEAK_ENDING_PATTERNS. */
  hasWeakEnding: boolean;
  lastSentence: string;
  /** Proper-noun-looking character names found in the story text (heuristic — see extractCharacterNames). */
  characterNames: string[];
  /** How many naturally-occurring words this story surfaces via deriveStoryVocabulary — 0 usually means missing wordTranslations, not that the story lacks vocabulary. */
  vocabularyCount: number;
}

// Deliberately narrow and literal ("was very happy", "everything was fine")
// rather than a broad emotion-word list — the goal is catching genuinely
// empty endings, not flagging every sentence that happens to end on a
// feeling. See Feature 3's examples in the Stories upgrade brief.
const WEAK_ENDING_PATTERNS: RegExp[] = [
  /\b(was|felt) (very |really |so )?(happy|glad|sad|fine|okay|ok|good|great)\.?$/i,
  /\beverything (was|turned out|is) (fine|okay|ok|good|great|well)\.?$/i,
  /\bit was a (great|good|nice|wonderful|lovely) day\.?$/i,
  /\b(and )?(they|everyone) (lived happily|was happy)\b/i,
  /\bthe end\.?$/i,
  /\b(and )?that('s| was) (it|all)\.?$/i,
];

// "X was ADJECTIVE because Y" is the textbook construction Feature 8 calls
// out — stating an emotion and its cause instead of showing it through
// action or dialogue. Matched loosely on purpose (any adjective-ish word
// between "was"/"felt" and "because"), since the point is flagging the
// *shape* of the sentence for a human to judge, not a specific word list.
const TELLING_PATTERNS: RegExp[] = [
  /\b(was|felt|were)\s+(very\s+|really\s+|so\s+)?[a-z]+\s+because\b/i,
];

const COMMON_NON_NAMES = new Set([
  "The",
  "A",
  "An",
  "He",
  "She",
  "They",
  "It",
  "His",
  "Her",
  "Their",
  "On",
  "In",
  "At",
  "One",
  "Every",
  "Some",
  "Others",
  "Then",
  "Now",
  "After",
  "Before",
  "When",
  "While",
  "But",
  "And",
  "So",
  "If",
  "There",
  "This",
  "That",
  "These",
  "Those",
  "I",
  "My",
  "We",
  "Our",
  "You",
  "Your",
]);

/** Heuristic proper-noun extraction: capitalized words outside sentence-initial position, minus a stoplist of common capitalized function words. Good enough for a diversity audit, not a linguistic parser. */
export function extractCharacterNames(sentences: Pick<Sentence, "en">[]): string[] {
  const names = new Set<string>();
  for (const sentence of sentences) {
    const words = sentence.en.trim().split(/\s+/);
    // Skip index 0 — every sentence-initial word is capitalized regardless
    // of whether it's a name, so it's not signal here.
    for (let i = 1; i < words.length; i++) {
      const word = words[i] ?? "";
      const clean = word.replace(/^[^A-Za-z']+|['".,!?;:]+$/g, "");
      if (/^[A-Z][a-z]+$/.test(clean) && !COMMON_NON_NAMES.has(clean)) {
        names.add(clean);
      }
    }
  }
  return [...names];
}

export function findDuplicateSentences(sentences: Pick<Sentence, "en">[]): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const sentence of sentences) {
    const key = sentence.en.trim().toLowerCase();
    if (seen.has(key)) duplicates.push(sentence.en.trim());
    seen.add(key);
  }
  return duplicates;
}

export function auditStory(
  lesson: Pick<Lesson, "id" | "title" | "sentences" | "level">,
): StoryQualityFlags {
  const texts = lesson.sentences.map((s) => s.en.trim());
  const lastSentence = texts[texts.length - 1] ?? "";

  return {
    lessonId: lesson.id,
    title: lesson.title,
    sentenceCount: lesson.sentences.length,
    duplicateSentences: findDuplicateSentences(lesson.sentences),
    tellingSentences: texts.filter((t) => TELLING_PATTERNS.some((p) => p.test(t))),
    hasWeakEnding: WEAK_ENDING_PATTERNS.some((p) => p.test(lastSentence)),
    lastSentence,
    characterNames: extractCharacterNames(lesson.sentences),
    vocabularyCount: deriveStoryVocabulary(lesson.sentences, lesson.level, lesson.title).length,
  };
}

export interface CollectionDiversityReport {
  totalStories: number;
  /** Names appearing in more names.length/threshold stories or more, sorted by frequency — candidates for the diversity audit (Feature 9/10), not an automatic rewrite list. */
  overusedNames: { name: string; count: number }[];
  /** First-3-word openings shared by 2+ stories — a real repeated structural pattern (Feature 10), as opposed to two stories that merely share a word. */
  repeatedOpenings: { opening: string; lessonIds: string[] }[];
  storiesBelowMinLength: string[];
  storiesWithWeakEndings: string[];
  storiesWithDuplicateSentences: string[];
}

/**
 * Collection-level diversity audit (Feature 10) — separate from per-story
 * quality (auditStory above). Flags *measured* repetition (a name used in
 * many stories, an opening shared verbatim) rather than asserting anything
 * about topic/theme similarity, which needs a human reader's judgment.
 */
export function auditCollectionDiversity(
  lessons: Pick<Lesson, "id" | "title" | "sentences" | "level">[],
  options: { nameOveruseThreshold?: number } = {},
): CollectionDiversityReport {
  const nameOveruseThreshold =
    options.nameOveruseThreshold ?? Math.max(4, Math.ceil(lessons.length * 0.08));

  const nameCounts = new Map<string, number>();
  const openingCounts = new Map<string, string[]>();
  const storiesBelowMinLength: string[] = [];
  const storiesWithWeakEndings: string[] = [];
  const storiesWithDuplicateSentences: string[] = [];

  for (const lesson of lessons) {
    const audit = auditStory(lesson);

    if (audit.sentenceCount < MIN_STORY_SENTENCE_COUNT) storiesBelowMinLength.push(lesson.id);
    if (audit.hasWeakEnding) storiesWithWeakEndings.push(lesson.id);
    if (audit.duplicateSentences.length > 0) storiesWithDuplicateSentences.push(lesson.id);

    for (const name of audit.characterNames) {
      nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
    }

    const opening = lesson.sentences[0]?.en.trim().split(/\s+/).slice(0, 3).join(" ").toLowerCase();
    if (opening) {
      const existing = openingCounts.get(opening) ?? [];
      existing.push(lesson.id);
      openingCounts.set(opening, existing);
    }
  }

  const overusedNames = [...nameCounts.entries()]
    .filter(([, count]) => count >= nameOveruseThreshold)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const repeatedOpenings = [...openingCounts.entries()]
    .filter(([, ids]) => ids.length >= 2)
    .map(([opening, lessonIds]) => ({ opening, lessonIds }));

  return {
    totalStories: lessons.length,
    overusedNames,
    repeatedOpenings,
    storiesBelowMinLength,
    storiesWithWeakEndings,
    storiesWithDuplicateSentences,
  };
}
