"use server";

import { canEmailAccount } from "@/lib/email/nudges/select";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { isStorableReminderTime } from "@/lib/session-end/reminder";
import { createClient } from "@/lib/supabase/server";

/**
 * Stores, replaces or (with null) clears the signed-in learner's ONE reminder email — the choice on
 * the lesson-ending screen's "Remind me tomorrow" card. Every condition is re-checked here, since a
 * Server Action is reachable by a direct POST whatever the screen shows: the feature must be open
 * for this visitor with reminders switched on at the server, there must be a signed-in learner, and
 * `remindAt` must be a real instant between an hour and forty hours away. The row is scoped to the
 * learner by row-level security as well as by the id read from their session. Never throws:
 * resolves with whether the choice was saved.
 */
export async function setSessionReminderAction(
  remindAt: string | null,
): Promise<{ ok: boolean; reason?: "unverified" }> {
  try {
    const features = await getEffectiveFeatures();
    if (!features.rollouts.sessionReminders) return { ok: false };

    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims.sub;
    if (!userId) return { ok: false };
    // Reminders go only to addresses Google has verified, like every nudge (see canEmailAccount), so
    // a learner whose address is not is told so now instead of being promised an email that never comes.
    // Clearing a reminder is always allowed.
    if (
      remindAt !== null &&
      !canEmailAccount(
        { app_metadata: data.claims.app_metadata },
        process.env.NUDGE_EMAIL_ALLOW_PASSWORD_ACCOUNTS === "true",
      )
    ) {
      return { ok: false, reason: "unverified" };
    }

    if (remindAt === null) {
      const { error } = await supabase.from("session_reminders").delete().eq("user_id", userId);
      return { ok: !error };
    }
    if (typeof remindAt !== "string" || !isStorableReminderTime(remindAt, new Date())) {
      return { ok: false };
    }
    const { error } = await supabase
      .from("session_reminders")
      .upsert(
        { user_id: userId, remind_at: new Date(remindAt).toISOString() },
        { onConflict: "user_id" },
      );
    return { ok: !error };
  } catch (error) {
    console.error("[session-end] setSessionReminderAction failed", error);
    return { ok: false };
  }
}
