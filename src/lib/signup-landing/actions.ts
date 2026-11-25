"use server";

import { getEffectiveFeatures } from "@/lib/features/queries";
import { isModeWithPath, resolveNextLesson } from "@/lib/session-end/next-lesson";
import { signupLandingHref } from "@/lib/signup-landing/href";
import { getCurrentUser } from "@/lib/supabase/auth";

/**
 * The page a visitor who has just finished the opening lesson should land on after signing up (the
 * signupLanding permission): the next lesson by the same rule as Home, as a plain same-origin path,
 * or null when the permission is closed for this visitor, nothing is left to open, or anything
 * looks wrong. One call, made when the sign-up page opens; it reads the lesson catalog only (no
 * account exists yet), and a visitor already signed in gets null, since they have nothing to land
 * after. Never throws, and what it returns only ever picks a destination: it unlocks nothing.
 */
export async function fetchSignupLandingAction(input: {
  mode: string;
  lessonId: string;
  guestStartingLevel: number | null;
}): Promise<string | null> {
  try {
    const { mode, lessonId, guestStartingLevel } = input;
    if (!isModeWithPath(mode) || typeof lessonId !== "string" || lessonId.length > 200) {
      return null;
    }
    const [features, user] = await Promise.all([getEffectiveFeatures(), getCurrentUser()]);
    if (!features.rollouts.signupLanding || user) return null;
    const next = await resolveNextLesson({
      user: null,
      mode,
      lessonId,
      guestCompletedIds: [],
      guestStartingLevel,
    });
    return next ? signupLandingHref(next.mode, next.id) : null;
  } catch (error) {
    console.error("[signup-landing] fetchSignupLandingAction failed", error);
    return null;
  }
}
