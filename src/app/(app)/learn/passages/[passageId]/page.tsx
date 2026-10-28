import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PassageLocked } from "@/components/passages/passage-locked";
import { PassageReader } from "@/components/passages/passage-reader";
import { isAdmin } from "@/lib/admin/access";
import { trackPaywallViewed } from "@/lib/analytics/paywall";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getFromMonthlyPrice } from "@/lib/billing/from-price";
import { getGateLean } from "@/lib/billing/gate-lean-queries";
import { getGatePay } from "@/lib/billing/gate-pay";
import { getGateProgress } from "@/lib/billing/gate-progress";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { getLocale } from "@/lib/i18n/get-locale";
import { pauseMarksFor } from "@/lib/passages/admin-pauses";
import { canOpenPassage, openablePassages } from "@/lib/passages/access";
import { resumeSectionIndex } from "@/lib/passages/progress";
import { fetchPassage, fetchPassageProgress, fetchPassageSummaries } from "@/lib/passages/queries";
import { getGateFigures } from "@/lib/stats/gate-figures";
import { getCurrentUser } from "@/lib/supabase/auth";

/**
 * The full-screen passage reader — outside the "(dashboard)" route group, same
 * convention as /learn/[mode]/[lessonId] and the Book reader: no header or
 * sidebar competing with the text. force-dynamic because where a signed-in
 * learner resumes, and whether the section is open to this visitor at all, must
 * never come from a stale cache.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ passageId: string }>;
}): Promise<Metadata> {
  // A title is content: never hand it to a visitor the section is not open to.
  if (!(await getEffectiveFeatures()).passages.enabled) return { title: "Passages" };
  const { passageId } = await params;
  const passage = await fetchPassage(passageId);
  return {
    title: passage?.status === "published" ? `${passage.title} · Passages` : "Passages",
  };
}

/** Where the passage's end screen carries on in Today's session, from the address it was opened with; null outside Today. */
async function todayNextLink(
  open: boolean,
  searchParams: Promise<{ today?: string; redo?: string }>,
): Promise<{ href: string } | null> {
  const query = await searchParams;
  if (!open || query.today !== "1") return null;
  return { href: `/learn/today/go?step=story${query.redo === "1" ? "&redo=1" : ""}` };
}

export default async function PassageReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ passageId: string }>;
  searchParams: Promise<{ today?: string; redo?: string }>;
}) {
  const features = await getEffectiveFeatures();
  if (!features.passages.enabled) notFound();

  const { passageId } = await params;
  const [passage, summaries, user, locale, isAdminUser] = await Promise.all([
    fetchPassage(passageId),
    fetchPassageSummaries(),
    getCurrentUser(),
    getLocale(),
    isAdmin(),
  ]);
  if (!passage || passage.sections.length === 0) notFound();
  // A draft is an admin's preview: nobody else can open it, nor learn it exists.
  if (passage.status !== "published" && !isAdminUser) notFound();

  // A Premium passage is for subscribers and admins; everyone else gets the lock screen. The
  // subscription is only looked up when it matters — this passage or a suggested next one is
  // Premium — so a free passage opens with no extra work.
  const canOpenPremium =
    isAdminUser ||
    (passage.isFree && !summaries.some((summary) => !summary.isFree)) ||
    (await hasPremiumAccess());
  if (!canOpenPassage(passage, canOpenPremium)) {
    const [fromPrice, figures, pay, progress, lean] = await Promise.all([
      getFromMonthlyPrice(),
      getGateFigures(locale),
      getGatePay(),
      getGateProgress(),
      getGateLean(locale),
      trackPaywallViewed({ kind: "passage", passageId: passage.id }),
    ]);
    return (
      <div className="lesson-shell bg-background text-foreground min-h-svh w-full">
        <div className="mx-auto flex min-h-svh max-w-5xl flex-col justify-center px-4 pt-8 pb-28 sm:px-6 sm:py-14">
          <PassageLocked
            passageId={passage.id}
            tone={passage.tone}
            order={passage.order}
            posterUrl={passage.posterUrl}
            title={passage.title}
            titleAr={passage.titleAr}
            summary={passage.summary}
            summaryAr={passage.summaryAr}
            fromPrice={fromPrice}
            pay={pay}
            progress={progress}
            figures={figures}
            lean={lean}
          />
        </div>
      </div>
    );
  }

  const progress = user
    ? (await fetchPassageProgress(user.id)).find((entry) => entry.passageId === passage.id)
    : undefined;

  // The next passage in list order — a suggestion on the end screen, never a requirement, and
  // never one this viewer can't open.
  const openable = openablePassages(summaries, canOpenPremium);
  const position = openable.findIndex((summary) => summary.id === passage.id);
  const next = position >= 0 ? openable[position + 1] : undefined;

  // "Practice these words": the real Word Lists page once the lesson is published (the
  // Passages switch is On); until then only an admin gets a way in, the admin preview of
  // that same lesson — a learner is never sent to a page that would 404 for them.
  const wordsLink = passage.wordGroupId
    ? passage.wordGroupStatus === "published"
      ? { href: `/learn/word-lists/${passage.wordGroupId}`, adminPreview: false }
      : isAdminUser
        ? { href: `/admin/word-lists/${passage.wordGroupId}/preview`, adminPreview: true }
        : null
    : null;

  // Where the narrator will pause: shown to an admin as small dots between the words, to nobody else —
  // it is computed here, from the stored lines, and never sent to a learner's browser.
  const pauseMarks = isAdminUser ? await pauseMarksFor(passage.id) : undefined;

  return (
    <div className="lesson-shell bg-background text-foreground min-h-svh w-full">
      <PassageReader
        passage={passage}
        pauseMarks={pauseMarks}
        initialSectionIndex={resumeSectionIndex(progress, passage.sections.length)}
        // Only Arabic translations are written so far (see PassageSentence.ar).
        translationAvailable={locale === "ar"}
        nextPassage={next ? { id: next.id, title: next.title } : null}
        // A step of Today's session (opened from Home): the end screen carries on to the story.
        // (`redo=1`, from "Redo today's lessons", keeps the story that follows today's own.)
        todayNext={await todayNextLink(features.rollouts.todaySession, searchParams)}
        wordsLink={wordsLink}
      />
    </div>
  );
}
