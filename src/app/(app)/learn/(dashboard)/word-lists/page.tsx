import type { Metadata } from "next";

import { WordListsLibrary } from "@/components/app/word-lists-library";
import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getLocale } from "@/lib/i18n/get-locale";
import { fetchWeakWordsAction } from "@/lib/weak-words/actions";
import { getWordGroupSummaries } from "@/lib/word-lists";

// Same reasoning as /learn/[mode] and /learn/stories: premium access is
// cookie/session-derived, so this page must never be statically cached —
// see src/app/learn/[mode]/page.tsx's doc comment for the specific bug
// this guards against.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Word Lists" };

export default async function WordListsPage() {
  const locale = await getLocale();
  const [groups, hasPremium, isAdminUser, weakWords] = await Promise.all([
    getWordGroupSummaries(locale ?? undefined),
    hasPremiumAccess(),
    isAdmin(),
    fetchWeakWordsAction(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <WordListsLibrary
        groups={groups}
        isPremiumUser={hasPremium || isAdminUser}
        weakWords={weakWords}
      />
    </div>
  );
}
