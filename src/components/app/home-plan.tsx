"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpenText, Check, CheckCircle2, Info, Keyboard, ListChecks } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { useFeatures } from "@/components/providers/feature-provider";
import { useSharedProgress } from "@/components/providers/progress-provider";
import { buttonVariants } from "@/components/ui/button";
import { useCurrentLesson } from "@/hooks/use-current-lesson";
import { planCopy } from "@/lib/home-plan/copy";
import { PLAN_STEPS, WORDS_PER_DAY, stepStates } from "@/lib/home-plan/plan";
import type { PlanStep, StepState } from "@/lib/home-plan/plan";
import type { HomePlanWords } from "@/lib/home-plan/words";
import { findCurrentLesson } from "@/lib/progress/level";
import { todayLocalISODate } from "@/lib/progress/streak";
import { cn } from "@/lib/utils";
import type { LearningMode, LessonUnit } from "@/types/content";

/** Everything one step of the day shows, whichever way it is drawn (the big card or a row). */
interface StepView {
  n: number;
  state: StepState;
  skill: string;
  Icon: LucideIcon;
  href: string;
  image?: string | null;
  band: ReactNode;
  eyebrow: string;
  title: string;
  sub?: string;
  why: string;
  cta: string;
  waitLabel: string;
}

function StepBadge({ n, state, className }: { n: number; state: StepState; className?: string }) {
  return (
    <span
      className={cn(
        "grid size-[30px] shrink-0 place-items-center rounded-full border-2 text-sm font-extrabold",
        state === "done" && "border-success bg-success text-success-foreground",
        state === "current" && "border-primary bg-primary text-primary-foreground",
        state === "todo" && "border-primary bg-card text-primary",
        className,
      )}
    >
      {state === "done" ? <Check className="size-4" aria-hidden="true" /> : n}
    </span>
  );
}

/**
 * The step to do now, drawn as the big Home card (image band, same springy lift on hover) with a
 * "Start here" pill and the only button of the plan.
 */
function MainCard({
  view,
  startHere,
  dir,
  className,
}: {
  view: StepView;
  startHere: string;
  dir: "rtl" | "ltr";
  className?: string;
}) {
  return (
    <Link
      href={view.href}
      className={cn(
        "group border-primary/60 bg-card focus-visible:ring-ring focus-visible:ring-offset-background flex flex-col overflow-hidden rounded-2xl border transition-[scale,translate,box-shadow] duration-[380ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] outline-none hover:shadow-[0_22px_40px_-12px_rgba(0,0,0,0.5)] focus-visible:ring-2 focus-visible:ring-offset-2 motion-safe:hover:-translate-y-2 motion-safe:hover:scale-[1.05]",
        className,
      )}
    >
      <div className="bg-brand-muted text-primary relative flex min-h-44 shrink-0 items-center justify-center overflow-hidden px-3 pt-12 pb-4">
        {view.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin-provided Supabase Storage URL, same choice as HomeHero's stories card.
          <img src={view.image} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="flex w-full items-center justify-center">{view.band}</div>
        )}
        <StepBadge n={view.n} state="current" className="absolute start-3 top-3" />
        <span className="bg-card text-primary absolute end-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold">
          <view.Icon className="size-3.5" aria-hidden="true" />
          {view.skill}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-5">
        <span
          className="bg-primary text-primary-foreground mb-1 inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold"
          dir={dir}
        >
          {startHere}
        </span>
        <h3 className="text-xl font-semibold tracking-tight sm:text-2xl" dir="ltr">
          {view.title}
        </h3>
        {view.sub && (
          <p className="text-muted-foreground text-sm" dir={dir}>
            {view.sub}
          </p>
        )}
        <p className="text-muted-foreground text-xs font-semibold" dir={dir}>
          {view.eyebrow}
        </p>
        <p className="mt-2 flex items-start gap-1.5 text-xs" dir={dir}>
          <Info className="text-primary mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {view.why}
        </p>
        <span className={cn(buttonVariants({ size: "lg" }), "mt-4 w-full")}>{view.cta}</span>
      </div>
    </Link>
  );
}

