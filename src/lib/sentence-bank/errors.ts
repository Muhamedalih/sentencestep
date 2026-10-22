/**
 * Whether a database error means "this table does not exist (yet)": PostgREST's PGRST205 (the table
 * is not in its schema cache) or Postgres' own 42P01 (undefined table). That is the answer of a
 * project that has not applied the sentence_mastery migration, which is an expected state — not a
 * failure to shout about on every page — so the callers read it as "nothing to ask" and back off.
 */
export function isMissingTableError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const code = (error as { code?: unknown }).code;
  return code === "PGRST205" || code === "42P01";
}
