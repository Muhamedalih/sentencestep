import { handleNudgeRequest } from "@/lib/email/nudges/route-handler";

/**
 * "Remind me tomorrow": the one email a learner chose on the lesson-ending screen, sent in the hour
 * they picked. Called every hour by the scheduler (see .github/workflows/cron.yml); sends nothing
 * until SESSION_REMINDER_MAX_PER_RUN is set. See runSessionReminders in
 * src/lib/email/nudges/run.ts for the rules.
 */
export async function GET(request: Request) {
  return handleNudgeRequest(request, "session-reminder");
}

export async function POST(request: Request) {
  return handleNudgeRequest(request, "session-reminder");
}
