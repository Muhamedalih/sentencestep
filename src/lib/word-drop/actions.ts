"use server";

import { after } from "next/server";

import { track } from "@/lib/analytics/track";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getCurrentUser } from "@/lib/supabase/auth";
import { fetchProfileCountry } from "@/lib/supabase/queries/profile";

import { scoreLimiter } from "./rate";
import { isPlausibleDay, parseDailyScore } from "./scores";
import { loadDailyBoard, recordDailyScore, type DailyBoard } from "./store";
import { parseWordDropReport } from "./tracking";

/** What the end page shows after a daily round: the best of the day, whether this round improved it, and the board. */
export interface DailyOutcome {
  ok: boolean;
  /** Why a score was not recorded, when the server refused it: `limit` (rounds too close together or too many today) or `invalid` (numbers a round cannot produce). */
  reason?: "limit" | "invalid";
  best?: number;
  improved?: boolean;
  board?: DailyBoard;
}

/**
 * Records one daily-challenge round for the signed-in learner (the better score of the day is kept) and
 * answers with the day's ranking. Everything arrives as client input, so it is re-validated (see
 * parseDailyScore: limits and the fit between score, words and speed), the learner may not record more
 * than one round every 90 seconds nor more than 30 a day (see rate.ts), and the "wordDrop" permission
 * must be open for the caller (a Server Action is reachable as a direct POST). Refused scores are
 * logged to the console only. Best-effort: it never throws into the game, which carries on either way;
 * on a project that has not applied the migration it just answers `ok: false`.
 */
export async function submitDailyScoreAction(input: unknown): Promise<DailyOutcome> {
  try {
    const parsed = parseDailyScore(input);
    if (!parsed) {
      console.warn("[word-drop] daily score refused: numbers a round cannot produce");
      return { ok: false, reason: "invalid" };
    }
    const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
    if (!features.rollouts.wordDrop || !user) return { ok: false };
    const verdict = scoreLimiter.check(user.id);
    if (verdict !== "ok") {
      console.warn(`[word-drop] daily score refused: ${verdict}`);
      return { ok: false, reason: "limit" };
    }
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

/**
 * Called from the game: once when a round starts, once when it ends, once when its picture or its
 * challenge link is shared. Counts only (the mode, the kind of round, the score and the accuracy): no
 * word, no name. Fire-and-forget, and the write is left until the response is sent, like the other
 * analytics actions. The report arrives as client input, so it is re-validated (see
 * parseWordDropReport) and a bad one is silently dropped.
 */
export async function trackWordDropAction(report: unknown): Promise<void> {
  try {
    const parsed = parseWordDropReport(report);
    if (!parsed) return;
    const user = await getCurrentUser();
    const userId = user?.id ?? null;
    after(() => track(parsed.event, userId));
  } catch (error) {
    console.error("[word-drop] trackWordDropAction failed", error);
  }
}
