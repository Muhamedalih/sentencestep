"use server";

import { after } from "next/server";

import { track } from "@/lib/analytics/track";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { canEmailAccount } from "@/lib/email/nudges/select";
import { fetchActiveMistakeCount, fetchDueReviewCountBy } from "@/lib/supabase/queries/mistakes";
import {
  isModeWithPath,
  resolveNextLesson,
  type SessionEndNextLesson,
} from "@/lib/session-end/next-lesson";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import type { LearningMode } from "@/types/content";

export type { SessionEndNextLesson };

export interface SessionEndData {
  /** The recommended next lesson, or null when nothing is left that this learner can open. */
  next: SessionEndNextLesson | null;
  /** Words waiting at the end of tomorrow (corrected words whose review falls due, plus mistakes not yet fixed), capped at the Daily session's size. Only counted for a signed-in learner while the Daily session — the screen those words come back on — is open for them; 0 otherwise. */
  reviewTomorrow: number;
  /** A signed-in learner with a Google-verified address, so a reminder EMAIL can reach them (the return loop's card offers that channel only then). Absent for a guest and on failure. */
  canEmail?: boolean;
  /** The Web Push public key (read at run time on the server, like Settings does), or null when push is not configured: the return loop's card offers notifications only when it is there. Absent for a guest. */
  vapidPublicKey?: string | null;
}

const NOTHING: SessionEndData = { next: null, reviewTomorrow: 0 };
const MAX_HORIZON_MS = 72 * 60 * 60 * 1000;

/**
 * What the finish screen needs that the lesson page didn't already know: the recommended next
 * lesson — by the same rule as Home (the learner's placement is a floor, see findCurrentLesson), not
 * the next one in catalog order, which for the opening lessons would skip most of a level — and how
 * many words come back tomorrow. One request per finished lesson, started while the recall round is
 * still on screen. A guest's finished lessons and placement live in their own browser, so the
 * caller sends them; a signed-in learner's are read from their account. It only changes which lesson
 * is suggested, so nothing sent can unlock anything. Never throws: any failure leaves the finish
 * screen without those two rows.
 */
export async function fetchSessionEndAction(input: {
  mode: LearningMode;
  lessonId: string;
  guestCompletedIds: string[];
  guestStartingLevel: number | null;
  /** The end of tomorrow in the learner's own time zone, as an instant. */
  tomorrowEndISO: string;
  /** For the SESSION_END_STARTED row this call also records (it is the first thing every finished lesson does here, so it costs no request of its own). */
  first: boolean;
  recall: boolean;
}): Promise<SessionEndData> {
  try {
    const { mode, lessonId, guestCompletedIds, guestStartingLevel, tomorrowEndISO, first, recall } =
      input;
    if (!isModeWithPath(mode) || typeof lessonId !== "string" || lessonId.length > 200) {
      return NOTHING;
    }

    const user = await getCurrentUser();
    after(() =>
      track(
        {
          name: "SESSION_END_STARTED",
          category: "ENGAGEMENT",
          properties: { first: first === true, recall: recall === true },
        },
        user?.id ?? null,
      ),
    );
    const [next, features, canEmail] = await Promise.all([
      resolveNextLesson({ user, mode, lessonId, guestCompletedIds, guestStartingLevel }),
      getEffectiveFeatures(),
      user ? readCanEmail() : Promise.resolve(undefined),
    ]);

    let reviewTomorrow = 0;
    const until = new Date(tomorrowEndISO);
    const horizon = until.getTime() - Date.now();
    if (
      user &&
      features.dailySession.enabled &&
      features.dailySession.sources.mistakesAndWeakWords &&
      Number.isFinite(horizon) &&
      horizon > 0 &&
      horizon <= MAX_HORIZON_MS
    ) {
      const [active, due] = await Promise.all([
        fetchActiveMistakeCount(user.id),
        fetchDueReviewCountBy(user.id, until),
      ]);
      reviewTomorrow = Math.min(features.dailySession.size, active + due);
    }

    return {
      next,
      reviewTomorrow,
      ...(canEmail === undefined
        ? {}
        : { canEmail, vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null }),
    };
  } catch (error) {
    console.error("[session-end] fetchSessionEndAction failed", error);
    return NOTHING;
  }
}

/** Whether the signed-in account has an address a reminder email may go to (Google-verified, unless the server allows password accounts): read from the sign-in token, no database read. */
async function readCanEmail(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims) return false;
    return canEmailAccount(
      { app_metadata: data.claims.app_metadata },
      process.env.NUDGE_EMAIL_ALLOW_PASSWORD_ACCOUNTS === "true",
    );
  } catch {
    return false;
  }
}
