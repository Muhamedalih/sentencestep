"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  MessagesSquare,
} from "lucide-react";

import { LessonIllustration } from "@/components/learning/lesson-illustration";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/components/providers/locale-provider";
import { getLessonsByLevel, getUnits, withOpeningLessonPlacement } from "@/lib/content-helpers";
import { useProgress } from "@/hooks/use-progress";
import {
  difficultyForLevel,
  estimateMinutes,
  tierSupportLabel,
  type Difficulty,
} from "@/lib/levels";
import { fadeInUp, staggerChildren } from "@/lib/motion";
import { findCurrentLesson, getCurrentLevel } from "@/lib/progress/level";
import { modeMeta } from "@/lib/learning-modes";
import { cn } from "@/lib/utils";
import type { Lesson, LearningMode, LessonUnit, Unit } from "@/types/content";

/** How many lessons a level page shows at once — Ordinary Lessons/Stories/Conversation catalog redesign (bigger, image-led cards need real pagination instead of one long scroll). */
const LESSONS_PER_PAGE = 4;

/** Subtle, distinct color per difficulty tier — deliberately not just three shades of the same accent, so a learner scanning several level sections can tell them apart at a glance without reading the label. `success` reuses the app's own theme-aware green token; intermediate/advanced use the same low-opacity-fill + colored-border language on plain palette colors, since no dedicated "info"/"advanced" token exists yet. */
const TIER_BADGE_CLASS: Record<Difficulty, string> = {
  beginner: "bg-success/10 text-success border-success/25",
  intermediate: "bg-sky-500/10 text-sky-500 border-sky-500/25",
  advanced: "bg-violet-500/10 text-violet-500 border-violet-500/25",
};

/** The colored dot alone, kept legible on a photo where the tinted-fill pill above isn't (see TierBadge's `onImage` variant). */
const TIER_DOT_CLASS: Record<Difficulty, string> = {
  beginner: "bg-success",
  intermediate: "bg-sky-500",
  advanced: "bg-violet-500",
};

function TierBadge({
  difficulty,
  label,
  onImage = false,
}: {
  difficulty: Difficulty;
  label: string;
  /** Same translucent-dark-pill treatment as StoryCard/BookCard's own overlay chips, for when this badge sits on top of a photo instead of the card's own background. */
  onImage?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        onImage
          ? "border-white/15 bg-black/40 text-white backdrop-blur-sm"
          : TIER_BADGE_CLASS[difficulty],
      )}
    >
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          onImage ? TIER_DOT_CLASS[difficulty] : "bg-current",
        )}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

