import type { ReviewWord } from "@/components/learning/word-review-session";
import { normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { splitAroundWord } from "@/lib/passages/text";
import type { PassageWord } from "@/lib/passages/types";
import { isImportantWord } from "@/lib/today/important-words";
import { buildBlankSentence } from "@/lib/vocabulary-recall/blank-sentence";
import { parseVocabularyItemId } from "@/lib/vocabulary-recall/item-id";
import { BLANK_TOKEN } from "@/types/word-lists";
import type { VocabularyItem } from "@/types/content";

/**
 * Today's words step is the same session's own words and nothing else: the TARGET words of today's
 * story (two or three) and, for the places left of the five, those of today's passage — the ones
 * Home shows for the day, finished or not yet. Pure — session-words-load.ts finds the lessons and reads them, this turns their target
 * words into the review words the step quizzes (each with its sentence blanked out and a small "from
 * today's story" line, ReviewWord.fromToday, so the link is visible) and decides which of them make
 * the five. No word of the Words section or of any other source is ever added to them.
 *
 * Every word of the step is also heard in a RECORDED voice and never the browser's: the loader hands
 * each candidate the clip it plays (`audioUrl` — a story's word its own ElevenLabs clip, the same
 * the Stories words screen plays) and a word with no clip is not a candidate at all (withClips,
 * playableOnly).
 */

/** The story gives at most this many of the five; its own target vocabulary is two or three words anyway. */
export const STORY_WORDS_MAX = 3;

/** A candidate word and where it sits in its story or passage (the index of its sentence), so words that sit close together can be picked as one related group. */
export interface PositionedWord {
  word: ReviewWord;
  position: number;
}

/**
 * Where one target word sits in the story: its sentence (an index into `sentences`) and its place
 * among that sentence's whitespace-split words. Derived vocabulary says so in its id
 * (`<sentence>-vocab-<wordIndex>`); a curated story's ids (story-79..198, the ones in use) carry the
 * word itself (`story-121-vocab-burnout`), so the word's first occurrence in the story's own
 * sentences is found instead. Null when it cannot be placed.
 */
function locateStoryWord(
  item: { id: string; en: string },
  sentences: readonly { id: string; en: string }[],
  indexById: ReadonlyMap<string, number>,
): { index: number; wordIndex: number } | null {
  const parsed = parseVocabularyItemId(item.id);
  if (parsed) {
    const index = indexById.get(parsed.sentenceId);
    return index === undefined ? null : { index, wordIndex: parsed.wordIndex };
  }
  if (!item.id.includes("-vocab-")) return null;
  const target = normalizeMistakeWord(item.en);
  for (let index = 0; index < sentences.length; index++) {
    const wordIndex = sentences[index]!.en.split(/\s+/).findIndex(
      (word) => normalizeMistakeWord(word) === target,
    );
    if (wordIndex !== -1) return { index, wordIndex };
  }
  return null;
}

/** Every important target word of the story (its `lesson.vocabulary`), each with the story sentence it sits in blanked out. They are the very words the story's Vocabulary Recall encounters were made from, so finishing one advances that schedule. */
export function storyWordCandidates(lesson: {
  title: string;
  sentences: readonly { id: string; en: string }[];
  vocabulary?: readonly VocabularyItem[];
}): PositionedWord[] {
  const indexById = new Map(lesson.sentences.map((sentence, index) => [sentence.id, index]));
  const candidates: PositionedWord[] = [];
  for (const item of lesson.vocabulary ?? []) {
    const targetWord = normalizeMistakeWord(item.en);
    const place = locateStoryWord(item, lesson.sentences, indexById);
    if (!place || !isImportantWord(targetWord)) continue;
    const { index, wordIndex } = place;
    const sentence = lesson.sentences[index]!;
    const blanked = buildBlankSentence(sentence.en, wordIndex);
    if (!blanked.includes(BLANK_TOKEN)) continue;
    candidates.push({
      position: index,
      word: {
        id: `recall-${targetWord}`,
        groupId: "recall",
        order: 0,
        targetWord,
        sentence: blanked,
        hintAr: item.ar,
        supportHint: item.supportText ?? item.ar,
        reason: "review",
        lessonTitle: lesson.title,
        fromToday: "story",
        // The real, synthesized isolated-word pipeline, as for every Vocabulary Recall word.
        pronunciationContentType: "sentence_word",
        pronunciationContentId: `${sentence.id}::${targetWord}`,
      },
    });
  }
  return candidates;
}

/**
 * Every important target word of the passage (the word lesson it hands over at its end) that can be
 * shown inside the passage line it appears in, each with that line blanked out. Empty for a passage
 * with no word lesson: there is nothing to complete them against.
 */
export function passageWordCandidates(passage: {
  title: string;
  wordGroupId: string | null;
  words: readonly PassageWord[];
  sections: readonly { sentences: readonly { en: string }[] }[];
}): PositionedWord[] {
  if (!passage.wordGroupId) return [];
  const lines = passage.sections.flatMap((section) => section.sentences.map((line) => line.en));
  const candidates: PositionedWord[] = [];
  for (const entry of passage.words) {
    const parts = entry.contextEn ? splitAroundWord(entry.contextEn, entry.word) : null;
    if (!parts || !isImportantWord(entry.word)) continue;
    const at = lines.indexOf(entry.contextEn ?? "");
    candidates.push({
      // A line that cannot be found (the clip it came from changed) counts as the end of the passage.
      position: at === -1 ? lines.length : at,
      word: {
        id: entry.id,
        groupId: passage.wordGroupId,
        order: 0,
        targetWord: entry.word,
        sentence: `${parts[0]}${BLANK_TOKEN}${parts[2]}`,
        hintAr: entry.hintAr,
        supportHint: entry.hintAr,
        reason: "review",
        lessonTitle: passage.title,
        fromToday: "passage",
        audioUrl: entry.audioUrl,
      },
    });
  }
  return candidates;
}

/**
 * Gives every candidate that has no clip yet the one `clipFor` names for it; a candidate that
 * already carries a clip (a passage word comes with its own) keeps it. Nothing is dropped here — a
 * word that no source could voice stays without one, and playableOnly leaves it out.
 */
export function withClips(
  candidates: readonly PositionedWord[],
  clipFor: (word: ReviewWord) => string | null | undefined,
): PositionedWord[] {
  return candidates.map(({ word, position }) => ({
    position,
    word: { ...word, audioUrl: word.audioUrl || clipFor(word) || null },
  }));
}

/**
 * The candidates that have a recorded clip. A word with none is not asked: a shorter round is better
 * than a word spoken by the browser's own voice, which is what the step used to fall back to.
 */
export function playableOnly(candidates: readonly PositionedWord[]): PositionedWord[] {
  return candidates.filter(({ word }) => Boolean(word.audioUrl));
}

/**
 * The `count` words that sit closest together in the story (or passage): words from one stretch of
 * the text belong to one scene, so they are the most related to each other that can be told without
 * understanding them. The window of `count` neighbours (in text order) with the smallest spread of
 * sentences wins, the earliest on a tie; when there are no more than `count` candidates, all of them,
 * in text order. A word listed twice counts once.
 */
export function closestWords(
  candidates: readonly PositionedWord[],
  count: number,
): PositionedWord[] {
  const wanted = Math.max(0, Math.trunc(count));
  if (wanted === 0) return [];
  const seen = new Set<string>();
  const unique = candidates.filter((entry) => {
    const key = normalizeMistakeWord(entry.word.targetWord);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const sorted = unique.sort((a, b) => a.position - b.position);
  if (sorted.length <= wanted) return sorted;
  let best = 0;
  let bestSpread = Number.POSITIVE_INFINITY;
  for (let start = 0; start + wanted <= sorted.length; start++) {
    const spread = sorted[start + wanted - 1]!.position - sorted[start]!.position;
    if (spread < bestSpread) {
      best = start;
      bestSpread = spread;
    }
  }
  return sorted.slice(best, best + wanted);
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other]!, result[index]!];
  }
  return result;
}

