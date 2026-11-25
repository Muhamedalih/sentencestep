/**
 * Text that is safe to drop inside a PostgREST `or(...)` filter such as
 * `title.ilike.%TERM%,author.ilike.%TERM%`.
 *
 * In that syntax a comma starts the next condition and parentheses and quotes group or escape, so a
 * search box value like `x%,id.not.is.null` would add a condition of the attacker's choosing (row
 * level security still applies, but the filter itself must never be steerable). Those characters,
 * the LIKE wildcards and the backslash are replaced by a space, which keeps the words on either side
 * of them searchable.
 */
export function safeFilterTerm(term: string): string {
  return term
    .replace(/[,()"'\%*]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}
