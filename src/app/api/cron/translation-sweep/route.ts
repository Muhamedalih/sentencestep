import { NextResponse } from "next/server";

import { isValidCronAuth } from "@/lib/cron/auth";
import { isSupportLocale } from "@/lib/i18n/locales";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { findLessonIdsNeedingGeneration } from "@/lib/translation/candidates";
import { generateLessonTranslationDraft } from "@/lib/translation/generate";

/**
 * The recovery mechanism for translation generation that `after()` may
 * have missed (src/lib/translation/auto-trigger.ts's own doc comment
 * explains why `after()` alone is best-effort, not durable) — triggered by
 * an external scheduler on a timer, exactly like
 * src/app/api/cron/inactive-learners/route.ts, which this file mirrors
 * directly (same CRON_SECRET gate, same isValidCronAuth, same "fails
 * closed without it" behavior, same GET+POST dual export for the same
 * reason — see that file's doc comment).
 *
 * vercel.json at the repo root registers this on a Vercel Cron schedule once
 * deployed there; any other scheduler that can call a URL on a timer works
 * the same way.
 *
 * Bounded on purpose: MAX_LESSON_LOCALE_PAIRS_PER_RUN caps how many
 * (lesson, locale) generation attempts a single invocation performs across
 * every enabled locale combined — this is a "do a little, safely, often"
 * sweep, not a full-library backfill. Candidate selection (which lessons
 * are actually worth attempting) is shared with the admin bulk-generate
 * action via findLessonIdsNeedingGeneration — see that function's doc
 * comment for why stale-but-approved work is deliberately never included.
 */
const MAX_LESSON_LOCALE_PAIRS_PER_RUN = 20;
const MAX_ERRORS_REPORTED = 20;

async function handleTranslationSweepCron(request: Request): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 501 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  if (!isValidCronAuth(authHeader, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const { data: localeRows, error: localesError } = await supabase
    .from("locales")
    .select("code")
    .eq("enabled", true);
  if (localesError) {
    return NextResponse.json({ error: "Failed to read enabled locales." }, { status: 500 });
  }
  const enabledLocales = (localeRows ?? []).map((row) => row.code).filter(isSupportLocale);

  const pairs: { lessonId: string; locale: (typeof enabledLocales)[number] }[] = [];
  for (const locale of enabledLocales) {
    if (pairs.length >= MAX_LESSON_LOCALE_PAIRS_PER_RUN) break;
    const remaining = MAX_LESSON_LOCALE_PAIRS_PER_RUN - pairs.length;
    const lessonIds = await findLessonIdsNeedingGeneration(supabase, locale, remaining);
    for (const lessonId of lessonIds) pairs.push({ lessonId, locale });
  }

  let generated = 0;
  let skipped = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const { lessonId, locale } of pairs) {
    const outcome = await generateLessonTranslationDraft(supabase, lessonId, locale);
    generated += outcome.generated;
    skipped += outcome.skipped;
    failed += outcome.failed;
    if (outcome.error && errors.length < MAX_ERRORS_REPORTED) {
      errors.push(`${lessonId}/${locale}: ${outcome.error}`);
    }
  }

  return NextResponse.json({ processed: pairs.length, generated, skipped, failed, errors });
}

export async function GET(request: Request): Promise<NextResponse> {
  return handleTranslationSweepCron(request);
}

export async function POST(request: Request): Promise<NextResponse> {
  return handleTranslationSweepCron(request);
}
