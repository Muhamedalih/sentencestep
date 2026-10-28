"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Lock } from "lucide-react";

import { LessonIllustration } from "@/components/learning/lesson-illustration";
import { useLocale } from "@/components/providers/locale-provider";
import { useCurrentLesson } from "@/hooks/use-current-lesson";
import { useProgress } from "@/hooks/use-progress";
import type { LessonCounts } from "@/lib/content";
import { getLessonsByLevel, getLevels, getUnits } from "@/lib/content-helpers";
import { levelCodeOf, minutesForWords } from "@/lib/levels";
import {
  countDone,
  pathStations,
  splitAroundCurrent,
  type PathStation,
} from "@/lib/path/path-model";
import { cn } from "@/lib/utils";
import type { LessonUnit } from "@/types/content";

type LevelNames = Record<number, { title: string; titleAr: string; supportTitle?: string }>;

/**
 * The Path (permission mobilePath, phone only): the daily lessons of one level in their order, the
 * lesson to do now as a large picture card between the finished ones and the rest, and a lock on
 * each lesson past the free ones. Levels are the same ones the lesson list shows.
 */
export function PathView({
  units,
  lessonStats,
  levelNames,
  isPremiumUser,
}: {
  units: LessonUnit[];
  lessonStats: Record<string, LessonCounts>;
  levelNames: LevelNames;
  isPremiumUser: boolean;
}) {
  const { t } = useLocale();
  const progress = useProgress();
  const { completedIds, currentLesson } = useCurrentLesson(units, isPremiumUser, progress);
  const [picked, setPicked] = useState<number | null>(null);

  const courseUnits = getUnits("normal");
  const levels = getLevels(units);
  const level = picked ?? currentLesson?.level ?? levels[0];

  const levelLabel = (value: number) => {
    const course = courseUnits.find((unit) => unit.level === value);
    if (course) return levelCodeOf(course.title);
    return levelNames[value]?.title ?? t.lesson.level.replace("{n}", String(value));
  };

  const lessons = level === undefined ? [] : getLessonsByLevel(units, level);
  const stations = pathStations(lessons, completedIds, currentLesson?.id, isPremiumUser);
  const { before, current, after } = splitAroundCurrent(stations);
  const done = countDone(stations);
  const percent = stations.length === 0 ? 0 : Math.round((done / stations.length) * 100);

  const minutesOf = (lesson: LessonUnit) =>
    minutesForWords(lessonStats[`normal:${lesson.id}`]?.words ?? 0);
  const numberOf = (station: PathStation) => lessons.indexOf(station.lesson) + 1;

  return (
    <div className="mx-auto max-w-xl px-5 pt-5 pb-28">
      <h1 className="text-2xl font-bold tracking-tight">{t.nav.normalLessons}</h1>
      <p className="text-primary mt-1 text-base font-semibold" dir="auto">
        {t.mobilePath.writingFocus}
      </p>

      <div role="tablist" aria-label={t.nav.normalLessons} className="mt-4 flex flex-wrap gap-2">
        {levels.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={value === level}
            onClick={() => setPicked(value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
              value === level
                ? "border-primary bg-brand-muted text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <span dir="ltr">{levelLabel(value)}</span>
          </button>
        ))}
      </div>

      <div className="mt-5">
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span dir="auto">
            {t.mobilePath.doneOfTotal
              .replace("{done}", String(done))
              .replace("{total}", String(stations.length))}
          </span>
        </div>
        <div className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full">
          <div className="bg-primary h-full rounded-full" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {stations.length > 0 && done === stations.length && (
        <p className="text-success mt-5 text-sm font-medium" dir="auto">
          {t.mobilePath.levelFinished}
        </p>
      )}

      <ol className="mt-5 flex flex-col gap-2.5">
        {before.map((station) => (
          <StationRow
            key={station.lesson.id}
            station={station}
            number={numberOf(station)}
            minutes={minutesOf(station.lesson)}
          />
        ))}
      </ol>

      {current && (
        <div className="mt-2.5 mb-2.5">
          <CurrentStation lesson={current.lesson} minutes={minutesOf(current.lesson)} />
        </div>
      )}

      <ol className="flex flex-col gap-2.5">
        {after.map((station) => (
          <StationRow
            key={station.lesson.id}
            station={station}
            number={numberOf(station)}
            minutes={minutesOf(station.lesson)}
          />
        ))}
      </ol>
    </div>
  );
}

