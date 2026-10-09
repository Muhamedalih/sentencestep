import { unstable_cache } from "next/cache";

import { summarizeDistribution } from "@/lib/admin/ratings-domain";
import { PUBLIC_REVIEWS_MAX, toReviewItems, type ReviewItem } from "@/lib/feedback/reviews-display";
import { getRatingsSettings } from "@/lib/feedback/ratings-settings";
import { buildRatingsProof, type RatingsProof } from "@/lib/stats/ratings-proof";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/service-role";

/** Busted whenever an admin changes something that moves the figure (archiving a rating, the switches). */
export const RATINGS_PROOF_TAG = "ratings-proof";

/** Busted whenever an admin changes which ratings the public box shows, or for how long. */
export const PUBLIC_REVIEWS_TAG = "public-reviews";

async function readRatingsProof(): Promise<RatingsProof | null> {
  if (!isSupabaseConfigured() || !isServiceRoleConfigured()) return null;
  // Counted with the service role (only per-star totals ever leave this
  // function). A failure throws so it is not cached; the caller shows nothing.
  const { data, error } = await createServiceRoleClient().rpc("app_rating_distribution");
  if (error) throw error;
  return buildRatingsProof(summarizeDistribution(data ?? []).perStar);
}

/** Kept for an hour so /upgrade never runs a table count per visit. */
const getCachedRatingsProof = unstable_cache(readRatingsProof, ["ratings-proof-v1"], {
  revalidate: 3600,
  tags: [RATINGS_PROOF_TAG],
});

/**
 * The real average and count quoted on /upgrade, or null while the admin has the
 * switch off (checked on every request, so turning it off takes effect at once),
 * while there are too few ratings, or if anything fails — it is decoration, never
 * an error page.
 */
export async function getRatingsProof(): Promise<RatingsProof | null> {
  try {
    if (!(await getRatingsSettings()).showRatingProof) return null;
    return await getCachedRatingsProof();
  } catch {
    return null;
  }
}

async function readPublicReviews(): Promise<ReviewItem[]> {
  if (!isSupabaseConfigured() || !isServiceRoleConfigured()) return [];

  // The master switch is read here, inside the cached read, so turning it off
  // empties the list as soon as the admin's change busts PUBLIC_REVIEWS_TAG.
  if (!(await getRatingsSettings()).showPublicRatings) return [];

  // Only these columns ever leave this function: no email, no account id, no
  // browser id. app_ratings has no public RLS policy (RLS can't hide single
  // columns), so this is the one way a public page reads ratings — with the
  // service role, on the server. A failure throws so it is not cached.
  const { data, error } = await createServiceRoleClient()
    .from("app_ratings")
    .select("id, rating, comment, display_seconds")
    .eq("is_public", true)
    .neq("status", "archived")
    .neq("comment", "")
    .order("created_at", { ascending: false })
    .limit(PUBLIC_REVIEWS_MAX);
  if (error) throw error;

  return toReviewItems(
    (data ?? []).map((row) => ({
      id: row.id,
      rating: row.rating,
      comment: row.comment,
      displaySeconds: row.display_seconds,
    })),
  );
}

const getCachedPublicReviews = unstable_cache(readPublicReviews, ["public-reviews-v1"], {
  revalidate: 300,
  tags: [PUBLIC_REVIEWS_TAG],
});

/**
 * The ratings the rotating "what our learners say" box shows: the newest
 * PUBLIC_REVIEWS_MAX that an admin approved ("Show on site"), each with how many
 * seconds it stays on screen. Empty while the admin's master switch is off, while
 * nothing is approved, or if anything fails — it is decoration, never an error
 * page. Kept for five minutes and refreshed at once when an admin changes
 * something. Server-only: it uses the service-role client.
 */
export async function listPublicReviews(): Promise<ReviewItem[]> {
  try {
    return await getCachedPublicReviews();
  } catch {
    return [];
  }
}
