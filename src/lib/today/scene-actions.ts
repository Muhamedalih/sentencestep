"use server";

import { after } from "next/server";

import { track } from "@/lib/analytics/track";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { dealDailyQuests, recordQuestEventsAndBadges } from "@/lib/features/quest-service";
import { getCurrentUser } from "@/lib/supabase/auth";
import { loadTodayScene } from "@/lib/today/scene-load";
import { makeSceneWordClip } from "@/lib/today/scene-word-clips";
import { isSynthesisRateLimited } from "@/lib/voice/isolated-word-audio";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_LINES = 5;
const MAX_MISTAKES = 2000;

/**
 * Called once when a learner has typed the last line of today's scene (permission dailyScene): the
 * day's second task is done, and one SCENE_LINES_COMPLETED is recorded. The numbers come from the
 * browser, so they are checked and the call silently does nothing otherwise. Best-effort: it never
 * throws into the screen.
 */
export async function recordSceneLinesAction(input: {
  todayISO: string;
  lines: number;
  /** Lines written with no word shown. */
  clean: number;
  mistakes: number;
}): Promise<void> {
  try {
    const { todayISO, lines, clean, mistakes } = input;
    if (
      !ISO_DATE.test(todayISO) ||
      !Number.isInteger(lines) ||
      lines < 1 ||
      lines > MAX_LINES ||
      !Number.isInteger(clean) ||
      clean < 0 ||
      clean > lines ||
      !Number.isInteger(mistakes) ||
      mistakes < 0 ||
      mistakes > MAX_MISTAKES
    ) {
      return;
    }
    const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
    if (!features.rollouts.dailyScene || !user) return;
    after(() =>
      track(
        {
          name: "SCENE_LINES_COMPLETED",
          category: "LEARNING",
          properties: { lines, clean, mistakes },
        },
        user.id,
      ),
    );
    if (!features.quests.enabled) return;
    // A learner who came straight to the lines still has today's tasks dealt.
    await dealDailyQuests(user.id, todayISO, features).catch((error: unknown) => {
      console.error("[scene] dealDailyQuests failed", error);
    });
    // The second task is the "finish a lesson" row; only a "today" event reaches it.
    await recordQuestEventsAndBadges(
      user.id,
      [{ type: "lessons", amount: 1, audience: "today" }],
      todayISO,
    );
  } catch (error) {
    console.error("[scene] recordSceneLinesAction failed", error);
  }
}

/**
 * Records a word of today's scene that has no clip yet and returns it. The word must be one the
 * learner types in their own scene, so this is no general text-to-speech endpoint.
 */
export async function makeSceneWordClipAction(key: string): Promise<string | null> {
  try {
    if (typeof key !== "string" || key.length === 0 || key.length > 40) return null;
    const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
    if (!features.rollouts.dailyScene || !user) return null;
    const today = await loadTodayScene(user.id, features);
    if (!today || (await isSynthesisRateLimited())) return null;
    return await makeSceneWordClip(today.passage.id, today.scene, key);
  } catch (error) {
    console.error("[scene] makeSceneWordClipAction failed", error);
    return null;
  }
}
