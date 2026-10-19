import type { NextResponse } from "next/server";

import { handleNudgeRequest } from "@/lib/email/nudges/route-handler";

/**
 * The weekly "your lesson is waiting" email to learners who have been away for a few days, run by
 * the daily scheduler (.github/workflows/cron.yml). All of the work (who is eligible, the weekly
 * limit per learner, the 20% who are deliberately not emailed, the pacing of a new sending domain,
 * which route the email goes through) lives in src/lib/email/nudges/run.ts, shared with the two
 * other nudge emails, so this is only the entry point. Sends nothing until NUDGE_EMAIL_MAX_PER_RUN
 * is set on the server; `?dry=1` counts who would be emailed without sending; `?preview=<address>`
 * sends one sample.
 */
export async function GET(request: Request): Promise<NextResponse> {
  return handleNudgeRequest(request, "reminder");
}

export async function POST(request: Request): Promise<NextResponse> {
  return handleNudgeRequest(request, "reminder");
}
