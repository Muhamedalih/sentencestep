"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Headphones, PenLine, Quote, RotateCcw, Target, Type } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Progress } from "@/components/ui/progress";
import { questProgressPercent } from "@/lib/features/quests";
import type { DailyQuest, DailyQuestsPayload, TodayQuestInfo } from "@/lib/features/quests";
import { requiredQuests } from "@/lib/today/quests";
import { cn } from "@/lib/utils";

/** The accuracy that earns the story's star. */
const STAR_ACCURACY = 0.9;

const ICONS = { listen: Headphones, story: PenLine, words: Type, sentences: Quote } as const;

const CHIP_LEVEL =
  "border-success/40 bg-success/10 text-success rounded-full border px-2 py-px text-[11px] font-semibold";

type TodayCopy = ReturnType<typeof useLocale>["t"]["today"];

function fill(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template,
  );
}

/** The task's name: "Listen to a passage", "Write a story", "Write 5 words", "Today's exam". */
export function todayTaskTitle(copy: TodayCopy, kind: TodayQuestInfo["kind"]): string {
  return {
    listen: copy.taskListen,
    story: copy.taskStory,
    words: copy.taskWords,
    sentences: copy.taskSentences,
  }[kind];
}

/**
 * The task's icon. The one in progress moves, gently and slowly: the headphones float with two soft
 * sound rings, the pen writes, the letters breathe. Nothing moves for a learner who asked for
 * reduced motion, and a task that is done or still waiting stays still.
 */
function TaskIcon({ kind, active }: { kind: TodayQuestInfo["kind"]; active: boolean }) {
  const reduced = useReducedMotion();
  const moving = active && !reduced;
  const Icon = ICONS[kind];
  const kindMotion =
    kind === "listen"
      ? { y: [0, -2, 0] }
      : kind === "story"
        ? { x: [0, 2.5, 0, 2.5, 0], rotate: [0, -6, 0, -6, 0] }
        : { scale: [1, 1.12, 1] };
  return (
    <span className="relative grid size-9 place-items-center" aria-hidden="true">
      {moving &&
        kind === "listen" &&
        [0, 1.2].map((delay) => (
          <motion.span
            key={delay}
            className="border-primary/40 absolute inset-1 rounded-full border"
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay }}
          />
        ))}
      <motion.span
        className="grid place-items-center"
        animate={moving ? kindMotion : undefined}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon className="size-5" strokeWidth={1.8} />
      </motion.span>
    </span>
  );
}

