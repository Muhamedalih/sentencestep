import {
  summarizeGermanActivity,
  summarizeGermanChoices,
  type GermanActivitySummary,
  type GermanChoicesSummary,
  type GermanLessonEventRow,
} from "@/lib/admin/german-counter-domain";
import { summarizeDistribution, type RatingsSummary } from "@/lib/admin/ratings-domain";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/** PostgREST returns at most 1000 rows a call, so a long list is read in pages up to this many rows. */
const PAGE = 1000;
const MAX_ROWS = 20000;

async function readAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

export interface GermanComment {
  id: string;
  rating: number;
  comment: string;
  lessonId: string;
  createdAt: string;
}

export interface GermanCounter {
  choices: GermanChoicesSummary;
  /** First time the counter wrote a row, or null before anyone has chosen German since it started. */
  countingSince: string | null;
  activity: GermanActivitySummary;
  /** Accounts that have German as their language right now, learners only (admins and editors left out), and the share created in the last 7 days. */
  members: { onGerman: number; newLast7Days: number };
  ratings: RatingsSummary & { withComment: number };
  latestComments: GermanComment[];
}

/**
 * Everything on Admin > German, read with the service-role client (analytics_events is not readable by a
 * session). Admins and editors are left out of every figure: they try German out all the time and would
 * otherwise be the biggest "learner" there is.
 */
export async function getGermanCounter(now: Date = new Date()): Promise<GermanCounter> {
  const supabase = createServiceRoleClient();

  const staff = await readAll<{ id: string }>((from, to) =>
    supabase.from("profiles").select("id").in("role", ["admin", "editor"]).range(from, to),
  );
  const staffIds = new Set(staff.map((row) => row.id));
  const notStaff = <T extends { user_id: string | null }>(row: T) =>
    !row.user_id || !staffIds.has(row.user_id);

  const [choiceRows, lessonRows, ratingRows, onGerman, newOnGerman] = await Promise.all([
    readAll<{ user_id: string | null; created_at: string; event_properties: unknown }>(
      (from, to) =>
        supabase
          .from("analytics_events")
          .select("user_id, created_at, event_properties")
          .eq("event_name", "GERMAN_CHOSEN")
          .order("created_at", { ascending: true })
          .range(from, to),
    ),
    readAll<GermanLessonEventRow>((from, to) =>
      supabase
        .from("analytics_events")
        .select("user_id, event_name")
        .in("event_name", [
          "LESSON_STARTED",
          "STORY_STARTED",
          "CONVERSATION_STARTED",
          "LESSON_COMPLETED",
          "STORY_COMPLETED",
          "CONVERSATION_COMPLETED",
        ])
        .like("event_properties->>lessonId", "de-%")
        .range(from, to),
    ),
    readAll<{
      id: string;
      rating: number;
      comment: string;
      lesson_id: string;
      user_id: string | null;
      created_at: string;
    }>((from, to) =>
      supabase
        .from("app_ratings")
        .select("id, rating, comment, lesson_id, user_id, created_at")
        .like("lesson_id", "de-%")
        .neq("status", "archived")
        .order("created_at", { ascending: false })
        .range(from, to),
    ),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("target_language", "de")
      .eq("role", "user"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("target_language", "de")
      .eq("role", "user")
      .gte("created_at", new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);
  if (onGerman.error) throw onGerman.error;
  if (newOnGerman.error) throw newOnGerman.error;

  const choices = choiceRows.filter(notStaff);
  const ratings = ratingRows.filter(notStaff);
  const perStar = new Map<number, number>();
  for (const row of ratings) perStar.set(row.rating, (perStar.get(row.rating) ?? 0) + 1);

  return {
    choices: summarizeGermanChoices(choices, now),
    countingSince: choices[0]?.created_at ?? null,
    activity: summarizeGermanActivity(lessonRows.filter(notStaff)),
    members: { onGerman: onGerman.count ?? 0, newLast7Days: newOnGerman.count ?? 0 },
    ratings: {
      ...summarizeDistribution(
        [...perStar].map(([rating, rating_count]) => ({ rating, rating_count })),
      ),
      withComment: ratings.filter((row) => row.comment.trim() !== "").length,
    },
    latestComments: ratings
      .filter((row) => row.comment.trim() !== "")
      .slice(0, 8)
      .map((row) => ({
        id: row.id,
        rating: row.rating,
        comment: row.comment,
        lessonId: row.lesson_id,
        createdAt: row.created_at,
      })),
  };
}
