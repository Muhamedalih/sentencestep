/**
 * Only ever follow a same-origin, relative `next` path — never an
 * attacker-supplied external URL. Shared by the sign-in/sign-up server
 * actions and the auth callback route (both accept a caller-supplied `next`
 * destination), so the open-redirect guard can't drift between the two.
 * Kept out of auth-actions.ts because a "use server" file may only export
 * async functions.
 *
 * Rejects a leading "//" (the obvious protocol-relative case, e.g.
 * "//evil.com") *and* a leading "/\" or "\" — per the WHATWG URL Standard,
 * a browser (and `new URL()`) treats a backslash exactly like a forward
 * slash inside a "special scheme" (http/https) URL, so "/\evil.com" parses
 * to the external origin "https://evil.com" every bit as much as
 * "//evil.com" does. A check that only looks for a literal "//" prefix
 * misses that second, well-documented bypass entirely.
 */
export function safeNextPath(next: FormDataEntryValue | string | null): string {
  const value = typeof next === "string" ? next : "";
  const secondCharIsSlashLike = value[1] === "/" || value[1] === "\\";
  const isSafeRelativePath = value.startsWith("/") && !secondCharIsSlashLike;
  return isSafeRelativePath ? value : "/learn";
}

/**
 * The sign-in or sign-up page, carrying `next` along only when it points
 * somewhere other than the default (/learn), so every plain link keeps exactly
 * the address it had. Lets a learner who is sent to sign in or create an
 * account on the way to somewhere (the plans page, say) end up there.
 */
export function authPageHref(
  page: "/login" | "/register",
  next: FormDataEntryValue | string | null | undefined,
): string {
  const safe = safeNextPath(next ?? null);
  return safe === "/learn" ? page : `${page}?next=${encodeURIComponent(safe)}`;
}
