import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { DEV_ADMIN_COOKIE } from "@/lib/admin/constants";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from "@/lib/i18n/locale-cookie";
import { isSupportLocale } from "@/lib/i18n/locales";

/**
 * Pages an already-authenticated visitor shouldn't land on again. The
 * learning app itself stays reachable by guests (see src/hooks/use-progress.ts
 * for the localStorage fallback), so there's nothing to gate here beyond
 * this.
 */
const AUTH_PATHS = new Set(["/login", "/register"]);

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
async function handleAdminRoute(request: NextRequest): Promise<NextResponse> {
  const devAdminOverride =
    process.env.NODE_ENV !== "production" &&
    request.cookies.get(DEV_ADMIN_COOKIE)?.value === "true";
  if (devAdminOverride) return NextResponse.next();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { supabase, getResponse } = createMiddlewareSupabaseClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return carryCookies(getResponse(), NextResponse.redirect(url));
  }

  if (await isMfaPending(supabase)) {
    const url = request.nextUrl.clone();
    url.pathname = VERIFY_MFA_PATH;
    url.search = "";
    url.searchParams.set("next", request.nextUrl.pathname);
    return carryCookies(getResponse(), NextResponse.redirect(url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
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
    return carryCookies(getResponse(), NextResponse.redirect(url));
  }

  return getResponse();
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
  if (isAdminRoute(request.nextUrl.pathname)) {
    return handleAdminRoute(request);
  }

  const isRoot = request.nextUrl.pathname === "/";

  if (!isSupabaseConfigured()) {
    if (isRoot) return handleRootRoute(request, false, NextResponse.next());
    return NextResponse.next();
  }

  const { supabase, getResponse } = createMiddlewareSupabaseClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let response = getResponse();
  if (user) {
    if (request.nextUrl.pathname !== VERIFY_MFA_PATH && (await isMfaPending(supabase))) {
      const url = request.nextUrl.clone();
      url.pathname = VERIFY_MFA_PATH;
      url.search = "";
      url.searchParams.set("next", request.nextUrl.pathname);
      return carryCookies(response, NextResponse.redirect(url));
    }

    const reconciled = await reconcileLocaleCookie(request, supabase, user.id, () => response);
    if (reconciled) response = reconciled;
  }

  if (isRoot) {
    return handleRootRoute(request, Boolean(user), response);
  }

  if (user && AUTH_PATHS.has(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/learn";
    url.search = "";
    return carryCookies(response, NextResponse.redirect(url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
