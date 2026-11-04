"use client";

import { useId, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, RotateCcw, Snowflake, Target } from "lucide-react";

import { QuestsCard } from "@/components/app/quests-card";
import { RepeatLessonMenu, WeekDots } from "@/components/app/engagement-strip";
import { useLocale } from "@/components/providers/locale-provider";
import { Progress } from "@/components/ui/progress";
import {
  ICONS,
  STAR_ACCURACY,
  TaskIcon,
  WeeklyLineView,
  fill,
  todayTaskTitle,
} from "@/components/today/today-tasks";
import type { StreakCalendarData } from "@/lib/features/calendar-actions";
import { questTitle } from "@/lib/features/quest-labels";
import { questProgressPercent } from "@/lib/features/quests";
import type { DailyQuest, DailyQuestsPayload } from "@/lib/features/quests";
import { requiredQuests } from "@/lib/today/quests";
import { cn } from "@/lib/utils";

import { HOME_CARD_COLORS, TASKS } from "./palette";

type RowState = "done" | "current" | "idle";

/** A thin vertical line between two groups of the strip. */
function Divider() {
  return (
    <span
      aria-hidden="true"
      className="mx-6 hidden h-[34px] w-px shrink-0 xl:block"
      style={{ background: TASKS.hairline }}
    />
  );
}

