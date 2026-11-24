import { NextResponse } from "next/server";

import { isValidCronAuth } from "@/lib/cron/auth";
import { nudgeLanguage } from "@/lib/email/nudges/copy";
import {
  runAbandonedCheckoutNudge,
  runDayOneNudge,
  runReminderNudge,
  runSessionReminders,
  runVodafoneSoonNudge,
  sendNudgePreview,
} from "@/lib/email/nudges/run";
import { getRequestOrigin } from "@/lib/request-origin";

const EMAIL_SHAPE = /^[^\s<>@"]+@[^\s<>@"]+\.[^\s<>@"]+$/;

/**
 * The request side of the nudge crons, shared so the routes stay identical: the same bearer
 * check as every other cron (fails closed without CRON_SECRET), then one of
 *   - the run itself (GET or POST from the scheduler),
 *   - `?dry=1`: counts who would be emailed, sends and writes nothing,
 *   - `?preview=<address>&lang=<ar|es|tr|en>`: sends one sample to that address (for the checkout
 *     reminder, `&help=vodafone` or `&help=binance` shows the stalled-checkout wording),
 *   - for the checkout reminder only, `?audience=blocked` (with or without `dry=1`): the one-off to
 *     learners who pressed Pay at least twice in the last two weeks and never paid.
 * Learner addresses are never part of any response.
 */
export async function handleNudgeRequest(
  request: Request,
  kind: "day-one" | "abandoned" | "reminder" | "session-reminder" | "vodafone-soon",
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
        help:
          params.get("help") === "vodafone" || params.get("help") === "binance"
            ? (params.get("help") as "vodafone" | "binance")
            : null,
      });
      return NextResponse.json(result);
    }

    if (kind === "abandoned") {
      const summary = await runAbandonedCheckoutNudge({
        origin,
        now: new Date(),
        dryRun: params.get("dry") === "1",
        audience: params.get("audience") === "blocked" ? "blocked" : "recent",
      });
      return NextResponse.json(summary);
    }

    const run =
      kind === "day-one"
        ? runDayOneNudge
        : kind === "reminder"
          ? runReminderNudge
          : kind === "vodafone-soon"
            ? runVodafoneSoonNudge
            : runSessionReminders;
    const summary = await run({ origin, now: new Date(), dryRun: params.get("dry") === "1" });
    return NextResponse.json(summary);
  } catch (error) {
    console.error(`[cron:${kind}-nudge] failed`, error);
    return NextResponse.json({ error: "The run failed." }, { status: 500 });
  }
}
