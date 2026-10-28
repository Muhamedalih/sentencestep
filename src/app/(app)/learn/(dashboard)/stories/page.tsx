import type { Metadata } from "next";

import { ReportProblemButton } from "@/components/app/report-problem-button";
import { StoriesLibrary } from "@/components/app/stories-library";
import { StoriesMobileTabs } from "@/components/app/stories-mobile-tabs";
import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getLessonSummaries } from "@/lib/content";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { isLearnerViewOn } from "@/lib/hybrid/learner-view";
import { viewerTaste } from "@/lib/hybrid/viewer";
import { getLocale } from "@/lib/i18n/get-locale";
import { getCurrentUser } from "@/lib/supabase/auth";
import { fetchVocabularyRecallCountAction } from "@/lib/vocabulary-recall/actions";

// Same reasoning as the generic [mode]/page.tsx this route sits beside: live
// admin-authored content and the viewer's real premium status must never be
// statically cached at build time — see that file's doc comment.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Stories" };

export default async function StoriesLibraryPage() {
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
  // The taste of the day (see lib/hybrid): a free learner's story for today is open in the grid too.
  const openTodayId =
    user && features.rollouts.hybridOffers && !isPremiumUser
      ? await viewerTaste({ userId: user.id, locale, withPassages: false, withStories: true }).then(
          ({ picks }) => (picks.storyIsTaste ? (picks.story?.id ?? null) : null),
        )
      : null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
      <StoriesMobileTabs active="simplified" className="mb-6" />
      <StoriesLibrary
        lessons={lessons}
        isPremiumUser={isPremiumUser}
        openTodayId={openTodayId}
        recallCount={recallCount}
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
