import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { BookCompletion } from "@/components/learning/book-completion";
import { BookReadingSession } from "@/components/learning/book-reading-session";
import { fetchBookProgressAction, fetchSectionForReadingAction } from "@/lib/book-progress/actions";
import { isSectionUnlocked } from "@/lib/book-progress/chapter-state";
import { getBookNarrationVoiceId } from "@/lib/admin/elevenlabs-queries";
import { getDictionary, fallbackDictionary } from "@/lib/i18n/dictionary";
import { resolveVoiceId } from "@/lib/voice/resolution";
import { lookupCachedAudioUrl } from "@/lib/voice/voice-audio";
import { getLocale } from "@/lib/i18n/get-locale";
import { getLearnerLevel } from "@/lib/progress/learner-level";
import { fetchDailyProgress, fetchStreak, fetchXp } from "@/lib/supabase/queries/progress";
import { fetchBookContentCounts, fetchBookSections } from "@/lib/supabase/queries/book-content";
import { fetchBookById } from "@/lib/supabase/queries/library";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createPublicClient } from "@/lib/supabase/public-client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { todayLocalISODate } from "@/lib/progress/streak";
import { emptyProgressState } from "@/lib/progress/types";

/**
 * The full-screen Book Learning Engine reading route — outside the
 * "(dashboard)" group, same convention as /learn/[mode]/[lessonId] and
 * /learn/word-lists/[groupId] (both also full-screen learning experiences
 * with no header/sidebar chrome). force-dynamic for the same reason every
 * other learner-progress route here is: a signed-in learner's resume
 * position must never come from a stale cache.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ bookId: string }>;
}): Promise<Metadata> {
  const { bookId } = await params;
  const book = await fetchBookById(bookId);
  return { title: book ? `${book.title} · Reading` : "Reading" };
}

export default async function BookReadingPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookId: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const { bookId } = await params;
  const { section: requestedSectionId } = await searchParams;
  // One shared client for every library/book-content query this page fires —
  // see library.ts's fetchCategories doc comment for why a separate
  // createPublicClient() per query must be avoided within one request.
  const supabase = isSupabaseConfigured() ? createPublicClient() : undefined;
  const [book, locale, user] = await Promise.all([
    fetchBookById(bookId, supabase),
    getLocale(),
    getCurrentUser(),
  ]);
  if (!book) notFound();

  const t = locale ? getDictionary(locale) : fallbackDictionary;
  const progress = await fetchBookProgressAction(bookId);

  // A book with no content at all is never playable (Section 18/21 of the
  // spec: no fabricated counts, no fake reading experience) — Book Overview
  // already keeps "Start Reading" disabled for this case; reaching this
  // route directly is a defensive fallback, not the normal path. isComplete
  // is checked first: a fully-read book also has currentSentenceId === null
  // (see BookProgressSummary's doc comment), which is the *good* kind of
  // null, not "no content."
  if (!progress.isComplete && (progress.totalSentenceCount === 0 || !progress.currentSentenceId)) {
    return (
      <div className="lesson-shell bg-background text-foreground mx-auto flex min-h-svh max-w-3xl flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <div className="bg-brand-muted text-primary flex size-14 items-center justify-center rounded-full">
          <AlertCircle className="size-7" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight" dir="ltr">
          {book.title}
        </h1>
        <p className="text-muted-foreground max-w-sm text-sm">{t.premium.contentUnavailableBody}</p>
        <Link
          href={`/learn/library/${book.id}`}
          className="text-primary text-sm font-medium hover:underline"
        >
          {t.bookLibrary.backToLibrary}
        </Link>
      </div>
    );
  }

  // isComplete is only ever true for a signed-in reader (see
  // fetchBookProgressAction — a guest never has a real book_progress row to
  // read), so `user` is guaranteed here; the check still guards notFound()
  // below from ever needing to run for this branch.
  if (progress.isComplete && user) {
    const todayISO = todayLocalISODate();
    const [xp, streak, dailyProgress, counts] = await Promise.all([
      fetchXp(user.id),
      fetchStreak(user.id).then((s) => s ?? emptyProgressState.streak),
      fetchDailyProgress(user.id, todayISO),
      fetchBookContentCounts(bookId, supabase),
    ]);

    return (
      <div className="lesson-shell bg-background text-foreground flex min-h-svh flex-col items-center justify-center px-6 py-16">
        <BookCompletion
          book={book}
          sectionCount={counts.sectionCount}
          sentenceCount={progress.totalSentenceCount}
          isSignedIn
          sessionXpEarned={0}
          xp={xp}
          streak={streak.currentStreak}
          dailyProgress={dailyProgress}
          learnerLevel={getLearnerLevel(xp)}
        />
      </div>
    );
  }

  // Unreachable in practice (see the guards above), kept only so
  // `currentSentenceId` narrows to `string` below rather than `string | null`.
  if (!progress.currentSentenceId) notFound();

  // Sequential chapter unlocking: a section opened from the Book Overview's
  // section list (see BookSectionList) arrives here as ?section=<id>. Only a
  // completed or currently-available section is ever honored — a locked
  // section (whether from a stale link or a hand-edited URL) silently falls
  // back to the reader's real resume position instead, the same
  // server-side gate deriveChapterStates/isSectionUnlocked apply on the Book
  // Overview page itself, so the sequence can't be bypassed by navigating
  // straight to a section's URL.
  const sections = requestedSectionId ? await fetchBookSections(bookId) : [];
  const targetSectionId =
    requestedSectionId && isSectionUnlocked(sections, progress, requestedSectionId)
      ? requestedSectionId
      : progress.currentSectionId;

  const [section, globalDefaultVoiceId, counts] = await Promise.all([
    fetchSectionForReadingAction(bookId, targetSectionId),
    getBookNarrationVoiceId(),
    fetchBookContentCounts(bookId, supabase),
  ]);
  if (!section || section.sentences.length === 0) notFound();
  // This book's own narration override (set per-book from the "Story audio
  // status" admin dashboard) always wins over the global default — mirrors
  // exactly how generateBookVoiceDraft resolves the voice it actually
  // generates audio with (see loadBookForVoiceWork in
  // book-voice-generation.ts). Without this, every book played the same
  // global default voice regardless of what was picked per book.
  const resolvedVoiceId = resolveVoiceId(book.voiceId, globalDefaultVoiceId);

  // progress.currentSentenceId is only a valid starting point for the
  // reader's OWN current section — deep-linking into a different, already-
  // unlocked section (e.g. re-reading a completed one from Book Overview or
  // a saved sentence) must start at that section's own first sentence
  // instead, not the book-wide resume pointer, which BookReadingSession
  // would otherwise silently fail to find in `section.sentences` and desync
  // completedSentenceCount for the rest of the visit.
  const initialSentenceId =
    targetSectionId === progress.currentSectionId
      ? progress.currentSentenceId
      : section.sentences[0]!.id;

  // Pre-resolves the initial sentence's pronunciation URL here, server-side,
  // mirroring /learn/[mode]/[lessonId]'s identical fix (see that page's own
  // doc comment) — without this, the first sentence of every book-reading
  // session (and every section jump) pays an avoidable client→server round
  // trip through PronunciationButton's on-demand resolve even when the clip
  // is already cached. Cache-only: never triggers Kokoro generation.
  const initialSentence = section.sentences.find((s) => s.id === initialSentenceId);
  const initialSection =
    initialSentence && !initialSentence.audioUrl && resolvedVoiceId
      ? {
          ...section,
          sentences: await Promise.all(
            section.sentences.map(async (s) =>
              s.id === initialSentenceId
                ? { ...s, audioUrl: await lookupCachedAudioUrl(s.en, resolvedVoiceId) }
                : s,
            ),
          ),
        }
      : section;

  return (
    <div className="lesson-shell bg-background text-foreground h-svh w-full">
      <BookReadingSession
        book={book}
        initialSection={initialSection}
        initialSentenceId={initialSentenceId}
        initialCompletedSentenceCount={progress.completedSentenceCount}
        totalSentenceCount={progress.totalSentenceCount}
        totalSectionCount={counts.sectionCount}
        resolvedVoiceId={resolvedVoiceId}
      />
    </div>
  );
}