const wordKey = (entry: PositionedWord) => normalizeMistakeWord(entry.word.targetWord);

/** Which candidates make a round of `size`, not yet shuffled: the story's (up to STORY_WORDS_MAX, then any the passage cannot fill) and the passage's. */
function chooseSessionWords(args: {
  story: readonly PositionedWord[];
  passage: readonly PositionedWord[];
  size: number;
}): { story: PositionedWord[]; passage: PositionedWord[] } {
  const size = Math.max(0, Math.trunc(args.size));
  const fromStory = closestWords(args.story, Math.min(STORY_WORDS_MAX, size));
  const taken = new Set(fromStory.map(wordKey));
  const fromPassage = closestWords(
    args.passage.filter((entry) => !taken.has(wordKey(entry))),
    size - fromStory.length,
  );
  // A passage with too few words for its places: the story fills them (still only the session's own
  // words), so the round stays at `size` whenever the two together have that many.
  const passageKeys = new Set(fromPassage.map(wordKey));
  const storyTopUp = closestWords(
    args.story.filter((entry) => !taken.has(wordKey(entry)) && !passageKeys.has(wordKey(entry))),
    size - fromStory.length - fromPassage.length,
  );
  return { story: [...fromStory, ...storyTopUp], passage: fromPassage };
}

/**
 * The words of the round, in a random order: the story's target words (two or three: up to
 * STORY_WORDS_MAX, the closest together) and then, for the places left of `size`, the passage's
 * closest-together target words — so a story with two gives the passage three places, a story with
 * three gives it two (and when the passage has too few, the story gives more than three). Nothing
 * else is ever added: with too few of the two together, the round is just shorter.
 * The story's words complete as Vocabulary Recall words, the passage's as Word Lists words.
 */
export function sessionWords(args: {
  story: readonly PositionedWord[];
  passage: readonly PositionedWord[];
  size: number;
  random?: () => number;
}): ReviewWord[] {
  const chosen = chooseSessionWords(args);
  return shuffled(
    [
      ...chosen.story.map((entry): ReviewWord => ({ ...entry.word, sessionSource: "recall" })),
      ...chosen.passage.map((entry): ReviewWord => ({ ...entry.word, sessionSource: "wordList" })),
    ],
    args.random ?? Math.random,
  );
}

/**
 * The target words of today's story and passage that the first round of `size` did not ask — what
 * "5 more words" is made of, so the extra round too holds only the session's own words. A word the
 * first round asked is gone from both lists, whichever of the two it was listed in.
 */
export function sessionLeftovers(args: {
  story: readonly PositionedWord[];
  passage: readonly PositionedWord[];
  size: number;
}): { story: PositionedWord[]; passage: PositionedWord[] } {
  const chosen = chooseSessionWords(args);
  const asked = new Set([...chosen.story, ...chosen.passage].map(wordKey));
  const rest = (entries: readonly PositionedWord[]) =>
    entries.filter((entry) => !asked.has(wordKey(entry)));
  return { story: rest(args.story), passage: rest(args.passage) };
}
