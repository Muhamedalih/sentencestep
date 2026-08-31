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
