"use server";

import { canEmailAccount } from "@/lib/email/nudges/select";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { guessAnsweredBy } from "@/lib/passages/series-guess";
import { seriesReminderId } from "@/lib/passages/series-reminder";
import { isStorableReminderTime } from "@/lib/session-end/reminder";
import { createClient } from "@/lib/supabase/server";

export type SeriesReminderResult = { ok: true } | { ok: false; reason: "unverified" | "error" };

/**
 * Stores the signed-in learner's one reminder for the series episode that opens tomorrow. Every
 * condition is checked again here, since a Server Action can be reached by a direct POST. Never throws.
 */
export async function setSeriesReminderAction(
  passageId: string,
  remindAt: string,
): Promise<SeriesReminderResult> {
  try {
    const features = await getEffectiveFeatures();
    const guess = typeof passageId === "string" ? guessAnsweredBy(passageId) : null;
    if (!features.rollouts.seriesGuess || !guess) return { ok: false, reason: "error" };

    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims.sub;
    if (!userId) return { ok: false, reason: "error" };
    // Reminders go only to addresses Google has verified, like every nudge (see canEmailAccount).
    if (
      !canEmailAccount(
        { app_metadata: data.claims.app_metadata },
        process.env.NUDGE_EMAIL_ALLOW_PASSWORD_ACCOUNTS === "true",
      )
    ) {
      return { ok: false, reason: "unverified" };
    }
    if (typeof remindAt !== "string" || !isStorableReminderTime(remindAt, new Date())) {
      return { ok: false, reason: "error" };
    }
    const { error } = await supabase.from("session_reminders").upsert(
      {
        user_id: userId,
        remind_at: new Date(remindAt).toISOString(),
        channel: "email",
        lesson_mode: null,
        lesson_id: seriesReminderId(passageId),
        lesson_title: guess.nextTitle,
        word: null,
      },
      { onConflict: "user_id" },
    );
    return error ? { ok: false, reason: "error" } : { ok: true };
  } catch (error) {
    console.error("[series] setSeriesReminderAction failed", error);
    return { ok: false, reason: "error" };
  }
}