/** One step of the opened card: its disc on the rail, its name and XP, its detail line, and, for the current one, why it matters and the button. */
function TaskRow({
  quest,
  current,
  first,
  last,
}: {
  quest: DailyQuest;
  current: boolean;
  first: boolean;
  last: boolean;
}) {
  const { t, dir } = useLocale();
  const copy = t.today;
  const info = quest.today;
  if (!info) return null;
  const Icon = ICONS[info.kind];
  const done = quest.completed;
  const state: RowState = done ? "done" : current ? "current" : "idle";
  const disc = TASKS.disc[state];
  const minutes = fill(copy.minutes, { n: info.minutes });
  const start = {
    listen: copy.startListen,
    story: copy.startStory,
    words: copy.startWords,
    sentences: copy.startSentences,
  }[info.kind];
  const why = {
    listen: copy.whyListen,
    story: copy.whyStory,
    words: copy.whyWords,
    sentences: copy.whySentences,
  }[info.kind];
  const accuracyLine =
    info.kind === "story" && done && info.accuracy !== null
      ? fill(info.accuracy >= STAR_ACCURACY ? copy.starEarned : copy.accuracyIs, {
          n: Math.round(info.accuracy * 100),
        })
      : null;
  const showMeta = info.title || info.levelCode || info.supportTitle || !done || accuracyLine;
  const xp = quest.xp > 0 && (!done || info.paid) ? fill(copy.xpChip, { xp: quest.xp }) : null;

  return (
    <li className="relative">
      {!first && (
        <span
          aria-hidden="true"
          className="absolute start-[54px] end-0 top-0 h-px"
          style={{ background: TASKS.rowLine }}
        />
      )}
      {!last && (
        <span
          aria-hidden="true"
          className="absolute start-[17px] top-[58px] -bottom-0.5 w-0.5 rounded-[1px]"
          style={{ background: done ? TASKS.rail.done : TASKS.rail.idle }}
        />
      )}
      <Link
        href={info.href}
        aria-current={current ? "step" : undefined}
        className="focus-visible:ring-ring flex gap-[18px] rounded-xl pt-[17px] pb-[19px] outline-none focus-visible:ring-2"
      >
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-full border-[1.5px]"
          style={
            {
              borderColor: disc.border,
              background: disc.background,
              color: disc.ink,
              boxShadow: state === "current" ? `0 0 0 5px ${TASKS.disc.current.halo}` : undefined,
            } as CSSProperties
          }
        >
          {done ? (
            <Check className="size-5" strokeWidth={2.2} />
          ) : current ? (
            <TaskIcon kind={info.kind} active />
          ) : (
            <Icon className="size-5" strokeWidth={1.8} />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-3.5">
            <span
              className="text-[15px] font-bold"
              style={done ? { color: TASKS.doneTitle } : undefined}
              dir="auto"
            >
              {todayTaskTitle(copy, info.kind)}
            </span>
            {xp && (
              <span
                className="shrink-0 rounded-full px-2.5 py-[3px] text-xs font-bold"
                style={{ background: TASKS.xp[state].background, color: TASKS.xp[state].ink }}
                dir="ltr"
              >
                {xp}
              </span>
            )}
          </span>
          {showMeta && (
            <span className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px]">
              {info.title && (
                <span
                  className="text-foreground font-semibold"
                  dir="ltr"
                  style={{ unicodeBidi: "isolate" }}
                >
                  {info.title}
                </span>
              )}
              {info.supportTitle && <span dir="auto">{info.supportTitle}</span>}
              {info.levelCode && (
                <span
                  className="rounded-md border px-[7px] py-px text-[11px] font-bold"
                  style={{ borderColor: TASKS.level.border, color: TASKS.level.ink }}
                >
                  {info.levelCode}
                </span>
              )}
              {!done && info.kind === "sentences" && <span dir="auto">{copy.sentencesFrom}</span>}
              {!done && <span dir="auto">{minutes}</span>}
              {accuracyLine && (
                <span
                  className={info.accuracy! >= STAR_ACCURACY ? "text-success font-medium" : ""}
                  dir="auto"
                >
                  {accuracyLine}
                </span>
              )}
              {!done && info.kind === "story" && <span dir="auto">{copy.starHint}</span>}
            </span>
          )}
          {current && !done && (
            <>
              {quest.progress > 0 && (
                <span className="mt-3 flex items-center gap-3">
                  <Progress value={questProgressPercent(quest)} className="h-1.5 flex-1" />
                  <span className="text-muted-foreground shrink-0 text-xs tabular-nums" dir="ltr">
                    {quest.progress} / {quest.target}
                  </span>
                </span>
              )}
              <span
                className="mt-3 block text-[13.5px] leading-[1.7]"
                style={{ color: TASKS.why }}
                dir={dir}
              >
                {why}
              </span>
              <span className="mt-3.5 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-slate-900 max-sm:w-full max-sm:justify-center">
                <span dir="auto">{`${start} · ${minutes}`}</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </span>
            </>
          )}
        </span>
      </Link>
    </li>
  );
}

/** The card that opens under the strip: today's three steps on one rail, and once they are done the way to do them again. */
function TasksPanel({ payload }: { payload: DailyQuestsPayload }) {
  const { t, dir } = useLocale();
  const copy = t.today;
  const colors = HOME_CARD_COLORS.lesson;
  const quests = payload.quests;
  const current = quests.find((quest) => !quest.completed);
  const required = requiredQuests(quests);
  const totalXp = required.reduce((sum, quest) => sum + quest.xp, 0);
  const earnedXp = required.reduce(
    (sum, quest) => sum + (quest.completed && quest.today?.paid ? quest.xp : 0),
    0,
  );
  const redoQuest = quests.find((quest) => quest.today?.redoHref && quest.today.kind !== "words");
  const redoHref = redoQuest?.today?.redoHref
    ? `${redoQuest.today.redoHref}?today=1&redo=1`
    : (quests.find((quest) => quest.today?.kind === "words")?.today?.href ?? null);

  return (
    <section
      aria-label={copy.questsHeading}
      className="rounded-2xl border px-5 pt-5 pb-2.5 sm:px-6"
      style={{ background: colors.background, borderColor: colors.edge }}
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-[15px] font-bold" dir={dir}>
          {copy.questsHeading}
        </h2>
        {totalXp > 0 && (
          <p
            className={cn("text-[12.5px]", payload.allDone && "text-success")}
            style={payload.allDone ? undefined : { color: TASKS.reward }}
            dir={dir}
          >
            {payload.allDone
              ? fill(copy.rewardEarned, { xp: earnedXp })
              : fill(copy.rewardAll, { xp: totalXp })}
          </p>
        )}
      </div>
      <ul>
        {quests.map((quest, index) => (
          <TaskRow
            key={quest.slot}
            quest={quest}
            current={quest.slot === current?.slot}
            first={index === 0}
            last={index === quests.length - 1}
          />
        ))}
      </ul>
      {payload.allDone && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-t py-3.5"
          style={{ borderColor: TASKS.rowLine }}
        >
          <p className="text-success text-sm font-medium" dir={dir}>
            {copy.doneHeading}
          </p>
          {redoHref && (
            <Link
              href={redoHref}
              className="hover:bg-muted focus-visible:ring-ring inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors outline-none focus-visible:ring-2"
              style={{ borderColor: TASKS.hairline }}
            >
              <RotateCcw aria-hidden="true" className="size-4" strokeWidth={1.8} />
              <span dir="auto">{copy.redo}</span>
            </Link>
          )}
        </div>
      )}
      {payload.weekly && <WeeklyLineView line={payload.weekly} className="mb-3" />}
    </section>
  );
}

/**
 * The daily-tasks box of the Home cards (permission "homeCards"): one strip, folded until tapped,
 * made of four groups with a hairline between them: the next task as a tile with its icon and two
 * lines (the task, then its title), a tracker of one part per task, the week with the streak freezes
 * as a small pill, and the round button that opens the card under it. Opened, the card lists the
 * day's steps on one rail; only the current step is open, with the one white button. When the day is
 * done the tile turns green and the repeat menu appears. The same data as the classic strip and the
 * same links; only how it is drawn changed.
 */
