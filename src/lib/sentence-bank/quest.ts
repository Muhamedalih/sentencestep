import type { EffectiveFeatures } from "@/lib/features/config";
import { fetchDailyQuests, insertDailyQuests } from "@/lib/features/quest-queries";
import type { DailyQuest } from "@/lib/features/quests";
import { countSentencesReady } from "@/lib/sentence-bank/load";
import type { SentenceBankContext } from "@/lib/sentence-bank/load";
import { sentenceQuest, sentenceQuestRow } from "@/lib/today/quests";

/**
 * Whether the day's test row exists and is not finished: where the words step leads next. With
 * `deal` the row is dealt first when it does not exist yet — a learner who goes straight from the
 * story to the words never rebuilt Home, and their test row would otherwise never have been dealt.
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
 * Sentence bank: dealing Today's fourth row. The row — the day's test — exists only on a day today's
 * lessons have something to ask (never an empty row), so it is dealt when the box is built, once, and
 * every later visit that day finds it already there and reads nothing. What is ready is the lines of
 * the passage and the story the learner finished today, so a learner who finishes the passage gets
 * the row on the next build. Best-effort by contract, like all quest work: any failure leaves the
 * box with its three tasks.
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

  try {
    // Nothing finished today reads nothing (see countSentencesReady) and gives no row.
    const row = sentenceQuestRow(features.quests.types, await countSentencesReady(context));
    if (!row) return null;
    const inserted = await insertDailyQuests(context.userId, context.todayISO, [row]);
    if (inserted[0]) return inserted[0];
    // Another tab dealt it first: read back what exists.
    return sentenceQuest(await fetchDailyQuests(context.userId, context.todayISO)) ?? null;
  } catch (error) {
    console.error("[sentence-bank] dealSentenceQuest failed", error);
    return null;
  }
}
