/**
 * Pure rules behind Home's "Today's session": three steps in a fixed order — listen to a passage,
 * type a story, type five words — and where the learner is in them today. No I/O: the loader
 * (load.ts) reads what is open and what was finished today, this only arranges it.
 */

export const STEP_KINDS = ["listen", "story", "words"] as const;
export type StepKind = (typeof STEP_KINDS)[number];

/** Words in one round of the words step; "5 more" starts another round. */
export const WORDS_PER_ROUND = 5;
/** About 20 seconds a word. */
export const WORDS_MINUTES = 2;

export interface StepInput {
  /** Something open to this learner exists for the step (a passage, a story, words to do). */
  available: boolean;
  /** Finished today. */
  done: boolean;
  minutes: number;
}

export interface StepPlan {
  kind: StepKind;
  done: boolean;
  minutes: number;
}

export interface TodayPlan {
  /** The steps that exist for this learner today (open, or already done), in order. */
  steps: StepPlan[];
  /** The first step not done yet, or null when every step is done (or none exists). */
  current: StepKind | null;
  remainingMinutes: number;
  totalMinutes: number;
  /** Every step that exists is done. */
  allDone: boolean;
}

/**
 * `sessionDone`: the learner already reached the finish screen today, so every step that exists
 * counts as done whatever the per-step records say.
 */
export function planToday(input: Record<StepKind, StepInput>, sessionDone: boolean): TodayPlan {
  const steps: StepPlan[] = STEP_KINDS.filter(
    (kind) => input[kind].available || input[kind].done,
  ).map((kind) => ({
    kind,
    done: sessionDone || input[kind].done,
    minutes: input[kind].minutes,
  }));
  const pending = steps.filter((step) => !step.done);
  return {
    steps,
    current: pending[0]?.kind ?? null,
    remainingMinutes: pending.reduce((sum, step) => sum + step.minutes, 0),
    totalMinutes: steps.reduce((sum, step) => sum + step.minutes, 0),
    allDone: steps.length > 0 && pending.length === 0,
  };
}

export const DEFAULT_WPM = 18;

/** The learner's typing speed: the median of their recent attempts, a default when there are none. */
export function medianWpm(values: readonly (number | null)[]): number {
  const usable = values
    .filter((value): value is number => typeof value === "number" && value >= 5 && value <= 150)
    .sort((a, b) => a - b);
  if (usable.length === 0) return DEFAULT_WPM;
  const middle = Math.floor(usable.length / 2);
  return Math.round(
    usable.length % 2 === 1 ? usable[middle]! : (usable[middle - 1]! + usable[middle]!) / 2,
  );
}

/** Minutes a typed story takes at this speed: the typing itself plus a few seconds a sentence to hear and read it. */
export function estimateStoryMinutes(input: {
  words: number;
  sentences: number;
  wpm: number;
}): number {
  const typing = (input.words / Math.max(input.wpm, 1)) * 60;
  return Math.max(2, Math.ceil((typing + input.sentences * 6) / 60));
}
