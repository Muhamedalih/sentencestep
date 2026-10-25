import { authPageHref } from "@/lib/supabase/safe-redirect";

/**
 * "Take me back to where I was stopped." A learner who opens the upgrade page
 * from a locked lesson, passage or word list is returned to that very page after
 * paying. The path travels in a short-lived cookie set by the checkout action, not in
 * the provider's return URL, so it can never change how a payment is created,
 * reused or fulfilled — it only decides where one button on the confirmation
 * page points.
 */
export const AFTER_PAYMENT_COOKIE = "ss_after_pay";

/**
 * A day: a Binance Pay order may be paid for up to 24 hours after it was opened (the learner first
 * has to get hold of USDT), and the page that confirms it should still lead back. A newer checkout
 * replaces the value, or clears it when it carries none, so an old one never lingers past that.
 */
export const AFTER_PAYMENT_MAX_AGE_SECONDS = 24 * 60 * 60;

const ID = "[A-Za-z0-9][A-Za-z0-9_-]{0,80}";

/** The pages a lock can stop a learner at: a lesson, a story or conversation, a passage, a word list (its practice, Learn and word wall pages). */
const RETURN_PATHS = [
  new RegExp(`^/learn/(normal|stories|conversation)/${ID}$`),
  new RegExp(`^/learn/passages/${ID}$`),
  new RegExp(`^/learn/word-lists/${ID}(/(learn|words))?$`),
];

/**
 * The path itself when it is one of those pages of this app, else null. Anything
 * else — another site, a protocol, a double slash, a query or fragment, a
 * different part of the app — is refused rather than cleaned up, because this
 * value comes from the address bar and a cookie.
 */
export function safeLessonPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return RETURN_PATHS.some((pattern) => pattern.test(value)) ? value : null;
}

/** `value` of a `?next=` query parameter, which Next hands over as a string or a list. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Where a learner who is not signed in goes to sign in before paying: the
 * plans page again, still remembering the lesson they were stopped at (if
 * any) so the confirmation page can lead back to it.
 */
export function upgradeSignInHref(afterPaymentPath?: string | null): string {
  const lesson = safeLessonPath(afterPaymentPath);
  return authPageHref(
    "/login",
    lesson ? `/upgrade?next=${encodeURIComponent(lesson)}` : "/upgrade",
  );
}
