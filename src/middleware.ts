import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { DEV_ADMIN_COOKIE } from "@/lib/admin/constants";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from "@/lib/i18n/locale-cookie";
import { isSupportLocale, SUPPORT_LOCALES } from "@/lib/i18n/locales";

/**
 * Pages an already-authenticated visitor shouldn't land on again. The
 * learning app itself stays reachable by guests (see src/hooks/use-progress.ts
 * for the localStorage fallback), so there's nothing to gate here beyond
 * this.
 */
const AUTH_PATHS = new Set(["/login", "/register"]);

/**
 * A fresh, unguessable value per request — never reused across requests,
 * which is what lets 'nonce-<value>' in the CSP header below authorize this
 * one request's specific inline script (the theme-flash-prevention script
 * in src/app/layout.tsx) without opening script-src up to 'unsafe-inline'
 * for every inline script an attacker might inject via a stored-XSS bug.
 * Built from Web Crypto (available on the Edge runtime middleware actually
 * runs on) rather than node:crypto, which isn't available there.
 */
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/**
 * The site's Content-Security-Policy — added after an audit flagged that
 * the app had no CSP at all (next.config.ts's headers() covers every other
 * security header already). script-src relaxes to 'unsafe-eval' outside
 * production because Next's own dev-mode React Refresh/HMR client
 * genuinely needs eval() to work at all; that relaxation never ships to a
 * production build. connect-src/img-src/media-src allow any
 * `*.supabase.co` subdomain — this app's one real external data dependency
 * (the learner's own Supabase project), matching next.config.ts's existing
 * images.remotePatterns hostname exactly. challenges.cloudflare.com is
 * Cloudflare Turnstile (the sign-up bot check — see register-form.tsx);
 * fonts.googleapis.com/fonts.gstatic.com are the Google Fonts already
 * loaded in src/app/layout.tsx for Amiri/Lora. PayTabs checkout is a real
 * top-level navigation (redirect(), see checkout-actions.ts), never a form
 * POST or fetch from this origin, so it needs no entry here at all.
 * media-src includes blob: (mirroring img-src's own blob: entry) for
 * client-generated TTS previews (see dataUriToBlobUrl and its callers) —
 * without it, a live voice preview's <audio> element loads silently
 * nothing: no error surfaced to the user, just a blocked network request
 * logged to the console (data: URIs are blocked here identically, which is
 * why those previews are converted to a Blob URL client-side rather than
 * just adding data: instead).
 *
 * Sentry's ingest host is derived from NEXT_PUBLIC_SENTRY_DSN itself rather
 * than hardcoded — Sentry's ingest domain varies by account region (e.g.
 * `*.ingest.us.sentry.io` vs `*.ingest.de.sentry.io`), and the DSN already
 * contains the exact right host. Without this, Sentry's SDK (see
 * instrumentation-client.ts/sentry.server.config.ts) would silently fail to
 * report a single error in production — not because Sentry is broken, but
 * because the browser itself would block every report as a CSP violation.
 */
function sentryConnectSrc(): string {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return "";
  try {
    return ` https://${new URL(dsn).host}`;
  } catch {
    return "";
  }
}

/**
 * The exact SHA-256 hash (`openssl dgst -sha256 -binary | openssl base64`,
 * or Node's `crypto.createHash("sha256")`) of layout.tsx's THEME_INIT_SCRIPT
 * string, byte for byte — CSP hashes the literal text a `<script>` tag
 * executes, so this must be recomputed and updated here if that script's
 * source ever changes even by one character (a stale hash just makes the
 * script fail CSP and silently not run, not a build error). Authorizing it
 * this way rather than by nonce is what lets layout.tsx render it without
 * calling headers() for a per-request nonce — a fixed, build-time-known
 * hash needs no per-request value at all, which is what actually lets
 * pages that don't otherwise read cookies()/headers() become statically
 * cacheable. See THEME_INIT_SCRIPT's own doc comment for why the script
 * itself is safe to authorize this way (100% static, zero interpolation).
 */
const THEME_SCRIPT_HASH = "sha256-wsUdzDaf48DVgowQHlmZS5LH85z4u/iIq9XHllJtjn4=";

/**
 * True for "/", "/privacy", "/terms" and every one of their locale-prefixed
 * static siblings ("/ar", "/es/privacy", "/tr/terms", ...) — see
 * buildCsp's `isStaticRoute` param for why this distinction exists.
 */
