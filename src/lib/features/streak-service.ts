import { consumeStreakFreezes, fetchFreezeUsage } from "@/lib/features/activity-queries";
import { freezesRemaining, monthPeriod, planStreakUpdate } from "@/lib/features/streak-freeze";
import type { StreakPlan } from "@/lib/features/streak-freeze";
import type { StreakState } from "@/lib/progress/types";

/**
 * The streak side of "the learner did something today", shared by everything
 * that counts as learning activity: a lesson completion (recordCompletionAction)
 * and a finished passage part (see src/lib/passages/engagement.ts). Moved here
 * unchanged from the lesson-completion action so both paths advance the streak
 * — and spend streak freezes — by exactly the same rules.
 */

/**
 * The streak update for this completion. With the admin "streak calendar &
 * freeze" feature on, extra consecutive missed days (beyond the free
 * one-day grace) are covered by spending freezes from the learner's monthly
 * balance; otherwise it is exactly the original updateStreak behavior. Any
 * failure reading or spending freezes (e.g. the migration isn't applied to
 * this environment yet) degrades to the original behavior — a lesson
 * completion must never fail over an optional protection feature.
 */
export async function planStreakForCompletion(
  userId: string,
  beforeStreak: StreakState,
  todayISO: string,
  freezeConfig: { enabled: boolean; monthlyFreezes: number },
): Promise<StreakPlan> {
  if (!freezeConfig.enabled) return planStreakUpdate(beforeStreak, todayISO, 0);
  try {
    const period = monthPeriod(todayISO);
    const usage = await fetchFreezeUsage(userId);
    const available = freezesRemaining(usage, period, freezeConfig.monthlyFreezes);
    const plan = planStreakUpdate(beforeStreak, todayISO, available);
    if (plan.freezesUsed === 0) return plan;
    const spent = await consumeStreakFreezes(period, plan.freezesUsed, freezeConfig.monthlyFreezes);
    // Someone else (another tab) spent the balance first: let the streak
    // fall back to the no-freeze outcome rather than granting a free save.
    return spent >= plan.freezesUsed ? plan : planStreakUpdate(beforeStreak, todayISO, 0);
  } catch (error) {
    console.error("[progress] planStreakForCompletion: freeze handling failed", error);
    return planStreakUpdate(beforeStreak, todayISO, 0);
  }
}

/** Runs an optional, best-effort write on the completion path and swallows its failure — see planStreakForCompletion. */
export async function bestEffort(label: string, write: () => Promise<void>): Promise<void> {
  try {
    await write();
  } catch (error) {
    console.error(`[progress] ${label} failed`, error);
  }
}
