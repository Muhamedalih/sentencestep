"use server";

import { createClient } from "@/lib/supabase/server";
import {
  fetchBookSentenceMarks,
  upsertBookmark,
  upsertNote,
} from "@/lib/supabase/queries/book-marks";
import { fetchMySavedSentences } from "@/lib/supabase/queries/saved-sentences";
import type { BookSentenceMark } from "@/lib/supabase/queries/book-marks";
import type { SavedSentenceItem } from "@/lib/supabase/queries/saved-sentences";
import { getLocale } from "@/lib/i18n/get-locale";

async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub ?? null;
}

/**
 * This learner's Save/Note state for every sentence ID given, in one
 * batched request — used once per reading page/section load (see
 * BookReadingSession's marksBySentence) instead of one request per rendered
 * sentence, which is what a naive per-BookSentenceReader fetch would do on
 * a page showing several at once. A guest (or an empty `sentenceIds`)
 * resolves to `{}`, the harmless "nothing marked" default. Returned as a
 * plain object (not a Map) since this crosses the server action boundary,
 * which only serializes plain JSON.
 */
export async function fetchBookSentenceMarksAction(
  sentenceIds: string[],
): Promise<Record<string, BookSentenceMark>> {
  const userId = await getAuthenticatedUserId();
  if (!userId || sentenceIds.length === 0) return {};
  const map = await fetchBookSentenceMarks(userId, sentenceIds);
  return Object.fromEntries(map);
}

/** Toggles this sentence's bookmark for the signed-in learner. Same "Sign in to..." guard as recordBookSentenceCompletionAction — the bookmark/note UI only ever calls this when already signed in (see useBookSentenceMark), so reaching the guard here would mean a stale client state, not a normal path. */
export async function setBookmarkAction(
  bookId: string,
  sentenceId: string,
  isBookmarked: boolean,
): Promise<void> {
  const userId = await getAuthenticatedUserId();
  if (!userId) throw new Error("Sign in to save bookmarks.");
  await upsertBookmark(userId, bookId, sentenceId, isBookmarked);
}

/** Saves (or clears, with `note: null`) this sentence's note for the signed-in learner. Same guard as setBookmarkAction. */
export async function setNoteAction(
  bookId: string,
  sentenceId: string,
  note: string | null,
): Promise<void> {
  const userId = await getAuthenticatedUserId();
  if (!userId) throw new Error("Sign in to save notes.");
  await upsertNote(userId, bookId, sentenceId, note);
}

/**
 * One further page of the signed-in learner's My Saves list, for the
 * "Load more" button (see SavedSentencesList) — the My Saves page itself
 * fetches the first page directly from fetchMySavedSentences (a plain
 * server-component read, no action needed), this is only for the
 * client-triggered pages after it. An empty result for a guest, same
 * "harmless read, no error" shape as fetchBookSentenceMarksAction.
 */
export async function fetchMySavedSentencesAction(
  offset: number,
): Promise<{ items: SavedSentenceItem[]; hasMore: boolean }> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { items: [], hasMore: false };
  const locale = await getLocale();
  return fetchMySavedSentences(userId, { offset, locale: locale ?? undefined });
}