/** A soft brand glow breathing behind Home's quests box while there is something to do: the one thing on the page that draws the eye. */
export function TodayGlow() {
  const reduced = useReducedMotion();
  return (
    <motion.div
      aria-hidden="true"
      className="bg-primary/25 pointer-events-none absolute -inset-2 -z-10 rounded-[1.75rem] blur-2xl"
      initial={{ opacity: 0.3 }}
      animate={reduced ? { opacity: 0.3 } : { opacity: [0.25, 0.6, 0.25] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function TaskRow({ quest, current }: { quest: DailyQuest; current: boolean }) {
  const { t } = useLocale();
  const copy = t.today;
  const info = quest.today;
  if (!info) return null;
  const Icon = ICONS[info.kind];
  const done = quest.completed;
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
  return (
    <li>
      <Link
        href={info.href}
        aria-current={current ? "step" : undefined}
        className={cn(
          "focus-visible:ring-ring block rounded-xl border px-3.5 py-3 transition-colors outline-none focus-visible:ring-2",
          done
            ? "border-success/40 bg-success/10"
            : current
              ? "border-primary/50 bg-brand-muted"
              : "border-border/70 hover:bg-muted/50",
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "mt-0.5 grid size-9 shrink-0 place-items-center",
              done ? "text-success" : current ? "text-primary" : "text-muted-foreground",
            )}
            aria-hidden="true"
          >
            {done ? (
              <Check className="size-5" strokeWidth={2} />
            ) : current ? (
              <TaskIcon kind={info.kind} active />
            ) : (
              <Icon className="size-5" strokeWidth={1.8} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className={cn("text-sm font-semibold", done && "text-success")}>
                <span dir="auto">{todayTaskTitle(copy, info.kind)}</span>
              </p>
              {quest.xp > 0 && (!done || info.paid) && (
                <span
                  className={cn(
                    "shrink-0 text-xs font-semibold",
                    done ? "text-success" : "text-primary",
                  )}
                  dir="ltr"
                >
                  {fill(copy.xpChip, { xp: quest.xp })}
                </span>
              )}
            </div>
            {showMeta && (
              <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px]">
                {info.title && (
                  <span
                    className="text-foreground font-medium"
                    dir="ltr"
                    style={{ unicodeBidi: "isolate" }}
                  >
                    {info.title}
                  </span>
                )}
                {info.supportTitle && <span dir="auto">{info.supportTitle}</span>}
                {info.levelCode && <span className={CHIP_LEVEL}>{info.levelCode}</span>}
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
              </p>
            )}
            <div className="mt-2 flex items-center gap-3">
              <Progress value={questProgressPercent(quest)} className="h-1.5 flex-1" />
              <span className="text-muted-foreground shrink-0 text-xs tabular-nums" dir="ltr">
                {quest.progress} / {quest.target}
              </span>
            </div>
            {current && !done && (
              <>
                <p className="text-muted-foreground mt-3 text-[13px] leading-relaxed">
                  <span dir="auto">{why}</span>
                </p>
                <span className="bg-primary text-primary-foreground mt-3 inline-flex h-11 items-center justify-center rounded-[10px] px-6 text-sm font-semibold max-sm:w-full">
                  <span dir="auto">{`${start} · ${minutes}`}</span>
                </span>
              </>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}

/**
 * Home's daily quests box while "Today's session (daily tasks)" is open: the same card the quests
 * always had — a title, three rows with their XP and a progress bar — but the three quests are
 * Today's session: listen to a passage, write a story, write five words, each tied to the specific
 * passage, story or word round picked for this learner. The one in progress is opened with its own
 * big start button, and every row is a link into its lesson. Finished, it offers to redo the day's
 * lessons, in the same order.
 */
export function TodayTasksPanel({
  payload,
  className,
}: {
  payload: DailyQuestsPayload;
  className?: string;
}) {
  const { t } = useLocale();
  const copy = t.today;
  const quests = payload.quests;
  const current = quests.find((quest) => !quest.completed);
  // The reward line is about the three steps: the day's exam is an extra with its own XP.
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
      className={cn("border-border/60 bg-card rounded-2xl border p-4 sm:p-5", className)}
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Target className="text-accent size-4" aria-hidden="true" />
          <span dir="auto">{copy.questsHeading}</span>
        </h2>
        {totalXp > 0 && (
          <p className={cn("text-xs", payload.allDone ? "text-success" : "text-muted-foreground")}>
            <span dir="auto">
              {payload.allDone
                ? fill(copy.rewardEarned, { xp: earnedXp })
                : fill(copy.rewardAll, { xp: totalXp })}
            </span>
          </p>
        )}
      </div>
      <ul className="flex flex-col gap-2.5">
        {quests.map((quest) => (
          <TaskRow key={quest.slot} quest={quest} current={quest.slot === current?.slot} />
        ))}
      </ul>
      {payload.allDone && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-success text-sm font-medium">
            <span dir="auto">{copy.doneHeading}</span>
          </p>
          {redoHref && (
            <Link
              href={redoHref}
              className="border-border hover:bg-muted focus-visible:ring-ring inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors outline-none focus-visible:ring-2"
            >
              <RotateCcw aria-hidden="true" className="size-4" strokeWidth={1.8} />
              <span dir="auto">{copy.redo}</span>
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
