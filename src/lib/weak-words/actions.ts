"use server";

import { createClient } from "@/lib/supabase/server";
import { hasSupabaseAuthCookie } from "@/lib/supabase/has-session-cookie";
import { normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { fetchWeakCandidateMistakeRows } from "@/lib/supabase/queries/mistakes";
import { fetchAllVocabularyWordsFlat } from "@/lib/supabase/queries/word-lists";
import { isWeakWord } from "@/lib/weak-words/types";
import type { WeakWordItem } from "@/lib/weak-words/types";

async function getAuthenticatedUserId(): Promise<string | null> {
  // Same fast path as getCurrentUser (src/lib/supabase/auth.ts) — a guest
  // with no session cookie can never produce claims, so skip standing up a
  // client and calling getClaims() at all for that guaranteed-null case.
  if (!(await hasSupabaseAuthCookie())) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub ?? null;
}

/**
 * The learner's current Word Lists vocabulary that mistake-tracking (see
 * src/lib/mistakes) says is currently weak — a read-only interpretation of
 * that existing data, never a second source of truth: no weak_words table,
 * no separate scheduler. mistakes.word (normalized free text) and
 * vocabulary_words.target_word (already-lowercase, since Word Lists content
 * is authored that way — see VocabularyWord.targetWord's doc comment) are
 * two different identifier spaces with no shared id or FK between them, so
 * the join happens here in application code by normalized text, using the
 * exact same normalizeMistakeWord mistake-tracking itself already keys on
 * — not a second, SQL-side normalization that could silently drift from it.
 *
 * Both reads are small, aggregated queries (never one query per word): the
 * candidate mistake set is the same "tens of rows per learner" scale
 * fetchActiveMistakeRows already relies on, and the vocabulary catalog is a
 * few hundred rows total, fetched once, not per candidate — no N+1.
 *
 * A mistake word with no matching Word Lists vocabulary entry (most
 * mistakes — lesson/story/conversation vocabulary is far larger than the
 * Word Lists catalog) is silently excluded rather than an error, the same
 * "unresolvable content just doesn't come back" precedent
 * fetchMistakesAction already uses for a deleted sentence/lesson.
 */
export async function fetchWeakWordsAction(): Promise<WeakWordItem[]> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return [];

  const [candidates, vocabulary] = await Promise.all([
    fetchWeakCandidateMistakeRows(userId),
    fetchAllVocabularyWordsFlat(),
  ]);
  if (candidates.length === 0 || vocabulary.length === 0) return [];

  const vocabularyByNormalizedWord = new Map(
    vocabulary.map((word) => [normalizeMistakeWord(word.targetWord), word]),
  );

  const items: WeakWordItem[] = [];
  for (const candidate of candidates) {
    if (!isWeakWord(candidate)) continue;
    const match = vocabularyByNormalizedWord.get(normalizeMistakeWord(candidate.word));
    if (!match) continue;
    items.push({
      wordId: match.id,
      groupId: match.groupId,
      targetWord: match.targetWord,
      reason: candidate.status === "active" ? "active" : "review",
    });
  }
  return items;
}
