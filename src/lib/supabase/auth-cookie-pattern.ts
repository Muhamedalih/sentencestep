/**
 * The one shape a real Supabase session cookie takes: `sb-<project-ref>-auth-token`,
 * optionally chunked into `.0`, `.1`, ... suffixes by supabase-js when the JWT
 * is too large for a single cookie. Shared by src/middleware.ts's
 * hasSupabaseAuthCookie(), has-session-cookie.ts's hasSupabaseAuthCookie(),
 * and has-session-cookie-client.ts's hasSupabaseAuthCookieClient() — all
 * three need the exact same answer to "does this look like a real session,"
 * so importing one pattern instead of keeping three independently-typed
 * copies in sync by comment convention.
 *
 * Anchored to that exact shape rather than a plain `.includes("-auth-token")`
 * substring check: supabase-js's own PKCE `code_verifier` cookies — set the
 * instant "Continue with Google" is clicked, left behind if that flow is
 * ever abandoned before completing — are named
 * `sb-<project-ref>-auth-token-code-verifier` and
 * `sb-<project-ref>-auth-token-flow-<id>-code-verifier`, both of which a
 * plain substring check also matches. That false positive was silently
 * cosmetic for the two server-side callers (they only skip straight to a
 * real getClaims() check, which correctly rejects a fake cookie either way),
 * but directly leaked into has-session-cookie-client.ts's one caller
 * (SiteHeaderClient): a visitor who started, then canceled, Google sign-in
 * would keep seeing a "Dashboard"/"Sign out" header on /privacy or /terms —
 * looking signed in despite never having signed in — until that cookie
 * happened to expire.
 */
export const SUPABASE_AUTH_COOKIE_PATTERN = /^sb-.+-auth-token(\.\d+)?$/;
