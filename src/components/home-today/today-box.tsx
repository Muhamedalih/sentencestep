"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Check, RotateCcw } from "lucide-react";

import { fill, withXp } from "@/components/home-today/format";
import { TASK_ICONS, TaskIcon } from "@/components/home-today/task-icon";
import { LockedTestCard, TestYourselfCard } from "@/components/home-today/test-card";
import { useLocale } from "@/components/providers/locale-provider";
import { todayTaskTitle } from "@/components/today/today-tasks";
import { ruleStrings } from "@/lib/daily-rule/strings";
import type { DailyQuest, DailyQuestsPayload } from "@/lib/features/quests";
import { splitToday, todayRedoHref, todayTotals } from "@/lib/today/home-layout";
import { cn } from "@/lib/utils";

/** The optional rule of the day on Home's box: where its row links, its level's name, and whether today's rule is answered. */
export interface RuleRowState {
  href: string | null;
  levelLabel: string;
  answeredToday: boolean;
}

/**
 * The rule of the day as the first row of Home's box (the dailyRule permission): a quiet row, not one of
 * the three tasks, so it is outside the ring and the day's reward. Linked until today's rule is answered.
 */
function RuleRow({ href, levelLabel, answeredToday }: RuleRowState) {
  const { locale } = useLocale();
  const rule = ruleStrings(locale);
  const body = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "size-2.5 shrink-0 rounded-full border",
          answeredToday ? "bg-primary border-primary" : "border-muted-foreground",
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span dir="auto">{rule.title}</span>
          <span className="text-primary border-primary/40 rounded-full border px-2 text-[11px] font-medium">
            <span dir="ltr">{levelLabel}</span>
          </span>
        </div>
        <div className="text-muted-foreground text-xs">
          <span dir="auto">{answeredToday ? rule.doneToday : rule.buttonHint}</span>
        </div>
      </div>
    </>
  );
  return (
    <li>
      {href ? (
        <Link href={href} className="hover:bg-muted flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors">
          {body}
        </Link>
      ) : (
        <div className="flex items-center gap-3 px-3 py-2.5">{body}</div>
      )}
    </li>
  );
}

/** The accuracy that earns the story's star. */
const STAR_ACCURACY = 0.9;

/** The ring of the tasks done today: the same conic ring the quests strip draws. */
function Ring({ done, total }: { done: number; total: number }) {
  const percent = total > 0 ? (done / total) * 100 : 0;
  return (
    <span
      className="roomy:size-12 relative flex size-10 shrink-0 items-center justify-center rounded-full"
      style={{ background: `conic-gradient(var(--primary) ${percent}%, var(--border) 0)` }}
      aria-hidden="true"
    >
      <span className="bg-card roomy:size-9 roomy:text-sm flex size-8 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums">
        <span dir="ltr">
          {done}/{total}
        </span>
      </span>
    </span>
  );
}

/**
 * The small sign on the words task that this one is about WRITING: a field with two letters typed,
 * a blinking caret and three letters still to type, and a line saying so. It is a picture of the
 * activity (it names no word), quiet enough to sit under the task's name; the caret stops blinking
 * for a learner who asked for reduced motion.
 */
