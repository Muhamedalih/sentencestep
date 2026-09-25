import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Community, Step 1 (competitor report Section 6.3): a plain 1-5 star
 * rating per (user, book). Reads use the anonymous public client — the
 * average/count is public, same reasoning as every other Library read in
 * queries/library.ts — while writes use the session-aware server client,
 * since only the signed-in owner may write their own row (see
 * 20250308000000_book_ratings.sql's RLS policies).
 */

export interface BookRatingSummary {
  average: number;
  count: number;
}

/**
 * Every given book's rating average/count, computed on demand by the
 * book_rating_summaries Postgres function — one grouped aggregate query for
 * the whole list, never one query per book (see that function's own doc
 * comment for why this is preferred over a cached column). A book with no
 * ratings yet is simply absent from the returned map.
 *
 * Deliberately swallows (not `if (error) throw error`, unlike every other
 * read in this schema) rather than failing the whole Book Overview/Library
 * page: the 20250308000000_book_ratings.sql migration this function depends
 * on ships in the same PR as this code but is applied to the live Supabase
 * project as a separate, manual step (this environment has no database
 * credentials to run it itself) — a deploy landing before that migration
 * runs must degrade to "no ratings shown yet," never a broken page.
 */
export async function fetchBookRatingSummaries(
  bookIds: string[],
  client?: ReturnType<typeof createPublicClient>,
): Promise<Map<string, BookRatingSummary>> {
  const map = new Map<string, BookRatingSummary>();
  if (bookIds.length === 0 || !isSupabaseConfigured()) return map;

  const supabase = client ?? createPublicClient();
  const { data, error } = await supabase.rpc("book_rating_summaries", { p_book_ids: bookIds });
  if (error) {
    console.error("[book-ratings] book_rating_summaries failed", error);
    return map;
  }

  for (const row of data ?? []) {
    map.set(row.book_id, { average: row.average, count: row.rating_count });
  }
  return map;
}

/** Convenience single-book form of fetchBookRatingSummaries, for the Book Overview page. Null when the book has no ratings yet. */
export async function fetchBookRatingSummary(
  bookId: string,
  client?: ReturnType<typeof createPublicClient>,
): Promise<BookRatingSummary | null> {
  const map = await fetchBookRatingSummaries([bookId], client);
  return map.get(bookId) ?? null;
}

/** This learner's own rating for one book, or null if they haven't rated it (or the migration hasn't landed yet — see fetchBookRatingSummaries' doc comment). */
export async function fetchMyBookRating(userId: string, bookId: string): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("book_ratings")
    .select("rating")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .maybeSingle();
  if (error) {
    console.error("[book-ratings] fetchMyBookRating failed", error);
    return null;
  }
  return data?.rating ?? null;
}

/** Sets (or replaces) this learner's rating for one book. Still throws on failure (unlike the reads above) — BookRating's optimistic UI needs the real outcome to know whether to revert. */
export async function upsertBookRating(
  userId: string,
  bookId: string,
  rating: number,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("book_ratings").upsert(
    {
      user_id: userId,
      book_id: bookId,
      rating,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,book_id" },
  );
  if (error) throw error;
}