function LessonCard({
  mode,
  lesson,
  number,
  completed,
  isCurrent,
  isPremiumUser,
}: {
  mode: LearningMode;
  lesson: Lesson;
  number: number;
  completed: boolean;
  isCurrent: boolean;
  isPremiumUser: boolean;
}) {
  const { t, dir, locale } = useLocale();
  const locked = !lesson.isFree && !isPremiumUser;
  const difficulty = difficultyForLevel(lesson.level);
  const difficultyLabel = locale ? tierSupportLabel(difficulty, locale) : "";
  // Never falls back to lesson.description (English) under a support-
  // language dir — see typing-sentence.tsx's identical supportText pattern.
  // Absent (not shown) rather than a mismatched-direction English fallback.
  const supportTitle = lesson.supportTitle ?? lesson.title;

  // Poster tile — same visual language as StoryCard/BookCard (see their doc
  // comments): the illustration fills the whole tile, with title/subtitle
  // sitting directly on it over a bottom gradient, rather than the old
  // "photo up top, text block below" layout. showScene={false} for the same
  // reason StoryCard sets it: at grid-thumbnail size the hand-drawn scene
  // reads as a meaningless dark blob, so every card gets the plain gradient
  // face instead. The two description paragraphs the old layout stacked
  // below the image are dropped rather than fit into the overlay — StoryCard
  // (same Lesson type, same optional fields) already established that a
  // title + subtitle is enough for a browsing-grid card; the full text is
  // one tap away on the lesson screen itself.
  return (
    <motion.div variants={fadeInUp} className="group h-full">
      <Link
        href={`/learn/${mode}/${lesson.id}`}
        aria-label={
          locked ? t.premium.lockedContentAriaLabel.replace("{title}", lesson.title) : lesson.title
        }
        className="focus-visible:ring-ring focus-visible:ring-offset-background block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        <div
          className={cn(
            "border-border/60 relative aspect-[4/3] w-full overflow-hidden rounded-2xl border shadow-sm transition-all duration-300",
            locked
              ? "opacity-90"
              : "hover:shadow-xl hover:shadow-black/25 motion-safe:group-hover:-translate-y-1",
            isCurrent && "ring-primary ring-2 ring-offset-2",
          )}
        >
          <LessonIllustration
            mode={mode}
            lessonId={lesson.id}
            title={lesson.title}
            illustrationUrl={lesson.illustrationUrl}
            showScene={false}
            className="absolute inset-0 aspect-[4/3] h-full w-full transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
          />

          {/* Fixed dark overlays, not theme tokens — same reasoning as
              StoryCard/BookCard: legible over any illustration/photo in
              either site theme. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/45 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
          />

          <span
            className="bg-background/90 text-foreground absolute start-3 top-3 flex size-7 items-center justify-center rounded-full text-xs font-bold tabular-nums backdrop-blur-sm"
            dir="ltr"
          >
            {number}
          </span>

          {(completed || locked) && (
            <span
              aria-hidden="true"
              className={cn(
                "absolute end-3 top-3 flex size-8 items-center justify-center rounded-full shadow-sm",
                completed
                  ? "bg-success text-success-foreground"
                  : "border border-white/15 bg-black/40 text-white backdrop-blur-sm",
              )}
            >
              {completed ? <Check className="size-4" /> : <Lock className="size-3.5" />}
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <TierBadge difficulty={difficulty} label={difficultyLabel} onImage />
              {isCurrent && <Badge className="shrink-0">{t.progress.continueMode}</Badge>}
            </div>
            {(mode === "stories" || mode === "conversation") && (
              <span className="inline-flex w-fit items-center gap-1 text-xs font-medium text-white/70">
                {mode === "stories" ? (
                  <>
                    <Clock className="size-3" aria-hidden="true" />~{estimateMinutes(lesson)} min
                  </>
                ) : (
                  <>
                    <MessagesSquare className="size-3" aria-hidden="true" />
                    {t.lesson.lineCount.replace("{n}", String(lesson.sentences.length))}
                  </>
                )}
              </span>
            )}
            <h3 className="truncate leading-snug font-semibold text-white" dir="ltr">
              {lesson.title}
            </h3>
            <p className="truncate text-sm text-white/70" dir={dir}>
              {supportTitle}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function LevelPagination({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const { t } = useLocale();
  if (totalPages <= 1) return null;

  // Plain, non-mirrored chevrons — this app's chrome direction is always
  // ltr regardless of the active support locale (see locales.ts's dirFor),
  // so "previous" is unconditionally the left-pointing icon, matching every
  // other left/right control in this app (no rtl: swapping needed or used
  // elsewhere).
  return (
    <div className="mt-5 flex items-center justify-center gap-3">
      <Button
        variant="outline"
        size="icon-sm"
        onClick={onPrev}
        disabled={page === 0}
        aria-label={t.library.previousPage}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </Button>
      <span className="text-muted-foreground text-xs font-medium tabular-nums" dir="ltr">
        {page + 1} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={onNext}
        disabled={page === totalPages - 1}
        aria-label={t.library.nextPage}
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}

function UnitSection({
  mode,
  unit,
  lessons,
  isCompleted,
  isLoaded,
  currentLessonId,
  isPremiumUser,
}: {
  mode: LearningMode;
  unit: Pick<
    Unit,
    "title" | "titleAr" | "titleEs" | "description" | "descriptionAr" | "descriptionEs" | "level"
  >;
  lessons: LessonUnit[];
  isCompleted: (mode: LearningMode, id: string) => boolean;
  isLoaded: boolean;
  currentLessonId: string | undefined;
  isPremiumUser: boolean;
}) {
  const { locale, dir } = useLocale();
  const [page, setPage] = useState(0);
  if (lessons.length === 0) return null;

  const completedCount = isLoaded
    ? lessons.filter((lesson) => isCompleted(mode, lesson.id)).length
    : 0;
  const tierText = locale ? tierSupportLabel(difficultyForLevel(unit.level), locale) : "";
  const unitDescription =
    locale === "es" ? unit.descriptionEs : locale === "ar" ? unit.descriptionAr : unit.description;

  const totalPages = Math.max(1, Math.ceil(lessons.length / LESSONS_PER_PAGE));
  const pageLessons = lessons.slice(
    page * LESSONS_PER_PAGE,
    page * LESSONS_PER_PAGE + LESSONS_PER_PAGE,
  );

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold tracking-tight">{unit.title}</h2>
            <TierBadge difficulty={difficultyForLevel(unit.level)} label={tierText} />
          </div>
          <p className="text-muted-foreground text-sm" dir={dir}>
            {unitDescription}
          </p>
        </div>
        {/* dir="ltr": these are three separate JSX text nodes (the two
            numbers and the literal " / "), unlike completeCount above which
            is one pre-formatted string — under an RTL ambient direction,
            the bidi algorithm reorders separate adjacent text nodes and was
            visually showing "4 / 3" for a real 3-of-4 count. */}
        <span className="text-muted-foreground shrink-0 text-xs font-medium" dir="ltr">
          {completedCount} / {lessons.length}
        </span>
      </div>

      <motion.div
        key={page}
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="grid gap-4 sm:grid-cols-2"
      >
        {pageLessons.map((lesson, index) => (
          <LessonCard
            key={lesson.id}
            mode={mode}
            lesson={lesson as Lesson}
            number={page * LESSONS_PER_PAGE + index + 1}
            completed={isLoaded && isCompleted(mode, lesson.id)}
            isCurrent={lesson.id === currentLessonId}
            isPremiumUser={isPremiumUser}
          />
        ))}
      </motion.div>

      <LevelPagination
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(0, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
      />
    </section>
  );
}

export function LessonListView({
  mode,
  title,
  description,
  units: rawUnits,
  isPremiumUser,
  levelNames = {},
}: {
  mode: LearningMode;
  title: string;
  description: string;
  units: LessonUnit[];
  isPremiumUser: boolean;
  /** Admin-authored names (via /admin/levels) for any level beyond the three static units in src/data/units.ts. */
  levelNames?: Record<number, { title: string; titleAr: string; supportTitle?: string }>;
}) {
  const { t } = useLocale();
  const { isCompleted, getCompletedIds, isLoaded, startingLevel } = useProgress();

  const units = withOpeningLessonPlacement(rawUnits);
  const courseUnits = getUnits(mode);
  const completedIds = isLoaded ? getCompletedIds(mode) : [];
  const currentLessonId = findCurrentLesson(units, completedIds, isPremiumUser, startingLevel)?.id;
  const currentLevel = getCurrentLevel(units, completedIds, startingLevel);
  const currentUnit = courseUnits.find((unit) => unit.level === currentLevel);
  const overallPercent =
    units.length === 0 ? 0 : Math.round((completedIds.length / units.length) * 100);

  const coveredLevels = new Set(courseUnits.map((unit) => unit.level));
  const uncoveredLessons = units.filter((lesson) => !coveredLevels.has(lesson.level));
  const uncoveredLevels = Array.from(new Set(uncoveredLessons.map((lesson) => lesson.level))).sort(
    (a, b) => a - b,
  );

  const ModeIcon = modeMeta[mode].icon;

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        {/* Same icon-in-a-colored-circle language as this file's own empty
            state below and NotConfiguredNotice — a plain text heading read
            as flat/unfinished next to the rest of the app's branded
            section headers (professional-title pass). */}
        <div className="bg-brand-muted text-primary flex size-14 shrink-0 items-center justify-center rounded-2xl">
          <ModeIcon className="size-7" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="text-muted-foreground mt-1 text-lg">{description}</p>
        </div>
      </div>

      {units.length > 0 &&
        (isLoaded ? (
          <div className="mb-10 flex flex-col gap-2">
            <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm font-medium">
              <span>
                {completedIds.length > 0 && currentUnit
                  ? t.lesson.youAreOn.replace("{unit}", currentUnit.title)
                  : t.lesson.readyToStart}
              </span>
              <span>
                {t.lesson.completeCount
                  .replace("{completed}", String(completedIds.length))
                  .replace("{total}", String(units.length))}
              </span>
            </div>
            <Progress value={overallPercent} />
          </div>
        ) : (
          // Progress hasn't loaded yet — a neutral pulse rather than a
          // flash of "Ready to start" / 0% that misrepresents a returning
          // learner's real progress for the instant it takes to load.
          <div className="mb-10 flex flex-col gap-2" aria-hidden="true">
            <div className="bg-muted h-5 w-40 animate-pulse rounded" />
            <div className="bg-muted h-2 w-full animate-pulse rounded-full" />
          </div>
        ))}

      {units.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="bg-brand-muted text-primary flex size-14 items-center justify-center rounded-full">
            <BookOpen className="size-7" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium">{t.lesson.noLessonsYet}</p>
            <p className="text-muted-foreground mt-1 text-sm">{t.lesson.noLessonsYetBody}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {courseUnits.map((unit) => (
            <UnitSection
              key={unit.id}
              mode={mode}
              unit={unit}
              lessons={getLessonsByLevel(units, unit.level)}
              isCompleted={isCompleted}
              isLoaded={isLoaded}
              currentLessonId={currentLessonId}
              isPremiumUser={isPremiumUser}
            />
          ))}
          {uncoveredLevels.map((level) => {
            const name = levelNames[level];
            return (
              <UnitSection
                key={`uncovered-level-${level}`}
                mode={mode}
                unit={{
                  // Admin-created levels (via /admin/levels) beyond the 3
                  // static units have no description field in the schema at
                  // all — an empty string here renders nothing, exactly like
                  // src/data/units.ts's own units would if theirs were empty.
                  // UnitSection only ever displays `title` in English and
                  // resolves the *description* per-locale (titleAr/titleEs
                  // are required by its prop type but not currently
                  // rendered) — supportTitle is already resolved against
                  // whichever locale is active, so it's put in the matching
                  // slot; the other slot is left empty since it's genuinely
                  // unknown for this locale until a refetch.
                  title: name?.title ?? t.lesson.level.replace("{n}", String(level)),
                  titleAr: name?.titleAr ?? "",
                  titleEs: name?.supportTitle ?? "",
                  description: "",
                  descriptionAr: "",
                  descriptionEs: "",
                  level,
                }}
                lessons={getLessonsByLevel(uncoveredLessons, level)}
                isCompleted={isCompleted}
                isLoaded={isLoaded}
                currentLessonId={currentLessonId}
                isPremiumUser={isPremiumUser}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
