"use server";

import { track } from "@/lib/analytics/track";
import { getCurrentUser } from "@/lib/supabase/auth";

const DOORS = ["opener", "welcome", "session"] as const;
const STEPS = ["shown", "push", "email", "fallback_email", "none", "error"] as const;

/** One row per card shown and per time pressed (a few per learner, ever): the numbers the return loop is read by. Re-validated here; anything else is ignored. */
export async function trackReturnLoopAction(door: string, step: string): Promise<void> {
  const knownDoor = DOORS.find((d) => d === door);
  const knownStep = STEPS.find((s) => s === step);
  if (!knownDoor || !knownStep) return;
  const user = await getCurrentUser();
  await track(
    {
      name: "RETURN_LOOP_STEP",
      category: "ENGAGEMENT",
      properties: { door: knownDoor, step: knownStep },
    },
    user?.id ?? null,
  );
}
