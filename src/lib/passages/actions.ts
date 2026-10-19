"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import type { ActionResult } from "@/lib/admin/content-actions";
import { saveFeatureConfig } from "@/lib/features/actions";
import { sanitizeFeatureConfig } from "@/lib/features/config";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { NO_PASSAGE_REWARDS, recordPassagePartEngagement } from "@/lib/passages/engagement";
import type { PassageRewards } from "@/lib/passages/engagement";
import { parsePassageProgressInput } from "@/lib/passages/progress";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export interface SavePassageProgressResult {
  ok: boolean;
  /** Why nothing was saved — a guest has nowhere to keep progress (not an error), anything else is. */
  reason?: "signed-out" | "unavailable" | "invalid" | "failed";
  /** What the finished part earned in the app's quests and badges (only when something was). */
  rewards?: PassageRewards;
}

/**
 * Saves how far the signed-in learner got in a passage: parts finished and the
 * best score, once after each part (the last one marks the passage done). The
 * database function (record_passage_progress) only ever moves progress
 * forward, so a retry or a replay of a finished passage cannot undo anything.
 * A guest simply gets { ok: false, reason: "signed-out" } — reading and
 * listening never need an account, only remembering the place does.
 *
 * Once the place is saved, the finished part is also counted toward the daily
 * quest, the streak and the badges (see recordPassagePartEngagement) — after
 * the save and best-effort, so none of it can cost a learner their progress.
 */
export async function savePassageProgressAction(
  input: unknown,
): Promise<SavePassageProgressResult> {
  const parsed = parsePassageProgressInput(input);
  if (!parsed) return { ok: false, reason: "invalid" };

  const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
  if (!features.passages.enabled) return { ok: false, reason: "unavailable" };
  if (!user) return { ok: false, reason: "signed-out" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("record_passage_progress", {
    p_passage_id: parsed.passageId,
    p_sections_done: parsed.sectionsDone,
    p_correct: parsed.correct,
    p_total: parsed.total,
    p_completed: parsed.completed,
  });
  if (error) {
    console.error("[passages] record_passage_progress failed", error);
    return { ok: false, reason: "failed" };
  }

  const rewards = await recordPassagePartEngagement({
    userId: user.id,
    todayISO: parsed.todayISO,
    passageCompleted: parsed.completed,
    features,
  }).catch((engagementError: unknown) => {
    console.error("[passages] recordPassagePartEngagement failed", engagementError);
    return NO_PASSAGE_REWARDS;
  });
  const earnedSomething = rewards.quests.length > 0 || rewards.badges.length > 0;
  return earnedSomething ? { ok: true, rewards } : { ok: true };
}

/**
 * The "Publish to everyone" button on the Passages page: flips the Passages
 * switch between Admin preview (only admins see the section) and On (everyone
 * does), through the same save the Features page uses. The passages' word lessons
 * are not part of it: they stay hidden from Word Lists (see syncPassageWordGroups).
 * Admin-only, checked here and again by that save.
 */
export async function setPassagesPublishedAction(publish: boolean): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  // The CURRENT document, read fresh (not the share-cached read): this saves the
  // whole document back, so working from a stale copy could undo another change.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feature_settings")
    .select("config")
    .eq("id", 1)
    .maybeSingle();
  if (error) return { error: "Couldn't read the feature settings. Please try again." };

  const config = sanitizeFeatureConfig(data?.config);
  config.features.passages.state = publish ? "on" : "admin";

  const saved = await saveFeatureConfig(config);
  if (saved.error) return saved;

  revalidatePath("/learn/passages");
  return {
    success: publish ? "Passages are now open to everyone." : "Passages are back to admins only.",
  };
}