function isStaticMarketingPath(pathname: string): boolean {
  if (MARKETING_STATIC_PATHS.has(pathname)) return true;
  return SUPPORT_LOCALES.some(
    (locale) =>
      pathname === `/${locale}` ||
      pathname === `/${locale}/privacy` ||
      pathname === `/${locale}/terms`,
  );
}

function buildCsp(nonce: string, isStaticRoute: boolean): string {
  const isProd = process.env.NODE_ENV === "production";
  // A per-request nonce cannot work on a statically-generated page: the
  // HTML is rendered ONCE at build time with no request to attach a nonce
  // to, so Next.js ships its own internal hydration/streaming <script>
  // tags on these routes with no nonce attribute at all (confirmed by
  // diffing curl output of a static vs. a dynamic route — the dynamic
  // page's internal scripts carry `nonce="..."`, the static page's don't).
  // A strict nonce-only script-src would then block Next's OWN scripts on
  // every visit to "/", "/privacy", "/terms" (and their locale variants),
  // breaking hydration entirely — this is a documented Next.js/CSP
  // limitation (nonces are incompatible with static rendering), not
  // something fixable from application code. `'unsafe-inline'` here
  // (WITHOUT a nonce or hash present — a nonce/hash source makes browsers
  // ignore 'unsafe-inline' entirely, so the two can't be combined) is the
  // standard mitigation, scoped to exactly these three read-only,
  // unauthenticated, no-form marketing pages — every other route (login,
  // learn, admin, ...) keeps the strict nonce-based policy unchanged.
  const scriptSrc = isStaticRoute
    ? "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com"
    : `script-src 'self' 'nonce-${nonce}' '${THEME_SCRIPT_HASH}'${isProd ? "" : " 'unsafe-eval'"} https://challenges.cloudflare.com`;
  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.supabase.co",
    "media-src 'self' blob: https://*.supabase.co",
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com${sentryConnectSrc()}`,
    "frame-src https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

/**
 * Stamps the CSP header on a response and returns it — called at every exit
 * point of this file so no code path (an early redirect, an admin 403, the
 * normal render path) ever ships without one.
 */
function withCsp(response: NextResponse, csp: string): NextResponse {
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

/**
 * Whether this request carries a Supabase session cookie at all
 * (`sb-<project-ref>-auth-token`, possibly chunked into `.0`/`.1` suffixes
 * by supabase-js when the JWT is large — hence a substring check rather
 * than an exact name match). Lets every call site below skip
 * `getClaims()`'s JWT verification (and, on projects still using
 * symmetric signing keys, its network round trip to the Auth server —
 * see the doc comments at each call site) entirely for a guest with no
 * session: there is provably no JWT to verify, so the result is always
 * `null` claims, just reached without the extra request/CPU work. This
 * matters here specifically because middleware runs on literally every
 * matched request (see this file's own matcher) — signed-out traffic
 * (every marketing-page visit, most of this app's actual volume) was
 * paying that cost on every single page view for no behavioral gain.
 */
function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
}

function createMiddlewareSupabaseClient(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  return { supabase, getResponse: () => response };
}

/**
 * Carries forward every Set-Cookie already staged on `from` onto a
 * differently-constructed response. Needed anywhere this file builds a new
 * NextResponse (a redirect, or reconcileLocaleCookie's own reconciled
 * response) instead of returning the one createMiddlewareSupabaseClient's
 * setAll produced — otherwise a session cookie Supabase just refreshed via
 * getUser() is silently dropped, leaving the browser holding an
 * already-rotated refresh token and getting signed out on its next request.
 */
function carryCookies(from: NextResponse, to: NextResponse): NextResponse {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
  return to;
}

const VERIFY_MFA_PATH = "/login/verify-mfa";

/**
 * True when this session has a verified TOTP factor but hasn't entered its
 * code yet this session (signInWithPassword always succeeds at aal1
 * regardless — see auth-actions.ts's completeSignIn doc comment). Checked
 * on every request, not just at the moment of sign-in, so a direct
 * navigation to any page (typed URL, bookmark, back button) can never skip
 * the second factor — only going through VERIFY_MFA_PATH can ever clear it.
 */
async function isMfaPending(
  supabase: ReturnType<typeof createMiddlewareSupabaseClient>["supabase"],
): Promise<boolean> {
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return Boolean(data && data.nextLevel === "aal2" && data.currentLevel !== "aal2");
}

/**
 * Gates the entire /admin route tree — the one place in the app where a
 * middleware-level check (real HTTP status, before any page code runs) is
 * more appropriate than a page-level redirect. Fails closed: no Supabase
 * project and no dev override means no admin access, full stop.
 */
async function handleAdminRoute(request: NextRequest, csp: string): Promise<NextResponse> {
  const devAdminOverride =
    process.env.NODE_ENV !== "production" &&
    request.cookies.get(DEV_ADMIN_COOKIE)?.value === "true";
  if (devAdminOverride) return withCsp(NextResponse.next({ request }), csp);

  if (!isSupabaseConfigured()) {
    return withCsp(NextResponse.json({ error: "Forbidden" }, { status: 403 }), csp);
  }

  if (!hasSupabaseAuthCookie(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return withCsp(NextResponse.redirect(url), csp);
  }

  const { supabase, getResponse } = createMiddlewareSupabaseClient(request);

  // getClaims() rather than getUser(): verifies the JWT the same way (it
  // falls back to a real getUser() network call itself if the project isn't
  // using asymmetric signing keys — see its own doc comment), but once
  // asymmetric keys are enabled it verifies locally via WebCrypto instead of
  // a round trip to the Auth server on every single request. Middleware runs
  // on nearly every request AND every Server Action (see this file's own
  // matcher), so that round trip was previously paid twice per action
  // (once here, once more inside whatever the action itself does) — a real,
  // measured source of "sometimes instant, sometimes seconds" latency.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims ?? null;

  if (!claims) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return withCsp(carryCookies(getResponse(), NextResponse.redirect(url)), csp);
  }

  if (await isMfaPending(supabase)) {
    const url = request.nextUrl.clone();
    url.pathname = VERIFY_MFA_PATH;
    url.search = "";
    url.searchParams.set("next", request.nextUrl.pathname);
    return withCsp(carryCookies(getResponse(), NextResponse.redirect(url)), csp);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", claims.sub)
    .maybeSingle();

  const role = profile?.role;
  const hasAdminAccess =
    role === "admin" || (role === "editor" && !isAdminOnlyRoute(request.nextUrl.pathname));

  if (!hasAdminAccess) {
    // A real, signed-in learner (or an editor reaching an admin-only area
    // like Reports/settings/user management) who lands here (mistyped URL,
    // stale link, idle curiosity) gets sent back to the app they can
    // actually use, rather than a bare, unstyled JSON error body — src/app/admin/layout.tsx
    // has its own styled "Access denied" fallback, but middleware runs
    // before any React rendering is possible, so it can't render that page
    // itself. This is still a real 403 in effect: nothing admin-only is ever
    // returned, only the destination differs.
    const url = request.nextUrl.clone();
    url.pathname = "/learn";
    url.search = "";
    return withCsp(carryCookies(getResponse(), NextResponse.redirect(url)), csp);
  }

  return withCsp(getResponse(), csp);
}

/** True for `/admin` itself and everything under it — not a bare prefix match, so a future sibling route (e.g. `/admin-status`) can never be swept into the admin gate by accident. */
function isAdminRoute(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/**
 * Areas the 'editor' role (20250215000000_editor_role.sql) never gets,
 * regardless of what its RLS policies would technically allow through —
 * sensitive global settings, Reports, the Audit log, and user management
 * itself. Everything else under /admin (Dashboard, Content, Levels,
 * Library, Categories, Word Lists, Translations) is editor-accessible.
 * Checked as real path segments (`/admin/voice` or `/admin/voice/...`),
 * never a bare substring match, for the same reason isAdminRoute isn't one.
 */
const ADMIN_ONLY_SEGMENTS = [
  "color-settings",
  "voice",
  "typing-sound",
  "onboarding-card",
  "lesson-fonts",
  "lesson-completion",
  "reports",
  "audit-log",
  "users",
];

function isAdminOnlyRoute(pathname: string): boolean {
  return ADMIN_ONLY_SEGMENTS.some(
    (segment) => pathname === `/admin/${segment}` || pathname.startsWith(`/admin/${segment}/`),
  );
}

/**
 * A returning, already-authenticated visitor with a live Supabase session
 * but no ss_locale cookie on this browser/device (a new device, or cookies
 * cleared) must see their real saved preference — not the first-time
 * picker again, and not silently fall back to anything else (see
 * src/lib/i18n/get-locale.ts's doc comment: an ordinary page render is a
 * single cookie read with no DB query, precisely because this is the one
 * place that reconciliation happens instead). Reads
 * profiles.preferred_language exactly once, only when the cookie is
 * genuinely missing. Mutates `request.cookies` before building the
 * response — mirrors createMiddlewareSupabaseClient's own setAll pattern
 * above — so the SAME request's Server Components (the root layout's
 * getLocale()) already see the reconciled value, not just the next
 * request; without this, a returning user would still see one flash of
 * the first-time picker on this exact page load.
 */
async function reconcileLocaleCookie(
  request: NextRequest,
  supabase: ReturnType<typeof createMiddlewareSupabaseClient>["supabase"],
  userId: string,
  getResponse: () => NextResponse,
): Promise<NextResponse | null> {
  if (isSupportLocale(request.cookies.get(LOCALE_COOKIE)?.value)) return null;

  const { data } = await supabase
    .from("profiles")
    .select("preferred_language")
    .eq("id", userId)
    .maybeSingle();
  if (!isSupportLocale(data?.preferred_language)) return null;

  request.cookies.set(LOCALE_COOKIE, data.preferred_language);
  // NextResponse.next({ request }) is what forwards the just-mutated
  // request cookie to this same request's Server Components — but it
  // starts a brand-new response with none of getUser()'s own staged
  // Set-Cookie headers, so those have to be carried over explicitly.
  const response = carryCookies(getResponse(), NextResponse.next({ request }));
  response.cookies.set(LOCALE_COOKIE, data.preferred_language, {
    maxAge: LOCALE_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });
  return response;
}

/**
 * Sends signed-in users straight to the existing /learn app instead of the
 * landing page — there's nothing for an authenticated learner to do on the
 * marketing page. A signed-out visitor always gets the landing page,
 * including a RETURNING signed-out visitor: marketing discovery (the value
 * proposition, pricing) must stay reachable on repeat visits, a shared
 * device, or a link someone re-shares — it must never become a page you can
 * only see once. (This previously also redirected on a "has visited before"
 * cookie regardless of auth state, which made "/" permanently unreachable
 * for anyone, signed in or not, who had loaded it a single time before.)
 */
function handleRootRoute(
  request: NextRequest,
  isAuthenticated: boolean,
  response: NextResponse,
): NextResponse {
  if (!isAuthenticated) return response;
  const url = request.nextUrl.clone();
  url.pathname = "/learn";
  url.search = "";
  return carryCookies(response, NextResponse.redirect(url));
}

/**
 * The three routes statically pre-rendered per src/app/(default)/layout.tsx
 * (unprefixed) and src/app/[locale]/layout.tsx (locale-prefixed) — see
 * redirectToLocalizedMarketingPath below for what actually happens on this
 * set.
 */
const MARKETING_STATIC_PATHS = new Set(["/", "/privacy", "/terms"]);

/**
 * Sends a visitor who already has a ss_locale cookie straight to the
 * matching locale-prefixed STATIC variant ("/ar", "/es/privacy", ...)
 * instead of the unprefixed English-fallback one — this is what lets a
 * returning visitor's very first response already be the fully static,
 * correctly-localized HTML, with no flash of English first (see
 * src/app/[locale]/layout.tsx's doc comment: that tree is pre-rendered per
 * locale at build time, with no per-request cookie read left to resolve
 * one). A cookie-less, genuinely first-time visitor is untouched: `null` is
 * returned, and the caller falls through to the unprefixed static page
 * exactly as today, with FirstTimeLanguagePicker prompting them.
 *
 * Deliberately does NOT apply this redirect for an authenticated visitor on
 * "/" — the caller checks that first (see handleRootRoute) and returns
 * before ever reaching here, since they're headed to /learn regardless of
 * locale. /privacy and /terms have no such authenticated-visitor redirect,
 * on either the old dynamic pages or these new static ones — a signed-in
 * learner can still open either directly, same as before this task.
 */
function redirectToLocalizedMarketingPath(
  request: NextRequest,
  response: NextResponse,
): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  if (!MARKETING_STATIC_PATHS.has(pathname)) return null;

  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (!isSupportLocale(cookieLocale)) return null;

  const url = request.nextUrl.clone();
  url.pathname = `/${cookieLocale}${pathname === "/" ? "" : pathname}`;
  return carryCookies(response, NextResponse.redirect(url));
}

/**
 * Refreshes the Supabase session cookie on every request (the official
 * @supabase/ssr pattern — calling getUser() here revalidates the access
 * token so Server Components downstream never see a stale session), keeps
 * a signed-in visitor out of the auth pages, sends signed-in visitors away
 * from the "/" landing page (see handleRootRoute — a signed-out visitor
 * always sees it, first visit or not), and gates /admin/*. A no-op entirely
 * (aside from the /admin gate and root handling) when no Supabase project
 * is linked.
 */
export async function middleware(request: NextRequest) {
  // Generated once per request, then threaded two ways: as a request header
  // (x-nonce) so src/app/layout.tsx's Server Component can read it via
  // headers() and stamp it on the one inline script this app ships, and as
  // part of the CSP response header every branch below returns through
  // withCsp. Mutating request.headers in place (rather than building a new
  // Headers object) means it's already present by the time
  // createMiddlewareSupabaseClient's own internal NextResponse.next({
  // request }) calls run below — the same "mutate request, then rebuild
  // NextResponse.next({ request })" pattern that function already uses for
  // cookies.
  const nonce = generateNonce();
  const csp = buildCsp(nonce, isStaticMarketingPath(request.nextUrl.pathname));
  // Both set as REQUEST headers (not just the response header every branch
  // below adds via withCsp) — Next's own App Router build pipeline detects
  // this exact x-nonce/Content-Security-Policy request-header pair to
  // automatically nonce the framework's own internal inline scripts too,
  // per Next's documented CSP pattern; without this, only this file's own
  // explicit script tag (see layout.tsx) would be nonced.
  request.headers.set("x-nonce", nonce);
  request.headers.set("Content-Security-Policy", csp);

  if (isAdminRoute(request.nextUrl.pathname)) {
    return handleAdminRoute(request, csp);
  }

  const isRoot = request.nextUrl.pathname === "/";

  if (!isSupabaseConfigured()) {
    // No auth system at all, so never authenticated — handleRootRoute would
    // always no-op here, straight to the locale-redirect check.
    const marketingRedirect = redirectToLocalizedMarketingPath(
      request,
      NextResponse.next({ request }),
    );
    if (marketingRedirect) return withCsp(marketingRedirect, csp);
    return withCsp(NextResponse.next({ request }), csp);
  }

  // A guest with no Supabase session cookie at all can never produce claims
  // — skip standing up a client and calling getClaims() entirely rather
  // than doing that work just to arrive at the same `null` (see
  // hasSupabaseAuthCookie's doc comment). This is the common case for
  // every marketing-page visit, so it's the request path most worth not
  // paying JWT verification (and, on projects without asymmetric signing
  // keys, a real Auth-server round trip) for.
  let claims: { sub: string } | null = null;
  let response = NextResponse.next({ request });
  let supabase: ReturnType<typeof createMiddlewareSupabaseClient>["supabase"] | null = null;
  if (hasSupabaseAuthCookie(request)) {
    const created = createMiddlewareSupabaseClient(request);
    supabase = created.supabase;

    // See handleAdminRoute's identical getClaims() switch above for why this
    // replaces getUser() — same JWT-verification guarantee, without forcing a
    // network round trip to the Auth server on every request/action once the
    // Supabase project is on asymmetric signing keys.
    const { data } = await supabase.auth.getClaims();
    claims = data?.claims ?? null;
    response = created.getResponse();
  }

  if (claims && supabase) {
    if (request.nextUrl.pathname !== VERIFY_MFA_PATH && (await isMfaPending(supabase))) {
      const url = request.nextUrl.clone();
      url.pathname = VERIFY_MFA_PATH;
      url.search = "";
      url.searchParams.set("next", request.nextUrl.pathname);
      return withCsp(carryCookies(response, NextResponse.redirect(url)), csp);
    }

    const reconciled = await reconcileLocaleCookie(request, supabase, claims.sub, () => response);
    if (reconciled) response = reconciled;
  }

  if (isRoot && claims) {
    // Authenticated visitor on "/" -> straight to /learn, unchanged from
    // before this task and regardless of locale.
    return withCsp(handleRootRoute(request, true, response), csp);
  }

  const marketingRedirect = redirectToLocalizedMarketingPath(request, response);
  if (marketingRedirect) return withCsp(marketingRedirect, csp);

  if (isRoot) {
    // Not authenticated, no (or invalid) locale cookie: a genuine
    // first-time visitor — the unprefixed static "/" renders as-is,
    // FirstTimeLanguagePicker prompts them client-side.
    return withCsp(response, csp);
  }

  if (claims && AUTH_PATHS.has(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/learn";
    url.search = "";
    return withCsp(carryCookies(response, NextResponse.redirect(url)), csp);
  }

  return withCsp(response, csp);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
