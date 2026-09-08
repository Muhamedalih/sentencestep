import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SavedReviewSession } from "@/components/learning/saved-review-session";
import { getLocale } from "@/lib/i18n/get-locale";
import { fetchMySavedSentences } from "@/lib/supabase/queries/saved-sentences";
import { getCurrentUser } from "@/lib/supabase/auth";
import type { Sentence } from "@/types/content";

// Same "never a stale cache for a signed-in learner's own state" reasoning
// as the My Saves route this session is launched from.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Review My Saves" };

const REVIEW_LIMIT = 30;

/**
 * "Review my saves" — a typing session (see SavedReviewSession) over every
 * sentence this learner has bookmarked, capped at REVIEW_LIMIT so a
 * long-time saver isn't handed a marathon session by default. Nothing to
 * review (signed out, or an empty saved library) falls back to the plain
 * My Saves list rather than rendering a broken empty session.
 */
export default async function SavedReviewPage() {
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);
  if (!user) redirect("/learn/saved");

  const { items } = await fetchMySavedSentences(user.id, {
    limit: REVIEW_LIMIT,
    locale: locale ?? undefined,
  });
  if (items.length === 0) redirect("/learn/saved");

  const sentences: Sentence[] = items.map((item) => ({
    id: item.sentenceId,
    en: item.en,
    ar: item.supportText ?? item.en,
    supportText: item.supportText,
  }));

  return (
    <div className="lesson-shell bg-background text-foreground h-svh w-full">
      <SavedReviewSession sentences={sentences} />
    </div>
  );
}
