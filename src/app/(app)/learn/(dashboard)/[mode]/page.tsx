import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LessonListView } from "@/components/app/lesson-list-view";
import { ReportProblemButton } from "@/components/app/report-problem-button";
import { StoriesMobileTabs } from "@/components/app/stories-mobile-tabs";
import { MODE_TITLE_KEY, MODE_DESCRIPTION_KEY } from "@/components/marketing/mode-title-key";
import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getLessonSummaries, getLessons, getLevelNames } from "@/lib/content";
import { getDictionary, fallbackDictionary } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { LEARNING_MODES, isLearningMode, modeMeta } from "@/lib/learning-modes";
import { getCurrentUser } from "@/lib/supabase/auth";
import { fetchVocabularyRecallCountAction } from "@/lib/vocabulary-recall/actions";

export function generateStaticParams() {
  return LEARNING_MODES.map((mode) => ({ mode }));
}

/**
 * Reads live content (admin-created lessons/levels) and the viewer's real
 * premium status on every request — matching src/app/upgrade/page.tsx's
 * same fix for the same class of problem. Without this, generateStaticParams
 * causes Next.js to statically cache this page at build time despite the
 * cookie-based hasPremiumAccess() call, so admin CMS changes (new lessons,
 * new levels, status changes) and a real subscriber's unlocked state would
 * never reach learners until the next deploy — verified live during
 * Milestone 15 by creating a level/lesson through the admin CMS and finding
 * it didn't appear even after a fresh production build.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mode: string }>;
}): Promise<Metadata> {
  const { mode } = await params;
  if (!isLearningMode(mode)) return {};
  return { title: modeMeta[mode].title };
}

/**
 * A plain lesson catalog for one mode — Normal, Stories, or Conversation,
 * all three handled identically (Home dashboard/Ordinary Lessons
 * separation): Normal used to also double as the Home dashboard here (an
 * `isHome` branch bolting greeting/stats/"up next" onto the top of this
 * same list), which made this file do two structurally different jobs at
 * once. That dashboard now lives at its own route (see
 * (dashboard)/page.tsx) — this page is purely "browse this mode's full
 * lesson list," the same job it already did for Stories/Conversation,
 * consistent across all three modes with nothing mode-specific left here.
 *
 * In practice this only ever serves Normal and Conversation: Stories has
 * its own literal route (see ../stories/page.tsx), which Next.js's router
 * always prefers over this dynamic [mode] segment for the exact path
 * /learn/stories — the two routes never compete, but that also means a
 * change made only here (e.g. VocabularySectionRecallCard below) never
 * reaches /learn/stories on its own; see StoriesLibraryPage for that route's
 * own copy of the same wiring.
 */
export default async function ModeLessonsPage({ params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  if (!isLearningMode(mode)) notFound();

  const locale = await getLocale();
  const t = locale ? getDictionary(locale) : fallbackDictionary;
  // "normal" gets its own page heading (library.normalHeading) instead of
  // nav.normalLessons — that key is shared with the marketing footer link
  // and the /upgrade plan-comparison table (see mode-title-key.ts's doc
  // comment), so it can't carry this page-only clarifying suffix.
  const title = mode === "normal" ? t.library.normalHeading : t.nav[MODE_TITLE_KEY[mode]];
  const description = t.marketing[MODE_DESCRIPTION_KEY[mode]];

  // Daily Lessons ("normal") cards show no sentence content, so skip loading
  // it — see getLessonSummaries. Conversation's cards print a line count, which
  // needs the real sentences.
  const [units, hasPremium, isAdminUser, levelNames, recallCount, user] = await Promise.all([
    mode === "normal"
      ? getLessonSummaries(mode, locale ?? undefined)
      : getLessons(mode, locale ?? undefined),
    hasPremiumAccess(),
    isAdmin(),
    getLevelNames(mode, locale ?? undefined),
    fetchVocabularyRecallCountAction(mode),
    getCurrentUser(),
  ]);

  const isPremiumUser = hasPremium || isAdminUser;

  return (
    <div className="mx-auto max-w-5xl px-6 pt-12 pb-12 sm:pt-16 sm:pb-16">
      {/* "normal" is really Stories' "Longer Stories" half (see
          learn-sidebar.tsx's Stories merge doc comment) and needs the same
          switch back to Simple Stories that LibraryMobileTabs already gives
          Books/Novels. */}
      {mode === "normal" && <StoriesMobileTabs active="longer" className="mb-6" />}
      <LessonListView
        mode={mode}
        title={title}
        description={description}
        units={units}
        isPremiumUser={isPremiumUser}
        levelNames={levelNames}
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