/** The lesson to do now: the full picture card, the one large card of the Path. */
function CurrentStation({ lesson, minutes }: { lesson: LessonUnit; minutes: number }) {
  const { t } = useLocale();
  return (
    <Link
      href={`/learn/normal/${lesson.id}`}
      className="group border-border bg-card relative flex min-h-[19rem] flex-col overflow-hidden rounded-2xl border transition-transform duration-300 ease-out motion-safe:hover:-translate-y-1"
    >
      <div className="absolute inset-0">
        <LessonIllustration
          mode="normal"
          lessonId={lesson.id}
          title={lesson.title}
          illustrationUrl={lesson.illustrationUrl}
          className="absolute inset-0 size-full rounded-none border-0 shadow-none transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
        />
      </div>
      <span className="absolute start-4 top-4 rounded-full bg-black/35 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
        {t.mobilePath.youAreHere}
      </span>
      <div className="relative mt-auto flex flex-col gap-1 bg-[linear-gradient(to_top,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.86)_74%,rgba(0,0,0,0)_100%)] px-5 pt-16 pb-5">
        <h2
          className="line-clamp-2 text-2xl leading-tight font-semibold tracking-tight text-white"
          dir="ltr"
        >
          {lesson.title}
        </h2>
        <p className="line-clamp-2 text-base font-medium text-white/85" dir="auto">
          {lesson.supportTitle ?? lesson.title}
        </p>
        <span className="mt-3 inline-flex h-10 w-fit items-center gap-2 rounded-[10px] bg-white px-5 text-sm font-semibold text-neutral-950">
          <span dir="auto">
            {t.mobilePath.continueMinutes.replace("{minutes}", String(minutes))}
          </span>
          <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

/** One finished, open or locked lesson of the level. */
function StationRow({
  station,
  number,
  minutes,
}: {
  station: PathStation;
  number: number;
  minutes: number;
}) {
  const { t } = useLocale();
  const { lesson, state } = station;
  const finished = state === "done";
  return (
    <li>
      <Link
        href={`/learn/normal/${lesson.id}`}
        className={cn(
          "flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors",
          finished
            ? "border-border/60 text-muted-foreground"
            : "border-border bg-card hover:bg-muted/50",
          state === "locked" && "opacity-75",
        )}
      >
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold tabular-nums",
            finished
              ? "border-success bg-success text-white"
              : "border-border text-muted-foreground",
          )}
          aria-hidden="true"
        >
          {finished ? <Check className="size-4" strokeWidth={2.5} /> : number}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold" dir="ltr">
            {lesson.title}
          </span>
          <span className="text-muted-foreground block truncate text-xs" dir="auto">
            {lesson.supportTitle ?? lesson.title}
          </span>
        </span>
        {state === "done" && (
          <span className="text-success shrink-0 text-xs font-medium" dir="auto">
            {t.mobilePath.finished}
          </span>
        )}
        {state === "locked" && (
          <span className="text-muted-foreground inline-flex shrink-0 items-center gap-1 text-xs font-medium">
            <Lock className="size-3.5" aria-hidden="true" />
            <span dir="auto">{t.premium.lockedChip}</span>
          </span>
        )}
        {state === "open" && (
          <span className="text-muted-foreground shrink-0 text-xs tabular-nums" dir="auto">
            {t.mobilePath.lessonLength.replace("{minutes}", String(minutes))}
          </span>
        )}
      </Link>
    </li>
  );
}
