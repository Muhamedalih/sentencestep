/**
 * "Take me back to the lesson I was stopped at." A learner who opens the
 * upgrade page from a locked lesson is returned to that lesson after paying.
 * The path travels in a short-lived cookie set by the checkout action, not in
 * the provider's return URL, so it can never change how a payment is created,
 * reused or fulfilled — it only decides where one button on the confirmation
 * page points.
 */
export const AFTER_PAYMENT_COOKIE = "ss_after_pay";

/** One hour: long enough to finish paying, short enough that a forgotten checkout never lingers. */
export const AFTER_PAYMENT_MAX_AGE_SECONDS = 60 * 60;

const LESSON_PATH = /^\/learn\/(normal|stories|conversation)\/[A-Za-z0-9][A-Za-z0-9_-]{0,80}$/;

/**
 * The path itself when it is a lesson page of this app, else null. Anything
 * else — another site, a protocol, a double slash, a query or fragment, a
 * different part of the app — is refused rather than cleaned up, because this
 * value comes from the address bar and a cookie.
 */
export function safeLessonPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return LESSON_PATH.test(value) ? value : null;
}

/** `value` of a `?next=` query parameter, which Next hands over as a string or a list. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
