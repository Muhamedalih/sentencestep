import { resolveVocabularySupportText } from "@/lib/content-helpers";
import type { SupportLocale } from "@/lib/i18n/locales";
import type { LearningMode, VocabularyItem } from "@/types/content";
import { BLANK_TOKEN } from "@/types/word-lists";

/**
 * The words step at the end of a story (see StoryWordsPanel): the story's own target words, shown
 * once as in Word Lists' Learn view and then typed one by one, exactly like Word Lists' practice.
 * Everything in it that has nothing to do with React lives here so it can be tested on its own:
 * whether the step is asked at all, how a word is found in the story to be shown or blanked, and
 * the requeue-until-right run the typing test follows.
 */

/** How a word of the test ended: typed right the first time it was asked, or only after at least one miss. */
export type StoryWordOutcome = "first" | "retried";

/** Word id -> how it ended. A word the learner has not finished has no entry. */
export type StoryWordOutcomes = Readonly<Record<string, StoryWordOutcome>>;

/** Everything that decides whether the words step follows the last sentence of a lesson. */
export interface StoryWordsStepGate {
  mode: LearningMode;
  /** How many target words the story has. */
  vocabularyCount: number;
  /** The admin content preview: nobody is learning there, and it records nothing, so it is never held up by a test. */
  previewMode: boolean;
  /** The opening lesson ends on its own pitch screen. */
  isOpeningLesson: boolean;
  /** A step of Today's session: the session asks the words itself right after the story. */
  todayStep: boolean;
  /** The new lesson ending owns the whole finish screen. */
  usesSessionEnd: boolean;
}

/** True when the learner must go through the story's words before the completion page. */
export function storyWordsStepApplies(gate: StoryWordsStepGate): boolean {
  return (
    gate.mode === "stories" &&
    gate.vocabularyCount > 0 &&
    !gate.previewMode &&
    !gate.isOpeningLesson &&
    !gate.todayStep &&
    !gate.usesSessionEnd
  );
}

/**
 * What a word means in the learner's language, or null when there is nothing to tell: the support
 * text falls back to the English word itself when a translation is missing (see
 * resolveVocabularySupportText), and the answer shown as its own clue is no clue.
 */
export function wordMeaning(item: VocabularyItem, locale: SupportLocale | null): string | null {
  const text = resolveVocabularySupportText(item, locale).trim();
  return text !== "" && text.toLowerCase() !== item.en.trim().toLowerCase() ? text : null;
}

/** A word as it sits in running text, without the punctuation glued to it: "rain," -> "rain". Apostrophes inside stay. */
export function stripWordPunctuation(word: string): string {
  return word.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, "");
}

/** A sentence split around one word: the text before, the punctuation glued in front of the word, the word, the punctuation glued after it, the text after. */
export interface WordInSentence {
  prefix: string;
  lead: string;
  word: string;
  tail: string;
  suffix: string;
}

/**
 * The first sentence that holds `target` as a whole word (any case; "rain" is not in "rainbow"),
 * split around that word. Null when no sentence holds it. The same matching rule that decided the
 * story's target words in the first place (see applyCuratedStoryVocabulary), so every target word
 * of a story is found here.
 */
export function findWordInSentences(
  target: string,
  sentences: readonly { en: string }[],
): WordInSentence | null {
  const wanted = target.toLowerCase();
  for (const sentence of sentences) {
    const tokens = sentence.en.split(/\s+/);
    const index = tokens.findIndex((token) => stripWordPunctuation(token).toLowerCase() === wanted);
    if (index === -1) continue;
    const token = tokens[index]!;
    const word = stripWordPunctuation(token);
    const start = token.indexOf(word);
    return {
      prefix: tokens.slice(0, index).join(" "),
      lead: token.slice(0, start),
      word,
      tail: token.slice(start + word.length),
      suffix: tokens.slice(index + 1).join(" "),
    };
  }
  return null;
}

/**
 * That sentence with BLANK_TOKEN where the word was — the shape VocabularySentence takes (see its
 * `sentence` prop). The punctuation next to the word stays, so "in the rain." becomes "in the ___.".
 * Null when no sentence holds the word.
 */
export function blankSentenceFor(
  target: string,
  sentences: readonly { en: string }[],
): string | null {
  const found = findWordInSentences(target, sentences);
  if (!found) return null;
  return [found.prefix, `${found.lead}${BLANK_TOKEN}${found.tail}`, found.suffix]
    .filter(Boolean)
    .join(" ");
}

/**
 * One run of the typing test. Every word of the story is asked once; a word typed wrong goes to the
 * back of the queue and comes round again after the rest, for as long as it keeps coming back wrong
 * (what Word Lists' practice does within a block). A run is a plain value: each answer returns the
 * next one.
 */
export interface WordsRun {
  /** Word ids still to be typed right; the first is on screen. Each id is in it once. */
  readonly queue: readonly string[];
  /** Word ids missed at least once in this run. */
  readonly missed: readonly string[];
  /** How the words typed right ended. */
  readonly outcomes: StoryWordOutcomes;
  /** How many answers there have been, right or wrong: tells apart two times the same word is asked. */
  readonly asked: number;
}

export function startWordsRun(ids: readonly string[]): WordsRun {
  return { queue: [...new Set(ids)], missed: [], outcomes: {}, asked: 0 };
}

/** The word on screen answered: right retires it, wrong sends it to the back. An empty run stays as it is. */
export function answerWord(run: WordsRun, correct: boolean): WordsRun {
  const [current, ...rest] = run.queue;
  if (current === undefined) return run;
  if (correct) {
    const outcome: StoryWordOutcome = run.missed.includes(current) ? "retried" : "first";
    return {
      queue: rest,
      missed: run.missed,
      outcomes: { ...run.outcomes, [current]: outcome },
      asked: run.asked + 1,
    };
  }
  return {
    queue: [...rest, current],
    missed: run.missed.includes(current) ? run.missed : [...run.missed, current],
    outcomes: run.outcomes,
    asked: run.asked + 1,
  };
}

/** Every word has been typed right. */
export function isRunFinished(run: WordsRun): boolean {
  return run.queue.length === 0;
}