export function TasksBox({
  today,
  quests,
  streak,
  className,
}: {
  today: string;
  quests: DailyQuestsPayload | null;
  streak: StreakCalendarData | null;
  className?: string;
}) {
  const { t, dir } = useLocale();
  const colors = HOME_CARD_COLORS.lesson;
  const [open, setOpen] = useState(false);
  const panelId = useId();

  if (!quests && !streak) return null;

  // Today's tasks are the quests tied to specific lessons; the tracker and the next task are about
  // the day's required ones (the sentence exam is an extra).
  const todayMode = Boolean(quests?.quests.some((quest) => quest.today));
  const required = requiredQuests(quests?.quests ?? []);
  const done = required.filter((quest) => quest.completed).length;
  const total = required.length;
  const pendingQuests = required.filter((quest) => !quest.completed);
  const nextQuest = todayMode
    ? pendingQuests[0]
    : [...pendingQuests].sort((a, b) => questProgressPercent(b) - questProgressPercent(a))[0];
  const finished = Boolean(quests) && (quests!.allDone || !nextQuest);
  const remaining = streak?.freezesRemaining ?? 0;
  const NextIcon = nextQuest?.today ? ICONS[nextQuest.today.kind] : Target;
  const tile = finished ? TASKS.tileDone : TASKS.tile;

  let heading = "";
  let detail = "";
  if (quests) {
    if (finished) {
      heading = t.quests.allDoneExplore;
    } else if (nextQuest?.today) {
      heading = todayTaskTitle(t.today, nextQuest.today.kind);
      detail = nextQuest.today.title;
    } else if (nextQuest) {
      heading = questTitle(t, nextQuest.type);
      detail = `${nextQuest.progress} / ${nextQuest.target}`;
    }
  }

  return (
    <div className={className}>
      <div
        className="hover:border-primary/40 relative flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-(--hc-edge) px-3.5 py-3 transition-colors xl:h-[4.4rem] xl:flex-nowrap xl:gap-x-0 xl:py-0 xl:pe-4"
        style={{ background: colors.background, "--hc-edge": colors.edge } as CSSProperties}
      >
        {quests && (
          <div className="flex min-w-0 flex-1 basis-56 items-center gap-3.5">
            <span
              aria-hidden="true"
              className="grid size-11 shrink-0 place-items-center rounded-[13px] border"
              style={{ background: tile.background, borderColor: tile.border, color: tile.ink }}
            >
              {finished ? (
                <Check className="size-[22px]" strokeWidth={2.2} />
              ) : (
                <NextIcon className="size-[22px]" strokeWidth={1.8} />
              )}
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="truncate text-[15.5px] font-bold" dir={dir}>
                {heading}
              </p>
              {detail && (
                <p className="text-muted-foreground truncate text-[13px]" dir="ltr">
                  {detail}
                </p>
              )}
            </div>
            {finished && todayMode && (
              <div className="ms-auto shrink-0">
                <RepeatLessonMenu quests={quests.quests} />
              </div>
            )}
          </div>
        )}

        {quests && total > 0 && (
          <>
            <Divider />
            <div className="flex shrink-0 flex-col gap-2">
              <p className="text-muted-foreground flex items-center gap-1.5 text-xs leading-none">
                <span dir={dir}>{t.quests.heading}</span>
                <span dir="ltr" className="tabular-nums">
                  {done}/{total}
                </span>
              </p>
              <div className="flex gap-[5px]" aria-hidden="true">
                {required.map((quest) => {
                  const isNext = quest === nextQuest;
                  const percent = quest.completed ? 100 : isNext ? questProgressPercent(quest) : 0;
                  return (
                    <i
                      key={quest.slot}
                      className="relative block h-1.5 w-9 overflow-hidden rounded-[3px]"
                      style={{
                        background: TASKS.segment.idle,
                        boxShadow: isNext ? `inset 0 0 0 1px ${TASKS.segment.current}` : undefined,
                      }}
                    >
                      <i
                        className="absolute inset-y-0 start-0 block"
                        style={{ width: `${percent}%`, background: TASKS.segment.fill }}
                      />
                    </i>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {streak && (
          <>
            {quests && <Divider />}
            <div className="flex shrink-0 flex-col gap-2">
              <span className="text-muted-foreground text-xs leading-none" dir={dir}>
                {t.streakCalendar.heading}
              </span>
              <WeekDots today={today} strip={streak} />
            </div>
            {remaining > 0 && (
              <span
                className="relative z-10 inline-flex shrink-0 items-center gap-[5px] rounded-full border px-2.5 py-1 text-[12.5px] font-bold xl:ms-4"
                style={{
                  background: TASKS.freeze.background,
                  borderColor: TASKS.freeze.border,
                  color: TASKS.freeze.ink,
                }}
                title={t.streakCalendar.freezesLeft.replace("{n}", String(remaining))}
              >
                <Snowflake className="size-3.5" aria-hidden="true" />
                <span dir="ltr">{remaining}</span>
              </span>
            )}
          </>
        )}

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={t.quests.heading}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:ring-2 xl:ms-[18px]"
          style={{ borderColor: TASKS.chevron.border }}
        >
          <ChevronDown
            className={cn("size-[18px] transition-transform", open && "rotate-180")}
            aria-hidden="true"
          />
        </button>
      </div>
      {open && (
        <div id={panelId} className="mt-3">
          {todayMode && quests ? <TasksPanel payload={quests} /> : <QuestsCard payload={quests} />}
        </div>
      )}
    </div>
  );
}
