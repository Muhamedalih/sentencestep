import { unstable_cache } from "next/cache";

import { summarizeDistribution } from "@/lib/admin/ratings-domain";
import { getRatingsSettings } from "@/lib/feedback/ratings-settings";
import { buildRatingsProof, type RatingsProof } from "@/lib/stats/ratings-proof";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/service-role";

/** Busted whenever an admin changes something that moves the figure (archiving a rating, the switches). */
export const RATINGS_PROOF_TAG = "ratings-proof";

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
