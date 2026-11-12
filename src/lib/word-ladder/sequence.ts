import { seededShuffle } from "@/lib/word-ladder/random";
import type { WordOutcome } from "@/lib/word-mastery/schedule";

/** The five steps of a round, in order: meet the words, choose the meaning, hear and choose the spelling, put the letters in order, hear and type. */
export const LADDER_STEPS = ["meet", "meaning", "listen", "letters", "type"] as const;
export type LadderStep = (typeof LADDER_STEPS)[number];

/** One screen of a round: a step asked about one word. `retry` marks the one more go a miss earns at the end. */
export interface LadderCard {
  wordId: string;
  step: LadderStep;
  retry: boolean;
}

/** What a word needs to be asked in each step (the rest of a word's data does not matter here). */
export interface SteppedWord {
  id: string;
  word: string;
  meaningOptions: readonly string[];
  spellingOptions: readonly string[];
}

/** Letters a word can be scrambled from: plain lowercase letters, 3 to 14 of them, at least two different. */
export function canScramble(word: string): boolean {
  return /^[a-z]{3,14}$/.test(word) && new Set(word).size >= 2;
}

/** The steps a word goes through: the meaning and the listening steps need at least one wrong choice to be a question, the letters step needs a word that can be scrambled. Meeting and typing are always asked. */
export function stepsFor(word: SteppedWord): LadderStep[] {
  return LADDER_STEPS.filter((step) => {
    if (step === "meaning") return word.meaningOptions.length >= 2;
    if (step === "listen") return word.spellingOptions.length >= 2;
    if (step === "letters") return canScramble(word.word);
    return true;
  });
}

/**
 * The queue of a round, step by step: the step-1 screens of every word, then the step-2 screens of
 * every word, and so on, so a word comes back after the others instead of five times in a row (the
 * same word asked again and again is answered from the short-term memory and teaches little). The
 * words of a step after the first come in a seeded order, and a step never opens with the word the
 * step before it ended on.
 */
export function buildQueue(words: readonly SteppedWord[], seed: string): LadderCard[] {
  const queue: LadderCard[] = [];
  for (const step of LADDER_STEPS) {
    const asked = words.filter((word) => stepsFor(word).includes(step));
    if (asked.length === 0) continue;
    const ordered = step === "meet" ? [...asked] : seededShuffle(asked, `${seed}:${step}`);
    const last = queue[queue.length - 1];
    if (last && ordered.length > 1 && ordered[0]!.id === last.wordId) {
      [ordered[0], ordered[1]] = [ordered[1]!, ordered[0]!];
    }
    for (const word of ordered) queue.push({ wordId: word.id, step, retry: false });
  }
  return queue;
}

/** What a miss earns: the same screen once more at the end of the round, and only once. */
export function retryOf(card: LadderCard): LadderCard | null {
  if (card.retry || card.step === "meet") return null;
  return { ...card, retry: true };
}

/** How one word went through the round. */
export interface WordRun {
  /** Misses in the steps before the typed one (and in a retry of them). */
  earlierMisses: number;
  /** The first typed answer: right (true), wrong (false) or not given yet (null). */
  typedFirst: boolean | null;
}

/**
 * The outcome the learner's records get for a word: wrong on the first typed answer is `missed`;
 * right with a miss somewhere earlier in the round is `assisted` (it needed another look); right
 * all the way is `clean`. Null until the typed step has been answered. Only the typed step counts as
 * "learned": the choices and the letters are scaffolding.
 */
export function ladderOutcome(run: WordRun): WordOutcome | null {
  if (run.typedFirst === null) return null;
  if (!run.typedFirst) return "missed";
  return run.earlierMisses > 0 ? "assisted" : "clean";
}
