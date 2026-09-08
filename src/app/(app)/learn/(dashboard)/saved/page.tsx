import type { Metadata } from "next";
import Link from "next/link";

import { SavedSentencesList } from "@/components/app/saved-sentences-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDictionary, fallbackDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { fetchMySavedSentences } from "@/lib/supabase/queries/saved-sentences";
import { getCurrentUser } from "@/lib/supabase/auth";

// A signed-in learner's saved library must never come from a stale cache —
// same reasoning as every other learner-progress route (see e.g. the Book
// Reading route's own doc comment).
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My Saves" };

/**
 * "My Saves" (Lightweight Save + Notes system, Section 9) — the one unified
 * personal area for every sentence a learner has saved and/or annotated,
 * across every book. Deliberately not a new nav item in LearnSidebar (that
 * list is curriculum sections only) — linked from AppHeader instead, next
 * to Settings, the same personal-area placement.
 */
export default async function SavedSentencesPage() {
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);
  const t = locale ? getDictionary(locale) : fallbackDictionary;

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 sm:py-24">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t.bookLibrary.mySavesSignInHeading}</CardTitle>
            <CardDescription>{t.bookLibrary.mySavesSignInSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login?next=/learn/saved">{t.common.signIn}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { items, hasMore } = await fetchMySavedSentences(user.id, { locale: locale ?? undefined });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t.nav.mySaves}</h1>
      <div className="mt-8">
        <SavedSentencesList initialItems={items} initialHasMore={hasMore} />
      </div>
    </div>
  );
}
