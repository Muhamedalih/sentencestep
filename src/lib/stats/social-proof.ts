/**
 * The real, aggregate figures /upgrade may quote as social proof: how many
 * learners have an account and how many lessons they have practiced. Nothing
 * here is invented or padded: a figure is only ever rounded DOWN, and it is
 * left out entirely until it is large enough to be worth saying.
 */

/** Below these a figure reads as small rather than reassuring, so it is not shown. */
export const MIN_LEARNERS_TO_SHOW = 500;
export const MIN_LESSONS_TO_SHOW = 5_000;

/**
 * Rounds down to two significant digits (5,237 becomes 5,200; 1,234,567
 * becomes 1,200,000), so a quoted "5,200+" is always true and never falsely precise.
 */
export function roundDownForDisplay(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const whole = Math.floor(value);
  if (whole < 100) return whole;
  const unit = 10 ** (String(whole).length - 2);
  return Math.floor(whole / unit) * unit;
}

export interface SocialProof {
  /** Learners with an account, rounded down, or null when too few to quote. */
  learners: number | null;
  /** Lessons practiced, rounded down, or null when too few to quote. */
  lessons: number | null;
}

export const NO_SOCIAL_PROOF: SocialProof = { learners: null, lessons: null };

export function buildSocialProof(counts: { learners: number; lessons: number }): SocialProof {
  return {
    learners: counts.learners >= MIN_LEARNERS_TO_SHOW ? roundDownForDisplay(counts.learners) : null,
    lessons: counts.lessons >= MIN_LESSONS_TO_SHOW ? roundDownForDisplay(counts.lessons) : null,
  };
}
