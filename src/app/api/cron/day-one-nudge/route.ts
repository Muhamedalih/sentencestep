import { handleNudgeRequest } from "@/lib/email/nudges/route-handler";

/**
 * "Your next lesson is ready": one email, about a day after a new learner went quiet. Called once
 * a day by the scheduler (see .github/workflows/cron.yml); sends nothing until
 * NUDGE_EMAIL_MAX_PER_RUN is set. See src/lib/email/nudges/run.ts for the rules.
 */
export async function GET(request: Request) {
  return handleNudgeRequest(request, "day-one");
}

export async function POST(request: Request) {
  return handleNudgeRequest(request, "day-one");
}
