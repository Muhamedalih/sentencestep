import { seededShuffle } from "@/lib/word-ladder/random";
import type { WordOutcome } from "@/lib/word-mastery/schedule";

/** The five kinds of screen of a round: meet a word, choose its meaning, hear and choose its spelling, put its letters in order, hear and type it. */
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
 * What the progress bar of a round counts: the introductions (each word met and asked its meaning
 * right away), then the three tests.
 */
export const LADDER_PHASES = ["intro", "listen", "letters", "type"] as const;
export type LadderPhase = (typeof LADDER_PHASES)[number];

export function phaseOf(step: LadderStep): LadderPhase {
  return step === "meet" || step === "meaning" ? "intro" : step;
}

/**
 * The queue of a round. Each word is introduced on its own and asked what it means at once: the
 * first word with its meaning, then its four choices, then the second word the same way, then the
 * third. After the introductions come the tests, test by test: every word heard and chosen, every
 * word's letters put in order, every word heard and typed. So a test brings a word back after the
 * others instead of the same word again and again (answered from the short-term memory, it teaches
 * little). The words of a test come in a seeded order, and a test never opens with the word the
 * screen before it was about.
 */
export function buildQueue(words: readonly SteppedWord[], seed: string): LadderCard[] {
  const queue: LadderCard[] = [];
  for (const word of words) {
    const steps = stepsFor(word);
    queue.push({ wordId: word.id, step: "meet", retry: false });
    if (steps.includes("meaning")) queue.push({ wordId: word.id, step: "meaning", retry: false });
  }
  for (const step of ["listen", "letters", "type"] as const) {
    const asked = words.filter((word) => stepsFor(word).includes(step));
    if (asked.length === 0) continue;
    const ordered = seededShuffle(asked, `${seed}:${step}`);
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
