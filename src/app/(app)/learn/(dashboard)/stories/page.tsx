import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { StoriesLibrary } from "@/components/app/stories-library";
import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getLessons } from "@/lib/content";
import { getLocale } from "@/lib/i18n/get-locale";
import { fetchVocabularyRecallCountAction } from "@/lib/vocabulary-recall/actions";

// Same reasoning as the generic [mode]/page.tsx this route sits beside: live
// admin-authored content and the viewer's real premium status must never be
// statically cached at build time — see that file's doc comment.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Stories" };

export default async function StoriesLibraryPage() {
  // Stories is temporarily admin-only while it's being rebuilt — checked
  // first, before any of the page's other queries run, so a regular learner
  // never pays for the lessons/recall-count fetches below.
  const isAdminUser = await isAdmin();
  if (!isAdminUser) redirect("/learn");

  const locale = await getLocale();
  const [lessons, hasPremium, recallCount] = await Promise.all([
    getLessons("stories", locale ?? undefined),
    hasPremiumAccess(),
    fetchVocabularyRecallCountAction("stories"),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
      <StoriesLibrary
        lessons={lessons}
        isPremiumUser={hasPremium || isAdminUser}
        recallCount={recallCount}
      />
    </div>
  );
}