/** A step that is done or still waiting: one quiet row, no image, no button. */
function SideRow({
  view,
  doneLabel,
  dir,
}: {
  view: StepView;
  doneLabel: string;
  dir: "rtl" | "ltr";
}) {
  const done = view.state === "done";
  return (
    <Link
      href={view.href}
      className="border-border bg-card hover:border-primary/50 focus-visible:ring-ring focus-visible:ring-offset-background flex items-center gap-3.5 rounded-2xl border p-4 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 md:flex-1"
    >
      <StepBadge n={view.n} state={view.state} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2" dir={dir}>
          <span className="text-primary inline-flex items-center gap-1 text-xs font-bold">
            <view.Icon className="size-3.5" aria-hidden="true" />
            {view.skill}
          </span>
          {done ? (
            <span className="text-success inline-flex items-center gap-1 text-xs font-bold">
              <Check className="size-3.5" aria-hidden="true" />
              {doneLabel}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs font-semibold">{view.waitLabel}</span>
          )}
        </div>
        <h3
          className={cn("truncate text-base font-semibold", done && "text-muted-foreground")}
          dir="ltr"
        >
          {view.title}
        </h3>
        {view.sub && (
          <p className="text-muted-foreground truncate text-sm" dir={dir}>
            {view.sub}
          </p>
        )}
        <p className="text-muted-foreground truncate text-xs" dir={dir}>
          {view.eyebrow}
        </p>
      </div>
    </Link>
  );
}

function lastCompletedToday(
  completions: readonly { mode: LearningMode; lessonId: string; completedAt: string }[],
  mode: LearningMode,
  today: string,
) {
  return completions
    .filter(
      (entry) => entry.mode === mode && todayLocalISODate(new Date(entry.completedAt)) === today,
    )
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
}

/**
 * Home's "Today's plan" (admin preview): three steps in a fixed order — a few new words, a story,
 * a writing lesson. The step to do now is the one big card marked "Start here"; the others sit
 * beside it as quiet rows (done ones ticked, the rest saying what they wait for). It replaces
 * HomeHero for admins only. Everything but the words comes from what Home already loaded; "done
 * today" for stories and lessons is read from the completions, for words from `words.learnedToday`.
 */
