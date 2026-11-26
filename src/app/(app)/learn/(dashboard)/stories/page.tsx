import { getLearnLanguage } from "@/lib/learn-language-server";
import type { Metadata } from "next";

import { ReportProblemButton } from "@/components/app/report-problem-button";
import { StoriesLibrary } from "@/components/app/stories-library";
import { StoriesMobileTabs } from "@/components/app/stories-mobile-tabs";
import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getDraftLessonSummaries, getLessonSummaries } from "@/lib/content";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { isLearnerViewOn } from "@/lib/hybrid/learner-view";
import { viewerTaste } from "@/lib/hybrid/viewer";
import { getLocale } from "@/lib/i18n/get-locale";
import { fetchProgressCached } from "@/lib/progress/cached";
import { todayLocalISODate } from "@/lib/progress/streak";
import { getCurrentUser } from "@/lib/supabase/auth";
import { cn } from "@/lib/utils";
import { fetchVocabularyRecallCountAction } from "@/lib/vocabulary-recall/actions";
import { loadLessonWords } from "@/lib/word-bank/lesson-words";
import { readinessByLesson } from "@/lib/word-bank/readiness";

// Same reasoning as the generic [mode]/page.tsx this route sits beside: live
// admin-authored content and the viewer's real premium status must never be
// statically cached at build time — see that file's doc comment.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Stories" };

export default async function StoriesLibraryPage() {
  // On a phone with the mobilePath permission the Daily Lessons are on the Path, so the switch to them is left out.
  const phoneRollouts = (await getEffectiveFeatures()).rollouts;
  const mobilePath = phoneRollouts.mobilePath;
  const locale = await getLocale();
  // Cards only — the story grid never reads a sentence, so don't load them
  // (see getLessonSummaries). The lesson page fetches the real body on open.
  const [lessons, hasPremium, isAdminUser, recallCount, user, features, learnerView] =
    await Promise.all([
      getLessonSummaries("stories", locale ?? undefined),
      hasPremiumAccess(),
      isAdmin(),
      fetchVocabularyRecallCountAction("stories"),
      getCurrentUser(),
      getEffectiveFeatures(),
      isLearnerViewOn(),
    ]);
  // An admin who asked for the learner's view (see lib/hybrid/learner-view.ts) sees the locks.
  const isPremiumUser = hasPremium || (isAdminUser && !learnerView);
  // An admin also sees the stories that are still drafts (the Expert level while it is being narrated),
  // so they can be opened and tried in the real list before they are published. Learners, and an admin
  // who switched to the learner's view, never get this: the drafts come from an uncached, session-aware read.
  // In German (permission germanTrack, an admin's choice) the list is the German stories instead,
  // which are all drafts for now: the English ones are left out.
  const language = await getLearnLanguage();
  const draftLessons =
    language === "de" || (isAdminUser && !learnerView)
      ? await getDraftLessonSummaries("stories", locale ?? undefined, language).catch(() => [])
      : [];
  // A German story (id "de-<english id>") wears the drawing of its English twin: copied, nothing new is drawn.
  const coverTitles: Record<string, string> = {};
  if (language === "de") {
    const englishDrafts = await getDraftLessonSummaries("stories", locale ?? undefined, "en").catch(
      () => [],
    );
    const englishTitles = new Map(
      [...lessons, ...englishDrafts].map((lesson) => [lesson.id, lesson.title] as const),
    );
    for (const lesson of draftLessons) {
      const title = englishTitles.get(lesson.id.replace(/^de-/, ""));
      if (title) coverTitles[lesson.id] = title;
    }
  }
  const listedLessons =
    language === "de"
      ? draftLessons
      : draftLessons.length > 0
        ? [...lessons, ...draftLessons]
        : lessons;
  // The taste of the day (see lib/hybrid): a free learner's story for today is open in the grid too.
  const openTodayId =
    user && features.rollouts.hybridOffers && !isPremiumUser
      ? await viewerTaste({ userId: user.id, locale, withPassages: false, withStories: true }).then(
          ({ picks }) => (picks.storyIsTaste ? (picks.story?.id ?? null) : null),
        )
      : null;

  // For a learner the words bank («كلماتي») is open to: how much of each story they have typed before,
  // counted from the lessons they have finished (the layout already read those for this request) and an
  // index of every lesson's words that is kept for an hour for everyone. Empty until five are finished.
  const readiness =
    user && features.rollouts.wordBank
      ? await Promise.all([loadLessonWords(), fetchProgressCached(todayLocalISODate())])
          .then(([index, progress]) =>
            readinessByLesson(
              index,
              (progress?.completions ?? []).map((completion) => completion.lessonId),
            ),
          )
          .catch(() => ({}))
      : {};

  return (
    <div
      className={cn(
        "mx-auto max-w-7xl px-6 py-8 sm:py-10",
        phoneRollouts.mobilePhoneUx && "max-md:pt-4",
      )}
    >
      <StoriesMobileTabs active="simplified" className={mobilePath ? "hidden" : "mb-6"} />
      <StoriesLibrary
        lessons={listedLessons}
        isPremiumUser={isPremiumUser}
        openTodayId={openTodayId}
        recallCount={recallCount}
        readiness={readiness}
        coverTitles={coverTitles}
      />
      {/* The dashboard layout's floating pill covers this page on desktop
          already (max-sm:hidden) — this is only the mobile fallback, same
          pattern as Settings > Preferences. */}
      {user?.email && (
        <div className="mt-8 sm:hidden">
          <ReportProblemButton variant="inline" />
        </div>
      )}
    </div>
  );
}
