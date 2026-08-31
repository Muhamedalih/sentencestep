/**
 * Kept dependency-free (no next/headers) so it's safe to import from
 * middleware.ts (Edge runtime) as well as ordinary server/client code —
 * same reasoning as src/lib/admin/constants.ts's DEV_ADMIN_COOKIE.
 */
export const LOCALE_COOKIE = "ss_locale";

/** One year — a learner-support-language choice is a durable preference, not a session-scoped one. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
