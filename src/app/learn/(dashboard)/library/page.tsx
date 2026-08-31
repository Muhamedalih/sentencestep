import type { Metadata } from "next";

import { LibraryHome } from "@/components/app/library-home";
import {
  fetchCategoriesWithBooks,
  fetchContinueReadingBooks,
  fetchFeaturedBooks,
} from "@/lib/supabase/queries/library";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getLocale } from "@/lib/i18n/get-locale";
import { createPublicClient } from "@/lib/supabase/public-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// Same reasoning as the Stories/Word Lists library pages this route sits
// beside: live admin-authored content must never be statically cached at
// build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Library" };

export default async function LibraryHomePage() {
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);
  // One shared client for every library query this page fires — creating a
  // separate createPublicClient() per query (as each of these functions
  // does on its own) has been observed to hang this request's streamed
  // response client-side once more than one exists in the same request.
  const supabase = isSupabaseConfigured() ? createPublicClient() : undefined;
  const [categoriesWithBooks, featuredBooks, continueReading] = await Promise.all([
    fetchCategoriesWithBooks(supabase, locale),
    fetchFeaturedBooks(supabase),
    fetchContinueReadingBooks(user?.id ?? null, supabase),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <LibraryHome
        categoriesWithBooks={categoriesWithBooks}
        featuredBooks={featuredBooks}
        continueReading={continueReading}
      />
    </div>
  );
}
