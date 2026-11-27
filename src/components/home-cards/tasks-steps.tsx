"use client";

import { Fragment, useId, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, RotateCcw, Snowflake, Target } from "lucide-react";

import { RepeatLessonMenu, WeekDots } from "@/components/app/engagement-strip";
import { useFeatures } from "@/components/providers/feature-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { rewardLine, sceneDetail, sceneHeading, taskCopy } from "@/components/today/task-copy";
import {
  ICONS,
  STAR_ACCURACY,
  TaskIcon,
  WeeklyLineView,
  fill,
} from "@/components/today/today-tasks";
import type { StreakCalendarData } from "@/lib/features/calendar-actions";
import type { DailyQuest, DailyQuestsPayload } from "@/lib/features/quests";
import { requiredQuests } from "@/lib/today/quests";
import { cn } from "@/lib/utils";

import { GREY, HOME_CARD_COLORS, TASKS } from "./palette";
import { useGreyHome } from "./use-grey-home";

type RowState = "done" | "current" | "idle";

/** The ring's soft halo round the step in progress (4 px). */
function halo(state: RowState): string | undefined {
  return state === "current" ? `0 0 0 4px ${TASKS.disc.current.halo}` : undefined;
}

/** A thin vertical line between the steps and the week (from xl up, like the strip it replaces). */
function Divider() {
  const grey = useGreyHome();
  return (
    <span
      aria-hidden="true"
      className="mx-6 hidden h-[34px] w-px shrink-0 xl:block"
      style={{ background: grey ? GREY.hairline : TASKS.hairline }}
    />
  );
}

