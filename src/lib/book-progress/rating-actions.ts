"use server";

import { createClient } from "@/lib/supabase/server";
import { fetchMyBookRating, upsertBookRating } from "@/lib/supabase/queries/book-ratings";

async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub ?? null;
}

/** This learner's own rating for the given book, or null for a guest or an unrated book. */
export async function fetchMyBookRatingAction(bookId: string): Promise<number | null> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return null;
  return fetchMyBookRating(userId, bookId);
}

/** Sets the signed-in learner's 1-5 star rating for a book — the star widget only ever calls this once already signed in (see BookRating), so reaching the guard here would mean a stale client state, not a normal path. */
export async function setBookRatingAction(bookId: string, rating: number): Promise<void> {
  const userId = await getAuthenticatedUserId();
  if (!userId) throw new Error("Sign in to rate books.");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be an integer between 1 and 5.");
  }
  await upsertBookRating(userId, bookId, rating);
}
