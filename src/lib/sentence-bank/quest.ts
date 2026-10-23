import type { EffectiveFeatures } from "@/lib/features/config";
import { localISODateInTimeZone } from "@/lib/features/learner-date";
import { fetchDailyQuests, insertDailyQuests } from "@/lib/features/quest-queries";
import type { DailyQuest } from "@/lib/features/quests";
import { isMissingTableError } from "@/lib/sentence-bank/errors";
import {
  finishedLessonDays,
  finishedTodayLessons,
  recentFinishedLessons,
} from "@/lib/sentence-bank/finished";
import { countSentencesReady } from "@/lib/sentence-bank/load";
import type { SentenceBankContext } from "@/lib/sentence-bank/load";
import { sentenceQuest, sentenceQuestRow } from "@/lib/today/quests";

/** A project that has not applied the migration answers every read with "no such table"; this remembers that for a minute, per server process, so Home does not repeat the failing read on every visit. */
let tableMissingUntil = 0;
const MISSING_TABLE_BACKOFF_MS = 60_000;

/**
 * Whether the day's exam row exists and is not finished: where the words step leads next. With
 * `deal` the row is dealt first when it does not exist yet — a learner who goes straight from the
 * story to the words never rebuilt Home, and their exam row would otherwise never have been dealt.
 * False on any failure.
 */
export async function sentenceReviewPending(
  userId: string,
  todayISO: string,
  deal?: { context: SentenceBankContext; features: EffectiveFeatures },
): Promise<boolean> {
  try {
    const existing = await fetchDailyQuests(userId, todayISO);
    const row = deal
      ? await dealSentenceQuest({ ...deal, existing })
      : (sentenceQuest(existing) ?? null);
    return row !== null && !row.completed;
  } catch {
    return false;
  }
}

/**
 * Sentence bank: dealing Today's fourth row. The row — the day's exam — exists only on a day
 * sentences are ready (never an empty row), so it is dealt when the box is built, once, and every
 * later visit that day finds it already there and reads nothing. What is ready is the sentences of
 * earlier days plus those of the lessons finished today, so a learner who finishes their first story
 * gets the row on the next build, and one whose only ready sentences came from today's lessons is
 * not left without it. Best-effort by contract, like all quest work: any failure — most simply, the
 * sentence_mastery table not being created yet — leaves the box with its three tasks.
 */
export async function dealSentenceQuest(args: {
  context: SentenceBankContext;
  features: EffectiveFeatures;
  /** The day's rows already read. */
  existing: readonly DailyQuest[];
}): Promise<DailyQuest | null> {
  const { context, features, existing } = args;
  const found = sentenceQuest(existing);
  if (found) return found;
  if (!features.rollouts.sentenceBank || !features.quests.enabled) return null;
  if (!features.quests.types.sentenceReview.enabled) return null;
  if (Date.now() < tableMissingUntil) return null;

  // Nothing finished before today or today means nothing to ask, so nothing is read.
  const finished = finishedLessonDays(
    context.completions,
    (iso) => localISODateInTimeZone(context.timeZone, new Date(iso)) ?? iso.slice(0, 10),
  );
  if (
    recentFinishedLessons(finished, context.todayISO, 1).length === 0 &&
    finishedTodayLessons(finished, context.todayISO, 1).length === 0
  ) {
    return null;
  }

  try {
    const row = sentenceQuestRow(features.quests.types, await countSentencesReady(context));
    if (!row) return null;
    const inserted = await insertDailyQuests(context.userId, context.todayISO, [row]);
    if (inserted[0]) return inserted[0];
    // Another tab dealt it first: read back what exists.
    return sentenceQuest(await fetchDailyQuests(context.userId, context.todayISO)) ?? null;
  } catch (error) {
    if (isMissingTableError(error)) {
      tableMissingUntil = Date.now() + MISSING_TABLE_BACKOFF_MS;
      console.warn(
        "[sentence-bank] sentence_mastery not found: has supabase/migrations/20250347000000_sentence_mastery.sql been applied? The fourth row is skipped until it is.",
      );
      return null;
    }
    console.error("[sentence-bank] dealSentenceQuest failed", error);
    return null;
  }
}
