import { awardQuestDayBadgeIfDone } from "@/lib/features/badge-service";
import {
  addQuestProgress,
  fetchDailyQuests,
  insertDailyQuests,
} from "@/lib/features/quest-queries";
import type { QuestType } from "@/lib/features/catalog";
import type { EffectiveFeatures } from "@/lib/features/config";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { eligibleQuestTypes, pickDailyQuestTypes } from "@/lib/features/quests";
import type { DailyQuest } from "@/lib/features/quests";
import { fetchWeakCandidateMistakeRows } from "@/lib/supabase/queries/mistakes";
import { isWeakWord } from "@/lib/weak-words/types";

/**
 * Server-side quest orchestration: dealing the day's quests and turning
 * learning events into progress. Both are best-effort by contract — quests
 * are an optional layer on top of learning, so a failure here (say the
 * migration isn't applied yet) is logged and swallowed, never allowed to
 * fail the lesson completion or review that triggered it.
 */

export interface CompletedQuest {
  type: QuestType;
  xp: number;
}

/** How many words the learner could review right now — what makes a "master N words" quest achievable. */
async function countReviewableWords(userId: string): Promise<number> {
  try {
    const rows = await fetchWeakCandidateMistakeRows(userId);
    return rows.filter(isWeakWord).length;
  } catch {
    return 0;
  }
}

/**
 * Deals today's quests for a learner (once — later calls just read them
 * back). `dateISO` is the learner's own local calendar date. Returns [] when
 * quests aren't open to this learner or nothing achievable can be dealt.
 */
export async function dealDailyQuests(
  userId: string,
  dateISO: string,
  features: EffectiveFeatures,
): Promise<DailyQuest[]> {
  if (!features.quests.enabled) return [];

  const existing = await fetchDailyQuests(userId, dateISO);
  if (existing.length > 0) return existing;

  const eligible = eligibleQuestTypes(features.quests.types, {
    reviewableWords: await countReviewableWords(userId),
    dictationAvailable: Object.values(features.dictation.sections).some(Boolean),
    dailySessionAvailable: features.dailySession.enabled,
  });
  if (eligible.length === 0) return [];

  const picked = pickDailyQuestTypes(userId, dateISO, eligible, features.quests.count);
  await insertDailyQuests(
    userId,
    dateISO,
    picked.map((type, slot) => ({
      slot,
      type,
      target: features.quests.types[type].target,
      xp: features.quests.types[type].xp,
    })),
  );
  // Re-read rather than trust the insert: a concurrent deal (two tabs) may
  // have won the race, and the learner must see the rows that actually exist.
  return fetchDailyQuests(userId, dateISO);
}

/**
 * Feeds learning events into today's quests and returns the quests THIS call
 * finished (their XP was already granted atomically in the database).
 * `dateISO` is the learner's local date when the caller has it; without it
 * the database picks the learner's most recent quest day (see
 * add_quest_progress).
 */
export async function recordQuestEvents(
  events: { type: QuestType; amount: number }[],
  dateISO?: string,
): Promise<CompletedQuest[]> {
  const completed: CompletedQuest[] = [];
  try {
    const features = await getEffectiveFeatures();
    if (!features.quests.enabled) return completed;
    for (const event of events) {
      if (event.amount <= 0) continue;
      const results = await addQuestProgress(event.type, event.amount, dateISO);
      for (const result of results) {
        if (result.completedNow) completed.push({ type: result.type, xp: result.xp });
      }
    }
  } catch (error) {
    console.error("[quests] recordQuestEvents failed", error);
  }
  return completed;
}

/**
 * recordQuestEvents plus the "all daily quests in one day" badge: for the
 * places that credit quest progress outside a lesson completion (word
 * reviews, feature-usage reports), where nothing else is watching for the
 * day's last quest to finish. Both halves are best-effort.
 */
export async function recordQuestEventsAndBadges(
  userId: string,
  events: { type: QuestType; amount: number }[],
  dateISO?: string,
): Promise<CompletedQuest[]> {
  const completed = await recordQuestEvents(events, dateISO);
  if (completed.length > 0) await awardQuestDayBadgeIfDone(userId);
  return completed;
}
