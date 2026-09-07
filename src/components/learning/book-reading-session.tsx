"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { BookCompletion } from "@/components/learning/book-completion";
import { BookPageNav } from "@/components/learning/book-page-nav";
import { BookSectionComplete } from "@/components/learning/book-section-complete";
import { BookSectionIntro } from "@/components/learning/book-section-intro";
import { BookSentenceReader } from "@/components/learning/book-sentence-reader";
import { ShiftReplayHint } from "@/components/learning/shift-replay-hint";
import { PageLoading } from "@/components/ui/page-loading";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/components/providers/locale-provider";
import { usePronunciationSettings } from "@/components/providers/pronunciation-settings-provider";
import { useTypingSoundSettings } from "@/components/providers/typing-sound-settings-provider";
import { useBookProgress } from "@/hooks/use-book-progress";
import { useTypingSound } from "@/hooks/use-typing-sound";
import { resolveSectionSentenceCompleteSound } from "@/lib/admin/typing-sound-settings";
import { fetchSectionAfterAction } from "@/lib/book-progress/actions";
import { fetchBookSentenceMarksAction } from "@/lib/book-progress/marks-actions";
import { EMPTY_MARK } from "@/lib/book-progress/marks";
import type { BookSentenceMark } from "@/lib/book-progress/marks";
import { findPageIndexForSentenceId, paginateSentences } from "@/lib/book-progress/pagination";
import { getLearnerLevel } from "@/lib/progress/learner-level";
import { emptyDailyProgress } from "@/lib/progress/types";
import type { DailyProgressState } from "@/lib/progress/types";
import type { Book, BookSectionWithSentences } from "@/types/library";

type Screen =
  "sectionIntro" | "reading" | "sectionComplete" | "loadingNextSection" | "bookComplete";

/** BookSentenceReader's onComplete for a read-only page-preview render — belt-and-suspenders alongside its own disabled input (see that component's readOnly doc comment): completion can never fire for a page the reader is only browsing to, not actively typing. */
const NOOP = () => {};

/**
 * Splits the click-to-highlight instruction around its one highlighted word
 * (`t.bookLibrary.clickHint` / `clickHintHighlight` — see their own doc
 * comments) and wraps just that substring in the same accent-highlight color
 * language as the reading page's real word highlight (see HighlightMark in
 * typing-text.tsx), so the hint visually demonstrates the exact interaction
 * it's describing. A plain background+radius rather than that component's
 * animated hand-drawn mark: this is a static instructional label, not a
 * learner-triggered highlight, so it doesn't need — and shouldn't have — an
 * entrance animation competing for attention here. Falls back to the
 * unhighlighted plain string if `highlightWord` isn't actually a substring
 * of `hint` (a translation drifting out of sync should never throw or drop
 * text, just lose the accent).
 */
function renderHintWithHighlight(hint: string, highlightWord: string) {
  const index = hint.indexOf(highlightWord);
  if (index === -1) return hint;
  return (
    <>
      {hint.slice(0, index)}
      <span className="bg-accent/45 text-foreground rounded-[3px] px-1 py-0.5">
        {highlightWord}
      </span>
      {hint.slice(index + highlightWord.length)}
    </>
  );
}

interface BookReadingSessionProps {
  book: Book;
  initialSection: BookSectionWithSentences;
  /** The sentence to resume at within `initialSection` — from BookProgressSummary.currentSentenceId, already confirmed to belong to this section by the page. */
  initialSentenceId: string;
  initialCompletedSentenceCount: number;
  totalSentenceCount: number;
  totalSectionCount: number;
  resolvedVoiceId?: string | null;
  /** Admin's "Preview" action on a draft section (see /admin/library/[bookId]/sections/[sectionId]/preview) — renders the exact same reading/typing experience but never persists anything to the signed-in admin's own account: no sentence-completion writes (no XP/streak/daily-progress/book_progress), and no bookmark/note fetch. Everything else (typing, paging, section transitions) behaves identically to a real session. */
  previewMode?: boolean;
}

/**
 * The active Book Learning Engine reading experience (Section 8 of the
 * spec): section intro → sentence-by-sentence typing → section complete →
 * next section, ending in Book Completion. Owns navigation entirely through
 * fetchSectionAfterAction (see its own doc comment) rather than the signed-
 * in-only book_progress pointer, so a guest gets the FULL reading/typing/
 * transition experience in this sitting — only their POSITION isn't saved
 * for a future visit, and they earn no XP/streak/daily-goal credit (see
 * useBookProgress's doc comment for why: Continue Reading, and therefore
 * all book-progress persistence, has been signed-in-only since it was first
 * built). completeSentence resolving to null is exactly that guest case,
 * never an error.
 */
