"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import { APP_RATING_STATUSES, type AppRatingStatus } from "@/lib/admin/ratings-domain";
import type { RatingsSettings } from "@/lib/feedback/ratings-settings";
import { RATINGS_PROOF_TAG } from "@/lib/stats/public-ratings";

export interface RatingActionState {
  error?: string;
}

export async function updateAppRatingStatus(
  id: string,
  status: AppRatingStatus,
): Promise<RatingActionState> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };
  if (!APP_RATING_STATUSES.includes(status)) return { error: "Invalid status." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_ratings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: "Failed to update this rating. Please try again." };

  void logAdminAction("rating.status_changed", "app_rating", id, { status });
  revalidatePath("/admin/ratings");
  // An archived rating no longer counts towards the average quoted on /upgrade.
  revalidateTag(RATINGS_PROOF_TAG);
  revalidatePath("/upgrade");
  return {};
}

/** Approves (or withdraws) showing a rating and its comment on the site — see listPublicAppRatings. */
export async function setAppRatingPublic(
  id: string,
  isPublic: boolean,
): Promise<RatingActionState> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_ratings")
    .update({ is_public: isPublic, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: "Failed to update this rating. Please try again." };

  void logAdminAction(isPublic ? "rating.made_public" : "rating.made_private", "app_rating", id);
  revalidatePath("/admin/ratings");
  return {};
}

/** The two switches for showing ratings to visitors (see RatingsSettings). Saved together; takes effect immediately. */
export async function setRatingsSettings(settings: RatingsSettings): Promise<RatingActionState> {
  const authError = await requireAdmin();
  if (authError) return { error: authError };

  const supabase = await createClient();
  // upsert, not update: it also creates the single row if it is somehow missing.
  const { error } = await supabase.from("ratings_settings").upsert(
    {
      id: 1,
      show_rating_proof: settings.showRatingProof === true,
      show_public_ratings: settings.showPublicRatings === true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error)
    return { error: "Couldn't save that. Make sure the latest migration has been applied." };

  void logAdminAction("ratings.settings_changed", "ratings_settings", null, {
    showRatingProof: settings.showRatingProof === true,
    showPublicRatings: settings.showPublicRatings === true,
  });
  revalidatePath("/admin/ratings");
  revalidatePath("/upgrade");
  revalidateTag(RATINGS_PROOF_TAG);
  return {};
}
