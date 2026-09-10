"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { BookReadingTools } from "@/components/learning/book-reading-tools";
import { PronunciationButton } from "@/components/learning/pronunciation-button";
import { TypingStats } from "@/components/learning/typing-stats";
import { TypingText } from "@/components/learning/typing-text";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { useLessonFontSettings } from "@/components/providers/lesson-font-settings-provider";
import { usePronunciationSettings } from "@/components/providers/pronunciation-settings-provider";
import { useAudioClip } from "@/hooks/use-audio-clip";
import { useTypingEngine } from "@/hooks/use-typing-engine";
import { resolveSectionFontFamily } from "@/lib/admin/lesson-font-settings";
import { isTrackableWord, normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { getLetterStates, tokenize } from "@/lib/typing";
import type { BookSentence } from "@/types/library";
import type { BookSentenceMark } from "@/lib/book-progress/marks";

/**
 * One book sentence's typing screen — reuses the exact same primitives
 * every lesson mode is built from (useTypingEngine for character-by-
 * character validation, TypingText for the rendered/typeable text,
 * PronunciationButton for audio, TypingStats for the live WPM/accuracy
 * readout — Section 9 of the spec: "reuse existing implementation rather
 * than copying it... do NOT fork the typing logic"). Deliberately its own
 * component rather than a fourth branch bolted onto TypingSentence: that
 * component's mode switch (normal/stories/conversation) is shaped around
 * per-lesson completion and a CurrentWordCard word-by-word gloss book
 * sentences don't have yet, where this needs section context and a
 * translation that's always visible (Section 10 of the spec: no toggle,
 * just English → translation → typing, stacked). The layout mirrors the
 * "stories" branch's visual language on purpose, so the reading experience
 * still feels like SentenceStep, not a different app bolted on.
 */
export function BookSentenceReader({
  sentence,
  bookId,
  sectionTitle,
  resolvedVoiceId,
  onComplete,
  onCorrectLetter,
  onErrorLetter,
  onAudioPlay,
  onPrevious,
  readOnly = false,
  large,
  mark,
}: {
  sentence: BookSentence;
  /** The parent book's id — identifies this sentence's bookmark/note for BookMarkControls (Book Reading Experience Enhancements Phase 2). */
  bookId: string;
  /** This sentence's Save/Note state, already fetched in one batched request for the whole reading page — passed straight through to BookMarkControls (see its own doc comment). */
  mark: BookSentenceMark;
  /**
   * Optional (Real Page Model, Phase 4): a page now shows several sentences
   * at once, so the section/chapter label lives once in the page header
   * (BookReadingSession) rather than being repeated above every sentence on
   * the page — pass this only for a standalone single-sentence rendering
   * that has no page header of its own.
   */
  sectionTitle?: string;
  resolvedVoiceId?: string | null;
  onComplete: (wpm: number) => void;
  onCorrectLetter: () => void;
  onErrorLetter?: () => void;
  onAudioPlay?: () => void;
  /** Moves the active pointer back to the previous sentence in this section for review (a local, client-only step — never un-records a completion already saved server-side; re-completing that sentence afterward is a safe idempotent no-op). Omit to hide the "previous sentence" control entirely — BookReadingSession only supplies it once there IS a previous sentence in this section. */
  onPrevious?: () => void;
  /**
   * Page-navigation preview (Book Reading Experience Enhancements, addition
   * 2): true for a sentence the reader has paged to that isn't their actual
   * current sentence. Renders the same sentence, translation, and word
   * interactions (translation-on-click, double-click highlight), but with
   * no live typing: the text shows in its normal, fully-readable state
   * (never the typing screen's muted "nothing typed yet" gray), the
   * invisible input is disabled so it can never steal focus or accept
   * keystrokes, and `onComplete` can therefore never fire. `useTypingEngine`
   * below is still called unconditionally either way (rules of hooks) — its
   * state simply never advances while readOnly, since the disabled input
   * can't receive change events. This is a pure view-state layer: it never
   * writes to book_progress, completedSentenceCount, or XP (see
   * BookReadingSession's viewIndex/sentenceIndex split, which is what
   * decides this flag).
   */
  readOnly?: boolean;
  /**
   * Visual size only — independent of `readOnly`'s functional meaning.
   * Defaults to `!readOnly` (the active sentence renders large, every other
   * one renders small), but BookReadingSession overrides this to `true` for
   * a readOnly sentence that's the ONLY sentence on the currently-viewed
   * page (e.g. a section's final, short page): nothing to look small
   * relative to, so it reads large even though it stays non-interactive.
   */
  large?: boolean;
}) {
  const reducedMotion = useReducedMotion() ?? false;
  const { t, dir } = useLocale();
  const sectionFontFamily = resolveSectionFontFamily(useLessonFontSettings(), "books");
  const textStyle = sectionFontFamily ? { fontFamily: sectionFontFamily } : undefined;
  // Same fallback rule as every other support-text field in this codebase
  // (see Sentence.supportText's doc comment): the locale-resolved
  // translation when one exists, English otherwise — never a mismatched
  // language.
  const supportText = sentence.supportText ?? sentence.en;
  const wordClip = useAudioClip(undefined, { maxRetries: 2, retryDelayMs: 400 });
  const { resolveAudio, prefetchPronunciation } = usePronunciationSettings();

  /**
   * Books-only rule (explicit product decision, 2026-09-11): a word click
   * plays this sentence's own resolved ElevenLabs voice on a cache hit, and
   * otherwise plays nothing at all — never a different voice. This used to
   * fall back to a gender-matched Edge-TTS substitute (see
   * resolvePronunciationAudioAction's book_sentence_word branch, now
   * disabled) or, failing that, the browser's own speech synthesis; both are
   * exactly the "some other voice speaking in the Books section" behavior
   * the product decision rules out, so a miss here is silent rather than
   * reaching for either.
   */
  async function handleWordClick(word: string) {
    if (!resolvedVoiceId || !isTrackableWord(word)) return;
    const contentId = `${sentence.id}::${normalizeMistakeWord(word)}`;
    const url = await resolveAudio({
      contentType: "book_sentence_word",
      contentId,
      voiceId: resolvedVoiceId,
    });
    if (url) wordClip.play(url);
  }

  // See TypingSentence's identical effect's own doc comment: warms every
  // trackable word's clip in the background as soon as this sentence
  // mounts, so a later click on it lands on an already-cached clip instead
  // of paying the first-time ~3-4s synthesis cost at click time. Skipped
  // entirely in the read-only page-preview state (readOnly) — that
  // rendering has no live typing cursor and isn't the sentence the learner
  // is actually reading right now.
  useEffect(() => {
    if (readOnly || !resolvedVoiceId) return;
    const words = new Set(tokenize(sentence.en).filter(isTrackableWord));
    for (const word of words) {
      prefetchPronunciation({
        contentType: "book_sentence_word",
        contentId: `${sentence.id}::${normalizeMistakeWord(word)}`,
        voiceId: resolvedVoiceId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when this sentence/voice/readOnly actually changes, not on every render
  }, [sentence.id, resolvedVoiceId, readOnly]);

  const engine = useTypingEngine({
    target: sentence.en,
    resetKey: sentence.id,
    onComplete,
    onCorrectChar: onCorrectLetter,
    onErrorChar: onErrorLetter,
  });

  const displayTyped = readOnly ? sentence.en : engine.typed;
  // Read/listen-first redesign: the active sentence starts in the same
  // fully-bright, fully-readable state as a read-only page-preview sentence
  // (every letter "correct") rather than the typing screen's usual muted
  // "nothing typed yet" gray — reading and listening are the default here,
  // not a paused typing exercise. Clicking the "want to practice typing?"
  // hint below (practiceMode) or just typing directly switches this sentence
  // to the same muted-until-typed system every other lesson mode (Normal,
  // Stories) already uses: engine.letterStates, starting all-pending/gray
  // and turning white as each real keystroke lands — nothing about
  // useTypingEngine's own validation, sectionAccuracy, or onComplete
  // changes, this is a rendering-only decision.
  const [practiceMode, setPracticeMode] = useState(false);
  const hasStartedTyping = !readOnly && engine.typed.length > 0;
  const displayLetterStates =
    readOnly || (!practiceMode && !hasStartedTyping)
      ? getLetterStates(sentence.en, sentence.en, null)
      : engine.letterStates;
  const isLarge = large ?? !readOnly;

  return (
    <motion.div initial={false} className="relative">
      {/*
        Save/Note/Speed live behind BookReadingTools' one trigger (see that
        component's own doc comment for why). A read-only page-preview
        sentence gets just this row — no per-sentence replay button anymore
        (removed: reader feedback was that a small speaker icon on every
        context sentence read as clutter competing with the active
        sentence's own big, primary Play button, and freed the row to sit
        more tightly against the sentence text below it). The active
        sentence's large, centered Play button (audio-first redesign) stays
        the one and only playback control on the page.
      */}
      <div className="mb-3 flex min-w-0 items-center gap-3">
        {sectionTitle && (
          <span className="text-primary text-xs font-semibold tracking-wide uppercase" dir={dir}>
            {sectionTitle}
          </span>
        )}
        <BookReadingTools
          bookId={bookId}
          sentenceId={sentence.id}
          inputRef={engine.inputRef}
          mark={mark}
          showSpeed={!readOnly}
        />
      </div>

      {!readOnly && (
        // Reader feedback: with audio already autoplaying and the Shift
        // shortcut already covering manual replay (see ShiftReplayHint),
        // a big dedicated Play button had no function beyond what Shift
        // already did — removed to give the sentences the space it took.
        // Still mounted (just visually `hidden`), never removed from the
        // tree: this is what actually fires the autoplay on mount AND
        // registers this sentence's audio with the global Shift-replay
        // hook (see PronunciationButton's own registerReplay effect) —
        // losing either of those would silently break Shift-to-replay too,
        // not just autoplay.
        <PronunciationButton
          text={sentence.en}
          audioUrl={sentence.audioUrl}
          onPlay={onAudioPlay}
          autoPlay
          resetKey={sentence.id}
          inputRef={engine.inputRef}
          kokoroVoiceId={resolvedVoiceId}
          contentType="book_sentence"
          contentId={sentence.id}
          disableSpeechFallback
          className="hidden"
        />
      )}

      <TypingText
        target={sentence.en}
        typed={displayTyped}
        letterStates={displayLetterStates}
        inputRef={engine.inputRef}
        onChange={engine.handleChange}
        onPaste={engine.handlePaste}
        reducedMotion={reducedMotion}
        textClassName={
          isLarge
            ? "text-[clamp(1.55rem,1.1rem+1.55vw,2.5rem)]"
            : "text-[clamp(0.95rem,0.75rem+0.55vw,1.25rem)]"
        }
        textStyle={textStyle}
        onWordClick={(word) => void handleWordClick(word)}
        wordTranslations={sentence.supportWordTranslations}
        translationDir={dir}
        enableWordHighlight
        showTypingCursor={!readOnly}
        disabled={readOnly}
      />
      <p
        className={
          isLarge ? "text-muted-foreground mt-1 text-base" : "text-muted-foreground mt-1 text-sm"
        }
        dir={dir}
      >
        {supportText}
      </p>
      {!readOnly && (
        <div className="mt-2 flex items-center justify-between gap-4">
          {hasStartedTyping ? (
            <TypingStats wpm={engine.wpm} accuracy={engine.accuracy} />
          ) : (
            // Read/listen-first redesign: before the learner has typed
            // anything, WPM/accuracy have nothing real to report, so this
            // slot instead invites the optional typing practice. Clicking it
            // now does two things, not just focus: it flips practiceMode on,
            // switching the sentence to the same muted-until-typed system
            // Normal/Stories already use (see displayLetterStates above) —
            // without that, the text already looked fully typed, so the
            // click had no visible effect at all.
            <button
              type="button"
              onClick={() => {
                setPracticeMode(true);
                engine.inputRef.current?.focus();
              }}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors hover:underline"
            >
              ✎ {t.bookLibrary.typingInviteHint}
            </button>
          )}
          <div className="flex items-center gap-2">
            {onPrevious && (
              <Button onClick={onPrevious} size="sm" variant="secondary">
                {t.bookLibrary.previousSentence}
              </Button>
            )}
            {/*
              Typing a sentence correctly still completes it exactly as
              before (engine.onComplete, wired below), but it's no longer
              the only way to move on — the text is already fully readable
              and the audio already autoplays, so a learner who just wants
              to read and listen can advance with this button instead of
              being required to type. sectionAccuracy in BookReadingSession
              already defaults to 1 when nothing was typed this section, so
              pressing this never costs XP relative to typing.
            */}
            <Button onClick={() => onComplete(engine.wpm)} size="sm">
              {t.bookLibrary.nextSentence}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
