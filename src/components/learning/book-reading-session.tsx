"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle } from "lucide-react";

import { BookCompletion } from "@/components/learning/book-completion";
import { BookPageNav } from "@/components/learning/book-page-nav";
import { BookSectionComplete } from "@/components/learning/book-section-complete";
import { BookSectionIntro } from "@/components/learning/book-section-intro";
import { BookSentenceReader } from "@/components/learning/book-sentence-reader";
import { ShiftReplayHint } from "@/components/learning/shift-replay-hint";
import { Button } from "@/components/ui/button";
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
import { isTrackableWord, normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { getLearnerLevel } from "@/lib/progress/learner-level";
import { emptyDailyProgress } from "@/lib/progress/types";
import type { DailyProgressState } from "@/lib/progress/types";
import { tokenize } from "@/lib/typing";
import { cn } from "@/lib/utils";
import { resolveBookPageAudioAction } from "@/lib/voice/book-audio-batch";
import type { Book, BookSentence, BookSectionWithSentences } from "@/types/library";

type Screen =
  | "sectionIntro"
  | "reading"
  | "sectionComplete"
  | "loadingNextSection"
  | "sectionLoadError"
  | "bookComplete";

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
  /** The book's first section, forwarded to Book Completion's "back to book" button (see its own doc comment) so finishing the book live, in this same session, reopens actual content — not just when the completed-book page is loaded fresh. Undefined only for a book with no sections, or the admin preview route. */
  firstSectionId?: string;
  resolvedVoiceId?: string | null;
  /** Admin's "Preview" action on a draft section (see /admin/library/[bookId]/sections/[sectionId]/preview) — renders the exact same reading/typing experience but never persists anything to the signed-in admin's own account: no sentence-completion writes (no XP/streak/daily-progress/book_progress), and no bookmark/note fetch. Everything else (typing, paging, section transitions) behaves identically to a real session. */
  previewMode?: boolean;
  /** Server-side pre-resolved `{contentId: audioUrl}` for `initialSentenceId`'s own trackable words (see the reading page's own doc comment and TypingSentence's identical `wordAudioUrls` prop) — only ever applied to that one sentence below, never any other. undefined for the admin preview route, which behaves exactly as before this prop existed. */
  firstSentenceWordAudio?: Record<string, string>;
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
  firstSectionId,
  resolvedVoiceId,
  previewMode = false,
  firstSentenceWordAudio,
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
  const { registerResolvedAudio } = usePronunciationSettings();

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

  // Batched page-audio warm-up (2026-09-12) — replaces what used to be one
  // prefetchPronunciation call per sentence PLUS one per trackable word
  // (100+ individual Server Action round trips on a typical page). Reader
  // reports traced this exact volume to two DIFFERENT symptoms depending on
  // how it was throttled client-side: unthrottled, a burst that size
  // saturated the connection pool and made the section-boundary fetch queue
  // behind it for minutes; throttled to 1 concurrent, the backlog instead
  // took minutes to fully drain, keeping a background request continuously
  // in flight the whole time the reader stayed on that page — either way,
  // competing with the reader's own on-demand plays. resolveBookPageAudioAction
  // (Books-only; see its own doc comment) collapses a whole page's worth of
  // "is this already cached?" checks into one or two round trips instead —
  // it never generates anything itself, so a miss for any sentence or word
  // is exactly as before: silently left for the existing on-demand
  // resolveAudio path (PronunciationButton/BookSentenceReader, both
  // unchanged) to resolve when the reader actually reaches it. Skips
  // entirely for a sentence whose audioUrl is already known (the book's own
  // pre-generated narration, already on the row from the initial fetch) —
  // registering that directly is a pure client-side cache write, no network
  // call needed at all.
  const prefetchedPagesRef = useRef<Set<string>>(new Set());
  const warmPageAudio = useCallback(
    (pageSentences: BookSentence[], voiceId: string) => {
      if (pageSentences.length === 0) return;
      const pageKey = `${voiceId}::${pageSentences.map((s) => s.id).join(",")}`;
      if (prefetchedPagesRef.current.has(pageKey)) return;
      prefetchedPagesRef.current.add(pageKey);

      const sentencesNeeded: { contentId: string; text: string }[] = [];
      const wordsNeeded: { contentId: string; word: string }[] = [];
      for (const s of pageSentences) {
        if (s.audioUrl) {
          registerResolvedAudio(s.id, s.audioUrl);
        } else {
          sentencesNeeded.push({ contentId: s.id, text: s.en });
        }
        for (const word of new Set(tokenize(s.en).filter(isTrackableWord))) {
          wordsNeeded.push({ contentId: `${s.id}::${normalizeMistakeWord(word)}`, word });
        }
      }
      if (sentencesNeeded.length === 0 && wordsNeeded.length === 0) return;

      void resolveBookPageAudioAction({
        narratorVoiceId: voiceId,
        sentences: sentencesNeeded,
        words: wordsNeeded,
      })
        .then(({ sentenceAudio, wordAudio }) => {
          for (const [contentId, url] of Object.entries(sentenceAudio))
            registerResolvedAudio(contentId, url);
          for (const [contentId, url] of Object.entries(wordAudio))
            registerResolvedAudio(contentId, url);
        })
        .catch((error: unknown) => {
          console.error("[book-audio] batched page warm-up failed", error);
        });
    },
    [registerResolvedAudio],
  );

  // Pipeline: the CURRENT page is warmed the instant it becomes current,
  // and the NEXT page is warmed at the same time, in the background, while
  // the reader is still on the current one — by the time they actually
  // page or sentence forward into it, its audio is normally already sitting
  // in the shared cache (see PronunciationSettingsProvider.getResolvedAudio)
  // with zero further round trips. warmPageAudio's own pageKey de-dup means
  // paging back and forth, or this effect re-firing for any other reason,
  // never re-warms the same page twice.
  useEffect(() => {
    if (!resolvedVoiceId) return;
    warmPageAudio(pages[viewPageIndex] ?? [], resolvedVoiceId);
    warmPageAudio(pages[viewPageIndex + 1] ?? [], resolvedVoiceId);
  }, [viewPageIndex, pages, resolvedVoiceId, warmPageAudio]);

  // Reader feedback (2026-09-11): completing a section's last sentence used
  // to show a bare loading screen for as long as fetchSectionAfterAction's
  // own network round trip took — a real Supabase fetch of the ENTIRE next
  // section (title + every sentence), started only once the learner had
  // already finished typing. Starting that same fetch here, the moment the
  // learner reaches the section's LAST sentence (while they're still
  // reading/typing it), gives it a real head start — by the time
  // handleSentenceComplete's own await runs below, the promise has often
  // already settled, so the loading screen flashes far more briefly or not
  // at all. Keyed by section.id (not just a boolean) so moving on to a new
  // section always fires a fresh prefetch instead of reusing a stale one.
  //
  // Chained onto that same promise (2026-09-11, same day, next round):
  // warming the new section's whole FIRST PAGE of audio — not just its
  // first sentence — the INSTANT the section data itself resolves, which
  // can happen while the learner is still reading/typing the OLD section's
  // last sentence, well before the section-complete card even appears. An
  // earlier version instead waited for pendingNextSection (i.e. the card
  // actually being on screen) before warming even just the first sentence;
  // that gave real but comparatively little lead time and only ever
  // reached one sentence, which reader feedback still caught as an audible
  // wait on the new section's later context sentences. Deliberately kept
  // out of handleSentenceComplete's own critical path (a .then() on the
  // ALREADY-independent prefetch promise, not something it awaits) so it
  // can never re-introduce the section-complete card's own delay — see
  // fetchSectionAfterAction's doc comment for that history.
  const nextSectionPrefetchRef = useRef<{
    sectionId: string;
    promise: Promise<BookSectionWithSentences | null>;
  } | null>(null);
  useEffect(() => {
    const isLastSentence = sentenceIndex === section.sentences.length - 1;
    if (!isLastSentence) return;
    if (nextSectionPrefetchRef.current?.sectionId === section.id) return;
    const promise = fetchSectionAfterAction(book.id, section.orderIndex);
    nextSectionPrefetchRef.current = { sectionId: section.id, promise };
    if (resolvedVoiceId) {
      void promise
        .then((next) => {
          const firstPage = next ? (paginateSentences(next.sentences)[0] ?? []) : [];
          warmPageAudio(firstPage, resolvedVoiceId);
        })
        // A rejected prefetch is surfaced properly once handleSentenceComplete
        // itself awaits this same promise (see loadNextSection below) — this
        // .catch exists purely so an early rejection (the reader still typing
        // the section's last sentence, well before that await runs) doesn't
        // also log as an unrelated unhandled promise rejection here.
        .catch(() => {});
    }
  }, [
    sentenceIndex,
    section.id,
    section.orderIndex,
    section.sentences.length,
    book.id,
    resolvedVoiceId,
    warmPageAudio,
  ]);

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
    // so this works identically for a guest and a signed-in reader. Reuses
    // the background prefetch (see nextSectionPrefetchRef above) when one
    // was actually started for THIS section, instead of always paying the
    // fetch's full latency here.
    await loadNextSection();
  }

  /**
   * The actual "fetch the next section" step of a section boundary —
   * pulled out of handleSentenceComplete so handleRetryNextSection (the
   * sectionLoadError screen's "Try again" button) can re-run exactly the
   * same logic. Root-cause fix (2026-09-12) for reader reports of a section
   * transition hanging forever on "loadingNextSection" for some books,
   * needing a full page refresh: fetchSectionAfterAction is a real network
   * call (Supabase RPC + translation joins — see its own doc comment) that
   * CAN reject on a flaky connection, and this await used to have nothing
   * catching that — an unhandled rejection here left `screen` stuck at
   * "loadingNextSection" forever, with no error shown and no way forward
   * short of reloading the page. A rejected prefetch is discarded (never
   * retried as-is) rather than reused, since awaiting an already-rejected
   * promise again would just fail instantly with the same stale error.
   */
  async function loadNextSection() {
    setScreen("loadingNextSection");
    try {
      const next = await (nextSectionPrefetchRef.current?.sectionId === section.id
        ? nextSectionPrefetchRef.current.promise
        : fetchSectionAfterAction(book.id, section.orderIndex));
      if (next) {
        setPendingNextSection(next);
        setScreen("sectionComplete");
      } else {
        setScreen("bookComplete");
      }
    } catch (error) {
      console.error("Failed to load the next section", error);
      nextSectionPrefetchRef.current = null;
      setScreen("sectionLoadError");
    }
  }

  function handleRetryNextSection() {
    void loadNextSection();
  }

  /**
   * Moves the active pointer back one sentence for review — client-only,
   * bounded to the current section (there's no fetchSectionBefore the way
   * fetchSectionAfterAction covers the forward direction, matching
   * BookPageNav's own page-navigation boundary). Never touches
   * completedCount/XP/book_progress: those are only ever written by
   * completeSentence, which this doesn't call. If the reader presses "next
   * sentence" again from here, that re-completes the same sentence they'd
   * already completed before — completeBookSentence's compare-and-swap
   * already makes that a safe no-op server-side (see handleSentenceComplete
   * above), so going back and forward freely can never double-count.
   */
  function goToPreviousSentence() {
    if (sentenceIndex === 0) return;
    const prevIndex = sentenceIndex - 1;
    const prevSentence = section.sentences[prevIndex]!;
    setSentenceIndex(prevIndex);
    setViewPageIndex(findPageIndexForSentenceId(pages, prevSentence.id));
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

  // Keyboard shortcut request: ArrowRight/ArrowLeft mirror the active
  // sentence's own Next sentence / Previous sentence buttons exactly
  // (handleSentenceComplete / goToPreviousSentence above), not the separate
  // page-navigation buttons (goToNextPage/goToPreviousPage). Only armed while
  // the reader is actually looking at the active sentence's page — those
  // buttons themselves only render there (see BookSentenceReader's
  // onComplete/onPrevious wiring below), so a stray arrow press while paged
  // away to browse a different page does nothing rather than silently
  // advancing progress the reader can't see happen. Skips the note editor's
  // textarea and any contenteditable so those keep their normal text-editing
  // arrow-key behavior.
  useEffect(() => {
    if (screen !== "reading" || !sentence) return;
    const activePageIndex = findPageIndexForSentenceId(pages, sentence.id);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      const target = event.target;
      if (
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      if (viewPageIndex !== activePageIndex) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        void handleSentenceComplete();
      } else if (event.key === "ArrowLeft" && sentenceIndex > 0) {
        event.preventDefault();
        goToPreviousSentence();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-armed whenever the active sentence/page actually changes; handleSentenceComplete/goToPreviousSentence are recreated every render alongside these same deps, so the closure is never stale
  }, [screen, sentence, pages, viewPageIndex, sentenceIndex]);

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
              Reader feedback (2026-09-11): back to two separate corners (an
              earlier pass briefly merged them into one bottom-right stack),
              but the click-hint is now a proper pill matching the Shift hint's
              own visual language instead of bare floating text, and the Shift
              hint itself sits a little closer to the true bottom edge — see
              its own `className` override below.
            */}
            <div
              aria-hidden="true"
              dir={dir}
              className="border-border/50 bg-background/80 pointer-events-none fixed bottom-4 left-4 z-30 flex items-center rounded-2xl border px-3.5 py-2 text-xs font-medium shadow-sm backdrop-blur-md select-none sm:bottom-6 sm:left-6"
            >
              <span className="text-muted-foreground">
                {renderHintWithHighlight(t.bookLibrary.clickHint, t.bookLibrary.clickHintHighlight)}
              </span>
            </div>
            <ShiftReplayHint className="bottom-2 sm:bottom-3" />
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
            <div className="flex flex-1 flex-col justify-between overflow-y-auto px-6 pb-4 lg:px-16 lg:pt-3">
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
              <div
                className={cn(
                  // Reverted to the original gap (2026-09-11): combined with
                  // the bigger text sizes, the wider gap made the reading
                  // page tall enough to need scrolling — not acceptable, so
                  // this went back rather than trimming text size alone.
                  "flex flex-col gap-2",
                  // A page that's down to its single last sentence (the tail
                  // of a section) gets the extra room centered on it instead
                  // of left stranded at the top — biased a bit above true
                  // center (via the uneven bottom padding) rather than dead
                  // center, which read as sitting too low relative to the
                  // header above it.
                  viewedPage.length === 1 && "flex-1 justify-center pb-[18vh]",
                )}
              >
                {viewedPage.map((pageSentence) => {
                  const isActiveSentence = pageSentence.id === sentence.id;
                  return (
                    <motion.div
                      key={pageSentence.id}
                      layout
                      // A quicker, smooth deceleration curve rather than the
                      // original bouncy spring — reader feedback asked for a
                      // more polished AND a snappier feel here (the first
                      // pass at this, at 0.45s, still read as sluggish).
                      transition={
                        reducedMotion
                          ? { duration: 0 }
                          : { duration: 0.26, ease: [0.22, 1, 0.36, 1] }
                      }
                      // Every slot keeps the exact same padded/rounded/bordered
                      // footprint regardless of active state — only its
                      // border/background COLOR (and opacity) change (see this
                      // block's own history above for why). Kept deliberately
                      // modest (not the original active-only padding) since
                      // this now applies to every sentence on the page at
                      // once — four sentences' worth of padding is real
                      // height, and stacking too much of it was what forced
                      // the whole page to need scrolling.
                      className={cn(
                        "rounded-xl border px-4 py-1.5 transition-[opacity,background-color,border-color] duration-300 sm:px-5 sm:py-2",
                        isActiveSentence
                          ? "border-border/40 bg-card/70"
                          : "border-transparent bg-transparent opacity-55",
                      )}
                    >
                      <BookSentenceReader
                        sentence={pageSentence}
                        bookId={book.id}
                        mark={marksBySentence[pageSentence.id] ?? EMPTY_MARK}
                        resolvedVoiceId={resolvedVoiceId}
                        wordAudioUrls={
                          pageSentence.id === initialSentenceId ? firstSentenceWordAudio : undefined
                        }
                        readOnly={!isActiveSentence}
                        large={isActiveSentence || viewedPage.length === 1}
                        onPrevious={
                          isActiveSentence && sentenceIndex > 0 ? goToPreviousSentence : undefined
                        }
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
        ) : screen === "sectionLoadError" ? (
          <div
            key="sectionLoadError"
            className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-8 text-center lg:min-h-svh lg:px-16"
          >
            <div className="bg-danger/10 text-danger flex size-14 items-center justify-center rounded-full">
              <AlertCircle className="size-7" aria-hidden="true" />
            </div>
            <p className="text-muted-foreground max-w-sm text-sm">
              {t.bookLibrary.sectionLoadError}
            </p>
            <Button onClick={handleRetryNextSection}>{t.common.tryAgain}</Button>
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
              firstSectionId={firstSectionId}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
