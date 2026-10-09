import { STORY_TARGET_VOCABULARY } from "@/lib/content/story-target-vocabulary";
import type { Lesson } from "@/types/content";

/**
 * Story word quiz — the "pick the meaning" question a Story asks right after
 * the sentence that holds one of its target words (isolated feature — safe to
 * delete this file, its test, StoryWordQuiz, and the `wordQuiz` wiring in
 * LessonSession and the lesson page, without touching anything else).
 *
 * Nothing new is authored here. Each question is one of the lesson's own
 * target words (`Lesson.vocabulary` — the curated 2-3 words, or the derived
 * ones for older stories) with its existing Arabic gloss as the right answer;
 * the wrong answers are glosses of other stories' curated target words
 * (STORY_TARGET_VOCABULARY). Given the same lesson it always returns the same
 * questions in the same order — no randomness, no I/O — so the server render,
 * a reload and every learner see the same quiz.
 */

export const QUIZ_OPTION_COUNT = 4;

/** The curated stories have 2-3 target words; an older story's derived list can run to six, which would be a quiz after every other sentence — so a story asks about its best three at most. */
export const MAX_QUESTIONS_PER_STORY = 3;

/** How many of the closest-in-level glosses the wrong answers are drawn from, so they read as words of the same difficulty rather than anything in the catalog. */
const NEARBY_CANDIDATES = 24;

export interface StoryWordQuizQuestion {
  /** `${lessonId}::${word}` — also the contentId the word's pronunciation clip is stored under (see "story_vocab_word" in voice-audio.ts), so the quiz plays the exact clip the words screen does. */
  id: string;
  word: string;
  /** The sentence this question follows: the first one in the story that contains `word`. */
  sentenceId: string;
  /** Arabic meanings in display order — the right one among wrong ones. */
  options: string[];
  answerIndex: number;
}

interface PoolEntry {
  en: string;
  ar: string;
  storyNo: number;
}

function stripPunctuation(word: string): string {
  return word.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, "");
}

function storyNumber(lessonId: string): number {
  const match = /^story-(\d+)$/.exec(lessonId);
  return match ? Number(match[1]) : 0;
}

/** The curated glosses are verbs in the form "يطير" — a wrong answer of the same kind keeps the question from being solved by its shape alone. A preference only: a noun that happens to start with ي just lands in the other group. */
function isVerbGloss(ar: string): boolean {
  return ar.startsWith("ي") && ar.length > 2;
}

/** Two glosses that share a word ("حنين" and "حنين للوطن") are near-synonyms: offered together, a learner who knows the word could still be marked wrong. */
function sharesWord(a: string, b: string): boolean {
  const words = new Set(a.split(/\s+/));
  return b.split(/\s+/).some((word) => words.has(word));
}

/**
 * Every curated target word, one entry per distinct Arabic gloss: two English
 * words can share one ("drops" and "fall" are both يسقط), and a gloss that
 * appears twice among the options would be two right answers.
 */
const POOL: readonly PoolEntry[] = (() => {
  const seen = new Set<string>();
  const entries: PoolEntry[] = [];
  for (const [lessonId, words] of Object.entries(STORY_TARGET_VOCABULARY)) {
    const storyNo = storyNumber(lessonId);
    for (const { en, ar } of words) {
      if (seen.has(ar)) continue;
      seen.add(ar);
      entries.push({ en, ar, storyNo });
    }
  }
  return entries;
})();

/** FNV-1a — a tiny stable string hash, so a question's wrong answers and option order depend only on its own id. */
function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Fisher-Yates over mulberry32 — a seeded shuffle, so the same seed always gives the same order. */
function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const result = [...items];
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/**
 * Wrong answers for one word: glosses of other curated words, never the right
 * gloss itself, a near-synonym of it (see sharesWord), or another entry for
 * the same English word. Same kind
 * (verb / not) first, then the nearest in story number — i.e. in difficulty,
 * since the curated catalog is ordered by level — and a seeded pick among
 * those so different words don't all get the same three.
 */
function pickDistractors(
  word: { en: string; ar: string },
  storyNo: number,
  seed: number,
  count: number,
): string[] {
  const wantsVerb = isVerbGloss(word.ar);
  const english = word.en.toLowerCase();
  const nearest = POOL.filter(
    (entry) => entry.en.toLowerCase() !== english && !sharesWord(entry.ar, word.ar),
  )
    .map((entry) => ({
      entry,
      rank: Math.abs(entry.storyNo - storyNo) + (isVerbGloss(entry.ar) === wantsVerb ? 0 : 1000),
    }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, Math.max(NEARBY_CANDIDATES, count));
  return seededShuffle(nearest, seed)
    .slice(0, count)
    .map(({ entry }) => entry.ar);
}

/**
 * One question per target word of the lesson (the first MAX_QUESTIONS_PER_STORY
 * of them — `vocabulary` is already best-first), in story order. A word that
 * never appears in the sentences, or has no usable Arabic gloss (empty, or
 * just the English word again), is skipped rather than asked badly; a word
 * that appears in several sentences is asked once, after the first.
 */
export function buildStoryWordQuiz(
  lesson: Pick<Lesson, "id" | "sentences" | "vocabulary">,
): StoryWordQuizQuestion[] {
  const storyNo = storyNumber(lesson.id);
  const asked = new Set<string>();
  const questions: { question: StoryWordQuizQuestion; position: number }[] = [];

  for (const item of lesson.vocabulary ?? []) {
    if (questions.length === MAX_QUESTIONS_PER_STORY) break;
    const word = item.en.trim();
    const meaning = item.ar.trim();
    const key = word.toLowerCase();
    if (!word || !meaning || meaning.toLowerCase() === key || asked.has(key)) continue;

    const position = lesson.sentences.findIndex((candidate) =>
      candidate.en.split(/\s+/).some((raw) => stripPunctuation(raw).toLowerCase() === key),
    );
    const sentence = lesson.sentences[position];
    if (!sentence) continue;

    const id = `${lesson.id}::${item.en}`;
    const seed = hashString(id);
    const distractors = pickDistractors(
      { en: word, ar: meaning },
      storyNo,
      seed,
      QUIZ_OPTION_COUNT - 1,
    );
    if (distractors.length < QUIZ_OPTION_COUNT - 1) continue;

    asked.add(key);
    const options = seededShuffle([meaning, ...distractors], seed ^ 0x9e3779b9);
    questions.push({
      position,
      question: {
        id,
        word: item.en,
        sentenceId: sentence.id,
        options,
        answerIndex: options.indexOf(meaning),
      },
    });
  }

  return questions.sort((a, b) => a.position - b.position).map(({ question }) => question);
}
