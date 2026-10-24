import { localISODateInTimeZone } from "@/lib/features/learner-date";
import { STORY_TARGET_VOCABULARY } from "@/lib/content/story-target-vocabulary";
import { getContentTranslations, resolveScalarField } from "@/lib/i18n/content-translations";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import type { SupportLocale } from "@/lib/i18n/locales";
import { isMissingTableError } from "@/lib/sentence-bank/errors";
import { finishedLessonDays } from "@/lib/sentence-bank/finished";
import type { ReviewScreenItem } from "@/lib/sentence-bank/items";
import type { SentenceBankContext } from "@/lib/sentence-bank/load";
import { storedClipsFor } from "@/lib/sentence-bank/lesson-clips";
import { fetchSentencePool } from "@/lib/sentence-bank/pool";
import type { SentenceCandidate } from "@/lib/sentence-bank/select";
import {
  WEEKLY_CHECK_MIN,
  WEEKLY_CHECK_SIZE,
  WEEKLY_DAYS,
  WEEKLY_STORIES_NEEDED,
  buildCheckItems,
  daysBetweenISO,
  selectWeeklyCheck,
  weeklyLine,
  weeklyStoryCounts,
} from "@/lib/sentence-bank/weekly";
import type { WeeklyLine } from "@/lib/sentence-bank/weekly";
import { weeklyFocusIds } from "@/lib/sentence-bank/weekly-targets";
import { fetchLastSentenceCheck } from "@/lib/supabase/queries/sentence-checks";
import { addDaysISO } from "@/lib/word-mastery/schedule";

/**
 * Sentence bank: what the server reads for the weekly check. For Today's box one tiny read (the
 * learner's last check) and nothing else — whether the three general stories are finished comes from
 * the learner's own progress, which Today already has; for the check itself the sentences of those
 * stories and their meanings. Callers treat any failure as "no line, no check" — the table does not
 * exist until its migration is applied, and a missing optional feature must never take Home down.
 */

/** A project that has not applied the migration answers every read with "no such table"; remembered for a minute per server process. */
let checksMissingUntil = 0;
const MISSING_TABLE_BACKOFF_MS = 60_000;

function dayOfIn(timeZone: string | undefined): (iso: string) => string {
  return (iso) => localISODateInTimeZone(timeZone, new Date(iso)) ?? iso.slice(0, 10);
}

/**
 * Story id → the learner-local day they first finished it, for the general stories only (the daily
 * lessons are for writing, and one of them is a whole test on its own).
 */
function finishedStoryDays(context: SentenceBankContext): Map<string, string> {
  return finishedLessonDays(
    context.completions.filter((completion) => completion.mode === "stories"),
    dayOfIn(context.timeZone),
  );
}

interface WeekSentences {
  candidates: SentenceCandidate[];
  /** The legacy Arabic text of each sentence, for a language with no translation row. */
  legacy: Map<string, string>;
}

/**
 * The sentences of the stories the learner finished in the last seven days, today's included (the
 * locked card says whether tomorrow will be enough). Reads nothing when no story was finished.
 */
async function readWeekSentences(context: SentenceBankContext): Promise<WeekSentences> {
  const { todayISO } = context;
  const finished = finishedStoryDays(context);
  const from = addDaysISO(todayISO, -WEEKLY_DAYS);
  const lessonIds = [...finished]
    .filter(([, day]) => day >= from && day <= todayISO)
    .map(([id]) => id);
  if (lessonIds.length === 0) return { candidates: [], legacy: new Map() };

  const pool = await fetchSentencePool({ lessonIds, sentenceIds: [] });
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
  return { candidates, legacy: new Map(pool.map((row) => [row.id, row.ar])) };
}

/** The one card about the weekly check for Today's box (see weeklyLine), or null. */
export async function loadWeeklyLine(context: SentenceBankContext): Promise<WeeklyLine | null> {
  if (Date.now() < checksMissingUntil) return null;
  const { userId, todayISO } = context;
  try {
    const last = await fetchLastSentenceCheck(userId);
    // Inside the week after a check the line is its result: no story needs to be counted.
    const since = last ? daysBetweenISO(last.checkedOn, todayISO) : null;
    if (since !== null && since < WEEKLY_DAYS) {
      return weeklyLine({ last, todayISO, stories: 0, storiesTomorrow: 0 });
    }
    return weeklyLine({
      last,
      todayISO,
      ...weeklyStoryCounts(finishedStoryDays(context), todayISO),
    });
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
  /** Sentences the learner typed in the stories of the week the check is about. */
  written: number;
}

/**
 * The weekly check's sentences, ready to be drawn: up to eight of the sentences that hold the target
 * words of the general stories finished in the last seven days (see weekly-targets.ts; fewer when
 * the stories have fewer, never padded), built the way the day's test is — each heard in its story's
 * stored clip and typed whole, its meaning in the learner's language shown after the answer. Fewer than three
 * finished stories, or fewer than five sentences that can be asked, means no check (empty). Reads:
 * the week's sentences (service role, scoped to the learner's own finished stories — see pool.ts),
 * then their meanings and clips together.
 */
export async function loadWeeklyCheckScreen(
  context: SentenceBankContext & { locale: SupportLocale | null },
): Promise<WeeklyCheckScreen> {
  const { todayISO } = context;
  // The check opens with three finished stories, however it is reached.
  if (weeklyStoryCounts(finishedStoryDays(context), todayISO).stories < WEEKLY_STORIES_NEEDED) {
    return { items: [], written: 0 };
  }
  const { candidates, legacy } = await readWeekSentences(context);
  if (candidates.length === 0) return { items: [], written: 0 };
  // Only what each story set out to teach: the sentences that hold its target words.
  const targets = new Map<string, string[]>(
    [...new Set(candidates.map((sentence) => sentence.lessonId))].map((lessonId) => [
      lessonId,
      (STORY_TARGET_VOCABULARY[lessonId] ?? []).map((word) => word.en),
    ]),
  );
  const { items: selected, written } = selectWeeklyCheck(
    candidates,
    todayISO,
    weeklyFocusIds(candidates, targets),
  );
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
  // The spares stand in for a sentence with no clip; the check itself is the first eight that can be asked.
  const items = buildCheckItems(selected, prompts, clips).slice(0, WEEKLY_CHECK_SIZE);
  return { items: items.length >= WEEKLY_CHECK_MIN ? items : [], written };
}
