import type { Metadata } from "next";

import { ReportProblemButton } from "@/components/app/report-problem-button";
import { StoriesLibrary } from "@/components/app/stories-library";
import { StoriesMobileTabs } from "@/components/app/stories-mobile-tabs";
import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getLessonSummaries } from "@/lib/content";
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
  const [lessons, hasPremium, isAdminUser, recallCount, user] = await Promise.all([
    getLessonSummaries("stories", locale ?? undefined),
    hasPremiumAccess(),
    isAdmin(),
    fetchVocabularyRecallCountAction("stories"),
    getCurrentUser(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
      <StoriesMobileTabs active="simplified" className="mb-6" />
      <StoriesLibrary
        lessons={lessons}
        isPremiumUser={hasPremium || isAdminUser}
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