export function HomePlan({
  units,
  storiesUnits,
  words,
  isPremiumUser,
}: {
  units: LessonUnit[];
  storiesUnits: LessonUnit[];
  words: HomePlanWords | null;
  isPremiumUser: boolean;
}) {
  const { locale, t, dir } = useLocale();
  const c = planCopy(locale);
  const progress = useSharedProgress();
  const { isLoaded, getCompletedIds, startingLevel, completions } = progress;
  const { rollouts } = useFeatures();
  const { currentLesson, isResumed } = useCurrentLesson(units, isPremiumUser, progress);

  if (!isLoaded) {
    return (
      <div className="mb-10 grid gap-3.5 md:grid-cols-5" aria-hidden="true">
        <div className="bg-muted h-72 animate-pulse rounded-2xl md:col-span-3 md:h-96" />
        <div className="flex flex-col gap-3.5 md:col-span-2">
          <div className="bg-muted h-24 animate-pulse rounded-2xl md:flex-1" />
          <div className="bg-muted h-24 animate-pulse rounded-2xl md:flex-1" />
        </div>
      </div>
    );
  }

  const today = todayLocalISODate();
  const currentStory = findCurrentLesson(
    storiesUnits,
    getCompletedIds("stories"),
    isPremiumUser,
    startingLevel,
    rollouts.levelFloor,
  );
  const storyToday = lastCompletedToday(completions, "stories", today);
  const writeToday = lastCompletedToday(completions, "normal", today);
  const storyLesson = storyToday
    ? (storiesUnits.find((unit) => unit.id === storyToday.lessonId) ?? currentStory)
    : currentStory;
  const writeLesson = writeToday
    ? (units.find((unit) => unit.id === writeToday.lessonId) ?? currentLesson)
    : currentLesson;

  const next = words?.next ?? null;
  const learnedToday = words?.learnedToday ?? 0;
  const done: Record<PlanStep, boolean> = {
    // Nothing left to learn counts as done, so the day can still be completed.
    words: !next || learnedToday >= WORDS_PER_DAY,
    story: Boolean(storyToday),
    write: Boolean(writeToday),
  };
  const states = stepStates(done);
  const doneCount = PLAN_STEPS.filter((step) => done[step]).length;
  const skills: Record<PlanStep, string> = {
    words: c.skillWords,
    story: c.skillStory,
    write: c.skillWrite,
  };

  const views: Record<PlanStep, StepView> = {
    words: {
      n: 1,
      state: states.words,
      skill: c.skillWords,
      Icon: ListChecks,
      href: next
        ? `/learn/word-lists/${next.groupId}${next.started ? "?scope=resume" : ""}`
        : "/learn/word-lists",
      band: next ? (
        <div className="flex flex-wrap justify-center gap-1.5" dir="ltr">
          {next.words.map((word) => (
            <span
              key={word}
              className="bg-card text-foreground rounded-lg px-2.5 py-1 text-sm font-bold"
            >
              {word}
            </span>
          ))}
        </div>
      ) : (
        <ListChecks className="size-10" aria-hidden="true" />
      ),
      eyebrow: next
        ? `${c.wordsEyebrow.replace("{n}", String(WORDS_PER_DAY))}${
            learnedToday > 0 && learnedToday < WORDS_PER_DAY
              ? ` · ${c.wordsToday.replace("{n}", String(learnedToday)).replace("{total}", String(WORDS_PER_DAY))}`
              : ""
          }`
        : c.wordsDoneSub,
      title: next ? next.title : c.wordsDoneTitle,
      sub: next
        ? `${next.supportTitle} · ${c.wordsRange
            .replace("{from}", String(next.from))
            .replace("{to}", String(next.to))
            .replace("{total}", String(next.total))}`
        : undefined,
      why: c.wordsWhy,
      cta: c.startWords,
      waitLabel: "",
    },
    story: {
      n: 2,
      state: states.story,
      skill: c.skillStory,
      Icon: BookOpenText,
      href: storyLesson ? `/learn/stories/${storyLesson.id}` : "/learn/stories",
      image: storyLesson?.illustrationUrl,
      band: <BookOpenText className="size-10" aria-hidden="true" />,
      eyebrow: c.storyEyebrow,
      title: storyLesson ? storyLesson.title : c.storyNone,
      sub: storyLesson ? (storyLesson.supportTitle ?? storyLesson.title) : undefined,
      why: c.storyWhy,
      cta: c.startStory,
      waitLabel: c.comesAfter.replace("{step}", skills.words),
    },
    write: {
      n: 3,
      state: states.write,
      skill: c.skillWrite,
      Icon: Keyboard,
      href: writeLesson ? `/learn/normal/${writeLesson.id}` : "/learn/normal",
      image: writeLesson?.illustrationUrl,
      band: (
        <div
          className="bg-card text-foreground w-full rounded-xl px-3.5 py-3 font-mono text-sm"
          dir="ltr"
        >
          {writeLesson ? writeLesson.title : c.writeNone}
          <span className="bg-primary ms-px inline-block h-4 w-0.5 animate-pulse align-text-bottom motion-reduce:animate-none" />
        </div>
      ),
      eyebrow: c.writeEyebrow,
      title: writeLesson ? writeLesson.title : c.writeNone,
      sub: writeLesson ? (writeLesson.supportTitle ?? writeLesson.title) : undefined,
      why: c.writeWhy,
      cta: isResumed ? t.common.resumeLesson : c.startWrite,
      waitLabel: c.comesAfter.replace("{step}", skills.story),
    },
  };
  const current = PLAN_STEPS.find((step) => states[step] === "current");

  return (
    <section aria-label={c.planTitle} className="mb-10">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div dir={dir}>
          <h2 className="text-lg font-semibold tracking-tight">{c.planTitle}</h2>
          <p className="text-muted-foreground text-sm">{c.planSub}</p>
        </div>
        <span className="text-muted-foreground text-sm" dir="ltr">
          <b className="text-foreground text-base">{doneCount}</b> / 3
        </span>
      </div>

      {doneCount === 3 && (
        <div className="border-success/40 bg-success/5 mb-4 flex items-center gap-3 rounded-2xl border px-4 py-3">
          <CheckCircle2 className="text-success size-5 shrink-0" aria-hidden="true" />
          <div dir={dir}>
            <p className="text-sm font-semibold">{c.allDoneTitle}</p>
            <p className="text-muted-foreground text-sm">{c.allDoneBody}</p>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center" dir={dir}>
        {PLAN_STEPS.map((step, index) => (
          <span key={step} className="contents">
            <span
              className={cn(
                "flex items-center gap-2 text-xs font-bold whitespace-nowrap",
                states[step] === "todo" && "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full border-2 text-xs",
                  states[step] === "done" && "border-primary bg-primary text-primary-foreground",
                  states[step] === "current" && "border-primary bg-brand-muted text-primary",
                  states[step] === "todo" && "border-border bg-card",
                )}
              >
                {states[step] === "done" ? (
                  <Check className="size-3.5" aria-hidden="true" />
                ) : (
                  index + 1
                )}
              </span>
              {skills[step]}
            </span>
            {index < PLAN_STEPS.length - 1 && (
              <span
                className={cn(
                  "mx-2.5 h-[3px] min-w-3.5 flex-1 rounded-full",
                  done[step] ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </span>
        ))}
      </div>

      {current ? (
        <div className="grid gap-3.5 md:grid-cols-5">
          <MainCard
            view={views[current]}
            startHere={c.startHere}
            dir={dir}
            className="md:col-span-3"
          />
          <div className="flex flex-col gap-3.5 md:col-span-2">
            {PLAN_STEPS.filter((step) => step !== current).map((step) => (
              <SideRow key={step} view={views[step]} doneLabel={c.doneToday} dir={dir} />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-3.5 md:grid-cols-3">
          {PLAN_STEPS.map((step) => (
            <SideRow key={step} view={views[step]} doneLabel={c.doneToday} dir={dir} />
          ))}
        </div>
      )}
    </section>
  );
}
