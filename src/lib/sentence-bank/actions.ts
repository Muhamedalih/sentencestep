"use server";

import { after } from "next/server";

import { track } from "@/lib/analytics/track";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { recordQuestEventsAndBadges } from "@/lib/features/quest-service";
import { WEEKLY_CHECK_SIZE } from "@/lib/sentence-bank/weekly";
import { saveSentenceCheck } from "@/lib/supabase/queries/sentence-checks";
import { recordSentenceReview } from "@/lib/supabase/queries/sentence-mastery";
import { getCurrentUser } from "@/lib/supabase/auth";
import { isISODate, isWordOutcome } from "@/lib/word-mastery/schedule";

/** The learner's "today" arrives from the page; anything further than this from the server's own clock is not a day they could be in. */
const MAX_DAY_SKEW_MS = 2 * 24 * 60 * 60 * 1000;

function isPlausibleDay(todayISO: unknown): todayISO is string {
  return (
    isISODate(todayISO) &&
    Math.abs(Date.parse(`${todayISO}T12:00:00Z`) - Date.now()) <= MAX_DAY_SKEW_MS
  );
}

/**
 * Records ONE sentence's first answer of a review (the second chance after a miss is practice and is
 * never sent): the schedule moves through the atomic record_sentence_review function, and the day's
 * "remember N sentences" task advances by one whatever the answer was — it is about doing the
 * review. Everything arrives as client input, so it is re-validated, and the sentence bank must be
 * open for the caller. Best-effort: it never throws into the review screen, which carries on
 * either way.
 */
export async function recordSentenceReviewAction(input: {
  sentenceId: string;
  outcome: string;
  todayISO: string;
}): Promise<{ ok: boolean }> {
  try {
    const { sentenceId, outcome, todayISO } = input;
    if (typeof sentenceId !== "string" || sentenceId.length === 0 || sentenceId.length > 120) {
      return { ok: false };
    }
    if (!isWordOutcome(outcome) || !isPlausibleDay(todayISO)) return { ok: false };
    const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
    if (!features.rollouts.sentenceBank || !user) return { ok: false };

    const recorded = await recordSentenceReview(sentenceId, outcome, todayISO);
    if (!recorded) return { ok: false };
    if (features.quests.enabled) {
      await recordQuestEventsAndBadges(user.id, [{ type: "sentenceReview", amount: 1 }], todayISO);
    }
    return { ok: true };
  } catch (error) {
    console.error("[sentence-bank] recordSentenceReviewAction failed", error);
    return { ok: false };
  }
}

/** How a review visit is reported: its start, and its end with how each sentence went. All counts of sentences, forms are the three review forms. */
export type SentenceReviewReport =
  | { event: "started"; count: number; partial: number; audio: number; translate: number }
  | {
      event: "finished";
      count: number;
      clean: number;
      assisted: number;
      missed: number;
      partial: number;
      audio: number;
      translate: number;
    };

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 20;
}

/**
 * Reports the start or the end of a review visit (the numbers the stop rules are judged on: how
 * many who start finish, and how well first answers go). Client input again, so every number is
 * checked; silent when anything does not check out.
 */
export async function trackSentenceReviewAction(report: SentenceReviewReport): Promise<void> {
  try {
    const counts = [report.count, report.partial, report.audio, report.translate];
    if (report.event === "finished") counts.push(report.clean, report.assisted, report.missed);
    if (!counts.every(isCount)) return;
    const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
    if (!features.rollouts.sentenceBank || !user) return;
    if (report.event === "started") {
      const { count, partial, audio, translate } = report;
      after(() =>
        track(
          {
            name: "SENTENCE_REVIEW_STARTED",
            category: "ENGAGEMENT",
            properties: { count, partial, audio, translate },
          },
          user.id,
        ),
      );
    } else {
      const { count, clean, assisted, missed, partial, audio, translate } = report;
      after(() =>
        track(
          {
            name: "SENTENCE_REVIEW_FINISHED",
            category: "ENGAGEMENT",
            properties: { count, clean, assisted, missed, partial, audio, translate },
          },
          user.id,
        ),
      );
    }
  } catch (error) {
    console.error("[sentence-bank] trackSentenceReviewAction failed", error);
  }
}

/**
 * Records ONE sentence's answer in the weekly check. The schedule moves exactly as for a review (a
 * miss comes back tomorrow; a sentence that was not due yet is left where it was when it is right),
 * but the day's "remember N sentences" task does NOT advance: the check is a measurement, not the
 * day's batch. Client input, so re-validated; best-effort like every action here.
 */
export async function recordSentenceCheckAnswerAction(input: {
  sentenceId: string;
  outcome: string;
  todayISO: string;
}): Promise<{ ok: boolean }> {
  try {
    const { sentenceId, outcome, todayISO } = input;
    if (typeof sentenceId !== "string" || sentenceId.length === 0 || sentenceId.length > 120) {
      return { ok: false };
    }
    if (!isWordOutcome(outcome) || !isPlausibleDay(todayISO)) return { ok: false };
    const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
    if (!features.rollouts.sentenceBank || !user) return { ok: false };
    return { ok: (await recordSentenceReview(sentenceId, outcome, todayISO)) !== null };
  } catch (error) {
    console.error("[sentence-bank] recordSentenceCheckAnswerAction failed", error);
    return { ok: false };
  }
}

/**
 * Saves a finished weekly check: how many sentences it asked, how many were typed right with no
 * help, and how many the learner wrote that week — the three numbers the line on Today says, and
 * nothing else. Re-validated (the figures come from the browser), one check per learner per day.
 */
export async function finishSentenceCheckAction(input: {
  todayISO: string;
  asked: number;
  remembered: number;
  written: number;
}): Promise<{ ok: boolean }> {
  try {
    const { todayISO, asked, remembered, written } = input;
    if (!isPlausibleDay(todayISO)) return { ok: false };
    if (!Number.isInteger(asked) || asked < 1 || asked > WEEKLY_CHECK_SIZE) return { ok: false };
    if (!Number.isInteger(remembered) || remembered < 0 || remembered > asked) return { ok: false };
    if (!Number.isInteger(written) || written < asked || written > 5000) return { ok: false };
    const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
    if (!features.rollouts.sentenceBank || !user) return { ok: false };

    await saveSentenceCheck(user.id, { checkedOn: todayISO, asked, remembered, written });
    after(() =>
      track(
        {
          name: "SENTENCE_CHECK_FINISHED",
          category: "ENGAGEMENT",
          properties: { asked, remembered, written },
        },
        user.id,
      ),
    );
    return { ok: true };
  } catch (error) {
    console.error("[sentence-bank] finishSentenceCheckAction failed", error);
    return { ok: false };
  }
}

/** Reports that a weekly check was opened, with how many sentences it asks. Silent when anything does not check out. */
export async function trackSentenceCheckStartedAction(asked: number): Promise<void> {
  try {
    if (!Number.isInteger(asked) || asked < 1 || asked > WEEKLY_CHECK_SIZE) return;
    const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
    if (!features.rollouts.sentenceBank || !user) return;
    after(() =>
      track(
        { name: "SENTENCE_CHECK_STARTED", category: "ENGAGEMENT", properties: { asked } },
        user.id,
      ),
    );
  } catch (error) {
    console.error("[sentence-bank] trackSentenceCheckStartedAction failed", error);
  }
}
