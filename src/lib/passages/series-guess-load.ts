import { cookies } from "next/headers";

import type { PassageSeriesStages, SeriesAsk } from "@/components/passages/series-stage-props";
import type { SeriesGuess } from "@/data/passages/series-guesses";
import { localISODateInTimeZone, TIMEZONE_COOKIE } from "@/lib/features/learner-date";
import type { SupportLocale } from "@/lib/i18n/locales";
import { guessAfter, guessAnsweredBy, opensTomorrow } from "@/lib/passages/series-guess";
import { seriesReminderText } from "@/lib/passages/series-reminder";
import { episodeOf } from "@/lib/passages/series";
import type { PassageProgress } from "@/lib/passages/types";
import { reminderSendsPerRun } from "@/lib/session-end/reminder";

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
  const canRemind = reminderSendsPerRun(process.env.SESSION_REMINDER_MAX_PER_RUN) > 0;

  const ask = (guess: SeriesGuess, tomorrow: boolean): SeriesAsk => {
    const asked = episodeOf(guess.after, null)!;
    return {
      guess,
      place: { title: asked.seriesTitle, number: asked.number, total: asked.total },
      question: asked.next,
      questionSupport: locale ? episodeOf(guess.after, locale)!.next : null,
      tomorrow,
      canRemind,
      reminderSubject: seriesReminderText(locale ?? "en", guess.next)?.subject ?? asked.next,
    };
  };

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
