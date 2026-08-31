"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";

const MAX_MESSAGE_LENGTH = 1000;
const MAX_PAGE_PATH_LENGTH = 500;

export type SubmitReportResult =
  { ok: true } | { ok: false; code: "empty" | "too_long" | "not_signed_in" | "generic" };

/**
 * Records a learner-submitted "Report a problem" entry (see
 * src/components/app/report-problem-button.tsx). Only a signed-in learner
 * with a known email can file one — problem_reports' RLS insert policy
 * enforces auth.uid() = user_id independently, so this check is the
 * user-facing half of that same boundary, not the only one.
 */
export async function submitProblemReport(input: {
  message: string;
  pagePath: string;
}): Promise<SubmitReportResult> {
  const message = input.message.trim();
  if (!message) return { ok: false, code: "empty" };
  if (message.length > MAX_MESSAGE_LENGTH) return { ok: false, code: "too_long" };

  const user = await getCurrentUser();
  if (!user || !user.email) return { ok: false, code: "not_signed_in" };

  const supabase = await createClient();
  const { error } = await supabase.from("problem_reports").insert({
    user_id: user.id,
    user_email: user.email,
    page_path: input.pagePath.slice(0, MAX_PAGE_PATH_LENGTH),
    message,
  });

  if (error) return { ok: false, code: "generic" };
  return { ok: true };
}
