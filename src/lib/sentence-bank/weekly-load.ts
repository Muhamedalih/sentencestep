import { localISODateInTimeZone } from "@/lib/features/learner-date";
import { getContentTranslations, resolveScalarField } from "@/lib/i18n/content-translations";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import type { SupportLocale } from "@/lib/i18n/locales";
import { isMissingTableError } from "@/lib/sentence-bank/errors";
import { finishedLessonDays } from "@/lib/sentence-bank/finished";
import type { ReviewScreenItem } from "@/lib/sentence-bank/items";
import type { SentenceBankContext } from "@/lib/sentence-bank/load";
import { storedClipsFor } from "@/lib/sentence-bank/lesson-clips";
import { fetchSentencePool } from "@/lib/sentence-bank/pool";
import {
  WEEKLY_CHECK_MIN,
  WEEKLY_DAYS,
  WEEKLY_MIN_LESSONS,
  buildCheckItems,
  daysBetweenISO,
  selectWeeklyCheck,
  weeklyLine,
} from "@/lib/sentence-bank/weekly";
import type { WeeklyLine } from "@/lib/sentence-bank/weekly";
import { fetchLastSentenceCheck } from "@/lib/supabase/queries/sentence-checks";
import { fetchSessionDatesSince } from "@/lib/today/queries";
import { addDaysISO } from "@/lib/word-mastery/schedule";

/**
 * Sentence bank: what the server reads for the weekly check. For Today's box one tiny read (the
 * learner's last check) and, only when a check could be due, a second one (the days they finished
 * Today's session); for the check itself the sentences of the week's lessons and their meanings.
 * Callers treat any failure as "no line, no check" — the table does not exist until its migration
 * is applied, and a missing optional feature must never take Home down.
 */

/** A project that has not applied the migration answers every read with "no such table"; remembered for a minute per server process. */
let checksMissingUntil = 0;
const MISSING_TABLE_BACKOFF_MS = 60_000;

/** How far back Today's session days are counted when the learner never took a check: seven days of use within four weeks. */
const FIRST_CHECK_LOOKBACK_DAYS = 28;

function dayOfIn(timeZone: string | undefined): (iso: string) => string {
  return (iso) => localISODateInTimeZone(timeZone, new Date(iso)) ?? iso.slice(0, 10);
}

/** The one line about the weekly check for Today's box (see weeklyLine), or null. */
export async function loadWeeklyLine(context: SentenceBankContext): Promise<WeeklyLine | null> {
  if (Date.now() < checksMissingUntil) return null;
  const { userId, todayISO, timeZone, completions } = context;
  try {
    const last = await fetchLastSentenceCheck(userId);
    const from = addDaysISO(todayISO, -WEEKLY_DAYS);
    const finished = finishedLessonDays(completions, dayOfIn(timeZone));
    const lessonsThisWeek = [...finished.values()].filter(
      (day) => day >= from && day < todayISO,
    ).length;

    // Only a learner who could be due is asked about their days: the second read is rare.
    const since = last ? daysBetweenISO(last.checkedOn, todayISO) : null;
    const couldBeDue =
      (since === null || since >= WEEKLY_DAYS) && lessonsThisWeek >= WEEKLY_MIN_LESSONS;
    const sessionDays = couldBeDue
      ? new Set(
          await fetchSessionDatesSince(
            userId,
            last ? addDaysISO(last.checkedOn, 1) : addDaysISO(todayISO, -FIRST_CHECK_LOOKBACK_DAYS),
          ),
        ).size
      : 0;
    return weeklyLine({ last, todayISO, sessionDays, lessonsThisWeek });
  } catch (error) {
    if (isMissingTableError(error)) {
      checksMissingUntil = Date.now() + MISSING_TABLE_BACKOFF_MS;
      console.warn(
        "[sentence-bank] sentence_checks not found: has supabase/migrations/20250348000000_sentence_checks.sql been applied? The weekly check is not offered until it is.",
      );
      return null;
    }
    console.error("[sentence-bank] loadWeeklyLine failed", error);
    return null;
  }
}

export interface WeeklyCheckScreen {
  items: ReviewScreenItem[];
  /** Sentences the learner typed in the week the check is about. */
  written: number;
}

/**
 * The weekly check's sentences, ready to be drawn: ten (at most) from the lessons finished in the
 * last seven days, each from its meaning in the learner's language and with its stored clip, in its
 * lesson's voice, for after the answer. Fewer than five that can be asked means no check (empty).
 * Reads: the week's sentences (service role, scoped to the learner's own finished lessons — see
 * pool.ts), then their meanings and clips together.
 */
export async function loadWeeklyCheckScreen(
  context: SentenceBankContext & { locale: SupportLocale | null },
): Promise<WeeklyCheckScreen> {
  const { todayISO, timeZone, completions } = context;
  const finished = finishedLessonDays(completions, dayOfIn(timeZone));
  const from = addDaysISO(todayISO, -WEEKLY_DAYS);
  const lessonIds = [...finished]
    .filter(([, day]) => day >= from && day < todayISO)
    .map(([id]) => id);
  if (lessonIds.length === 0) return { items: [], written: 0 };

  const pool = await fetchSentencePool({ lessonIds, sentenceIds: [] });
  const legacy = new Map(pool.map((row) => [row.id, row.ar]));
  const candidates = pool.flatMap((row) => {
    const completedOn = finished.get(row.lessonId);
    return completedOn === undefined
      ? []
      : [
          {
            id: row.id,
            lessonId: row.lessonId,
            orderIndex: row.orderIndex,
            en: row.en,
            completedOn,
          },
        ];
  });
  const { items: selected, written } = selectWeeklyCheck(candidates, todayISO);
  if (selected.length < WEEKLY_CHECK_MIN) return { items: [], written };

  const locale = context.locale ?? DEFAULT_LOCALE;
  const [translations, clips] = await Promise.all([
    getContentTranslations(
      "sentence",
      selected.map((sentence) => sentence.id),
      locale,
    ).catch(() => new Map<string, unknown>()),
    storedClipsFor(selected),
  ]);
  const prompts = new Map<string, string>();
  for (const sentence of selected) {
    const meaning = resolveScalarField(
      translations,
      sentence.id,
      "text",
      legacy.get(sentence.id),
      locale,
    );
    if (meaning) prompts.set(sentence.id, meaning);
  }
  const items = buildCheckItems(selected, prompts, clips);
  return { items: items.length >= WEEKLY_CHECK_MIN ? items : [], written };
}
