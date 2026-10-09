import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public-client";

/**
 * The two admin switches for showing ratings to visitors (Admin > Ratings),
 * stored in the single-row `ratings_settings` table (see
 * 20250332000000_ratings_display_settings.sql). Both are off until an admin
 * turns them on.
 */
export interface RatingsSettings {
  /** The "average from N ratings" line on /upgrade. */
  showRatingProof: boolean;
  /** Whether ratings an admin approved ("Show on site") may be shown at all. */
  showPublicRatings: boolean;
}

export const RATINGS_HIDDEN: RatingsSettings = { showRatingProof: false, showPublicRatings: false };

/** Strict on purpose: only a real `true` turns something on. */
export function parseRatingsSettings(row: unknown): RatingsSettings {
  if (typeof row !== "object" || row === null) return RATINGS_HIDDEN;
  const values = row as Record<string, unknown>;
  return {
    showRatingProof: values.show_rating_proof === true,
    showPublicRatings: values.show_public_ratings === true,
  };
}

/**
 * The stored switches. Any problem — no Supabase project, the migration not
 * applied yet, a read error — means "nothing is shown", never an error page.
 * cache()'d per request.
 */
export const getRatingsSettings = cache(async (): Promise<RatingsSettings> => {
  if (!isSupabaseConfigured()) return RATINGS_HIDDEN;

  try {
    const { data, error } = await createPublicClient()
      .from("ratings_settings")
      .select("show_rating_proof, show_public_ratings")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data) return RATINGS_HIDDEN;
    return parseRatingsSettings(data);
  } catch {
    return RATINGS_HIDDEN;
  }
});
