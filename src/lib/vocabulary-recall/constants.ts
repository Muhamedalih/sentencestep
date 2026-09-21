/**
 * Shared, client-safe constants for Vocabulary Recall — kept out of
 * src/lib/supabase/queries/vocabulary-recall.ts (which imports the
 * server-only Supabase client, see its "next/headers" dependency) so
 * VocabularyRecallCard (a Client Component) can read MIN_DUE_WORDS_TO_SHOW
 * without pulling that server-only module into the client bundle.
 */

/** Card is only worth showing once a learner has a real handful of words ready — a single word wouldn't feel like a meaningful "remember these" moment. */
export const MIN_DUE_WORDS_TO_SHOW = 3;
/** Keeps a review visit short and bite-sized rather than a long queue — see the feature's own "never a chore" design. */
export const MAX_RECALL_SESSION_WORDS = 6;
