/**
 * Kept in its own zero-dependency module, separate from access.ts, because
 * middleware.ts (Edge runtime) needs this exact string but must never pull
 * in access.ts's other imports (next/headers, the session-aware Supabase
 * client) — those aren't valid in the Edge bundle.
 */
export const DEV_ADMIN_COOKIE = "sentencestep-dev-admin";