function TypingHint() {
  const { t } = useLocale();
  const reduced = useReducedMotion();
  return (
    <div className="roomy:mt-[clamp(0.3rem,0.9svh,0.7rem)] mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <span
        aria-hidden="true"
        dir="ltr"
        className="border-border bg-background/60 roomy:h-9 roomy:px-3.5 roomy:text-sm inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 font-mono text-sm leading-none font-semibold"
      >
        <span className="text-primary">w</span>
        <span className="text-primary">r</span>
        <motion.span
          className="bg-primary h-4 w-0.5 rounded-full"
          animate={reduced ? undefined : { opacity: [1, 1, 0, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, times: [0, 0.5, 0.5, 1], ease: "linear" }}
        />
        {[0, 1, 2].map((slot) => (
          <span
            key={slot}
            className="bg-muted-foreground/40 h-0.5 w-2.5 translate-y-[5px] rounded-full"
          />
        ))}
      </span>
      <span className="text-muted-foreground roomy:text-sm text-[12.5px]">
        <span dir="auto">{t.today.wordsTypeHint}</span>
      </span>
    </div>
  );
}

/** One task: a quiet row without a frame of its own — only the one in progress is lifted and carries the button. */
function TaskRow({
  quest,
  current,
  phoneSingleAction = false,
}: {
  quest: DailyQuest;
  current: boolean;
  /** On a phone with mobilePath the one next-step button sits above the boxes, so this row's button steps aside below md:. */
  phoneSingleAction?: boolean;
}) {
  const { t } = useLocale();
  const copy = t.today;
  const info = quest.today;
  if (!info) return null;
  const Icon = TASK_ICONS[info.kind];
  const done = quest.completed;
  const minutes = fill(copy.minutes, { n: info.minutes });
  const start = {
    listen: copy.startListen,
    story: copy.startStory,
    words: copy.startWords,
    sentences: copy.startSentences,
  }[info.kind];
  const accuracyLine =
    info.kind === "story" && done && info.accuracy !== null
      ? fill(info.accuracy >= STAR_ACCURACY ? copy.starEarned : copy.accuracyIs, {
          n: Math.round(info.accuracy * 100),
        })
      : null;
  const supportTitle = current && !done ? info.supportTitle : null;
  const hasMeta = Boolean(info.title || supportTitle || info.levelCode || !done || accuracyLine);
  return (
    <li>
      <Link
        href={info.href}
        aria-current={current ? "step" : undefined}
        className={cn(
          "focus-visible:ring-ring roomy:rounded-2xl roomy:px-5 roomy:py-[clamp(0.4rem,1.05svh,0.85rem)] block rounded-xl px-3.5 py-3 transition-colors outline-none focus-visible:ring-2",
          current ? "bg-brand-muted/70 ring-primary/30 ring-1" : "hover:bg-muted/50",
        )}
      >
        <div className="roomy:gap-4 flex items-start gap-3">
          <span
            className={cn(
              "roomy:size-10 mt-px grid size-8 shrink-0 place-items-center",
              done ? "text-success" : current ? "text-primary" : "text-muted-foreground",
            )}
            aria-hidden="true"
          >
            {done ? (
              <Check className="roomy:size-6 size-5" strokeWidth={2} />
            ) : current ? (
              <TaskIcon kind={info.kind} />
            ) : (
              <Icon className="roomy:size-6 size-5" strokeWidth={1.8} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <p
                className={cn(
                  "roomy:text-base text-sm font-semibold",
                  done && "text-muted-foreground",
                )}
              >
                <span dir="auto">{todayTaskTitle(copy, info.kind)}</span>
              </p>
              {quest.xp > 0 && (!done || info.paid) && (
                <span
                  className={cn(
                    "roomy:text-sm shrink-0 text-xs font-medium",
                    done ? "text-success" : current ? "text-primary" : "text-muted-foreground",
                  )}
                  dir="ltr"
                >
                  {fill(copy.xpChip, { xp: quest.xp })}
                </span>
              )}
            </div>
            {hasMeta && (
              <p className="text-muted-foreground roomy:mt-0.5 roomy:gap-x-3 roomy:text-sm mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px]">
                {info.title && (
                  <span
                    className={cn("font-medium", !done && "text-foreground")}
                    dir="ltr"
                    style={{ unicodeBidi: "isolate" }}
                  >
                    {info.title}
                  </span>
                )}
                {supportTitle && <span dir="auto">{supportTitle}</span>}
                {info.levelCode && (
                  <span className="text-muted-foreground/80" dir="ltr">
                    {info.levelCode}
                  </span>
                )}
                {!done && <span dir="auto">{minutes}</span>}
                {accuracyLine && (
                  <span
                    className={info.accuracy! >= STAR_ACCURACY ? "text-success font-medium" : ""}
                    dir="auto"
                  >
                    {accuracyLine}
                  </span>
                )}
              </p>
            )}
            {info.kind === "words" && !done && <TypingHint />}
            {current && !done && (
              <span
                className={cn(
                  "bg-primary text-primary-foreground roomy:mt-[clamp(0.4rem,1.2svh,0.85rem)] roomy:h-[clamp(2.25rem,5svh,2.75rem)] roomy:px-8 roomy:text-base mt-3 inline-flex h-11 items-center justify-center rounded-[10px] px-6 text-sm font-semibold max-sm:w-full",
                  phoneSingleAction && "max-md:hidden",
                )}
              >
                <span dir="auto">{`${start} · ${minutes}`}</span>
              </span>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}

/**
 * Today's tasks on the new Home page: the ring and the reward in the heading, the three tasks as
 * quiet rows (the one in progress lifted, with the only solid button of the page), once the day is
 * done a calm line with "Redo today's lessons", and at the foot the day's self-test card — locked
 * (slightly blurred) until the three tasks are done, then open (`test`, see testCardState). The
 * weekly test is the card under the boxes (WeeklyLineView).
 */
export function TodayBox({
  payload,
  test,
  className,
  phoneSingleAction = false,
  ruleRow,
}: {
  payload: DailyQuestsPayload;
  /** What the self-test card at the foot shows; none when the day has no test for this learner. */
  test?: { state: "locked" | "open"; quest: DailyQuest | null };
  className?: string;
  /** See TaskRow: the phone's next-step button is drawn above the boxes instead. */
  phoneSingleAction?: boolean;
  /** The optional rule-of-the-day row (dailyRule permission): absent when the permission is closed. */
  ruleRow?: RuleRowState;
}) {
  const { t } = useLocale();
  const copy = t.today;
  const { tasks } = splitToday(payload.quests);
  const current = tasks.find((quest) => !quest.completed);
  const totals = todayTotals(tasks);
  const redoHref = payload.allDone ? todayRedoHref(payload.quests) : null;
  return (
    <section
      aria-label={copy.questsHeading}
      className={cn(
        // `zoom` makes everything inside (type, icons, spacing, the ring) a tenth larger on a roomy screen. On the pointer the box rises a little and its edge takes the brand colour: calm, no glow.
        "border-border/60 bg-card roomy:p-[clamp(0.75rem,2svh,1.5rem)] roomy:[zoom:var(--home-zoom,1.1)] flex h-full flex-col rounded-2xl border p-4 transition-[translate,border-color,box-shadow] duration-300 ease-out sm:p-5",
        "hover:border-primary/40 hover:shadow-[0_18px_36px_-18px_rgba(0,0,0,0.6)] motion-safe:hover:-translate-y-1",
        className,
      )}
    >
      <header className="roomy:mb-[clamp(0.4rem,1.2svh,1rem)] roomy:px-2 mb-3 flex items-center justify-between gap-4 px-1">
        <div className="min-w-0">
          <h2 className="roomy:text-xl text-[17px] font-semibold">
            <span dir="auto">{copy.questsHeading}</span>
          </h2>
          {totals.totalXp > 0 && (
            <p
              className={cn(
                "roomy:mt-1 roomy:text-sm mt-0.5 text-xs",
                payload.allDone ? "text-success" : "text-muted-foreground",
              )}
            >
              <span dir="auto">
                {payload.allDone
                  ? withXp(copy.rewardEarned, totals.earnedXp)
                  : withXp(copy.rewardAll, totals.totalXp)}
              </span>
            </p>
          )}
        </div>
        <Ring done={totals.done} total={totals.total} />
      </header>
      <ul className="roomy:gap-[clamp(0.1rem,0.45svh,0.4rem)] flex flex-1 flex-col gap-1">
        {ruleRow && <RuleRow {...ruleRow} />}
        {tasks.map((quest) => (
          <TaskRow
            key={quest.slot}
            quest={quest}
            current={quest.slot === current?.slot}
            phoneSingleAction={phoneSingleAction}
          />
        ))}
      </ul>
      {payload.allDone && (
        <div className="border-border/60 roomy:mt-[clamp(0.4rem,1.4svh,1rem)] roomy:px-2 roomy:pt-[clamp(0.4rem,1.4svh,1rem)] mt-3 flex flex-wrap items-center justify-between gap-3 border-t px-1 pt-3">
          <p className="text-success roomy:text-base text-sm font-medium">
            <span dir="auto">{copy.doneHeading}</span>
          </p>
          {redoHref && (
            <Link
              href={redoHref}
              className="border-border hover:bg-muted focus-visible:ring-ring roomy:h-10 roomy:px-5 roomy:text-sm inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors outline-none focus-visible:ring-2"
            >
              <RotateCcw aria-hidden="true" className="size-4" strokeWidth={1.8} />
              <span dir="auto">{copy.redo}</span>
            </Link>
          )}
        </div>
      )}
      {/* The day's self-test: locked until the three tasks are done, then the card itself. */}
      {test?.state === "locked" && (
        <LockedTestCard className="roomy:mt-[clamp(0.4rem,1.4svh,1rem)] mt-3" />
      )}
      {test?.state === "open" && test.quest && (
        <TestYourselfCard
          quest={test.quest}
          className="roomy:mt-[clamp(0.4rem,1.4svh,1rem)] mt-3"
        />
      )}
    </section>
  );
}
