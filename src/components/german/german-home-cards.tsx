import { Suspense } from "react";
import { cookies } from "next/headers";

import { cn } from "@/lib/utils";

import { CardSkeleton } from "@/components/app/home-engagement";
import type { LessonStatsMap } from "@/components/app/home-hero";
import { GermanSuggestedCard } from "@/components/german/suggested-card";
import { PassagesSectionCard } from "@/components/home-cards/section-cards";
import { StatsPanel } from "@/components/home-cards/stats-panel";
import { TasksBox } from "@/components/home-cards/tasks-box";
import { ProgressProvider } from "@/components/providers/progress-provider";
import { WordsBanner } from "@/components/words/words-banner";
import { getDraftLessonSummaries } from "@/lib/content";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { localISODateInTimeZone, TIMEZONE_COOKIE } from "@/lib/features/learner-date";
import { loadGermanToday } from "@/lib/today/german";
import type { ProgressState } from "@/lib/progress/types";
import { loadStreakCalendar } from "@/lib/features/home-engagement";
import { addDays } from "@/lib/features/streak-freeze";
import type { SupportLocale } from "@/lib/i18n/locales";
import { openablePassages } from "@/lib/passages/access";
import type { PassagesHomeData } from "@/lib/passages/home-card";
import { homeCardPick } from "@/lib/passages/progress";
import { fetchGermanPassageSummaries, fetchPassageProgress } from "@/lib/passages/queries";
import { fetchProgressCached } from "@/lib/progress/cached";
import { todayLocalISODate } from "@/lib/progress/streak";
import { fetchLessonSentenceStats } from "@/lib/supabase/queries/content";
import { getDictionary, fallbackDictionary } from "@/lib/i18n/dictionary";
import { getDraftWordGroupSummaries } from "@/lib/word-lists";
import type { CurrentUser } from "@/lib/supabase/auth";

/** The week strip looks back this many days, like the English Home's. */
const STRIP_LOOKBACK_DAYS = 6;

async function germanPassageCard(userId: string | null): Promise<PassagesHomeData | null> {
  try {
    const [summaries, progress] = await Promise.all([
      fetchGermanPassageSummaries(),
      userId ? fetchPassageProgress(userId) : Promise.resolve([]),
    ]);
    // The German track is Admins only for now, so every passage is open.
    const pick = homeCardPick(
      openablePassages(summaries, true),
      new Map(progress.map((entry) => [entry.passageId, entry])),
    );
    if (!pick) return null;
    const { passage } = pick;
    return {
      mode: pick.mode,
      sectionsDone: pick.sectionsDone,
      passage: {
        id: passage.id,
        order: passage.order,
        level: passage.level,
        tone: passage.tone,
        title: passage.title,
        titleAr: passage.titleAr,
        summary: passage.summary,
        summaryAr: passage.summaryAr,
        minutes: passage.estimatedMinutes,
        sectionCount: passage.sectionCount,
        posterUrl: passage.posterUrl,
      },
    };
  } catch (error) {
    console.error("[german-home] passage card failed", error);
    return null;
  }
}

async function PassagesSlot({ data }: { data: Promise<PassagesHomeData | null> }) {
  const resolved = await data;
  return resolved ? <PassagesSectionCard data={resolved} index={3} /> : null;
}

async function TasksSlot({
  user,
  todayISO,
  locale,
  timeZone,
  progress,
}: {
  user: CurrentUser | null;
  todayISO: string;
  locale: SupportLocale | null;
  timeZone: string | undefined;
  progress: ProgressState | undefined;
}) {
  if (!user) return null;
  const features = await getEffectiveFeatures();
  const [quests, streak] = await Promise.all([
    loadGermanToday({ userId: user.id, locale, timeZone, todayISO, progress }),
    loadStreakCalendar(
      user.id,
      addDays(todayISO, -STRIP_LOOKBACK_DAYS),
      todayISO,
      todayISO,
      features,
    ),
  ]);
  // The English Home's daily-tasks box, with the German track's three tasks (see lib/today/german.ts).
  // The streak is one habit for the whole account, so it is shared with English.
  return <TasksBox today={todayISO} quests={quests} streak={streak} />;
}

