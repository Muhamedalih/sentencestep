"use server";

import { recordQuestEvents } from "@/lib/features/quest-service";
import type { CompletedQuest } from "@/lib/features/quest-service";
import { createClient } from "@/lib/supabase/server";

/** Upper bound on what one lesson could plausibly report — a client is never trusted to claim more. */
const MAX_REPORTED_SENTENCES = 100;

export interface FeatureUsage {
  /** Sentences graded through Dictation in the lesson that just finished. */
  dictationSentences?: number;
}

function clampCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(MAX_REPORTED_SENTENCES, Math.max(0, Math.floor(value)));
}

/**
 * The client tells the server what optional-feature practice a finished
 * lesson included, so quests (and later badges) can react. Signed-in only —
 * a guest has nothing to credit. Counts are clamped, never trusted, and the
 * quest layer is best-effort: this resolves with whatever it managed to do
 * and never throws into the lesson screen.
 */
export async function recordFeatureUsageAction(
  usage: FeatureUsage,
): Promise<{ completedQuests: CompletedQuest[] }> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims.sub) return { completedQuests: [] };

    const dictationSentences = clampCount(usage.dictationSentences);
    const completedQuests =
      dictationSentences > 0
        ? await recordQuestEvents([{ type: "dictation", amount: dictationSentences }])
        : [];
    return { completedQuests };
  } catch (error) {
    console.error("[features] recordFeatureUsageAction failed", error);
    return { completedQuests: [] };
  }
}
