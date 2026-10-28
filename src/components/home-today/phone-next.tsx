"use client";

import Link from "next/link";

import { fill } from "@/components/home-today/format";
import { useLocale } from "@/components/providers/locale-provider";
import { useSharedProgress } from "@/components/providers/progress-provider";
import { todayTaskTitle } from "@/components/today/today-tasks";
import { useCurrentLesson } from "@/hooks/use-current-lesson";
import type { DailyQuest } from "@/lib/features/quests";
import type { LessonUnit } from "@/types/content";

/**
 * The one next step of the phone Home (permission mobilePath): the current task of Today while one
 * is left, otherwise the learner's current lesson. Below md: it is the only solid button above the
 * boxes; the desktop Home does not draw it.
 */
export function PhoneNextStep({
  task,
  units,
  isPremiumUser,
}: {
  task: DailyQuest | null;
  units: LessonUnit[];
  isPremiumUser: boolean;
}) {
  if (task) return <TaskNext quest={task} />;
  return <LessonNext units={units} isPremiumUser={isPremiumUser} />;
}

function TaskNext({ quest }: { quest: DailyQuest }) {
  const { t } = useLocale();
  const copy = t.today;
  const info = quest.today;
  if (!info) return null;
  const start = {
    listen: copy.startListen,
    story: copy.startStory,
    words: copy.startWords,
    sentences: copy.startSentences,
  }[info.kind];
  const minutes = fill(copy.minutes, { n: info.minutes });
  return (
    <div className="border-primary/40 bg-brand-muted/40 rounded-2xl border p-4 md:hidden">
      <p className="text-muted-foreground text-xs font-medium" dir="auto">
        {t.mobilePath.nextStep}
      </p>
      <p className="mt-1 text-base font-semibold" dir="auto">
        {todayTaskTitle(copy, info.kind)}
      </p>
      {info.title && (
        <p className="text-muted-foreground mt-0.5 text-sm" dir="ltr">
          {info.title}
        </p>
      )}
      <Link
        href={info.href}
        className="bg-primary text-primary-foreground mt-3 flex h-11 w-full items-center justify-center rounded-[10px] text-sm font-semibold"
      >
        <span dir="auto">{`${start} · ${minutes}`}</span>
      </Link>
    </div>
  );
}

function LessonNext({ units, isPremiumUser }: { units: LessonUnit[]; isPremiumUser: boolean }) {
  const { t } = useLocale();
  const progress = useSharedProgress();
  const { currentLesson } = useCurrentLesson(units, isPremiumUser, progress);
  if (!currentLesson) return null;
  return (
    <div className="border-primary/40 bg-brand-muted/40 rounded-2xl border p-4 md:hidden">
      <p className="text-muted-foreground text-xs font-medium" dir="auto">
        {t.mobilePath.nextStep}
      </p>
      <p className="mt-1 text-base font-semibold" dir="ltr">
        {currentLesson.title}
      </p>
      <Link
        href={`/learn/normal/${currentLesson.id}`}
        className="bg-primary text-primary-foreground mt-3 flex h-11 w-full items-center justify-center rounded-[10px] text-sm font-semibold"
      >
        <span dir="auto">{t.mobilePath.startNow}</span>
      </Link>
    </div>
  );
}
