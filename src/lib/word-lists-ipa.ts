/**
 * Client-safe helpers for a Word Lists word's IPA pronunciation. The data
 * itself (the generated fallback map in src/data/word-lists/ipa.ts) is
 * deliberately NOT imported here — it is looked up on the server in
 * src/lib/word-lists.ts, so the ~600-entry map never reaches the browser.
 */

/** Longest IPA string the admin form accepts, slashes excluded. */
export const MAX_IPA_LENGTH = 80;

/**
 * Normalizes whatever an admin typed (or the generator stored) to the bare
 * IPA: surrounding slashes or brackets and whitespace are dropped, since the
 * slashes are display, not data. Empty or whitespace-only input is null.
 */
export function normalizeIpa(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const bare = raw
    .trim()
    .replace(/^[/[]+|[/\]]+$/g, "")
    .trim();
  return bare.length > 0 ? bare : null;
}

/** The bare IPA wrapped in slashes the way dictionaries print it ("ænt" → "/ænt/"), or null when there is none. */
export function formatIpa(raw: string | null | undefined): string | null {
  const bare = normalizeIpa(raw);
  return bare ? `/${bare}/` : null;
}
