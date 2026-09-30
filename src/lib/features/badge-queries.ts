import { createClient } from "@/lib/supabase/server";
import { isBadgeId } from "@/lib/features/catalog";
import type { BadgeId } from "@/lib/features/catalog";
import type { BadgeMetrics } from "@/lib/features/badges";

/**
 * Persistence for badges (see 20250318000000_badges.sql). Throws on a database
 * error; badge-service.ts wraps these best-effort for the hot paths.
 */

export interface EarnedBadge {
  id: BadgeId;
  earnedAt: string;
  seen: boolean;
}

export async function fetchBadgeMetrics(): Promise<BadgeMetrics> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("badge_metrics").single();
  if (error) throw error;
  return {
    longestStreak: data.out_longest_streak,
    totalSentences: Number(data.out_total_sentences),
    lessonCount: Number(data.out_lesson_count),
    perfectLessons: Number(data.out_perfect_lessons),
    maxWpm: data.out_max_wpm,
    xp: data.out_xp,
    fixedWords: Number(data.out_fixed_words),
  };
}

export async function fetchEarnedBadges(userId: string): Promise<EarnedBadge[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_badges")
    .select("badge_id, earned_at, seen_at")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });
  if (error) throw error;
  const badges: EarnedBadge[] = [];
  for (const row of data ?? []) {
    // A row for a badge no longer in the catalog is simply not shown.
    if (isBadgeId(row.badge_id)) {
      badges.push({ id: row.badge_id, earnedAt: row.earned_at, seen: row.seen_at !== null });
    }
  }
  return badges;
}

/** Awards the given badges; returns only the ones that were genuinely new. */
export async function awardBadges(ids: BadgeId[]): Promise<BadgeId[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("award_badges", { p_ids: ids });
  if (error) throw error;
  return (data ?? []).map((row) => row.out_badge_id).filter(isBadgeId);
}

export async function markBadgesSeen(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_badges_seen");
  if (error) throw error;
}
