import { handleNudgeRequest } from "@/lib/email/nudges/route-handler";

/**
 * "Did something go wrong with your payment?": one email to someone whose order was started and
 * never finished. Called once a day by the scheduler (see .github/workflows/cron.yml); sends
 * nothing until NUDGE_EMAIL_MAX_PER_RUN is set. See src/lib/email/nudges/run.ts for the rules.
 */
export async function GET(request: Request) {
  return handleNudgeRequest(request, "abandoned");
}

export async function POST(request: Request) {
  return handleNudgeRequest(request, "abandoned");
}
