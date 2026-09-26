import type { Metadata } from "next";

import { LibraryMobileTabs } from "@/components/app/library-mobile-tabs";
import { NovelsHome } from "@/components/app/novels-home";
import { fetchMonthlyReadingChallengeAction } from "@/lib/book-progress/actions";
import {
  fetchAllNovels,
  fetchCompletedBooks,
  fetchContinueReadingBooks,
  fetchFeaturedBooks,
} from "@/lib/supabase/queries/library";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getLocale } from "@/lib/i18n/get-locale";
import { createPublicClient } from "@/lib/supabase/public-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// Same reasoning as the Library homepage this route sits beside: live
// admin-authored content must never be statically cached at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Novels" };

export default async function NovelsHomePage() {
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);
  // One shared client for every query this page fires — see library.ts's
  // fetchCategories doc comment for why a separate createPublicClient() per
  // query must be avoided within one request.
  const supabase = isSupabaseConfigured() ? createPublicClient() : undefined;
  const [novels, featuredNovels, continueReading, completedNovels, monthlyChallenge] =
    await Promise.all([
      fetchAllNovels(supabase, locale),
      fetchFeaturedBooks(supabase, locale, "novel"),
      fetchContinueReadingBooks(user?.id ?? null, supabase, "novel"),
      fetchCompletedBooks(user?.id ?? null, supabase, "novel"),
      fetchMonthlyReadingChallengeAction(),
    ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <LibraryMobileTabs active="novels" className="mb-6" />
      <NovelsHome
        novels={novels}
        featuredNovels={featuredNovels}
        continueReading={continueReading}
        completedNovels={completedNovels}
        monthlyChallenge={monthlyChallenge}
      />
    </div>
  );
}
