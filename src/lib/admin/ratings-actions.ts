"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import { APP_RATING_STATUSES, type AppRatingStatus } from "@/lib/admin/ratings-domain";

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
