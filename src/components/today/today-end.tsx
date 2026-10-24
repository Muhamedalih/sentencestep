"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { SessionEnd } from "@/components/learning/session-end";
import { Logo } from "@/components/layout/logo";
import { useAuthUserId } from "@/components/providers/auth-user-provider";
import { useFeatures } from "@/components/providers/feature-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { todayLocalISODate } from "@/lib/progress/streak";
import { SENTENCE_REVIEW_MINUTES } from "@/lib/sentence-bank/review";
import type { SessionEndAction } from "@/lib/session-end/action-names";
import { REMINDER_HOURS, reminderTimeFor } from "@/lib/session-end/reminder";
import { setSessionReminderAction } from "@/lib/session-end/reminder-actions";
import { trackSessionEndAction } from "@/lib/session-end/track-actions";
import { completeTodaySessionAction, fetchTodayTomorrowAction } from "@/lib/today/actions";
import { WORDS_MINUTES } from "@/lib/today/plan";
import { readTodayReview } from "@/lib/today/run-state";
import type { TodayRun } from "@/lib/today/run-state";

/**
 * The finish screen of Today's session (the /learn/today/end route): the lesson ending's calm
 * SessionEnd with this session's numbers — how many of the words were typed right the first time
 * (kept in sessionStorage by the words step), what comes back tomorrow, the reminder card when
 * reminders are on — and five more words as the extra button. Reaching it records the day.
 */
export function TodayEnd({
  weekDays,
  nextTitle,
  moreWords,
  testHref,
}: {
  weekDays: number;
  /** The title tomorrow starts with (the next passage, else the next story), or null. */
  nextTitle: string | null;
  /** The words step still has something to do (new words, or review words due). */
  moreWords: boolean;
  /** Where "Test yourself on today's lessons" goes when the learner has one waiting (it is optional: the day is finished without it), else null. */
  testHref: string | null;
}) {
  const { t } = useLocale();
  const userId = useAuthUserId();
  const features = useFeatures();
  const startedRef = useRef(false);
  const [review, setReview] = useState<TodayRun["review"]>(null);
  const [reviewWords, setReviewWords] = useState<number | null>(null);
  const [reminderHour, setReminderHour] = useState<number | null>(null);
  const [reminderStatus, setReminderStatus] = useState<
    "idle" | "saving" | "saved" | "error" | "unavailable"
  >("idle");

  // Once, on the client: read the words step's result, record the day, ask what is due tomorrow.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const todayISO = todayLocalISODate();
    const result = readTodayReview(todayISO);
    setReview(result);
    void completeTodaySessionAction({
      todayISO,
      reviewTotal: result?.total ?? 0,
      reviewClean: result?.clean ?? 0,
    }).catch(() => {});
    const tomorrowEnd = new Date();
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    tomorrowEnd.setHours(23, 59, 59, 999);
    fetchTodayTomorrowAction(tomorrowEnd.toISOString())
      .then((answer) => setReviewWords(answer.reviewWords))
      .catch(() => setReviewWords(0));
  }, []);

  function handleReminder(hour: number | null) {
    setReminderHour(hour);
    setReminderStatus("saving");
    setSessionReminderAction(hour === null ? null : reminderTimeFor(hour).toISOString())
      .then(({ ok, reason }) =>
        setReminderStatus(ok ? "saved" : reason === "unverified" ? "unavailable" : "error"),
      )
      .catch(() => setReminderStatus("error"));
  }

  function handleAction(action: SessionEndAction) {
    void trackSessionEndAction(action).catch(() => {});
  }

  return (
    <div className="bg-background flex min-h-svh flex-col">
      <Link
        href="/learn"
        aria-label={t.marketing.dashboardLinkAriaLabel}
        className="flex shrink-0 items-center px-3 pt-2.5 pb-2"
      >
        <Logo size="sm" />
      </Link>
      <div className="flex min-h-0 flex-1 flex-col">
        <SessionEnd
          first={false}
          weekDays={weekDays}
          recall={review}
          isGuest={!userId}
          tomorrow={{
            ready: reviewWords !== null,
            reviewWords: reviewWords ?? 0,
            nextTitle,
            minutes: 0,
          }}
          extra={moreWords ? { href: "/learn/today/words?more=1", locked: false } : null}
          extraMinutes={WORDS_MINUTES}
          extraLabel={t.today.extraWords.replace(
            "{time}",
            t.today.minutes.replace("{n}", String(WORDS_MINUTES)),
          )}
          test={
            testHref
              ? {
                  href: testHref,
                  label: `${t.today.taskSentences} · ${t.today.minutes.replace("{n}", String(SENTENCE_REVIEW_MINUTES))}`,
                }
              : null
          }
          reminder={
            userId && features.rollouts.sessionReminders
              ? {
                  hours: REMINDER_HOURS,
                  selected: reminderHour,
                  status: reminderStatus,
                  onSelect: handleReminder,
                }
              : null
          }
          saveStatus="idle"
          onAction={handleAction}
        />
      </div>
    </div>
  );
}
