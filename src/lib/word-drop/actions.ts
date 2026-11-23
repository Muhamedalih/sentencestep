"use server";

import { getEffectiveFeatures } from "@/lib/features/queries";
import { getCurrentUser } from "@/lib/supabase/auth";
import { fetchProfileCountry } from "@/lib/supabase/queries/profile";

import { isPlausibleDay, parseDailyScore } from "./scores";
import { loadDailyBoard, recordDailyScore, type DailyBoard } from "./store";

/** What the end page shows after a daily round: the best of the day, whether this round improved it, and the board. */
export interface DailyOutcome {
  ok: boolean;
  best?: number;
  improved?: boolean;
  board?: DailyBoard;
}

/**
 * Records one daily-challenge round for the signed-in learner (the better score of the day is kept) and
 * answers with the day's ranking. Everything arrives as client input, so it is re-validated (see
 * parseDailyScore) and the "wordDrop" permission must be open for the caller (a Server Action is
 * reachable as a direct POST). Best-effort: it never throws into the game, which carries on either way;
 * on a project that has not applied the migration it just answers `ok: false`.
 */
export async function submitDailyScoreAction(input: unknown): Promise<DailyOutcome> {
  try {
    const parsed = parseDailyScore(input);
    if (!parsed) return { ok: false };
    const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
    if (!features.rollouts.wordDrop || !user) return { ok: false };
    const country = await fetchProfileCountry(user.id).catch(() => null);
    const recorded = await recordDailyScore(
      parsed,
      country && /^[a-z]{2}$/.test(country) ? country : null,
    );
    if (!recorded) return { ok: false };
    const board = await loadDailyBoard(parsed.day).catch(() => undefined);
    return { ok: true, best: recorded.best, improved: recorded.improved, board };
  } catch (error) {
    console.error("[word-drop] submitDailyScoreAction failed", error);
    return { ok: false };
  }
}

/** The day's ranking for the start page's daily card; null on any failure or when the permission is closed. */
export async function fetchDailyBoardAction(day: unknown): Promise<DailyBoard | null> {
  try {
    if (!isPlausibleDay(day)) return null;
    const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
    if (!features.rollouts.wordDrop || !user) return null;
    return await loadDailyBoard(day);
  } catch (error) {
    console.error("[word-drop] fetchDailyBoardAction failed", error);
    return null;
  }
}
