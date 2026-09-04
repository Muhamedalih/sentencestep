"use client";

import { motion, useReducedMotion } from "framer-motion";

import { BookReadingTools } from "@/components/learning/book-reading-tools";
import { CurrentWordCard } from "@/components/learning/current-word-card";
import { PronunciationButton } from "@/components/learning/pronunciation-button";
import { TypingStats } from "@/components/learning/typing-stats";
import { TypingText } from "@/components/learning/typing-text";
import { useLocale } from "@/components/providers/locale-provider";
import { useLessonFontSettings } from "@/components/providers/lesson-font-settings-provider";
import { useSpeech } from "@/hooks/use-speech";
import { useTypingEngine } from "@/hooks/use-typing-engine";
import { resolveSectionFontFamily } from "@/lib/admin/lesson-font-settings";
import { getCurrentWordIndex, getLetterStates } from "@/lib/typing";
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
  readOnly = false,
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
}) {
  const reducedMotion = useReducedMotion() ?? false;
  const { dir } = useLocale();
  const sectionFontFamily = resolveSectionFontFamily(useLessonFontSettings(), "books");
  const textStyle = sectionFontFamily ? { fontFamily: sectionFontFamily } : undefined;
  // Same fallback rule as every other support-text field in this codebase
  // (see Sentence.supportText's doc comment): the locale-resolved
  // translation when one exists, English otherwise — never a mismatched
  // language.
  const supportText = sentence.supportText ?? sentence.en;
  const wordSpeech = useSpeech();

  const engine = useTypingEngine({
    target: sentence.en,
    resetKey: sentence.id,
    onComplete,
    onCorrectChar: onCorrectLetter,
    onErrorChar: onErrorLetter,
  });

  const displayTyped = readOnly ? sentence.en : engine.typed;
  const displayLetterStates = readOnly
    ? getLetterStates(sentence.en, sentence.en, null)
    : engine.letterStates;

  // Same pattern as TypingSentence's Stories/normal modes: the word at the
  // learner's current typing position, shown automatically as they read/type
  // — never requires a click. No current word to show in the read-only
  // page-preview state (no live typing cursor there — see showTypingCursor).
  const currentWord = readOnly
    ? undefined
    : sentence.supportWordTranslations?.[getCurrentWordIndex(sentence.en, engine.typed.length)];

  // Only the active sentence grows to fill available height and anchors its
  // translation/stats toward the bottom (Reading Experience Polish, Goal 1)
  // — a page now holds this one PLUS one compact context sentence, and
  // giving both an equal `flex-1` share left the short context block
  // stretching to half the page height with a large empty gap above its
  // translation. The context sentence instead sizes to its own content.
  const spacer = <div aria-hidden="true" className="lg:flex-1" />;

  return (
    <motion.div
      initial={false}
      className={readOnly ? "relative" : "relative lg:flex lg:min-h-0 lg:flex-1 lg:flex-col"}
    >
      {/*
        Save/Note/Speed all live behind BookReadingTools' one trigger now
        (see that component's own doc comment for why) — Play stays its own
        always-visible icon alongside it, since it's the single most-used
        action here and research on real reading apps (Apple Books, Kindle,
        Chrome Reading Mode) only ever tucks away the *secondary* controls,
        never primary playback.
      */}
      <div className="mb-4 flex min-w-0 items-center gap-3">
        {sectionTitle && (
          <span className="text-primary text-xs font-semibold tracking-wide uppercase" dir={dir}>
            {sectionTitle}
          </span>
        )}
        <div className="flex items-center gap-1.5">
          <BookReadingTools
            bookId={bookId}
            sentenceId={sentence.id}
            inputRef={engine.inputRef}
            mark={mark}
            showSpeed={!readOnly}
          />
          <PronunciationButton
            text={sentence.en}
            audioUrl={sentence.audioUrl}
            onPlay={onAudioPlay}
            autoPlay={!readOnly}
            resetKey={sentence.id}
            inputRef={engine.inputRef}
            kokoroVoiceId={resolvedVoiceId}
            contentType="book_sentence"
            contentId={sentence.id}
          />
        </div>
      </div>

      {!readOnly && (
        <div className="mb-4 min-h-11">
          <CurrentWordCard word={currentWord} dir={dir} />
        </div>
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
          readOnly
            ? "text-[clamp(1.05rem,0.85rem+0.6vw,1.375rem)]"
            : "text-[clamp(1.75rem,1.05rem+2.1vw,3rem)]"
        }
        textStyle={textStyle}
        onWordClick={(word) => wordSpeech.speakWord(word)}
        wordTranslations={sentence.supportWordTranslations}
        translationDir={dir}
        enableWordHighlight
        showTypingCursor={!readOnly}
        disabled={readOnly}
      />
      {!readOnly && spacer}
      <p
        className={
          readOnly ? "text-muted-foreground mt-2 text-sm" : "text-muted-foreground mt-6 text-lg"
        }
        dir={dir}
      >
        {supportText}
      </p>
      {!readOnly && <TypingStats wpm={engine.wpm} accuracy={engine.accuracy} />}
    </motion.div>
  );
}
