/**
 * Word Lists: vocabulary practice, organized Level > Group > Word — a
 * sibling feature to the three LearningModes (normal/stories/conversation),
 * not a fourth mode. Deliberately its own shape rather than reused
 * LessonUnit/Sentence types: a vocabulary word is "one target word taught
 * through one context sentence," not a multi-sentence typing lesson, and
 * conflating the two would force either shape to carry fields it doesn't
 * need. See Sentence.wordTranslations in src/types/content.ts for a
 * related-but-different concept — that's a word-by-word gloss of an
 * already-complete sentence; this is a single blanked-out target word a
 * learner produces from context.
 */

/** The token a word's `sentence` uses in place of the target word — see splitOnBlank in src/lib/word-lists.ts. */
export const BLANK_TOKEN = "___";

/**
 * The admin CMS's reference/default word count for a new group — no longer
 * a hard invariant every group satisfies (some groups now carry more, up to
 * 30, where the topic genuinely supports it; see the word-lists content
 * expansion). WordGroupSummary.wordCount is the real per-group count (see
 * fetchWordGroupSummaries, which reads it via a service-role query
 * specifically so a locked group's true count is never misreported as 0)
 * — never assume every group equals this constant.
 */
export const WORDS_PER_GROUP = 20;

export interface VocabularyWord {
  id: string;
  groupId: string;
  /** Display/typing order within the group, lowest first. */
  order: number;
  /** The answer — always lowercase; the typing comparison is case-insensitive anyway (see isCorrectChar), but keeping the stored form consistent avoids "Aunt" vs "aunt" showing up in two places. */
  targetWord: string;
  /** English context sentence containing exactly one BLANK_TOKEN where targetWord belongs. Never shown with the blank already filled. */
  sentence: string;
  /** Short Arabic explanation of the WORD's meaning — not a translation of the whole sentence. See BLANK_TOKEN's doc comment for the distinction this file's whole design is built around. */
  hintAr: string;
  /** Same locale-resolution rules as Sentence.supportText in src/types/content.ts — the word's hint in the request's active support locale, only populated when the fetch layer was given a locale. */
  supportHint?: string;
  /** Pre-resolved Kokoro pronunciation URL for this word, when already cached — set server-side only for the group's first word (see WordGroupPracticePage), the same "skip the on-demand round trip when we already know the answer" fix as Sentence.audioUrl. Absent/null is normal; PronunciationButton falls back to its existing on-demand resolve. */
  audioUrl?: string | null;
}

export interface WordGroup {
  id: string;
  /** 1 = Beginner, 2 = Intermediate, 3 = Advanced — same tier semantics as LessonUnit.level / src/lib/levels.ts's difficultyForLevel, so existing level UI/labels apply unchanged. */
  level: number;
  order: number;
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  /** Same locale-resolution rules as Sentence.supportText in src/types/content.ts. */
  supportTitle?: string;
  /** Same locale-resolution rules as Sentence.supportText in src/types/content.ts. */
  supportDescription?: string;
  isFree: boolean;
  words: VocabularyWord[];
}

/**
 * A group without its words loaded — what the library page needs (word
 * count and ids for progress counting, not the full sentence/hint
 * content, which is gated and only fetched once the learner actually
 * opens the group).
 */
export type WordGroupSummary = Omit<WordGroup, "words"> & { wordCount: number; wordIds: string[] };
