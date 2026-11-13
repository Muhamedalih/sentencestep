import { seededShuffle } from "@/lib/word-ladder/random";
import type { WordOutcome } from "@/lib/word-mastery/schedule";

/**
 * The five steps of a round, in the order a word meets them: (1) the word with its meaning and its
 * sound, (2) the word with four meanings to choose from, (3) the word's scrambled letters put in
 * order, (4) the word's sound and four spellings to choose from, (5) the word's sound and the
 * learner types it.
 */
export const LADDER_STEPS = ["meet", "meaning", "letters", "listen", "type"] as const;
export type LadderStep = (typeof LADDER_STEPS)[number];

/**
 * One screen of a round: a step asked about one word. A word answered wrong earns the same screen
 * again a few screens later: `retry` marks that go and `tries` counts the goes it follows (0 for the
 * screen of the round itself).
 */
export interface LadderCard {
  wordId: string;
  step: LadderStep;
  retry: boolean;
  tries: number;
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
    if (step === "letters") return canScramble(word.word);
    if (step === "listen") return word.spellingOptions.length >= 2;
    return true;
  });
}

/**
 * What the progress bar of a round counts: learning (steps 1 to 3, the words one after the other),
 * then the hearing test (step 4) and the typed test (step 5).
 */
export const LADDER_PHASES = ["learn", "listen", "type"] as const;
export type LadderPhase = (typeof LADDER_PHASES)[number];

export function phaseOf(step: LadderStep): LadderPhase {
  return step === "listen" || step === "type" ? step : "learn";
}

/** A piece of the learning part: word `w` is introduced (met, then asked its meaning), or its letters are put in order. */
type LearnToken = { word: number; kind: "intro" | "letters" };

const intro = (word: number): LearnToken => ({ word, kind: "intro" });
const letters = (word: number): LearnToken => ({ word, kind: "letters" });

/**
 * The order of the learning part, for a round of `count` words (A, B, C, D). With four: A is met and
 * asked its meaning, then B, then C; then A's letters, then B's; then D is met and asked its meaning;
 * then C's letters, then D's. So each word comes back after others, the fourth word joins in the
 * middle instead of waiting at the end, and no word is met twice in a row. Three words: the same
 * without D. More than four (a round is never that long) carries on one word at a time.
 */
export function learnOrder(count: number): LearnToken[] {
  if (count <= 0) return [];
  if (count === 1) return [intro(0), letters(0)];
  if (count === 2) return [intro(0), intro(1), letters(0), letters(1)];
  if (count === 3) return [intro(0), intro(1), intro(2), letters(0), letters(1), letters(2)];
  const order = [
    intro(0),
    intro(1),
    intro(2),
    letters(0),
    letters(1),
    intro(3),
    letters(2),
    letters(3),
  ];
  for (let word = 4; word < count; word++) order.push(intro(word), letters(word));
  return order;
}

/**
 * The queue of a round: the learning part (see learnOrder), then the hearing test over every word in
 * a seeded order, then the typed test over every word in another seeded order. A test never opens
 * with the word the screen before it was about.
 */
export function buildQueue(
  words: readonly SteppedWord[],
  seed: string,
  /** A round of one word (opened from the words list) leaves the hearing test out: four steps, not five. */
  skipListen = false,
): LadderCard[] {
  const queue: LadderCard[] = [];
  const card = (wordId: string, step: LadderStep): LadderCard => ({
    wordId,
    step,
    retry: false,
    tries: 0,
  });

  for (const token of learnOrder(words.length)) {
    const word = words[token.word]!;
    const steps = stepsFor(word);
    if (token.kind === "intro") {
      queue.push(card(word.id, "meet"));
      if (steps.includes("meaning")) queue.push(card(word.id, "meaning"));
    } else if (steps.includes("letters")) {
      queue.push(card(word.id, "letters"));
    }
  }

  for (const step of skipListen ? (["type"] as const) : (["listen", "type"] as const)) {
    const asked = words.filter((word) => stepsFor(word).includes(step));
    if (asked.length === 0) continue;
    const ordered = seededShuffle(asked, `${seed}:${step}`);
    const last = queue[queue.length - 1];
    if (last && ordered.length > 1 && ordered[0]!.id === last.wordId) {
      [ordered[0], ordered[1]] = [ordered[1]!, ordered[0]!];
    }
    for (const word of ordered) queue.push(card(word.id, step));
  }
  return queue;
}

/** The exam after a round: every word heard and typed, in a seeded order, nothing else. */
export function buildExamQueue(words: readonly SteppedWord[], seed: string): LadderCard[] {
  return seededShuffle(words, `${seed}:exam`).map((word) => ({
    wordId: word.id,
    step: "type" as const,
    retry: false,
    tries: 0,
  }));
}

/** How many other screens come between a miss and the screen that asks it again. */
export const RETRY_LAG = 3;
/** How many times a missed screen is asked again (after the second, the round moves on). */
export const MAX_RETRIES = 2;

/**
 * What a miss earns: the same screen again, a few screens later (see scheduleRetry), and again once
 * more if that goes wrong too. The meeting is not a question, so it earns nothing.
 */
export function retryOf(card: LadderCard): LadderCard | null {
  if (card.step === "meet" || card.tries >= MAX_RETRIES) return null;
  return { ...card, retry: true, tries: card.tries + 1 };
}

/**
 * Puts a retry into the queue `lag` screens after the one being answered (`pos`): late enough that
 * the answer has to be recalled and not just repeated, early enough that it has not been forgotten
 * (a screen asked again at the very end of a round is asked after the learner has stopped thinking
 * about it). With fewer screens left than that it goes to the end.
 */
export function scheduleRetry(
  queue: readonly LadderCard[],
  pos: number,
  card: LadderCard,
  lag: number = RETRY_LAG,
): LadderCard[] {
  const at = Math.min(queue.length, pos + 1 + lag);
  return [...queue.slice(0, at), card, ...queue.slice(at)];
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
