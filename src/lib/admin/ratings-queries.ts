import {
  RATINGS_PAGE_SIZE,
  summarizeDistribution,
  type AppRatingStatus,
  type RatingsFilter,
  type RatingsSummary,
  type RatingUserType,
} from "@/lib/admin/ratings-domain";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/service-role";
import { createClient } from "@/lib/supabase/server";

export interface AdminAppRating {
  id: string;
  rating: number;
  comment: string;
  lessonId: string;
  mode: string;
  locale: string;
  userType: RatingUserType;
  /** Where a reply goes, or null when there is none. */
  contactEmail: string | null;
  status: AppRatingStatus;
  isPublic: boolean;
  createdAt: string;
}

/**
 * Admin reads for Ratings — the session-aware client, like Reports and Inbox:
 * app_ratings' RLS grants is_admin() sessions full access (see
 * 20250331000000_app_ratings.sql), so no service-role client is needed here.
 */
export async function listAppRatings(
  filter: RatingsFilter,
): Promise<{ ratings: AdminAppRating[]; totalCount: number }> {
  const supabase = await createClient();
  let query = supabase
    .from("app_ratings")
    .select(
      "id, rating, comment, lesson_id, mode, locale, user_type, contact_email, status, is_public, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (filter.view === "archived") query = query.eq("status", "archived");
  else if (filter.view === "public") query = query.eq("is_public", true);
  else query = query.neq("status", "archived");

  if (filter.stars) query = query.eq("rating", filter.stars);
  if (filter.userType) query = query.eq("user_type", filter.userType);
  if (filter.commentOnly) query = query.neq("comment", "");

  const from = (filter.page - 1) * RATINGS_PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + RATINGS_PAGE_SIZE - 1);
  if (error) throw error;

  return {
    totalCount: count ?? 0,
    ratings: (data ?? []).map((row) => ({
      id: row.id,
      rating: row.rating,
      comment: row.comment,
      lessonId: row.lesson_id,
      mode: row.mode,
      locale: row.locale,
      userType: row.user_type,
      contactEmail: row.contact_email,
      status: row.status,
      isPublic: row.is_public,
      createdAt: row.created_at,
    })),
  };
}

/** The figures at the top of the page: count, average, the per-star spread, and how many are waiting. */
export async function getAppRatingsOverview(): Promise<
  RatingsSummary & { newCount: number; commentCount: number; publicCount: number }
> {
  const supabase = await createClient();
  const head = () => supabase.from("app_ratings").select("id", { count: "exact", head: true });

  const [distribution, isNew, withComment, isPublic] = await Promise.all([
    supabase.rpc("app_rating_distribution"),
    head().eq("status", "new"),
    head().neq("comment", ""),
    head().eq("is_public", true),
  ]);
  for (const result of [distribution, isNew, withComment, isPublic]) {
    if (result.error) throw result.error;
  }

  return {
    ...summarizeDistribution(distribution.data ?? []),
    newCount: isNew.count ?? 0,
    commentCount: withComment.count ?? 0,
    publicCount: isPublic.count ?? 0,
  };
}

/** Powers the admin nav badge — ratings nobody has opened yet. */
export async function countNewAppRatings(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("app_ratings")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");

  if (error) throw error;
  return count ?? 0;
}

export interface PublicAppRating {
  id: string;
  rating: number;
  comment: string;
  locale: string;
  createdAt: string;
}

/**
 * The ratings an admin approved for the site ("Show on site" in Admin >
 * Ratings), newest first, with only the columns that are safe to show anyone:
 * no email, no account id, no browser id. This is the one way a public page
 * should read ratings — app_ratings has no public RLS policy, because RLS
 * can't hide single columns. Server-only: it uses the service-role client.
 * Returns an empty list when that isn't configured, so a page built on it
 * simply shows nothing.
 */
export async function listPublicAppRatings(limit = 12): Promise<PublicAppRating[]> {
  if (!isServiceRoleConfigured()) return [];

  const { data, error } = await createServiceRoleClient()
    .from("app_ratings")
    .select("id, rating, comment, locale, created_at")
    .eq("is_public", true)
    .neq("comment", "")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    locale: row.locale,
    createdAt: row.created_at,
  }));
}
