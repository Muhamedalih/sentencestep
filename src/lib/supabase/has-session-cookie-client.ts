/**
 * Client-side, cosmetic-only counterpart to src/middleware.ts's
 * hasSupabaseAuthCookie() — same heuristic (`sb-<project-ref>-auth-token`,
 * possibly chunked into `.0`/`.1` suffixes by supabase-js when the JWT is
 * large, hence a substring check rather than an exact name match), just
 * reading `document.cookie` instead of a NextRequest's cookie jar, because
 * this runs in the browser after hydration rather than in middleware.
 *
 * Deliberately does NOT verify the cookie's contents — a forged or expired
 * cookie makes this return true just as readily as a real session would,
 * and that's fine: the one caller (SiteHeaderClient, see its own doc
 * comment) only ever uses this to decide whether to show a generic
 * "you're signed in" header state instead of "Sign in" on the three static
 * marketing pages, never to gate access to anything. Any real
 * authorization decision still goes through getCurrentUser()/getClaims()
 * server-side, exactly as before.
 */
export function hasSupabaseAuthCookieClient(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .map((pair) => pair.split("=")[0]?.trim() ?? "")
    .some((name) => name.startsWith("sb-") && name.includes("-auth-token"));
}