/** The day's tasks as three small discs joined by lines: the rail of the opened box, folded. */
function StepTrio({
  quests,
  current,
  calm = false,
}: {
  quests: DailyQuest[];
  current: DailyQuest | undefined;
  /** The calm look: the step in progress breathes softly. */
  calm?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden="true">
      {quests.map((quest, index) => {
        const state: RowState = quest.completed
          ? "done"
          : quest.slot === current?.slot
            ? "current"
            : "idle";
        const disc = TASKS.disc[state];
        const Icon = quest.today ? ICONS[quest.today.kind] : Target;
        return (
          <Fragment key={quest.slot}>
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full border-[1.5px]",
                calm && state === "current" && "tk-breathe",
              )}
              style={
                {
                  borderColor: disc.border,
                  background: disc.background,
                  color: disc.ink,
                  boxShadow: halo(state),
                } as CSSProperties
              }
            >
              {state === "done" ? (
                <Check className="size-4" strokeWidth={2.2} />
              ) : (
                <Icon className="size-4" strokeWidth={1.8} />
              )}
            </span>
            {index < quests.length - 1 && (
              <span
                className="h-0.5 w-3.5 rounded-[1px]"
                style={{ background: state === "done" ? TASKS.rail.done : TASKS.rail.idle }}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

/** One step of the opened box: its disc on the rail, its name and XP, its detail line, and, for the current one, why it matters and the button at the row's end. */
function StepRow({
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
  const { t, dir, locale } = useLocale();
  const { rollouts } = useFeatures();
  const copy = t.today;
  const info = quest.today;
  if (!info) return null;
  const Icon = ICONS[info.kind];
  const done = quest.completed;
  const state: RowState = done ? "done" : current ? "current" : "idle";
  const disc = TASKS.disc[state];
  const minutes = fill(copy.minutes, { n: info.minutes });
  const words = taskCopy(copy, info, { locale, tidy: rollouts.todayTidy });
  // A scene day's second and third rows say what is in them, not the passage's title again.
  const sceneRow = Boolean(info.scene) && (info.kind === "story" || info.kind === "words");
  const detail = sceneDetail(info, locale);
  const accuracyLine =
    info.kind === "story" && done && info.accuracy !== null
      ? fill(info.accuracy >= STAR_ACCURACY ? copy.starEarned : copy.accuracyIs, {
          n: Math.round(info.accuracy * 100),
        })
      : null;
  const showMeta =
    !sceneRow && (info.title || info.levelCode || info.supportTitle || !done || accuracyLine);
  const xp = quest.xp > 0 && (!done || info.paid) ? fill(copy.xpChip, { xp: quest.xp }) : null;

  return (
    <li className="relative">
      {!first && (
        <span
          aria-hidden="true"
          className="absolute start-12 end-0 top-0 h-px"
          style={{ background: TASKS.rowLine }}
        />
      )}
      {!last && (
        <span
          aria-hidden="true"
          className="absolute start-[15px] top-[49px] -bottom-[9px] w-0.5 rounded-[1px]"
          style={{ background: done ? TASKS.rail.done : TASKS.rail.idle }}
        />
      )}
      <Link
        href={info.href}
        aria-current={current ? "step" : undefined}
        className="focus-visible:ring-ring flex items-start gap-4 rounded-xl py-[13px] outline-none focus-visible:ring-2 max-sm:flex-wrap"
      >
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-full border-[1.5px]"
          style={
            {
              borderColor: disc.border,
              background: disc.background,
              color: disc.ink,
              boxShadow: halo(state),
            } as CSSProperties
          }
        >
          {done ? (
            <Check className="size-[17px]" strokeWidth={2.2} />
          ) : current ? (
            <TaskIcon kind={info.kind} active small />
          ) : (
            <Icon className="size-[17px]" strokeWidth={1.8} />
          )}
        </span>
        <span className="block min-w-0 flex-1 max-sm:basis-[calc(100%-3rem)]">
          <span className="flex items-center gap-2.5 text-[15px] leading-[1.4] font-bold">
            <span style={done ? { color: TASKS.doneTitle } : undefined} dir="auto">
              {words.title}
            </span>
            {xp && (
              <span
                className="shrink-0 rounded-full px-[9px] py-0.5 text-[11.5px] font-bold"
                style={{ background: TASKS.xp[state].background, color: TASKS.xp[state].ink }}
                dir="ltr"
              >
                {xp}
              </span>
            )}
          </span>
          {sceneRow && !done && detail && (
            <span
              className="text-muted-foreground mt-[3px] block text-[13px] md:text-left"
              dir="auto"
            >
              {detail}
            </span>
          )}
          {showMeta && (
            <span className="text-muted-foreground mt-[3px] flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px]">
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
                  className="rounded-md border px-[7px] text-[11px] font-bold"
                  style={{ borderColor: TASKS.level.border, color: TASKS.level.ink }}
                >
                  {info.levelCode}
                </span>
              )}
              {!done && info.kind === "sentences" && <span dir="auto">{copy.sentencesFrom}</span>}
              {!done && <span dir="auto">{minutes}</span>}
              {current && !done && quest.progress > 0 && (
                <span className="tabular-nums" dir="ltr">
                  {quest.progress} / {quest.target}
                </span>
              )}
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
            <span
              className="mt-1.5 block text-[12.5px] leading-[1.6]"
              style={{ color: TASKS.why }}
              dir={dir}
            >
              {words.why}
            </span>
          )}
        </span>
        {current && !done && (
          <span className="inline-flex h-10 shrink-0 items-center gap-[9px] self-center rounded-[11px] bg-white px-[18px] text-sm font-bold whitespace-nowrap text-slate-900 max-sm:ms-12 max-sm:w-[calc(100%-3rem)] max-sm:justify-center">
            <span dir="auto">{`${words.start} · ${minutes}`}</span>
            <ArrowRight className="size-4" strokeWidth={2} aria-hidden="true" />
          </span>
        )}
      </Link>
    </li>
  );
}

/**
 * The daily-tasks box as three steps (permission "taskSteps", a look of the Home cards' strip; mock-up
 * `reports/tasks-strip-options-2026-11-05.html`, option B): the day's tasks are three small discs joined
 * by lines (a green tick for a finished one, a ring for the one in progress, grey for the rest), the
 * "tasks 1/3" label and the next task's name beside them, the week as small dots, the freezes left as plain
 * text and the round button. Opened, the SAME box grows downward: its first line becomes the heading with
 * the reward, and under a hairline the steps are listed on one rail, only the current one with its why-line
 * and the white button at the row's end. Same data, same links and same rewards as the strip it replaces.
 */
export function TasksStepsBox({
  today,
  quests,
  streak,
  className,
}: {
  today: string;
  quests: DailyQuestsPayload;
  streak: StreakCalendarData | null;
  className?: string;
}) {
  const { t, dir, locale } = useLocale();
  const copy = t.today;
  // The grey look of Home (permission "greyCalm"): the capsule is a flat neutral grey with small corners.
  const grey = useGreyHome();
  const colors = grey ? GREY.colors.neutral : HOME_CARD_COLORS.lesson;
  const capsuleRadius = grey ? GREY.radius.capsule : null;
  const [open, setOpen] = useState(false);
  const panelId = useId();
  // The calm look (permission "homeCalm"): folded, the box is a slim capsule that FILLS with a soft wash as the day's tasks are done (green once the day is done), the step in progress breathes, and one small white button starts it.
  const calm = useFeatures().rollouts.homeCalm;

  const required = requiredQuests(quests.quests);
  const done = required.filter((quest) => quest.completed).length;
  const total = required.length;
  const current = required.find((quest) => !quest.completed);
  // The opened list highlights the first unfinished row of ALL the day's quests, as the card it replaces did
  // (once the three are done that is the sentence exam, if the day has one).
  const rowCurrent = quests.quests.find((quest) => !quest.completed);
  const finished = quests.allDone || !current;
  const washPercent = finished ? 100 : total > 0 ? Math.round((done / total) * 100) : 0;
  const nextInfo = current?.today ?? null;
  const nextStart = nextInfo ? taskCopy(copy, nextInfo, { locale, tidy: false }).start : null;
  // A scene day: the folded box names the scene and its passage, whichever step is next.
  const scene = sceneHeading(quests.quests, locale);
  const remaining = streak?.freezesRemaining ?? 0;
  const totalXp = required.reduce((sum, quest) => sum + quest.xp, 0);
  const earnedXp = required.reduce(
    (sum, quest) => sum + (quest.completed && quest.today?.paid ? quest.xp : 0),
    0,
  );
  const redoQuest = quests.quests.find(
    (quest) => quest.today?.redoHref && quest.today.kind !== "words",
  );
  const redoHref = redoQuest?.today?.redoHref
    ? `${redoQuest.today.redoHref}?today=1&redo=1`
    : (quests.quests.find((quest) => quest.today?.kind === "words")?.today?.href ?? null);
  const reward =
    totalXp > 0
      ? quests.allDone
        ? fill(copy.rewardEarned, { xp: earnedXp })
        : rewardLine(copy, quests.quests, totalXp, locale)
      : null;

  return (
    <div className={className}>
      <div
        className="hover:border-primary/40 relative rounded-2xl border border-(--hc-edge) transition-colors"
        style={
          {
            background: colors.background,
            "--hc-edge": colors.edge,
            borderRadius: capsuleRadius ?? undefined,
          } as CSSProperties
        }
      >
        <div
          className={cn(
            "relative flex flex-wrap items-center gap-x-5 gap-y-3 px-3.5 py-3 xl:h-[calc(4.4rem-2px)] xl:flex-nowrap xl:gap-x-0 xl:py-0 xl:pe-4",
            calm && "overflow-hidden xl:h-[calc(3.5rem-2px)]",
            calm && (open ? "rounded-t-2xl" : "rounded-2xl"),
          )}
          style={
            capsuleRadius !== null && calm
              ? { borderRadius: open ? `${capsuleRadius}px ${capsuleRadius}px 0 0` : capsuleRadius }
              : undefined
          }
        >
          {calm && !open && (
            <span
              aria-hidden="true"
              className="tk-wash pointer-events-none absolute inset-y-0 start-0 origin-left rtl:origin-right"
              style={{
                width: `${washPercent}%`,
                background: finished
                  ? TASKS.wash.done
                  : `linear-gradient(to ${dir === "rtl" ? "left" : "right"},${grey ? GREY.wash.from : TASKS.wash.from},${grey ? GREY.wash.to : TASKS.wash.to})`,
              }}
            />
          )}
          <div className="flex min-w-0 flex-1 basis-56 items-center">
            {open ? (
              <p className="ms-1.5 flex min-w-0 items-baseline gap-2.5 leading-[1.3] whitespace-nowrap">
                <b className="text-[15.5px] font-bold" dir={dir}>
                  {copy.questsHeading}
                </b>
                {reward && (
                  <span
                    className={cn(
                      "truncate text-[13.5px]",
                      quests.allDone ? "text-success" : "text-muted-foreground",
                    )}
                    // The scene's line ends in «+35 XP»: its own direction keeps XP after the number.
                    dir={scene && !quests.allDone ? "auto" : dir}
                  >
                    {reward}
                  </span>
                )}
              </p>
            ) : (
              <>
                <StepTrio quests={required} current={current} calm={calm} />
                <div className="ms-4 flex min-w-0 flex-col gap-[3px] whitespace-nowrap">
                  <p className="text-muted-foreground flex gap-1.5 text-xs leading-[1.2]">
                    <span dir={dir}>{t.quests.heading}</span>
                    <b className="text-foreground font-semibold tabular-nums" dir="ltr">
                      {done}/{total}
                    </b>
                  </p>
                  <p className="flex min-w-0 items-baseline gap-2.5 leading-[1.3]">
                    {finished || !current?.today ? (
                      <b
                        className="truncate text-[15.5px] font-bold"
                        style={{ color: TASKS.tileDone.ink }}
                        dir={dir}
                      >
                        {t.quests.allDoneExplore}
                      </b>
                    ) : (
                      <>
                        <b className="shrink-0 text-[15.5px] font-bold" dir={dir}>
                          {scene?.name ??
                            taskCopy(copy, current.today, { locale, tidy: false }).title}
                        </b>
                        {(scene?.title ?? current.today.title) && (
                          <span className="text-muted-foreground truncate text-[13.5px]" dir="ltr">
                            {scene?.title ?? current.today.title}
                          </span>
                        )}
                      </>
                    )}
                  </p>
                </div>
                {finished && (
                  <div className="ms-1.5 shrink-0">
                    <RepeatLessonMenu quests={quests.quests} />
                  </div>
                )}
              </>
            )}
          </div>

          {streak && (
            <>
              <Divider />
              <div className="flex shrink-0 flex-col gap-2">
                <span className="text-muted-foreground text-xs leading-none" dir={dir}>
                  {t.streakCalendar.heading}
                </span>
                <WeekDots today={today} strip={streak} quiet />
              </div>
              {remaining > 0 && (
                <span
                  className="relative z-10 inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold xl:ms-3.5"
                  style={{ color: TASKS.freezeQuiet }}
                  title={t.streakCalendar.freezesLeft.replace("{n}", String(remaining))}
                >
                  <Snowflake className="size-3.5" aria-hidden="true" />
                  <span dir="ltr">{remaining}</span>
                </span>
              )}
            </>
          )}

          {calm && !open && !finished && nextInfo && nextStart && (
            <Link
              href={nextInfo.href}
              className="focus-visible:ring-ring relative z-10 inline-flex h-9 shrink-0 items-center gap-2 rounded-[11px] bg-white px-3.5 text-[13.5px] font-bold whitespace-nowrap text-slate-900 transition-colors outline-none hover:bg-white/90 focus-visible:ring-2 max-sm:w-full max-sm:justify-center xl:ms-4"
              style={grey ? { borderRadius: GREY.radius.button } : undefined}
            >
              <span dir="auto">{nextStart}</span>
              <span className="font-medium text-slate-500" dir="auto">
                {fill(copy.minutes, { n: nextInfo.minutes })}
              </span>
              <ArrowRight className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
            </Link>
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
          <section
            id={panelId}
            aria-label={copy.questsHeading}
            className="border-t ps-[18px] pe-[22px] pt-1 pb-3"
            style={{ borderColor: TASKS.hairline }}
          >
            <ul>
              {quests.quests.map((quest, index) => (
                <StepRow
                  key={quest.slot}
                  quest={quest}
                  current={quest.slot === rowCurrent?.slot}
                  first={index === 0}
                  last={index === quests.quests.length - 1}
                />
              ))}
            </ul>
            {quests.allDone && (
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
            {quests.weekly && <WeeklyLineView line={quests.weekly} className="mb-1" />}
          </section>
        )}
      </div>
    </div>
  );
}
