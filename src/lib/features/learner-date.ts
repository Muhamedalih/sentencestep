/**
 * The learner's own calendar date on the SERVER.
 *
 * Home's quests / daily session / streak strip are keyed by the learner's
 * LOCAL date, which only the browser knows. They used to be fetched by the
 * browser after hydration (passing that date in), which put three queued
 * Server Actions between "page shown" and "cards shown". Instead the browser
 * leaves its IANA time zone in a cookie (see TimezoneCookie), and the server
 * turns it into the learner's date itself so the cards can be rendered in the
 * initial response. Dependency-free (no next/headers) so it stays trivially
 * testable and safe to import anywhere.
 */
export const TIMEZONE_COOKIE = "ss_tz";

/** One year — a time zone is as durable a preference as the support language. */
export const TIMEZONE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** IANA names are letters, digits, "_", "+", "-" and "/" — anything else is not one, and never reaches Intl. */
const TIME_ZONE_SHAPE = /^[A-Za-z0-9_+\-/]{1,64}$/;

/**
 * "YYYY-MM-DD" for `now` in the given IANA time zone, or null when the value
 * is missing or not a zone this runtime knows (the caller then falls back to
 * asking the browser, exactly as before).
 */
export function localISODateInTimeZone(
  timeZone: string | null | undefined,
  now: Date = new Date(),
): string | null {
  if (!timeZone || !TIME_ZONE_SHAPE.test(timeZone)) return null;
  try {
    // en-CA formats as YYYY-MM-DD in every ICU build.
    const formatted = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    return /^\d{4}-\d{2}-\d{2}$/.test(formatted) ? formatted : null;
  } catch {
    return null;
  }
}