export function BookReadingSession({
  book,
  initialSection,
  initialSentenceId,
  initialCompletedSentenceCount,
  totalSentenceCount,
  totalSectionCount,
  resolvedVoiceId,
  previewMode = false,
}: BookReadingSessionProps) {
  const { t, dir } = useLocale();
  const reducedMotion = useReducedMotion() ?? false;
  const { isSignedIn: isSignedInReal, completeSentence } = useBookProgress();
  // See previewMode's own doc comment — an admin previewing a draft section
  // gets the exact same reading UI, but every persistence-gated effect below
  // treats them as if signed out, the same "advance the UI locally, nothing
  // saved" path a guest already takes (completeSentence resolving to null).
  const isSignedIn = isSignedInReal && !previewMode;
  const typingSoundSettings = useTypingSoundSettings();
  const { play, playSentenceComplete } = useTypingSound({
    pack: typingSoundSettings.soundPack,
    enabled: typingSoundSettings.enabled,
    volume: typingSoundSettings.volume,
    sentenceCompleteSound: typingSoundSettings.sentenceCompleteSound,
  });
  const { prefetchPronunciation } = usePronunciationSettings();

  const [section, setSection] = useState(initialSection);
  const initialIndex = Math.max(
    0,
    initialSection.sentences.findIndex((s) => s.id === initialSentenceId),
  );
  const [sentenceIndex, setSentenceIndex] = useState(initialIndex);

  // The Real Page Model (Phase 4): the current section's sentences grouped
  // into real, multi-sentence pages — a pure, deterministic derivation from
  // `section.sentences` (see paginateSentences), recomputed whenever the
  // section changes. This is a READ-ONLY view layer over the learning
  // engine's sentence state, never a replacement for it: sentenceIndex above
  // remains the only thing that ever advances book_progress/
  // completedSentenceCount/XP (via handleSentenceComplete).
  const pages = useMemo(() => paginateSentences(section.sentences), [section]);

  // Which PAGE is currently DISPLAYED — a pure reading/browse layer (Book
  // Reading Experience Enhancements, addition 2; extended to real pages in
  // Phase 4) kept entirely separate from sentenceIndex. Defaults to, and is
  // explicitly kept in sync with, the active sentence's page at every point
  // sentenceIndex itself changes (sentence completion, section transition) —
  // see those call sites below. Paging away from the active sentence's page
  // renders every sentence on the viewed page in BookSentenceReader's
  // readOnly preview mode, which cannot fire onComplete at all (see that
  // component's own doc comment), so navigating pages can never be mistaken
  // for completing a sentence.
  const [viewPageIndex, setViewPageIndex] = useState(() =>
    findPageIndexForSentenceId(pages, initialSentenceId),
  );
  const [screen, setScreen] = useState<Screen>(initialIndex === 0 ? "sectionIntro" : "reading");
  const [pendingNextSection, setPendingNextSection] = useState<BookSectionWithSentences | null>(
    null,
  );
  const [completedCount, setCompletedCount] = useState(initialCompletedSentenceCount);
  const [sessionXpEarned, setSessionXpEarned] = useState(0);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [dailyProgress, setDailyProgress] = useState<DailyProgressState>(emptyDailyProgress);

  // Section-scoped accuracy, mirroring LessonSession's lesson-scoped refs —
  // reset every time the reader lands on a new section, accumulated across
  // that section's sentences, and read only when a section actually
  // completes (see recordBookSentenceCompletionAction's doc comment for why
  // XP is section-, not sentence-, granular).
  const sectionCorrectRef = useRef(0);
  const sectionErrorRef = useRef(0);
  useEffect(() => {
    sectionCorrectRef.current = 0;
    sectionErrorRef.current = 0;
  }, [section.id]);

  const sentence = section.sentences[sentenceIndex];

  // This section's Save/Note state for every one of its sentences, fetched
  // once per section in a single batched request (Lightweight Save + Notes
  // system: performance) rather than once per rendered BookSentenceReader —
  // a viewed page can show several at once (see the sentences.map below).
  // Re-fetched whenever the section changes (section boundary crossed);
  // never re-fetched merely for paging within the same section, since
  // marksBySentence already covers every sentence in it. A sentence with no
  // entry (guest, or genuinely never marked) falls back to EMPTY_MARK at
  // each call site below.
  const [marksBySentence, setMarksBySentence] = useState<Record<string, BookSentenceMark>>({});
  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    fetchBookSentenceMarksAction(section.sentences.map((s) => s.id)).then((marks) => {
      if (!cancelled) setMarksBySentence(marks);
    });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, section]);

  // Same fix as LessonSession's identical effect: resolve the next
  // sentence's pronunciation in the background while the current one is
  // being typed, so its PronunciationButton finds it already cached.
  useEffect(() => {
    if (!resolvedVoiceId) return;
    const nextSentence = section.sentences[sentenceIndex + 1];
    if (!nextSentence) return;
    prefetchPronunciation({
      contentType: "book_sentence",
      contentId: nextSentence.id,
      voiceId: resolvedVoiceId,
    });
  }, [sentenceIndex, section.sentences, resolvedVoiceId, prefetchPronunciation]);

  async function handleSentenceComplete() {
    if (!sentence) return;
    playSentenceComplete(resolveSectionSentenceCompleteSound(typingSoundSettings, "books"));

    const totalAttempts = sectionCorrectRef.current + sectionErrorRef.current;
    const sectionAccuracy = totalAttempts === 0 ? 1 : sectionCorrectRef.current / totalAttempts;

    // Persisted in the background rather than awaited (Reading Experience
    // Polish, Goal 3): completeSentence is a real network round trip
    // (Supabase RPC + streak/XP/daily-progress reads and upserts), but which
    // sentence/page comes next below is decided purely from local section
    // data — it never depends on this call's result. Awaiting it before
    // advancing the UI was pure added latency between sentences for no
    // correctness benefit; the RPC itself is idempotent (see
    // completeBookSentence's compare-and-swap), so firing it without
    // blocking the transition can't produce a duplicate or incorrect
    // completion, only a slightly later XP/streak/daily-progress update.
    const persist = previewMode
      ? Promise.resolve(null)
      : completeSentence(book.id, section.id, sentence.id, sectionAccuracy);
    persist
      .then((result) => {
        if (!result) return;
        setXp(result.xp);
        setStreak(result.streak.currentStreak);
        setDailyProgress(result.dailyProgress);
        if (result.xpEarned > 0) setSessionXpEarned((total) => total + result.xpEarned);
        // Reconciles the optimistic bump below against the server's real
        // count rather than trusting it blindly. Matters when this sentence
        // belongs to a section the reader is re-visiting after already
        // completing it (e.g. deep-linking back into a finished section from
        // Book Overview or a saved sentence) — completeBookSentence's
        // compare-and-swap then reports `advanced: false` and returns the
        // count unchanged, so without this the locally-displayed "X of Y"
        // would stay permanently inflated by every sentence re-read this
        // session, surviving until a full reload.
        setCompletedCount(result.completedSentenceCount);
      })
      .catch((error) => {
        console.error("Failed to record book sentence completion", error);
      });
    // Optimistic — instant progress-bar feedback while the request above is
    // still in flight; corrected to the authoritative value once it resolves.
    setCompletedCount((count) => count + 1);

    const isLastInSection = sentenceIndex + 1 === section.sentences.length;
    if (!isLastInSection) {
      // Completion can only ever happen while actively viewing the real
      // current sentence's page (readOnly preview sentences can't fire
      // onComplete at all — see BookSentenceReader), so viewPageIndex is
      // guaranteed to already be the active page here. Following the next
      // sentence to ITS page keeps the reader looking at their new current
      // sentence — this is what makes the reading experience naturally turn
      // to the next real page once the current page's last sentence is
      // completed, while staying on the same page for every completion that
      // doesn't cross a page boundary.
      const nextSentence = section.sentences[sentenceIndex + 1]!;
      const nextPageIndex = findPageIndexForSentenceId(pages, nextSentence.id);
      setSentenceIndex((index) => index + 1);
      setViewPageIndex(nextPageIndex);
      return;
    }

    // Section boundary. Resolved independently of the signed-in-only
    // book_progress pointer — see fetchSectionAfterAction's doc comment —
    // so this works identically for a guest and a signed-in reader.
    setScreen("loadingNextSection");
    const next = await fetchSectionAfterAction(book.id, section.id);
    if (next) {
      setPendingNextSection(next);
      setScreen("sectionComplete");
    } else {
      setScreen("bookComplete");
    }
  }

  function handleContinueToNextSection() {
    if (!pendingNextSection) return;
    setSection(pendingNextSection);
    setSentenceIndex(0);
    setViewPageIndex(0);
    setPendingNextSection(null);
    setScreen("sectionIntro");
  }

  // Page navigation (addition 2; real multi-sentence pages as of Phase 4):
  // bounded to the current section, never crossing into a not-yet-fetched
  // section the way completing the section's last sentence does — see
  // BookPageNav's own doc comment for why that boundary is deliberate, not a
  // missing feature.
  const viewedPage = pages[viewPageIndex] ?? [];
  const canGoToPreviousPage = viewPageIndex > 0;
  const canGoToNextPage = viewPageIndex < pages.length - 1;
  // A real page number within the current section (Phase 4: "Page X
  // represents a real page, not a sentence number") — never derived from
  // completedCount/sentence position.
  const pageNumber = viewPageIndex + 1;
  const totalPages = pages.length;

  function goToPreviousPage() {
    setViewPageIndex((index) => Math.max(0, index - 1));
  }
  function goToNextPage() {
    setViewPageIndex((index) => Math.min(pages.length - 1, index + 1));
  }

  const percent =
    totalSentenceCount > 0 ? Math.min(100, (completedCount / totalSentenceCount) * 100) : 0;
  const learnerLevel = getLearnerLevel(xp);

  // The book title itself (Book Reading Experience header integration): on
  // the "reading" screen it's rendered inline, as the centered middle column
  // of the same header row as the section title/page info below — see
  // bookTitleHeading's use there — rather than as its own separate block
  // above that row, which used to read as a disconnected floating layer.
  // Every other screen (section intro/complete, book complete) keeps its
  // own standalone title bar exactly as before; those screens have no
  // equivalent "reading info" row to fold it into.
  const bookTitleHeading = (
    <h1
      className="text-foreground min-w-0 truncate text-center text-sm font-semibold tracking-wide sm:text-base"
      dir="ltr"
    >
      {book.title}
    </h1>
  );

  const sessionLabel = (
    <>
      {screen !== "reading" && (
        <h1
          className="text-muted-foreground truncate px-4 pt-3 text-center text-xs font-medium tracking-wide uppercase"
          dir="ltr"
        >
          {book.title}
        </h1>
      )}
      <p className="sr-only" aria-live="polite">
        {screen === "bookComplete"
          ? t.bookLibrary.bookCompleteHeading
          : t.lesson.sentenceProgress
              .replace("{n}", String(Math.min(completedCount + 1, totalSentenceCount)))
              .replace("{total}", String(totalSentenceCount))}
      </p>
    </>
  );

  return (
    <div className="lg:h-full">
      {sessionLabel}
      <AnimatePresence mode="wait">
        {screen === "reading" && sentence && viewedPage.length > 0 ? (
          <div key="reading" className="flex flex-col lg:h-full">
            {/*
              Reuses the main lessons' exact ShiftReplayHint pill/position
              (fixed bottom-right, same pill styling, same isActive gating)
              rather than approximating it — see that component's own doc
              comment for what `below` adds: one more instructional line,
              sharing the same anchor/gap, for the click-to-highlight hint
              that used to sit centered under BookPageNav. Scoped to the
              "reading" screen only (this branch), matching where that hint
              was always shown before — section intro/complete and book
              complete never had it and still don't.
            */}
            <ShiftReplayHint
              below={
                <p dir={dir} className="text-muted-foreground/70 text-end text-sm">
                  {renderHintWithHighlight(
                    t.bookLibrary.clickHint,
                    t.bookLibrary.clickHintHighlight,
                  )}
                </p>
              }
            />
            <div className="shrink-0 px-6 pt-3 lg:px-16 lg:pt-4">
              {/*
                Just the centered book title now — the section-title (start)
                and page-of-total (end) that used to flank it were dropped
                (reading-screen feedback: redundant with the sentence-
                progress row directly below and with BookPageNav's own page
                count at the page's bottom, and cutting them shrinks the
                header enough to hand the content area real extra height).
                Kept flush against the header's own (now smaller) top
                padding rather than adding a further nudge — reading-screen
                feedback was that the header was taking noticeably more
                vertical space than the sentence content itself deserved.
              */}
              <div className="mb-0.5">{bookTitleHeading}</div>
              <div className="mb-1 flex items-center justify-between gap-4">
                <span className="text-muted-foreground text-sm font-medium">
                  {t.lesson.sentenceProgress
                    .replace("{n}", String(Math.min(completedCount + 1, totalSentenceCount)))
                    .replace("{total}", String(totalSentenceCount))}
                </span>
                <span className="text-muted-foreground text-sm font-medium">
                  {Math.round(percent)}%
                </span>
              </div>
              <Progress value={percent} />
            </div>
            <div className="flex flex-1 flex-col justify-start overflow-y-auto px-6 pb-4 lg:px-16 lg:pt-3">
              {/*
                A real page renders all four of `viewedPage`'s sentences as
                one persistent slot each — keyed by the sentence's OWN id,
                which never changes for the lifetime of this page, unlike the
                pre-redesign version which pulled the active sentence into a
                separate, specially-positioned element whose key changed
                every time progress advanced (and which fought Framer
                Motion's layout animation badly enough, combined with flex
                `order` repositioning, to render sentences invisible
                mid-transition — caught live while building this). Exactly
                one slot is ever active at a time (isActiveSentence,
                `readOnly={false}`, rendered large) — the rest render small
                (readOnly, listen/read-only context) — and since a slot's key
                never changes as active-ness moves through the page one
                sentence at a time, useTypingEngine for a given sentence
                never remounts while advancing within this page, only when a
                genuinely different page is loaded.

                Read/listen-first redesign's "which sentence is big" motion:
                plain `layout` (no `layoutId` needed — this is the same
                persisting element, not a cross-element match) lets Framer
                Motion smoothly interpolate each slot's own bounding-box
                change between renders — its real size differs a lot between
                small/readOnly and large/active (BookSentenceReader renders
                genuinely different content either way), so the slot visibly
                grows when it becomes active and shrinks when it stops being
                active, instead of an instant cut.
              */}
              <div className="flex flex-col gap-2">
                {viewedPage.map((pageSentence) => {
                  const isActiveSentence = pageSentence.id === sentence.id;
                  return (
                    <motion.div
                      key={pageSentence.id}
                      layout
                      transition={
                        reducedMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 300, damping: 30 }
                      }
                    >
                      <BookSentenceReader
                        sentence={pageSentence}
                        bookId={book.id}
                        mark={marksBySentence[pageSentence.id] ?? EMPTY_MARK}
                        resolvedVoiceId={resolvedVoiceId}
                        readOnly={!isActiveSentence}
                        large={isActiveSentence || viewedPage.length === 1}
                        onComplete={isActiveSentence ? handleSentenceComplete : NOOP}
                        onCorrectLetter={
                          isActiveSentence
                            ? () => {
                                sectionCorrectRef.current += 1;
                                play("letter");
                              }
                            : NOOP
                        }
                        onErrorLetter={
                          isActiveSentence
                            ? () => {
                                sectionErrorRef.current += 1;
                                play("error");
                              }
                            : NOOP
                        }
                      />
                    </motion.div>
                  );
                })}
              </div>
              <BookPageNav
                pageNumber={pageNumber}
                totalPages={totalPages}
                canGoPrevious={canGoToPreviousPage}
                canGoNext={canGoToNextPage}
                onPrevious={goToPreviousPage}
                onNext={goToNextPage}
              />
            </div>
          </div>
        ) : screen === "sectionIntro" ? (
          <div
            key="sectionIntro"
            className="flex flex-1 items-center justify-center px-6 py-8 lg:min-h-svh lg:px-16"
          >
            <BookSectionIntro
              book={book}
              section={section}
              sectionNumber={section.orderIndex + 1}
              totalSectionCount={totalSectionCount}
              onBegin={() => setScreen("reading")}
            />
          </div>
        ) : screen === "loadingNextSection" ? (
          <div key="loadingNextSection">
            <PageLoading />
          </div>
        ) : screen === "sectionComplete" ? (
          <div
            key="sectionComplete"
            className="flex flex-1 items-center justify-center px-6 py-8 lg:min-h-svh lg:px-16"
          >
            <BookSectionComplete
              sectionTitle={section.supportTitle ?? section.title}
              xpEarned={isSignedIn ? sessionXpEarned : 0}
              onContinue={handleContinueToNextSection}
            />
          </div>
        ) : (
          <div
            key="bookComplete"
            className="flex flex-1 items-center justify-center px-6 py-8 lg:min-h-svh lg:px-16"
          >
            <BookCompletion
              book={book}
              sectionCount={totalSectionCount}
              sentenceCount={totalSentenceCount}
              isSignedIn={isSignedIn}
              sessionXpEarned={sessionXpEarned}
              xp={xp}
              streak={streak}
              dailyProgress={dailyProgress}
              learnerLevel={learnerLevel}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
