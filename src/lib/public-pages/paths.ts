/**
 * Dependency-free (no data files), so src/middleware.ts (Edge runtime) and the inline scripts of
 * root-html-shell.tsx can share the one definition of "this is a public page".
 */

/** The first path segments of the public pages: "/ar/grammar", "/ar/grammar/for-since", "/ar/about". */
export const PUBLIC_PAGE_SECTIONS = ["grammar", "about"] as const;

const LOCALES = "ar|es|tr";

/** True for "/{locale}/grammar", "/{locale}/grammar/<slug>" and "/{locale}/about" (a trailing slash is fine). */
export function isPublicPagePath(pathname: string): boolean {
  return new RegExp(`^/(?:${LOCALES})/(?:${PUBLIC_PAGE_SECTIONS.join("|")})(?:/[^/]+)?/?$`).test(
    pathname,
  );
}

/**
 * The same test as a string of JavaScript, for the inline scripts that run before the page paints (a
 * returning guest is sent to /learn from the landing page; a public page is a page they came to read,
 * so those scripts leave it alone). Kept next to isPublicPagePath so the two cannot drift apart.
 */
export const IS_PUBLIC_PAGE_PATH_JS = `/^\\/(?:${LOCALES})\\/(?:${PUBLIC_PAGE_SECTIONS.join("|")})(?:\\/[^\\/]+)?\\/?$/.test(window.location.pathname)`;

/** Which part of the site a first page belongs to, for the `landing` tag of a sign-up (see attribution.ts). */
export function landingSectionOf(pathname: string): string {
  const stripped = pathname.replace(new RegExp(`^/(?:${LOCALES})(?=/|$)`), "") || "/";
  const first = stripped.split("/")[1] ?? "";
  if (first === "") return "home";
  if ((PUBLIC_PAGE_SECTIONS as readonly string[]).includes(first)) return first;
  if (first === "learn") return "learn";
  if (first === "privacy" || first === "terms") return "legal";
  if (first === "upgrade") return "upgrade";
  if (first === "login" || first === "register") return "auth";
  return "other";
}
