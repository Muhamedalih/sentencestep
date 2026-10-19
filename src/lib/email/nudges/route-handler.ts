import { NextResponse } from "next/server";

import { isValidCronAuth } from "@/lib/cron/auth";
import { nudgeLanguage } from "@/lib/email/nudges/copy";
import {
  runAbandonedCheckoutNudge,
  runDayOneNudge,
  sendNudgePreview,
} from "@/lib/email/nudges/run";
import { getRequestOrigin } from "@/lib/request-origin";

const EMAIL_SHAPE = /^[^\s<>@"]+@[^\s<>@"]+\.[^\s<>@"]+$/;

/**
 * The request side of the two nudge crons, shared so the two routes stay identical: the same bearer
 * check as every other cron (fails closed without CRON_SECRET), then one of
 *   - the run itself (GET or POST from the scheduler),
 *   - `?dry=1`: counts who would be emailed, sends and writes nothing,
 *   - `?preview=<address>&lang=<ar|es|tr|en>`: sends one sample to that address.
 * Learner addresses are never part of any response.
 */
export async function handleNudgeRequest(
  request: Request,
  kind: "day-one" | "abandoned",
): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 501 });
  }
  if (!isValidCronAuth(request.headers.get("authorization") ?? "", cronSecret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const origin = getRequestOrigin(request);

  try {
    const preview = params.get("preview");
    if (preview) {
      if (!EMAIL_SHAPE.test(preview)) {
        return NextResponse.json({ error: "preview must be an email address." }, { status: 400 });
      }
      const result = await sendNudgePreview({
        kind,
        to: preview,
        language: nudgeLanguage(params.get("lang")),
        origin,
      });
      return NextResponse.json(result);
    }

    const run = kind === "day-one" ? runDayOneNudge : runAbandonedCheckoutNudge;
    const summary = await run({ origin, now: new Date(), dryRun: params.get("dry") === "1" });
    return NextResponse.json(summary);
  } catch (error) {
    console.error(`[cron:${kind}-nudge] failed`, error);
    return NextResponse.json({ error: "The run failed." }, { status: 500 });
  }
}
