import { awardBadges } from "@/lib/features/badge-queries";
import { awardQuestDayBadgeIfDone } from "@/lib/features/badge-service";
import type { BadgeId, QuestType } from "@/lib/features/catalog";
import type { EffectiveFeatures } from "@/lib/features/config";
import { recordActivityDay, recordStreakBridgeDays } from "@/lib/features/activity-queries";
import { dealDailyQuests, recordQuestEvents } from "@/lib/features/quest-service";
import { passagePartQuestEvents } from "@/lib/features/quests";
import { bestEffort, planStreakForCompletion } from "@/lib/features/streak-service";
import { passageBadgesFor } from "@/lib/passages/progress";
import { emptyProgressState } from "@/lib/progress/types";
import { createClient } from "@/lib/supabase/server";
import { fetchStreak, upsertStreak } from "@/lib/supabase/queries/progress";

/**
 * What a finished passage part counts toward — the app's existing engagement
 * layer, not a new one: the daily quest "finish passage parts", the streak (and
 * the day on the streak calendar), and a few badges. Everything here is
 * best-effort by the same contract as the lesson-completion path: the learner's
 * place in the passage is saved first and separately, and a failure in any of
 * this (a migration not applied, a hiccup) is logged and swallowed — it can
 * never cost a learner their progress.
 */

export interface PassageRewards {
  /** Quests this very part completed (their XP was already granted in the database). */
  quests: { type: QuestType; xp: number }[];
  /** Badges this part earned. */
  badges: BadgeId[];
}

export const NO_PASSAGE_REWARDS: PassageRewards = { quests: [], badges: [] };

async function countFinishedPassages(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("passage_progress")
    .select("passage_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("completed_at", "is", null);
  if (error) throw error;
  return count ?? 0;
}

export async function recordPassagePartEngagement(input: {
  userId: string;
  /** The learner's own date; null when the browser did not send a believable one (the day-keyed parts are then skipped). */
  todayISO: string | null;
  /** Parts this save newly finished, as the database counted them. Zero means nothing new, so nothing is counted. */
  parts: number;
  /** This save newly finished the whole passage, as the database counted it (only the first finish). */
  passageCompleted: boolean;
  features: EffectiveFeatures;
}): Promise<PassageRewards> {
  const { userId, todayISO, parts, passageCompleted, features } = input;
  const rewards: PassageRewards = { quests: [], badges: [] };
  if (parts <= 0) return rewards;

  // The streak and the daily quest don't depend on each other, so they run side by side.
  //
  // The streak and the calendar: a part finished is learning activity today. Needs the learner's
  // own date — the streak is keyed on it (a lesson completion gets it the same way).
  const streakDone = todayISO
    ? bestEffort("passages: streak", async () => {
        const before = (await fetchStreak(userId)) ?? emptyProgressState.streak;
        if (before.lastActiveDate !== todayISO) {
          const plan = await planStreakForCompletion(
            userId,
            before,
            todayISO,
            features.streakCalendar,
          );
          await upsertStreak(userId, {
            currentStreak: plan.streak.currentStreak,
            longestStreak: plan.streak.longestStreak,
            lastActiveDate: plan.streak.lastActiveDate as string,
          });
          if (features.streakCalendar.trackActivity) {
            await bestEffort("passages: streak bridge days", () =>
              recordStreakBridgeDays(plan.bridges),
            );
          }
        }
        // Nothing typed here, so the day is marked without adding sentences or XP to the typing totals.
        if (features.streakCalendar.trackActivity) await recordActivityDay(todayISO, 0, 0);
      })
    : Promise.resolve();

  // The daily quest. A learner who came straight to a passage (not through Home) still has today's
  // quests dealt, so the part is not lost.
  const questsDone = features.quests.enabled
    ? (async () => {
        if (todayISO) {
          await dealDailyQuests(userId, todayISO, features).catch((error: unknown) => {
            console.error("[passages] dealDailyQuests failed", error);
          });
        }
        return recordQuestEvents(
          passagePartQuestEvents({
            parts,
            passageCompleted,
            honestTicks: features.rollouts.honestTicks,
          }),
          todayISO ?? undefined,
          features,
        );
      })()
    : Promise.resolve([]);

  const [, completedQuests] = await Promise.all([streakDone, questsDone]);
  rewards.quests = completedQuests;

  // Badges: one for the first passage and for reaching 5 and 10, and the "all quests in a day" one
  // when this part finished the day's last quest.
  if (features.badges.enabled) {
    try {
      const earned: BadgeId[] = [];
      if (passageCompleted) {
        const wanted = passageBadgesFor(await countFinishedPassages(userId)).filter(
          (id) => !features.badges.disabled.includes(id),
        );
        earned.push(...(await awardBadges(wanted)));
      }
      if (rewards.quests.length > 0) earned.push(...(await awardQuestDayBadgeIfDone(userId)));
      rewards.badges = earned;
    } catch (error) {
      console.error("[passages] badges failed", error);
    }
  }

  return rewards;
}
