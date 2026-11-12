import {
  RATINGS_PAGE_SIZE,
  RATINGS_SECTIONS,
  summarizeDistribution,
  type AppRatingStatus,
  type RatingsFilter,
  type RatingsSection,
  type RatingsSource,
  type RatingsSummary,
  type RatingUserType,
} from "@/lib/admin/ratings-domain";
import {
  PASSAGES_RATING_MODE,
  ROUNDS_RATING_LESSON_ID,
  VIDEO_RATING_MODE,
  WORDS_RATING_MODE,
} from "@/lib/feedback/rating-record";
import { createClient } from "@/lib/supabase/server";

/** The sections whose ratings are listed on their own tab, so the App tab leaves them out. */
const APP_EXCLUDED_MODES = `(${PASSAGES_RATING_MODE},${VIDEO_RATING_MODE},${WORDS_RATING_MODE})`;

function sourceMode(source: Exclude<RatingsSource, "app">): string {
  return source === "video"
    ? VIDEO_RATING_MODE
    : source === "words" || source === "rounds"
      ? WORDS_RATING_MODE
      : PASSAGES_RATING_MODE;
}

/** The two tabs that share the mode "words" are told apart by the lesson id: the word rounds' is "rounds". */
type ModeScope =
  | { only: string; lessonId?: string; notLessonId?: string }
  | { except: string };

/**
 * Which `mode`s a tab shows: one mode (a section's own tab, or one section of the app: the rating pop-up
 * after a Daily lesson is mode "normal", after a Story "stories", the one in Settings "settings"), or
 * every mode except the sections that have their own tab (the App tab as a whole, which is what the
 * site's average is made of).
 */
function modeScope(
  source: RatingsSource,
  section: RatingsSection,
): ModeScope {
  if (source === "rounds") return { only: sourceMode(source), lessonId: ROUNDS_RATING_LESSON_ID };
  if (source === "words") return { only: sourceMode(source), notLessonId: ROUNDS_RATING_LESSON_ID };
  if (source !== "app") return { only: sourceMode(source) };
  return section === "all" ? { except: APP_EXCLUDED_MODES } : { only: section };
}

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

  const scope = modeScope(filter.source, filter.section);
  if ("only" in scope) {
    query = query.eq("mode", scope.only);
    if (scope.lessonId) query = query.eq("lesson_id", scope.lessonId);
    if (scope.notLessonId) query = query.neq("lesson_id", scope.notLessonId);
  } else {
    query = query.not("mode", "in", scope.except);
  }
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
 * how many are waiting — for one source (the app's own ratings, or the Passages
 * section's). Archived ratings are left out of all of them (and out of the
 * average quoted on the site) — archiving is how a junk rating is removed.
 */
export async function getAppRatingsOverview(
  source: RatingsSource,
  section: RatingsSection = "all",
): Promise<
  RatingsSummary & {
    newCount: number;
    commentCount: number;
    publicCount: number;
    /** Approved ratings that have a comment — the ones the public box can actually show. */
    publicWithCommentCount: number;
  }
> {
  const supabase = await createClient();
  const scope = modeScope(source, section);
  const head = () => {
    let query = supabase.from("app_ratings").select("id", { count: "exact", head: true });
    if ("only" in scope) {
      query = query.eq("mode", scope.only);
      if (scope.lessonId) query = query.eq("lesson_id", scope.lessonId);
      if (scope.notLessonId) query = query.neq("lesson_id", scope.notLessonId);
    } else {
      query = query.not("mode", "in", scope.except);
    }
    return query;
  };

  // The per-star spread: the passages, video and whole-app figures come from the database functions
  // the site's average is also made of; a words rating or one section of the app has no function of its
  // own, so its five counts are read the same way the other figures below are.
  const perStar = async (): Promise<{ rating: number; rating_count: number }[]> => {
    const counts = await Promise.all(
      [1, 2, 3, 4, 5].map((stars) => head().neq("status", "archived").eq("rating", stars)),
    );
    for (const result of counts) if (result.error) throw result.error;
    return counts.map((result, index) => ({ rating: index + 1, rating_count: result.count ?? 0 }));
  };

  const [distribution, isNew, withComment, isPublic, isPublicWithComment] = await Promise.all([
    source === "passages"
      ? supabase.rpc("passage_rating_distribution")
      : source === "video"
        ? supabase.rpc("video_rating_distribution")
        : source === "words" || source === "rounds" || section !== "all"
          ? perStar().then((data) => ({ data, error: null }))
          : supabase.rpc("app_rating_distribution"),
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

/** How many ratings nobody has opened yet on each tab of Admin > Ratings. */
export async function countNewRatingsBySource(): Promise<Record<RatingsSource, number>> {
  const supabase = await createClient();
  const unread = () =>
    supabase.from("app_ratings").select("id", { count: "exact", head: true }).eq("status", "new");

  const [passages, video, words, rounds, app] = await Promise.all([
    unread().eq("mode", PASSAGES_RATING_MODE),
    unread().eq("mode", VIDEO_RATING_MODE),
    unread().eq("mode", WORDS_RATING_MODE).neq("lesson_id", ROUNDS_RATING_LESSON_ID),
    unread().eq("mode", WORDS_RATING_MODE).eq("lesson_id", ROUNDS_RATING_LESSON_ID),
    unread().not("mode", "in", APP_EXCLUDED_MODES),
  ]);
  if (passages.error) throw passages.error;
  if (video.error) throw video.error;
  if (words.error) throw words.error;
  if (rounds.error) throw rounds.error;
  if (app.error) throw app.error;
  return {
    app: app.count ?? 0,
    passages: passages.count ?? 0,
    video: video.count ?? 0,
    words: words.count ?? 0,
    rounds: rounds.count ?? 0,
  };
}

/**
 * How many ratings (archived ones left out) each section of the App tab holds, for the small tabs under
 * it: "all" is the whole App tab, so it equals the three sections together plus any other mode.
 */
export async function countAppRatingsBySection(): Promise<Record<RatingsSection, number>> {
  const supabase = await createClient();
  const results = await Promise.all(
    RATINGS_SECTIONS.map((section) => {
      const query = supabase
        .from("app_ratings")
        .select("id", { count: "exact", head: true })
        .neq("status", "archived");
      return section === "all"
        ? query.not("mode", "in", APP_EXCLUDED_MODES)
        : query.eq("mode", section);
    }),
  );
  const counts = {} as Record<RatingsSection, number>;
  RATINGS_SECTIONS.forEach((section, index) => {
    const result = results[index]!;
    if (result.error) throw result.error;
    counts[section] = result.count ?? 0;
  });
  return counts;
}

/** Powers the admin nav badge — ratings nobody has opened yet (from every source). */
export async function countNewAppRatings(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("app_ratings")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");

  if (error) throw error;
  return count ?? 0;
}
