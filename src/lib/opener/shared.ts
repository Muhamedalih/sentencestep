/**
 * The opening lesson ("First Steps") tests, shared by the server, the browser and the tests — pure,
 * no window and no next imports.
 *
 * Two Permissions-page features aimed at first-time visitors ride on it:
 *  - `shortOpener`: the opening lesson's text is the shorter one (five sentences, 25 words instead of
 *    46). The short text lives in three NEW draft rows, `onboarding-short-<tier>`; the lesson page
 *    swaps only the SENTENCES in, so the lesson the learner is on keeps its own id
 *    (`onboarding-<tier>`) everywhere — progress, resume, the tier read back at sign-up, the home
 *    recommendation. The old rows and their recordings are never touched.
 *  - `openerSkip`: a «تخطّي الدرس» button in the opening lesson.
 * A visitor is told apart by a random token in a cookie, so "a share of visitors" is the same visitors
 * every time and a bigger share only adds visitors (see rolloutBucket in src/lib/rollouts/config.ts).
 */

import { OPENING_LESSON_ID } from "@/lib/progress/starting-level";
import type { RolloutId } from "@/lib/rollouts/catalog";
import { rolloutBucket, visitorShare } from "@/lib/rollouts/config";
import type { RolloutEntry } from "@/lib/rollouts/config";

/** The ids of the three real opening lessons (one per tier), the ones a learner's progress is kept under. */
export const OPENER_LESSON_IDS: readonly string[] = Object.values(OPENING_LESSON_ID);

export function isOpenerLessonId(lessonId: string): boolean {
  return OPENER_LESSON_IDS.includes(lessonId);
}

/** The draft rows holding the short text: `onboarding-beginner` -> `onboarding-short-beginner`. */
export function shortOpenerRowId(lessonId: string): string | null {
  return isOpenerLessonId(lessonId) ? lessonId.replace("onboarding-", "onboarding-short-") : null;
}

/** A visitor's random token: 12 lowercase letters and digits, kept in a cookie for a year. */
export const VISITOR_TOKEN_COOKIE = "ss_vt";
export const VISITOR_TOKEN_MAX_AGE = 60 * 60 * 24 * 365;

export function parseVisitorToken(value: string | null | undefined): string | null {
  return value && /^[a-z0-9]{12}$/.test(value) ? value : null;
}

/** `random` returns a number in [0, 1), e.g. Math.random. */
export function newVisitorToken(random: () => number): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let index = 0; index < 12; index++) {
    token += alphabet[Math.min(alphabet.length - 1, Math.floor(random() * alphabet.length))];
  }
  return token;
}

/**
 * Whether a visitor is inside the share a visitor-aimed feature is given to (see visitorShare in
 * rollouts/config.ts): their number for this feature — from their token, independent between
 * features — is below the share. A share of 0 is out; so is no token (cookies blocked, a first
 * request) when the share is below 100. At 100 everybody is in, token or not: "everyone" must reach
 * a visitor who lands straight on the opening lesson, before the browser has set its token.
 */
export function inVisitorShare(id: RolloutId, entry: RolloutEntry, token: string | null): boolean {
  const share = visitorShare(entry);
  if (share <= 0) return false;
  if (share >= 100) return true;
  if (token === null) return false;
  return rolloutBucket(token, id) < share;
}

/**
 * The cookie that says which opening lessons a browser has skipped: one letter per tier (b, i, a).
 * It is read by the server (the lesson list, the next-lesson pick) and by the browser (Home), so a
 * skipped opening lesson is never recommended again, signed in or not, without counting as a lesson.
 */
export const OPENER_SKIP_COOKIE = "ss_osk";
export const OPENER_SKIP_MAX_AGE = 60 * 60 * 24 * 365;

const TIER_LETTER: Record<string, string> = Object.fromEntries(
  Object.entries(OPENING_LESSON_ID).map(([difficulty, id]) => [id, difficulty.charAt(0)]),
);

/** The opening lesson ids a cookie value names (unknown letters are ignored). */
export function parseSkippedOpeners(value: string | null | undefined): string[] {
  if (!value) return [];
  return OPENER_LESSON_IDS.filter((id) => value.includes(TIER_LETTER[id] ?? "?"));
}

/** The cookie value after `lessonId` is skipped on top of what `current` already holds. */
export function withSkippedOpener(current: string | null | undefined, lessonId: string): string {
  const skipped = new Set(parseSkippedOpeners(current));
  if (isOpenerLessonId(lessonId)) skipped.add(lessonId);
  return OPENER_LESSON_IDS.filter((id) => skipped.has(id))
    .map((id) => TIER_LETTER[id])
    .join("");
}

/** The measurement events of the opening lesson (counts only, never typed text): the phone's tap-to-start card, the first letter, a finished sentence, a skip, the keyboard hint being shown (the learner's keyboard is still on Arabic) and the sound failing (once per lesson). */
export const OPENER_STEPS = [
  "tap",
  "key",
  "sentence",
  "skipped",
  "keyboard_hint",
  "audio_failed",
] as const;

/** The steps that carry a sentence number (the others carry none). */
export function openerStepNeedsSentence(step: OpenerStep): boolean {
  return step === "sentence" || step === "skipped" || step === "keyboard_hint";
}
export type OpenerStep = (typeof OPENER_STEPS)[number];

export const OPENER_VARIANTS = ["short", "classic"] as const;
export type OpenerVariant = (typeof OPENER_VARIANTS)[number];

/** The most sentences an opening lesson can have, so a made-up number is turned away. */
export const OPENER_MAX_SENTENCES = 9;

export function isOpenerStep(value: unknown): value is OpenerStep {
  return OPENER_STEPS.some((step) => step === value);
}

export function isOpenerVariant(value: unknown): value is OpenerVariant {
  return value === "short" || value === "classic";
}

/** A sentence number (1 to the most an opening lesson has), or null when it is anything else. */
export function parseSentenceNumber(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= OPENER_MAX_SENTENCES
    ? value
    : null;
}
