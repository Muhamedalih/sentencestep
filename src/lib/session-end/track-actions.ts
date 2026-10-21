"use server";

import { track } from "@/lib/analytics/track";
import { isSessionEndAction } from "@/lib/session-end/action-names";
import { getCurrentUser } from "@/lib/supabase/auth";

/**
 * Called once from the recall round's own callbacks (see SessionEndFlow) — fire-and-forget, never
 * awaited before the screen moves on. The numbers arrive as client input, so they are re-validated
 * here (whole, non-negative, `clean` never above `total`, a round of at most ten sentences) and the
 * call silently no-ops otherwise.
 */
export async function trackSessionRecallAction(
  outcome: { clean: number; total: number } | { skipped: true },
): Promise<void> {
  if ("skipped" in outcome) {
    if (outcome.skipped !== true) return;
  } else if (
    !Number.isInteger(outcome.clean) ||
    !Number.isInteger(outcome.total) ||
    outcome.total < 1 ||
    outcome.total > 10 ||
    outcome.clean < 0 ||
    outcome.clean > outcome.total
  ) {
    return;
  }
  const user = await getCurrentUser();
  await track(
    {
      name: "SESSION_RECALL_FINISHED",
      category: "ENGAGEMENT",
      properties: "skipped" in outcome ? { skipped: true } : outcome,
    },
    user?.id ?? null,
  );
}

/** Called once when a learner presses something on the finish screen; the action name is re-validated against the known ones. */
export async function trackSessionEndAction(action: string): Promise<void> {
  if (!isSessionEndAction(action)) return;
  const user = await getCurrentUser();
  await track(
    { name: "SESSION_END_ACTION", category: "ENGAGEMENT", properties: { action } },
    user?.id ?? null,
  );
}
