"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  BookOpenText,
  Check,
  CheckCircle2,
  Info,
  Keyboard,
  Library,
  ListChecks,
  Repeat,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { useSharedProgress } from "@/components/providers/progress-provider";
import { buttonVariants } from "@/components/ui/button";
import { useCurrentLesson } from "@/hooks/use-current-lesson";
import { planCopy } from "@/lib/home-plan/copy";
import {
  WORDS_PER_DAY,
  cefrForLevel,
  levelCount,
  stepStates,
  summarizeLevel,
} from "@/lib/home-plan/plan";
import type { PlanStep, StepState, Track } from "@/lib/home-plan/plan";
import type { HomePlanWords } from "@/lib/home-plan/words";
import { difficultyForLevel, tierLabel, tierSupportLabel } from "@/lib/levels";
import { findCurrentLesson, getCurrentLevel } from "@/lib/progress/level";
import { todayLocalISODate } from "@/lib/progress/streak";
import { cn } from "@/lib/utils";
import type { LearningMode, LessonUnit } from "@/types/content";

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
 * One step of the day. The card keeps the Home card language (border, rounded-2xl, image band,
 * the same springy lift on hover); only the current step carries the button. On a phone every
 * other step folds into one line so a single thing is left to do.
 */
function StepCard({
  n,
  state,
  skill,
  Icon,
  href,
  image,
  band,
  eyebrow,
  title,
  sub,
  why,
  cta,
  doneLabel,
  waitLabel,
  dir,
}: {
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
  doneLabel: string;
  waitLabel: string;
  dir: "rtl" | "ltr";
}) {
  const current = state === "current";
  return (
    <Link
      href={href}
      className={cn(
        "group border-border bg-card focus-visible:ring-ring focus-visible:ring-offset-background relative flex flex-col overflow-hidden rounded-2xl border transition-[scale,translate,box-shadow] duration-[380ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] outline-none hover:shadow-[0_22px_40px_-12px_rgba(0,0,0,0.5)] focus-visible:ring-2 focus-visible:ring-offset-2 motion-safe:hover:-translate-y-2 motion-safe:hover:scale-[1.05]",
        current && "border-primary/60",
        !current && "max-md:flex-row max-md:items-center max-md:gap-3 max-md:p-3",
      )}
    >
      <div
        className={cn(
          "bg-brand-muted text-primary relative flex min-h-32 shrink-0 items-center justify-center overflow-hidden px-3 pt-11 pb-3",
          !current && "max-md:hidden",
        )}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin-provided Supabase Storage URL, same choice as HomeHero's stories card.
          <img
            src={image}
            alt=""
            className={cn(
              "absolute inset-0 size-full object-cover",
              state === "done" && "opacity-60",
            )}
          />
        ) : (
          <div
            className={cn(
              "flex w-full items-center justify-center",
              state === "done" && "opacity-60",
            )}
          >
            {band}
          </div>
        )}
        <StepBadge n={n} state={state} className="absolute start-2.5 top-2.5" />
        <span className="bg-card text-primary absolute end-2.5 top-2.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold">
          <Icon className="size-3.5" aria-hidden="true" />
          {skill}
        </span>
      </div>
      <StepBadge n={n} state={state} className={cn("md:hidden", current && "hidden")} />
      <div className={cn("flex flex-1 flex-col gap-0.5 p-4 pb-5", !current && "max-md:p-0")}>
        <p className="text-muted-foreground text-xs font-semibold" dir={dir}>
          {eyebrow}
        </p>
        <h3 className="text-lg font-semibold tracking-tight md:text-xl" dir="ltr">
          {title}
        </h3>
        {sub && (
          <p className="text-muted-foreground text-sm" dir={dir}>
            {sub}
          </p>
        )}
        <p
          className={cn("mt-2 flex items-start gap-1.5 text-xs", !current && "max-md:hidden")}
          dir={dir}
        >
          <Info className="text-primary mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {why}
        </p>
        <div className={cn("mt-auto pt-3", !current && "max-md:hidden")} dir={dir}>
          {state === "current" ? (
            <span className={cn(buttonVariants({ size: "lg" }), "w-full")}>{cta}</span>
          ) : state === "done" ? (
            <span className="text-success inline-flex items-center gap-1.5 text-xs font-bold">
              <Check className="size-3.5" aria-hidden="true" />
              {doneLabel}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs font-bold">{waitLabel}</span>
          )}
        </div>
      </div>
      <span
        className={cn(
          "text-primary ms-auto hidden items-center gap-1 text-xs font-bold",
          !current && "max-md:flex",
        )}
      >
        <Icon className="size-3.5" aria-hidden="true" />
        {skill}
      </span>
    </Link>
  );
}

