"use server";

import { getLessonSummaries } from "@/lib/content";
import { canEmailAccount } from "@/lib/email/nudges/select";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { hasPushSubscription } from "@/lib/push/subscriptions";
import { nameableWord } from "@/lib/return-loop/message";
import { isStorableReminderTime } from "@/lib/session-end/reminder";
import { isModeWithPath, resolveNextLesson } from "@/lib/session-end/next-lesson";
import { LESSON_MINUTES } from "@/lib/session-end/summary";
import { getCurrentUser } from "@/lib/supabase/auth";
import { fetchRecentActiveMistakeWords } from "@/lib/supabase/queries/mistakes";
import { createClient } from "@/lib/supabase/server";
import type { LearningMode } from "@/types/content";

/** What the return loop's card needs for a learner who just finished a lesson. */
export interface ReturnHook {
  /** False when the return loop is not open for this visitor, is not a signed-in learner, or the server cannot send reminders: nothing is shown then. */
  enabled: boolean;
  next: { id: string; mode: LearningMode; title: string } | null;
  minutes: number;
  /** A Google-verified address: a reminder email can reach this learner. */
  canEmail: boolean;
  /** The Web Push public key, or null when push is not configured on the server. */
  vapidPublicKey: string | null;
}

const OFF: ReturnHook = {
  enabled: false,
  next: null,
  minutes: LESSON_MINUTES,
  canEmail: false,
  vapidPublicKey: null,
};

/**
 * The one request the first two doors of the return loop make (the end of the first lesson, and the
 * page after a guest signs up): tomorrow's lesson by name, whether an email can reach this learner,
 * and the push key. `lessonId` is the lesson just finished (for the page after sign-up, the opening
 * lesson the guest finished before the account existed), so the next lesson is the one after it even
 * while the guest's progress is still moving into the account. Never throws.
 */
export async function fetchReturnHookAction(input: {
  /** The lesson just finished. Without one (Today's finish screen, which names no single lesson) no next lesson is looked up and the message opens Home. */
  mode?: LearningMode;
  lessonId?: string;
}): Promise<ReturnHook> {
  try {
    const { mode, lessonId } = input;
    const withLesson = mode !== undefined || lessonId !== undefined;
    if (
      withLesson &&
      (!isModeWithPath(mode) || typeof lessonId !== "string" || lessonId.length > 200)
    ) {
      return OFF;
    }
    const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
    if (!features.rollouts.returnLoop || !user) return OFF;
    const [next, canEmail] = await Promise.all([
      withLesson && isModeWithPath(mode) && typeof lessonId === "string"
        ? resolveNextLesson({
            user,
            mode,
            lessonId,
            guestCompletedIds: [],
            guestStartingLevel: null,
          })
        : Promise.resolve(null),
      readCanEmail(),
    ]);
    return {
      enabled: true,
      next,
      minutes: LESSON_MINUTES,
      canEmail,
      vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null,
    };
  } catch (error) {
    console.error("[return-loop] fetchReturnHookAction failed", error);
    return OFF;
  }
}

export type SetReturnResult =
  | { ok: true; channel: "push" | "email" }
  | { ok: false; reason: "disabled" | "unverified" | "nopush" | "error" };

/**
 * Stores, replaces or (with null) clears the signed-in learner's ONE reminder: the choice on the
 * return loop's card. Every condition is re-checked here, since a Server Action can be called by a
 * direct POST whatever the screen shows: the permission must be open for this visitor with sending
 * switched on at the server, there must be a signed-in learner, `remindAt` must be a real instant
 * between an hour and forty hours away, an email reminder needs a Google-verified address and a push
 * reminder needs a subscription already saved for this learner. What the message will name is worked
 * out HERE, never taken from the browser: the title comes from the lesson catalog (by the id the
 * card was shown with), the word from the learner's own active mistakes. Never throws.
 */
export async function setReturnReminderAction(input: {
  remindAt: string | null;
  channel: "push" | "email";
  lesson?: { mode: string; id: string } | null;
}): Promise<SetReturnResult> {
  try {
    const features = await getEffectiveFeatures();
    if (!features.rollouts.returnLoop) return { ok: false, reason: "disabled" };

    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims.sub;
    if (!userId) return { ok: false, reason: "error" };

    const channel = input.channel === "push" ? "push" : "email";
    if (input.remindAt === null) {
      const { error } = await supabase.from("session_reminders").delete().eq("user_id", userId);
      return error ? { ok: false, reason: "error" } : { ok: true, channel };
    }
    if (typeof input.remindAt !== "string" || !isStorableReminderTime(input.remindAt, new Date())) {
      return { ok: false, reason: "error" };
    }
    if (channel === "email") {
      const allowed = canEmailAccount(
        { app_metadata: data.claims.app_metadata },
        process.env.NUDGE_EMAIL_ALLOW_PASSWORD_ACCOUNTS === "true",
      );
      if (!allowed) return { ok: false, reason: "unverified" };
    } else if (!(await hasPushSubscription(userId))) {
      return { ok: false, reason: "nopush" };
    }

    const [lesson, word] = await Promise.all([lookUpLesson(input.lesson), pickWord(userId)]);
    const { error } = await supabase.from("session_reminders").upsert(
      {
        user_id: userId,
        remind_at: new Date(input.remindAt).toISOString(),
        channel,
        lesson_mode: lesson?.mode ?? null,
        lesson_id: lesson?.id ?? null,
        lesson_title: lesson?.title ?? null,
        word,
      },
      { onConflict: "user_id" },
    );
    return error ? { ok: false, reason: "error" } : { ok: true, channel };
  } catch (error) {
    console.error("[return-loop] setReturnReminderAction failed", error);
    return { ok: false, reason: "error" };
  }
}

async function readCanEmail(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return false;
  return canEmailAccount(
    { app_metadata: data.claims.app_metadata },
    process.env.NUDGE_EMAIL_ALLOW_PASSWORD_ACCOUNTS === "true",
  );
}

/** The lesson the card named, checked against the catalog so the message can only ever name a real lesson (and carries its real title). */
async function lookUpLesson(
  lesson: { mode: string; id: string } | null | undefined,
): Promise<{ mode: "normal" | "stories"; id: string; title: string } | null> {
  if (!lesson || !isModeWithPath(lesson.mode) || typeof lesson.id !== "string") return null;
  if (!/^[\w-]{1,200}$/.test(lesson.id)) return null;
  const locale = await getLocale();
  const units = await getLessonSummaries(lesson.mode, locale ?? undefined);
  const found = units.find((unit) => unit.id === lesson.id);
  if (!found) return null;
  return { mode: lesson.mode, id: found.id, title: found.title.slice(0, 160) };
}

/** One word the learner stumbled on, most recent first, that is fit to name in a message. */
async function pickWord(userId: string): Promise<string | null> {
  try {
    const words = await fetchRecentActiveMistakeWords(userId, 6);
    for (const word of words) {
      const nameable = nameableWord(word);
      if (nameable) return nameable;
    }
  } catch {
    // The word is a nicety: the message is sent without it.
  }
  return null;
}
