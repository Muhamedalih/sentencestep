import { cookies } from "next/headers";

import type {
  PassageSeriesStages,
  SeriesAsk,
  SeriesPreview,
} from "@/components/passages/series-stage-props";
import { PASSAGE_SEEDS } from "@/data/passages";
import { SERIES_GUESSES, type SeriesGuess } from "@/data/passages/series-guesses";
import { localISODateInTimeZone, TIMEZONE_COOKIE } from "@/lib/features/learner-date";
import type { SupportLocale } from "@/lib/i18n/locales";
import { guessAfter, guessAnsweredBy, opensTomorrow } from "@/lib/passages/series-guess";
import { seriesReminderText } from "@/lib/passages/series-reminder";
import { episodeOf } from "@/lib/passages/series";
import type { PassageProgress } from "@/lib/passages/types";
import { reminderSendsPerRun } from "@/lib/session-end/reminder";

function remindersOn(): boolean {
  return reminderSendsPerRun(process.env.SESSION_REMINDER_MAX_PER_RUN) > 0;
}

function askFor(guess: SeriesGuess, locale: SupportLocale | null, tomorrow: boolean): SeriesAsk {
  const asked = episodeOf(guess.after, null)!;
  return {
    guess,
    place: { title: asked.seriesTitle, number: asked.number, total: asked.total },
    question: asked.next,
    questionSupport: locale ? episodeOf(guess.after, locale)!.next : null,
    tomorrow,
    canRemind: remindersOn(),
    reminderSubject: seriesReminderText(locale ?? "en", guess.next)?.subject ?? asked.next,
  };
}

/**
 * Every guess with both its ends, for the admin's quick try on the Passages page. The lines come from
 * the authored episodes (Arabic only: it is the admin's own tool).
 */
export function seriesPreviews(locale: SupportLocale | null): SeriesPreview[] {
  return SERIES_GUESSES.flatMap((guess) => {
    const next = episodeOf(guess.next, null);
    const line = PASSAGE_SEEDS.find((seed) => seed.slug === guess.next)?.sections[
      guess.reveal.section
    ]?.lines[guess.reveal.line];
    if (!next || !line) return [];
    return [
      {
        ask: askFor(guess, locale, true),
        place: { title: next.seriesTitle, number: next.number, total: next.total },
        line: line.en,
        lineSupport: locale === "ar" ? line.ar : null,
      },
    ];
  });
}

/**
 * What «What happens next?» (permission seriesGuess) shows on one passage for one signed-in learner,
 * or null for a passage that is in no series. Days are the learner's own (their timezone cookie).
 * Server only.
 */
export async function seriesStagesFor(args: {
  passageId: string;
  locale: SupportLocale | null;
  progress: readonly PassageProgress[];
}): Promise<PassageSeriesStages | null> {
  const { passageId, locale, progress } = args;
  const here = episodeOf(passageId, null);
  if (!here) return null;

  const timeZone = (await cookies()).get(TIMEZONE_COOKIE)?.value;
  const dayOf = (iso: string) =>
    localISODateInTimeZone(timeZone, new Date(iso)) ?? iso.slice(0, 10);
  const todayISO = dayOf(new Date().toISOString());
  const of = (id: string) => progress.find((entry) => entry.passageId === id);
  const ask = (guess: SeriesGuess, tomorrow: boolean) => askFor(guess, locale, tomorrow);

  const answered = guessAnsweredBy(passageId);
  const closed =
    answered &&
    opensTomorrow({
      previousCompletedAt: of(answered.after)?.completedAt,
      sectionsDone: of(passageId)?.sectionsDone ?? 0,
      todayISO,
      dayOf,
    })
      ? ask(answered, true)
      : null;

  const asking = guessAfter(passageId);
  const next = asking ? of(asking.next) : undefined;
  const finished = of(passageId)?.completedAt;
  const after =
    asking && !next?.completedAt && !next?.sectionsDone
      ? // Finished now, or earlier today: the next one waits for midnight. Finished before: it is open.
        ask(asking, !finished || dayOf(finished) === todayISO)
      : null;

  return {
    after,
    answers: answered
      ? {
          guess: answered,
          place: { title: here.seriesTitle, number: here.number, total: here.total },
        }
      : null,
    closed,
  };
}
