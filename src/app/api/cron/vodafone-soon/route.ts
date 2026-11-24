import { handleNudgeRequest } from "@/lib/email/nudges/route-handler";

/**
 * The ten-minute Vodafone Cash email: a Vodafone Cash order still unpaid ten minutes after it was
 * opened gets one short, kind "you can finish whenever you like". Called every five minutes by the
 * scheduler (see .github/workflows/cron.yml); sends nothing until NUDGE_EMAIL_MAX_PER_RUN is set. See
 * runVodafoneSoonNudge in src/lib/email/nudges/run.ts for the rules.
 */
export async function GET(request: Request) {
  return handleNudgeRequest(request, "vodafone-soon");
}

export async function POST(request: Request) {
  return handleNudgeRequest(request, "vodafone-soon");
}
