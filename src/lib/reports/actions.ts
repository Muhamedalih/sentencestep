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
  const row = {
    user_id: user.id,
    user_email: user.email,
    page_path: input.pagePath.slice(0, MAX_PAGE_PATH_LENGTH),
    message,
  };

  let { error, status } = await supabase.from("problem_reports").insert(row);

  // status 0 is supabase-js's own signal that this request never reached
  // Postgres at all and got no HTTP response back — see
  // src/lib/supabase/server-fetch-with-timeout.ts's doc comment for the
  // recurring cause (a frozen Netlify function thawing with a pooled
  // connection Supabase's own side already closed, which then hangs until
  // fetch-with-timeout.ts's 8s AbortSignal.timeout notices). That file
  // deliberately never retries a write automatically — a real Postgrest/
  // Postgres error (RLS, a check constraint, ...) always carries a real
  // status code instead, and retrying THAT blindly could double a write
  // Postgres already applied. A `status === 0` failure carries no such risk
  // (nothing was ever received), and one extra problem-report row is cheap
  // enough (an admin seeing a duplicate, at worst) that it's worth buying
  // back the same self-healing a GET already gets, right here rather than
  // by loosening that shared, deliberately-write-safe fetch wrapper.
  if (error && status === 0) {
    console.error("[reports] submitProblemReport insert timed out, retrying once", error);
    ({ error, status } = await supabase.from("problem_reports").insert(row));
  }

  if (error) {
    console.error("[reports] submitProblemReport insert failed", { status, error });
    return { ok: false, code: "generic" };
  }
  return { ok: true };
}