/**
 * Home for a learner of German (permission germanTrack, Admins only for now): the English Home's cards
 * page, rearranged — the week strip, then the words banner at the top beside the achievements panel,
 * then the Passages card beside a small keep-learning card (the next story or daily lesson, see
 * GermanSuggestedCard), and no Video card (German has no videos) — drawn with the German track's own
 * lessons, stories, passages and word lists. German content is separate
 * from English by id ("de-…"), so every count and the progress it reads is the German track's alone.
 */
export async function GermanHomeCards({
  user,
  locale,
}: {
  user: CurrentUser | null;
  locale: SupportLocale | null;
}) {
  const t = locale ? getDictionary(locale) : fallbackDictionary;
  const timeZone = (await cookies()).get(TIMEZONE_COOKIE)?.value;
  const todayISO = localISODateInTimeZone(timeZone) ?? todayLocalISODate();
  const calm = (await getEffectiveFeatures()).rollouts.homeCalm;
  const passages = germanPassageCard(user?.id ?? null);
  const [units, storiesUnits, groups, initialProgress] = await Promise.all([
    getDraftLessonSummaries("normal", locale ?? undefined, "de").catch(() => []),
    getDraftLessonSummaries("stories", locale ?? undefined, "de").catch(() => []),
    getDraftWordGroupSummaries(locale ?? undefined, "de"),
    user ? fetchProgressCached(todayLocalISODate()).catch(() => undefined) : undefined,
  ]);
  const counts = await fetchLessonSentenceStats([...units, ...storiesUnits].map((unit) => unit.id));
  const lessonStats: LessonStatsMap = {};
  for (const unit of [...units, ...storiesUnits]) {
    lessonStats[`${unit.mode}:${unit.id}`] = counts.get(unit.id) ?? { sentences: 0, words: 0 };
  }

  return (
    <ProgressProvider initialProgress={initialProgress}>
      <h1 className="sr-only">{t.nav.home}</h1>
      <div
        className={cn(
          "mx-auto max-w-5xl px-6 pt-4 pb-12 sm:pt-6 sm:pb-16 xl:max-w-7xl",
          calm && "max-w-7xl pt-3 sm:pt-3",
        )}
        data-calm-home={calm ? "" : undefined}
      >
        <div className="hc-rise">
          <Suspense fallback={<CardSkeleton feature="strip" className="xl:h-[4.4rem]" />}>
            <TasksSlot
              user={user}
              todayISO={todayISO}
              locale={locale}
              timeZone={timeZone}
              progress={initialProgress}
            />
          </Suspense>
        </div>
        {!calm && (
          <div className="mt-4 mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <h2 className="text-lg font-semibold tracking-tight">{t.progress.upNextLabel}</h2>
          </div>
        )}
        <div
          className={cn("grid gap-4 lg:grid-cols-[minmax(0,1fr)_20.75rem]", calm && "mt-5 gap-y-4")}
        >
          <WordsBanner
            groups={groups}
            isPremiumUser
            reviewCount={0}
            reviewHref="/learn/word-lists/review"
            className="min-w-0 xl:h-[19.75rem] xl:min-h-0"
          />
          <StatsPanel lessonStats={lessonStats} sessionCount={null} videosFinished={null} />
        </div>
        <div className="mt-4 flex flex-wrap gap-4 empty:hidden">
          <Suspense
            fallback={
              <CardSkeleton feature="passages" className="min-h-[13.75rem] flex-1 basis-[20rem]" />
            }
          >
            <PassagesSlot data={passages} />
          </Suspense>
          <GermanSuggestedCard units={units} storiesUnits={storiesUnits} />
        </div>
      </div>
    </ProgressProvider>
  );
}