function Ring({ ratio, Icon }: { ratio: number; Icon: LucideIcon }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  return (
    <span className="text-primary relative grid size-[52px] place-items-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 52 52" aria-hidden="true">
        <circle cx="26" cy="26" r={radius} fill="none" strokeWidth="5" className="stroke-border" />
        <circle
          cx="26"
          cy="26"
          r={radius}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={`${circumference * Math.min(1, ratio)} ${circumference}`}
        />
      </svg>
      <Icon className="size-[18px]" aria-hidden="true" />
    </span>
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
 * Home's "Today's plan" (admin preview): three steps in a fixed order — a few new words, a
 * story, a writing lesson — each saying which skill it trains, then a level card that measures
 * the same three tracks together, then the way out into every section. It replaces HomeHero
 * for admins only. Everything but the words comes from what Home already loaded; "done today"
 * for stories and lessons is read from the completions, for words from `words.learnedToday`.
 */
export function HomePlan({
  units,
  storiesUnits,
  words,
  reviewCount,
  isPremiumUser,
}: {
  units: LessonUnit[];
  storiesUnits: LessonUnit[];
  words: HomePlanWords | null;
  reviewCount: number;
  isPremiumUser: boolean;
}) {
  const { locale, t, dir } = useLocale();
  const c = planCopy(locale);
  const progress = useSharedProgress();
  const { isLoaded, getCompletedIds, startingLevel, completions } = progress;
  const { currentLesson, isResumed, completedIds } = useCurrentLesson(
    units,
    isPremiumUser,
    progress,
  );

  if (!isLoaded) {
    return (
      <div className="mb-10 flex flex-col gap-5" aria-hidden="true">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-muted h-64 animate-pulse rounded-2xl" />
          <div className="bg-muted h-24 animate-pulse rounded-2xl md:h-64" />
          <div className="bg-muted h-24 animate-pulse rounded-2xl md:h-64" />
        </div>
        <div className="bg-muted h-40 animate-pulse rounded-2xl" />
      </div>
    );
  }

  const today = todayLocalISODate();
  const storyIds = getCompletedIds("stories");
  const currentStory = findCurrentLesson(storiesUnits, storyIds, isPremiumUser, startingLevel);
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
  const doneCount = Object.values(done).filter(Boolean).length;
  const order: PlanStep[] = ["words", "story", "write"];
  const skills: Record<PlanStep, string> = {
    words: c.skillWords,
    story: c.skillStory,
    write: c.skillWrite,
  };

  // Level card: the learner's current level, measured on all three tracks.
  const level = getCurrentLevel(units, completedIds, startingLevel);
  const counts = {
    words: words?.byLevel[level] ?? { done: 0, total: 0 },
    stories: levelCount(storiesUnits, storyIds, level, isPremiumUser),
    lessons: levelCount(units, completedIds, level, isPremiumUser),
  };
  const summary = summarizeLevel(counts);
  const difficulty = difficultyForLevel(level);
  const tierName = locale ? tierSupportLabel(difficulty, locale) : tierLabel(difficulty).label;
  const trackName: Record<Track, string> = {
    words: c.weakWords,
    stories: c.weakStories,
    lessons: c.weakLessons,
  };
  const trackTip: Record<Track, string> = {
    words: c.tipWords,
    stories: c.tipStories,
    lessons: c.tipLessons,
  };
  const hint =
    summary.percent === 0 || !summary.weakest
      ? c.hintStart
      : `${c.hintWeak
          .replace("{track}", trackName[summary.weakest])
          .replace("{done}", String(counts[summary.weakest].done))
          .replace("{total}", String(counts[summary.weakest].total))} ${trackTip[summary.weakest]}`;

  const typingBand = (title: string) => (
    <div
      className="bg-card text-foreground w-full rounded-xl px-3.5 py-3 font-mono text-sm"
      dir="ltr"
    >
      {title}
      <span className="bg-primary ms-px inline-block h-4 w-0.5 animate-pulse align-text-bottom motion-reduce:animate-none" />
    </div>
  );

  const tiles: { href: string; Icon: LucideIcon; name: string; sub: string }[] = [
    { href: "/learn/word-lists", Icon: ListChecks, name: c.tileWords, sub: c.skillWords },
    { href: "/learn/stories", Icon: BookOpenText, name: c.tileStories, sub: c.skillStory },
    { href: "/learn/normal", Icon: Keyboard, name: c.tileLessons, sub: c.skillWrite },
    {
      href: "/learn/word-lists/review",
      Icon: Repeat,
      name: c.tileReview,
      sub: reviewCount > 0 ? c.reviewReady.replace("{n}", String(reviewCount)) : c.reviewNone,
    },
    { href: "/learn/library", Icon: Library, name: c.tileLibrary, sub: c.tileLibrarySub },
  ];

  return (
    <div className="mb-10 flex flex-col gap-6">
      <section aria-label={c.planTitle}>
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

        <div className="mb-4 flex items-center" dir={dir}>
          {order.map((step, index) => (
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
              {index < order.length - 1 && (
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

        <div className="grid gap-3.5 md:grid-cols-3">
          <StepCard
            n={1}
            state={states.words}
            skill={c.skillWords}
            Icon={ListChecks}
            href={
              next
                ? `/learn/word-lists/${next.groupId}${next.started ? "?scope=resume" : ""}`
                : "/learn/word-lists"
            }
            band={
              next ? (
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
              )
            }
            eyebrow={
              next
                ? `${c.wordsEyebrow.replace("{n}", String(WORDS_PER_DAY))}${
                    learnedToday > 0 && learnedToday < WORDS_PER_DAY
                      ? ` · ${c.wordsToday.replace("{n}", String(learnedToday)).replace("{total}", String(WORDS_PER_DAY))}`
                      : ""
                  }`
                : c.wordsDoneSub
            }
            title={next ? next.title : c.wordsDoneTitle}
            sub={
              next
                ? `${next.supportTitle} · ${c.wordsRange
                    .replace("{from}", String(next.from))
                    .replace("{to}", String(next.to))
                    .replace("{total}", String(next.total))}`
                : undefined
            }
            why={c.wordsWhy}
            cta={c.startWords}
            doneLabel={c.doneToday}
            waitLabel=""
            dir={dir}
          />
          <StepCard
            n={2}
            state={states.story}
            skill={c.skillStory}
            Icon={BookOpenText}
            href={storyLesson ? `/learn/stories/${storyLesson.id}` : "/learn/stories"}
            image={storyLesson?.illustrationUrl}
            band={<BookOpenText className="size-10" aria-hidden="true" />}
            eyebrow={c.storyEyebrow}
            title={storyLesson ? storyLesson.title : c.storyNone}
            sub={storyLesson ? (storyLesson.supportTitle ?? storyLesson.title) : undefined}
            why={c.storyWhy}
            cta={c.startStory}
            doneLabel={c.doneToday}
            waitLabel={c.comesAfter.replace("{step}", c.afterWords)}
            dir={dir}
          />
          <StepCard
            n={3}
            state={states.write}
            skill={c.skillWrite}
            Icon={Keyboard}
            href={writeLesson ? `/learn/normal/${writeLesson.id}` : "/learn/normal"}
            image={writeLesson?.illustrationUrl}
            band={typingBand(writeLesson ? writeLesson.title : c.writeNone)}
            eyebrow={c.writeEyebrow}
            title={writeLesson ? writeLesson.title : c.writeNone}
            sub={writeLesson ? (writeLesson.supportTitle ?? writeLesson.title) : undefined}
            why={c.writeWhy}
            cta={isResumed ? t.common.resumeLesson : c.startWrite}
            doneLabel={c.doneToday}
            waitLabel={c.comesAfter.replace("{step}", c.afterStory)}
            dir={dir}
          />
        </div>
      </section>

      <section
        aria-label={c.levelLabel}
        className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-4 sm:px-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div dir={dir}>
            <p className="text-muted-foreground text-xs font-bold tracking-wide">{c.levelLabel}</p>
            <h2 className="text-2xl font-semibold tracking-tight">
              {tierName}
              <span className="text-primary ms-2 text-sm" dir="ltr">
                {cefrForLevel(level)}
              </span>
            </h2>
            <p className="text-muted-foreground text-sm">
              {c.levelPercent.replace("{n}", String(summary.percent))}
            </p>
          </div>
          <div className="flex gap-5" dir={dir}>
            {(
              [
                ["words", ListChecks, c.ringWords],
                ["stories", BookOpenText, c.ringStory],
                ["lessons", Keyboard, c.ringWrite],
              ] as const
            ).map(([track, Icon, label]) => (
              <div
                key={track}
                className="text-muted-foreground flex min-w-14 flex-col items-center gap-0.5 text-xs"
              >
                <Ring
                  ratio={counts[track].total > 0 ? counts[track].done / counts[track].total : 0}
                  Icon={Icon}
                />
                <b className="text-foreground text-[13px]" dir="ltr">
                  {counts[track].done} / {counts[track].total}
                </b>
                {label}
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5" dir={dir}>
          {[1, 2, 3].map((zone) => (
            <div
              key={zone}
              className={cn(
                "text-xs font-bold",
                zone === level ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span className="bg-muted border-border mb-1 block h-2 overflow-hidden rounded-full border">
                <i
                  className="bg-primary block h-full"
                  style={{
                    width: `${zone < level ? 100 : zone === level ? summary.percent : 0}%`,
                  }}
                />
              </span>
              <span dir="ltr">{cefrForLevel(zone)}</span>
            </div>
          ))}
        </div>
        <p
          className="bg-muted text-muted-foreground flex items-start gap-2 rounded-xl px-3 py-2 text-sm"
          dir={dir}
        >
          <Sparkles className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {hint}
        </p>
      </section>

      <section aria-label={c.exploreTitle}>
        <div dir={dir} className="mb-3">
          <h2 className="text-base font-semibold tracking-tight">{c.exploreTitle}</h2>
          <p className="text-muted-foreground text-sm">{c.exploreSub}</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
          {tiles.map(({ href, Icon, name, sub }) => (
            <Link
              key={href}
              href={href}
              className="border-border bg-card hover:border-primary/50 focus-visible:ring-ring focus-visible:ring-offset-background flex min-w-0 items-center gap-2.5 rounded-2xl border p-3 outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <span className="bg-brand-muted text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
                <Icon className="size-[18px]" aria-hidden="true" />
              </span>
              <span className="min-w-0" dir={dir}>
                <b className="block truncate text-[13px] leading-tight">{name}</b>
                <span className="text-muted-foreground block truncate text-xs">{sub}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
