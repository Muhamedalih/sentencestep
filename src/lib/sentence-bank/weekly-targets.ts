import { MIN_REVIEW_WORDS, reviewWordCount } from "@/lib/sentence-bank/select";
import type { SentenceCandidate } from "@/lib/sentence-bank/select";

/**
 * Sentence bank: which sentences of a story the weekly check may ask. The check is about what each
 * story set out to teach, so it asks the sentences that hold the story's TARGET words (the two or
 * three words its recap lists and the day's words step quizzes), one sentence for each word, and
 * nothing else of that story. A story with no target words on record, or none that can be found in
 * its sentences, falls back to all its sentences, so it never silently drops out of the check.
 * Pure — the loader hands in the stories' target words.
 */

/** A word as the story's own text spells it: no punctuation round it, lower case ("Fly," → "fly"). */
function spelled(rawWord: string): string {
  return rawWord.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, "").toLowerCase();
}

/**
 * The sentences that carry the given target words, in story order, one per word: for each word, the
 * first sentence that holds it and is long enough to be asked (a "Run!" tests nothing); a word whose
 * sentence is already chosen for another word needs no sentence of its own, and one that appears
 * nowhere askable gives none.
 */
export function targetSentenceIds(
  words: readonly string[],
  sentences: readonly { id: string; en: string; orderIndex: number }[],
): string[] {
  const ordered = [...sentences].sort(
    (a, b) => a.orderIndex - b.orderIndex || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
  const holds = (en: string, word: string) => en.split(/\s+/).some((raw) => spelled(raw) === word);
  const chosen: string[] = [];
  for (const rawWord of words) {
    const word = spelled(rawWord);
    if (!word) continue;
    if (chosen.some((id) => holds(ordered.find((line) => line.id === id)!.en, word))) continue;
    const line = ordered.find(
      (candidate) => reviewWordCount(candidate.en) >= MIN_REVIEW_WORDS && holds(candidate.en, word),
    );
    if (line) chosen.push(line.id);
  }
  return ordered.filter((line) => chosen.includes(line.id)).map((line) => line.id);
}

/**
 * The ids of the sentences the check may ask, over all the stories of the week: for each story its
 * target-word sentences, or every sentence of it when it has no target words (or none can be found).
 * `targets` is story id → its target words.
 */
export function weeklyFocusIds(
  candidates: readonly SentenceCandidate[],
  targets: ReadonlyMap<string, readonly string[]>,
): Set<string> {
  const byLesson = new Map<string, SentenceCandidate[]>();
  for (const sentence of candidates) {
    const list = byLesson.get(sentence.lessonId);
    if (list) list.push(sentence);
    else byLesson.set(sentence.lessonId, [sentence]);
  }
  const focus = new Set<string>();
  for (const [lessonId, sentences] of byLesson) {
    const found = targetSentenceIds(targets.get(lessonId) ?? [], sentences);
    for (const id of found.length > 0 ? found : sentences.map((sentence) => sentence.id)) {
      focus.add(id);
    }
  }
  return focus;
}
