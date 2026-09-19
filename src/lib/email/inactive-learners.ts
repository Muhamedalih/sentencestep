import { shouldNotify } from "@/lib/email/events";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export interface InactiveLearner {
  userId: string;
  daysInactive: number;
}

/**
 * Learners whose streaks.last_active_date crosses INACTIVITY_THRESHOLD_DAYS
 * (see shouldNotify's INACTIVE_LEARNER case) — the eligibility query shared
 * by both the email reminder (src/app/api/cron/inactive-learners) and the
 * push reminder (src/app/api/cron/inactive-learners-push), so "how many days
 * counts as inactive" has exactly one implementation regardless of which
 * channel a learner is eligible for. Channel-specific concerns (opt-in
 * check, dedupe ledger, the actual send) stay in each route — this only
 * answers "who is inactive right now."
 */
export async function getInactiveLearners(now: Date): Promise<InactiveLearner[]> {
  const supabase = createServiceRoleClient();
  const { data: streaks, error } = await supabase
    .from("streaks")
    .select("user_id, last_active_date");
  if (error) throw error;

  const eligible: InactiveLearner[] = [];
  for (const row of streaks ?? []) {
    if (!row.last_active_date) continue;
    const daysInactive = Math.floor(
      (now.getTime() - new Date(row.last_active_date).getTime()) / 86_400_000,
    );
    if (shouldNotify({ type: "INACTIVE_LEARNER", daysInactive })) {
      eligible.push({ userId: row.user_id, daysInactive });
    }
  }
  return eligible;
}
