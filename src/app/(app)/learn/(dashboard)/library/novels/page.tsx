import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NovelsHome } from "@/components/app/novels-home";
import { isAdmin } from "@/lib/admin/access";
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
  // Novels is admin-only while the catalog is still being written and
  // reviewed as drafts — same rollout pattern Stories used while it was
  // being rebuilt (see stories/page.tsx). Checked first, before any of this
  // page's other queries run, so a regular learner never pays for them.
  const isAdminUser = await isAdmin();
  if (!isAdminUser) redirect("/learn/library");

  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);
  // One shared client for every query this page fires — see library.ts's
  // fetchCategories doc comment for why a separate createPublicClient() per
  // query must be avoided within one request.
  const supabase = isSupabaseConfigured() ? createPublicClient() : undefined;
  const [novels, featuredNovels, continueReading, completedNovels] = await Promise.all([
    fetchAllNovels(supabase, locale),
    fetchFeaturedBooks(supabase, locale, "novel"),
    fetchContinueReadingBooks(user?.id ?? null, supabase, "novel"),
    fetchCompletedBooks(user?.id ?? null, supabase, "novel"),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <NovelsHome
        novels={novels}
        featuredNovels={featuredNovels}
        continueReading={continueReading}
        completedNovels={completedNovels}
      />
    </div>
  );
}
