/**
 * The first-run test: part of the brand-new visitors get the short first run (start, level, then
 * straight into the first lesson — language taken from the browser, no country, tutorial or start
 * card), the rest keep the long one. The two are told apart in every funnel event (see
 * src/lib/analytics/track.ts), so what the shorter path does to "reached the first lesson",
 * sign-ups and next-day return is read from a split instead of guessed from before and after.
 *
 * Kept free of window/next imports so the server (track.ts) and the tests can use it; the browser
 * half, which stores the choice, is browser.ts.
 */

export const FIRST_RUN_VARIANTS = ["classic", "short"] as const;
export type FirstRunVariant = (typeof FIRST_RUN_VARIANTS)[number];

/** Share of new visitors who get the short first run: 0 gives everyone the long one, 1 gives everyone the short one. */
export const FIRST_RUN_SHORT_SHARE = 0.5;

/** localStorage key and cookie holding the visitor's variant — the cookie is what lets server-side events (a lesson started, an account created) carry it. */
export const FIRST_RUN_STORAGE_KEY = "looma:firstRunVariant";
export const FIRST_RUN_COOKIE = "ss_fr";
export const FIRST_RUN_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** `?first_run=short` or `?first_run=classic` on any page pins that visitor to that variant, so either flow can be opened on purpose. */
export const FIRST_RUN_SEARCH_PARAM = "first_run";

/** The screens of the first run, in the order the long variant shows them (the short one shows intro, level and then the lesson). */
export const ONBOARDING_STEPS = [
  "intro",
  "language",
  "level",
  "country",
  "tutorial",
  "start",
] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export function isOnboardingStep(value: unknown): value is OnboardingStep {
  return ONBOARDING_STEPS.some((step) => step === value);
}

export function isFirstRunVariant(value: unknown): value is FirstRunVariant {
  return value === "classic" || value === "short";
}

/** `random` is a number in [0, 1), e.g. Math.random(). */
export function assignFirstRunVariant(
  random: number,
  shortShare: number = FIRST_RUN_SHORT_SHARE,
): FirstRunVariant {
  return random < shortShare ? "short" : "classic";
}

export function variantFromSearch(search: string): FirstRunVariant | null {
  const value = new URLSearchParams(search).get(FIRST_RUN_SEARCH_PARAM);
  return isFirstRunVariant(value) ? value : null;
}

/** The variant in a cookie value, or null when there is none or it is not one of ours. */
export function parseFirstRunCookie(value: string | null | undefined): FirstRunVariant | null {
  return isFirstRunVariant(value) ? value : null;
}
