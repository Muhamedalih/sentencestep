"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { BookReadingTools } from "@/components/learning/book-reading-tools";
import { CurrentWordCard } from "@/components/learning/current-word-card";
import { PronunciationButton } from "@/components/learning/pronunciation-button";
import { TypingStats } from "@/components/learning/typing-stats";
import { TypingText } from "@/components/learning/typing-text";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { useLessonFontSettings } from "@/components/providers/lesson-font-settings-provider";
import { usePronunciationSettings } from "@/components/providers/pronunciation-settings-provider";
import { useAudioClip } from "@/hooks/use-audio-clip";
import { useSpeech } from "@/hooks/use-speech";
import { useTypingEngine } from "@/hooks/use-typing-engine";
import { resolveSectionFontFamily } from "@/lib/admin/lesson-font-settings";
import { isTrackableWord, normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { getCurrentWordIndex, getLetterStates, tokenize } from "@/lib/typing";
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
  const { t, dir } = useLocale();
  const sectionFontFamily = resolveSectionFontFamily(useLessonFontSettings(), "books");
  const textStyle = sectionFontFamily ? { fontFamily: sectionFontFamily } : undefined;
  // Same fallback rule as every other support-text field in this codebase
  // (see Sentence.supportText's doc comment): the locale-resolved
  // translation when one exists, English otherwise — never a mismatched
  // language.
  const supportText = sentence.supportText ?? sentence.en;
  const wordSpeech = useSpeech();
  const wordClip = useAudioClip();
  const { resolveAudio, prefetchPronunciation } = usePronunciationSettings();

  /** Same rule as TypingSentence's identical handler: a word click always speaks with this sentence's own resolved voice (cache hit, a free Edge-TTS on-demand synthesis, or — for a paid narration provider — a gender-matched free Edge-TTS substitute, never a fresh paid synthesis just for one word), falling back to the browser's speech synthesis only when nothing resolves at all. */
  async function handleWordClick(word: string) {
    if (resolvedVoiceId && isTrackableWord(word)) {
      const contentId = `${sentence.id}::${normalizeMistakeWord(word)}`;
      const url = await resolveAudio({
        contentType: "book_sentence_word",
        contentId,
        voiceId: resolvedVoiceId,
      });
      if (url) {
        wordClip.play(url);
        return;
      }
    }
    wordSpeech.speakWord(word);
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
  // not a paused typing exercise. The instant the learner actually types a
  // first character, this switches to the engine's real letterStates and
  // behaves exactly like every other typing screen from then on; nothing
  // about useTypingEngine's own validation, sectionAccuracy, or onComplete
  // changes — this is a rendering-only decision.
  const hasStartedTyping = !readOnly && engine.typed.length > 0;
  const displayLetterStates =
    readOnly || !hasStartedTyping
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
        Save/Note/Speed live behind BookReadingTools' one trigger (see that
        component's own doc comment for why). For a read-only page-preview
        sentence, Play stays a small icon right alongside it — that row is
        the only chrome those get. The active sentence instead gets its own
        much larger, centered Play button below (audio-first redesign): the
        single most-used control here now reads as the primary action, the
        way a real audiobook/reading app (Audible, Speechify) treats
        playback, not as one icon among several.
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
          {readOnly && (
            <PronunciationButton
              text={sentence.en}
              audioUrl={sentence.audioUrl}
              onPlay={onAudioPlay}
              resetKey={sentence.id}
              inputRef={engine.inputRef}
              kokoroVoiceId={resolvedVoiceId}
              contentType="book_sentence"
              contentId={sentence.id}
            />
          )}
        </div>
      </div>

      {!readOnly && (
        <div className="mb-5 flex justify-center">
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
            className="bg-accent/15 text-accent hover:bg-accent/25 hover:text-accent size-16 rounded-full [&_svg]:size-7"
          />
        </div>
      )}

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
        onWordClick={(word) => void handleWordClick(word)}
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
      {!readOnly && (
        <div className="mt-4 flex items-center justify-between gap-4">
          {hasStartedTyping ? (
            <TypingStats wpm={engine.wpm} accuracy={engine.accuracy} />
          ) : (
            // Read/listen-first redesign: before the learner has typed
            // anything, WPM/accuracy have nothing real to report, so this
            // slot instead invites the optional typing practice — clicking
            // it just focuses the same invisible input TypingText's own
            // click-anywhere-on-the-text already focuses, it's only a more
            // discoverable entry point for someone who wouldn't guess the
            // text itself is typeable now that it no longer looks muted/
            // waiting-to-be-typed (see displayLetterStates above).
            <button
              type="button"
              onClick={() => engine.inputRef.current?.focus()}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors hover:underline"
            >
              ✎ {t.bookLibrary.typingInviteHint}
            </button>
          )}
          {/*
            Typing a sentence correctly still completes it exactly as before
            (engine.onComplete, wired below), but it's no longer the only way
            to move on — the text is already fully readable and the audio
            already autoplays, so a learner who just wants to read and listen
            can advance with this button instead of being required to type.
            sectionAccuracy in BookReadingSession already defaults to 1 when
            nothing was typed this section, so pressing this never costs XP
            relative to typing.
          */}
          <Button onClick={() => onComplete(engine.wpm)} size="sm">
            {t.bookLibrary.nextSentence}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
