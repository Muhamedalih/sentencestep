/**
 * Whether the caller may read a lesson sentence, decided by the database's own
 * row-level security on `sentences` rather than a second copy of the rule: the
 * policy returns the row only for a published free lesson, an active
 * subscriber, an admin, or while the sitewide free-for-all switch is on (see
 * 20250228000000_free_for_all_access.sql). The lookup must run on a
 * session-aware client (the caller's own cookies), never the service role,
 * which sees every row and would make this always true.
 *
 * Used by /api/voice/sentence-words, which reads the sentence text with the
 * service role to derive its words and must not hand a premium sentence's word
 * clips to someone who couldn't open that lesson.
 */

/** Looks up one sentence id as the caller; resolves to the row only if row-level security lets them see it. */
export type SentenceLookup = (
  sentenceId: string,
) => PromiseLike<{ data: { id: string } | null; error: unknown }>;

export async function canReadSentence(
  lookup: SentenceLookup,
  sentenceId: string,
): Promise<boolean> {
  const { data, error } = await lookup(sentenceId);
  if (error) throw error;
  return data !== null;
}
