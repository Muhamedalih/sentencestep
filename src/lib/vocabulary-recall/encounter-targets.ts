import { normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { MAX_STORY_ENCOUNTERS } from "@/lib/vocabulary-recall/constants";
import { locateVocabularyItem } from "@/lib/vocabulary-recall/item-id";
import type { Lesson, VocabularyItem } from "@/types/content";

/** One word a finished lesson hands to Vocabulary Recall, with the sentence the learner met it in. */
export interface EncounterTarget {
  /** Normalized the exact same way resolvePronunciationAudioAction's "sentence_word" lookup re-derives a word from the live sentence (see record-encounters.ts). */
  word: string;
  ar: string;
  sentenceId: string;
  sentenceEn: string;
  /** Index into the sentence's whitespace-split words. */
  wordIndex: number;
}

/**
 * The words a finished Normal lesson or Story hands to Vocabulary Recall (pure — the write is
 * record-encounters.ts). Each target word is placed in its sentence by locateVocabularyItem: a
 * Normal lesson's carry their place in their id; a curated story's carry the word itself
 * (`story-121-vocab-burnout`), so the word is looked up in the story's own sentences, exactly as
 * Today's words step does. Before that lookup was shared every story word was skipped, and no story
 * had ever put a word into Recall.
 *
 * A story gives at most MAX_STORY_ENCOUNTERS words (the first that can be placed, in the order of
 * its vocabulary); a Normal lesson gives all of its words, as it always did. A word that cannot be
 * placed, or that repeats one already taken, is left out.
 *
 * `stories` says whether a story hands over anything at all: it is the "storyRecall" permission of
 * the learner who finished it (Admins only until the owner opens it), because the words a story adds
 * show up for the learner (the Recall card on the Stories page). Closed, a story gives nothing, as it
 * did before the lookup was shared; a Normal lesson is not affected either way. Required, so every
 * caller has to decide.
 */
export function encounterTargets(
  lesson: {
    mode: Lesson["mode"];
    vocabulary?: readonly VocabularyItem[];
    sentences: readonly { id: string; en: string }[];
  },
  options: { stories: boolean },
): EncounterTarget[] {
  if (lesson.mode !== "normal" && lesson.mode !== "stories") return [];
  if (lesson.mode === "stories" && !options.stories) return [];
  if (!lesson.vocabulary || lesson.vocabulary.length === 0) return [];
  const max = lesson.mode === "stories" ? MAX_STORY_ENCOUNTERS : Number.POSITIVE_INFINITY;

  const indexById = new Map(lesson.sentences.map((sentence, index) => [sentence.id, index]));
  const taken = new Set<string>();
  const targets: EncounterTarget[] = [];
  for (const item of lesson.vocabulary) {
    if (targets.length >= max) break;
    const place = locateVocabularyItem(item, lesson.sentences, indexById);
    if (!place) continue;
    const word = normalizeMistakeWord(item.en);
    if (!word || taken.has(word)) continue;
    const sentence = lesson.sentences[place.index]!;
    taken.add(word);
    targets.push({
      word,
      ar: item.ar,
      sentenceId: sentence.id,
      sentenceEn: sentence.en,
      wordIndex: place.wordIndex,
    });
  }
  return targets;
}
