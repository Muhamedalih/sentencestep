/**
 * The first-run test: part of the brand-new visitors get the short first run (start, level, then
 * straight into the first lesson — language taken from the browser, no country, tutorial or start
 * card), the rest keep the long one. How many get it is the "Short first run" permission
 * (/admin/permissions): none until an admin opens it to a share of visitors. The two are told apart in every funnel event (see
 * src/lib/analytics/track.ts), so what the shorter path does to "reached the first lesson",
 * sign-ups and next-day return is read from a split instead of guessed from before and after.
 *
 * Kept free of window/next imports so the server (track.ts) and the tests can use it; the browser
 * half, which stores the choice, is browser.ts.
 */

export const FIRST_RUN_VARIANTS = ["classic", "short"] as const;
export type FirstRunVariant = (typeof FIRST_RUN_VARIANTS)[number];

/** Where a visitor's browser asks what share of new visitors get the short first run (the "Short first run" permission, see src/lib/rollouts). */
export const FIRST_RUN_CONFIG_URL = "/api/rollouts/public";

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

/** `random` is a number in [0, 1), e.g. Math.random(); `shortShare` is the fraction (0 to 1) given the short first run. */
export function assignFirstRunVariant(random: number, shortShare: number): FirstRunVariant {
  return random < shortShare ? "short" : "classic";
}

/** The share (0 to 100) the public config route reported, or 0 when it is missing or not a number. */
export function sharePercentFromConfig(config: unknown): number {
  const share = (config as { shortFirstRun?: { share?: unknown } } | null)?.shortFirstRun?.share;
  if (typeof share !== "number" || !Number.isFinite(share)) return 0;
  return Math.min(100, Math.max(0, share));
}

/**
 * Which first run this visitor gets, and whether to remember it. A variant in the address wins and
 * is kept, one already stored is kept; otherwise the visitor is randomized — but only while some
 * share of visitors is switched on. With the share at 0 (the permission is still "Admins only")
 * nobody is randomized and nothing is stored, so the day the test starts every new visitor is
 * assigned fresh, never already filed as "classic".
 */
export function decideFirstRunVariant(input: {
  forced: FirstRunVariant | null;
  stored: FirstRunVariant | null;
  sharePercent: number;
  random: number;
}): { variant: FirstRunVariant; remember: boolean } {
  if (input.forced) return { variant: input.forced, remember: true };
  if (input.stored) return { variant: input.stored, remember: true };
  if (input.sharePercent <= 0) return { variant: "classic", remember: false };
  return {
    variant: assignFirstRunVariant(input.random, input.sharePercent / 100),
    remember: true,
  };
}

export function variantFromSearch(search: string): FirstRunVariant | null {
  const value = new URLSearchParams(search).get(FIRST_RUN_SEARCH_PARAM);
  return isFirstRunVariant(value) ? value : null;
}

/** The variant in a cookie value, or null when there is none or it is not one of ours. */
export function parseFirstRunCookie(value: string | null | undefined): FirstRunVariant | null {
  return isFirstRunVariant(value) ? value : null;
}
