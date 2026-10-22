"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { FromMemorySession } from "@/components/learning/from-memory-session";
import { SessionEnd } from "@/components/learning/session-end";
import type { SessionEndExtra, SessionEndReminder } from "@/components/learning/session-end";
import { useAuthUserId } from "@/components/providers/auth-user-provider";
import { useFeatures } from "@/components/providers/feature-provider";
import { useLocale } from "@/components/providers/locale-provider";
import type { CompletionSaveStatus } from "@/hooks/use-progress";
import type { FromMemoryItem } from "@/lib/features/from-memory";
import type { LessonCompletion } from "@/lib/progress/types";
import { fetchSessionEndAction } from "@/lib/session-end/actions";
import type { SessionEndAction } from "@/lib/session-end/action-names";
import { pickRecallItems } from "@/lib/session-end/recall";
import { REMINDER_HOURS, reminderTimeFor } from "@/lib/session-end/reminder";
import { setSessionReminderAction } from "@/lib/session-end/reminder-actions";
import {
  LESSON_MINUTES,
  activeDaysInWindow,
  estimateTomorrowMinutes,
} from "@/lib/session-end/summary";
import { trackSessionEndAction, trackSessionRecallAction } from "@/lib/session-end/track-actions";
import type { NextLessonRef } from "@/types/content";
import type { LearningMode } from "@/types/content";

/**
 * What happens after the last sentence of a lesson while the "New lesson ending" switch is open
 * (see LessonSession, which mounts this in place of the stats-and-confetti screen): first a short
 * recall round — three of the lesson's sentences asked back from their meaning, typed from memory,
 * through the same FromMemorySession a learner can already start by hand — then the finish screen
 * (SessionEnd), whose "what you remembered" is that round's real result. A learner can leave the
 * round at any time and goes straight to the finish screen without the number.
 *
 * Mounted when the lesson finishes, which is also when the one request this screen needs
 * (fetchSessionEndAction: the recommended next lesson and how many words come back tomorrow) is
 * started, so the answer is normally in before the recall round is over. Words missed in the round
 * go to the same mistakes list a mistyped word does, which is what brings them back later.
 */
export function SessionEndFlow({
  unit,
  items,
  nextLesson,
  nextLessonLocked,
  completions,
  startingLevel,
  saveStatus,
  onRetrySave,
  resolvedVoiceId,
  speakerVoiceMap,
  allowReveal,
  showFirstLetters,
  onMistakes,
  endExtras,
}: {
  unit: { id: string; mode: LearningMode };
  /** Every sentence of the lesson that can be asked back (buildFromMemoryItems). */
  items: FromMemoryItem[];
  nextLesson?: NextLessonRef;
  /** The next lesson in catalog order is Premium and this learner can't open it. */
  nextLessonLocked: boolean;
  completions: LessonCompletion[];
  startingLevel: number | null;
  saveStatus: CompletionSaveStatus;
  onRetrySave?: () => void;
  resolvedVoiceId?: string | null;
  speakerVoiceMap?: Record<string, string>;
  allowReveal: boolean;
  showFirstLetters: boolean;
  onMistakes: (sentenceId: string, words: { word: string; errorIndexes: number[] }[]) => void;
  /** Rendered only once the finish screen is up — the one-time rating card, which must not appear over the recall round. */
  endExtras?: ReactNode;
}) {
  const userId = useAuthUserId();
  const { t } = useLocale();
  const features = useFeatures();
  const recallItems = useMemo(() => pickRecallItems(items), [items]);
  const [phase, setPhase] = useState<"recall" | "end">(recallItems.length > 0 ? "recall" : "end");
  const [recall, setRecall] = useState<{ clean: number; total: number } | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchSessionEndAction>> | null>(null);
  const startedRef = useRef(false);
  const [reminderHour, setReminderHour] = useState<number | null>(null);
  const [reminderStatus, setReminderStatus] = useState<SessionEndReminder["status"]>("idle");

  // The learner's first lesson ever. A signed-in learner's list only gains this lesson once it is
  // saved, so 0 counts too.
  const first = completions.length <= 1;

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const tomorrowEnd = new Date();
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    tomorrowEnd.setHours(23, 59, 59, 999);
    fetchSessionEndAction({
      mode: unit.mode,
      lessonId: unit.id,
      // A signed-in learner's own progress is read from their account instead.
      guestCompletedIds: userId
        ? []
        : completions.filter((entry) => entry.mode === unit.mode).map((entry) => entry.lessonId),
      guestStartingLevel: userId ? null : startingLevel,
      tomorrowEndISO: tomorrowEnd.toISOString(),
      first,
      recall: recallItems.length > 0,
    })
      .then(setData)
      .catch(() => setData({ next: null, reviewTomorrow: 0 }));
    // Once per finished lesson: everything it reads is fixed by the time the lesson is over.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRecallFinished(summary: { total: number; clean: number }) {
    setRecall(summary);
    setPhase("end");
    void trackSessionRecallAction(summary).catch(() => {});
  }

  function handleRecallSkipped() {
    setPhase("end");
    void trackSessionRecallAction({ skipped: true }).catch(() => {});
  }

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

  if (phase === "recall") {
    return (
      <div className="flex min-h-0 flex-1 flex-col lg:overflow-y-auto">
        <FromMemorySession
          items={recallItems}
          mode={unit.mode}
          resolvedVoiceId={resolvedVoiceId}
          speakerVoiceMap={speakerVoiceMap}
          allowReveal={allowReveal}
          showFirstLetters={showFirstLetters}
          onMistakes={onMistakes}
          onFinished={handleRecallFinished}
          onExit={handleRecallSkipped}
          exitLabel={t.sessionEnd.skipRecall}
        />
      </div>
    );
  }

  const next = data?.next ?? null;
  const reviewWords = data?.reviewTomorrow ?? 0;
  const extra: SessionEndExtra | null = next
    ? { href: `/learn/${next.mode}/${next.id}`, locked: false }
    : data && nextLessonLocked && nextLesson
      ? { href: `/learn/${nextLesson.mode}/${nextLesson.id}`, locked: true }
      : null;

  return (
    <>
      <SessionEnd
        first={first}
        weekDays={activeDaysInWindow(
          completions.map((entry) => entry.completedAt),
          new Date(),
        )}
        recall={recall}
        isGuest={!userId}
        tomorrow={{
          ready: data !== null,
          reviewWords,
          nextTitle: next?.title ?? null,
          minutes: estimateTomorrowMinutes(reviewWords, next !== null),
        }}
        extra={extra}
        extraMinutes={LESSON_MINUTES}
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
        saveStatus={saveStatus}
        onRetrySave={onRetrySave}
        onAction={handleAction}
      />
      {endExtras}
    </>
  );
}
