import {
  RATINGS_PAGE_SIZE,
  summarizeDistribution,
  type AppRatingStatus,
  type RatingsFilter,
  type RatingsSummary,
  type RatingUserType,
} from "@/lib/admin/ratings-domain";
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
  /** Seconds it stays on screen in the public box, or null for automatic. */
  displaySeconds: number | null;
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
      "id, rating, comment, lesson_id, mode, locale, user_type, contact_email, status, is_public, display_seconds, created_at",
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
      displaySeconds: row.display_seconds,
      createdAt: row.created_at,
    })),
  };
}

/**
 * The figures at the top of the page: count, average, the per-star spread, and
 * how many are waiting. Archived ratings are left out of all of them (and out of
 * the average quoted on the site) — archiving is how a junk rating is removed.
 */
export async function getAppRatingsOverview(): Promise<
  RatingsSummary & {
    newCount: number;
    commentCount: number;
    publicCount: number;
    /** Approved ratings that have a comment — the ones the public box can actually show. */
    publicWithCommentCount: number;
  }
> {
  const supabase = await createClient();
  const head = () => supabase.from("app_ratings").select("id", { count: "exact", head: true });

  const [distribution, isNew, withComment, isPublic, isPublicWithComment] = await Promise.all([
    supabase.rpc("app_rating_distribution"),
    head().eq("status", "new"),
    head().neq("status", "archived").neq("comment", ""),
    head().neq("status", "archived").eq("is_public", true),
    head().neq("status", "archived").eq("is_public", true).neq("comment", ""),
  ]);
  for (const result of [distribution, isNew, withComment, isPublic, isPublicWithComment]) {
    if (result.error) throw result.error;
  }

  return {
    ...summarizeDistribution(distribution.data ?? []),
    newCount: isNew.count ?? 0,
    commentCount: withComment.count ?? 0,
    publicCount: isPublic.count ?? 0,
    publicWithCommentCount: isPublicWithComment.count ?? 0,
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
