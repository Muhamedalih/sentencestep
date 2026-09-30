"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { CheckCircle2 } from "lucide-react";

import { PronunciationButton } from "@/components/learning/pronunciation-button";
import { PronunciationSpeedControl } from "@/components/learning/pronunciation-speed-control";
import { SentenceDiff } from "@/components/learning/sentence-diff";
import { TapToStartOverlay } from "@/components/learning/typing-sentence";
import { useLessonFontSettings } from "@/components/providers/lesson-font-settings-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { resolveSectionFontFamily } from "@/lib/admin/lesson-font-settings";
import {
  compareDictation,
  dictationAccuracy,
  dictationBlanks,
  dictationMistakes,
} from "@/lib/features/dictation";
import type { DictationResult } from "@/lib/features/dictation";
import { calculateWpm } from "@/lib/typing";
import { isMistakeWorthTracking } from "@/lib/mistakes/normalize";
import { cn } from "@/lib/utils";
import type { LearningMode, Sentence } from "@/types/content";

/** What one graded dictation sentence reports back to LessonSession — folded into the lesson's accuracy/WPM/mistakes exactly like a keystroke-typed sentence would be. */
export interface DictationOutcome {
  wpm: number;
  correctChars: number;
  errorChars: number;
  accuracy: number;
  /** Words (raw tokens) to record in Fix Your Mistakes — already filtered to ones worth tracking. */
  mistakes: { word: string; errorIndexes: number[] }[];
  exact: boolean;
}

interface DictationSentenceProps {
  sentence: Sentence;
  mode: LearningMode;
  resolvedVoiceId?: string | null;
  speakerVoiceMap?: Record<string, string>;
  /** Admin option: show a ___ per letter for each hidden word. */
  showWordBlanks: boolean;
  /** Same mobile "tap to start" gate TypingSentence honors — audio autoplay and input focus wait for it. */
  hasStarted?: boolean;
  onStart?: () => void;
  onAudioPlay?: () => void;
  /** Fired per keystroke so the lesson's typing sound / haptics behave like the normal engine. */
  onKeystroke?: () => void;
  onComplete: (outcome: DictationOutcome) => void;
}

/** No human dictation answer is typed faster than this; anything above is a timing artifact. */
const MAX_PLAUSIBLE_WPM = 200;

/**
 * The Dictation view of one sentence: the text is hidden, the learner
 * listens (audio autoplays; Shift replays; the speed control still works),
 * types the whole sentence, and presses Enter. Grading is word-by-word and
 * only happens at that point — deliberately NOT the keystroke engine's
 * reject-the-wrong-letter rule, because with the sentence hidden that rule
 * would let a learner guess their way through letter by letter.
 */
export function DictationSentence({
  sentence,
  mode,
  resolvedVoiceId,
  speakerVoiceMap,
  showWordBlanks,
  hasStarted = true,
  onStart,
  onAudioPlay,
  onKeystroke,
  onComplete,
}: DictationSentenceProps) {
  const { dir, t } = useLocale();
  const sectionFontFamily = resolveSectionFontFamily(useLessonFontSettings(), mode);
  const textStyle = sectionFontFamily ? { fontFamily: sectionFontFamily } : undefined;
  const inputRef = useRef<HTMLInputElement>(null);
  const startedAtRef = useRef<number | null>(null);
  const [value, setValue] = useState("");
  const [result, setResult] = useState<DictationResult | null>(null);
  const wpmRef = useRef(0);

  const sentenceVoiceId =
    (mode === "conversation" && sentence.speaker && speakerVoiceMap?.[sentence.speaker]) ||
    resolvedVoiceId;
  const supportText = sentence.supportText ?? sentence.en;

  useEffect(() => {
    if (hasStarted) inputRef.current?.focus();
  }, [hasStarted, sentence.id]);

  function check() {
    if (result || value.trim().length === 0) return;
    const graded = compareDictation(sentence.en, value);
    const elapsed = startedAtRef.current === null ? 0 : Date.now() - startedAtRef.current;
    // Capped at a generous human ceiling: the timer starts at the first
    // keystroke, so an instant paste/autofill would otherwise report an
    // absurd speed into the learner's WPM average.
    wpmRef.current = Math.min(MAX_PLAUSIBLE_WPM, calculateWpm(graded.correctChars, elapsed));
    setResult(graded);
  }

  function next() {
    if (!result) return;
    onComplete({
      wpm: wpmRef.current,
      correctChars: result.correctChars,
      errorChars: result.errorChars,
      accuracy: dictationAccuracy(result),
      mistakes: dictationMistakes(result).filter((mistake) => isMistakeWorthTracking(mistake.word)),
      exact: result.exact,
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (result) next();
    else check();
  }

  const blanks = showWordBlanks ? dictationBlanks(sentence.en) : [];

  return (
    <div className="relative lg:flex lg:h-full lg:flex-col">
      {!hasStarted && (
        <TapToStartOverlay
          heading={t.lesson.tapToStartHeading}
          body={t.lesson.tapToStartBody}
          onStart={() => {
            inputRef.current?.focus();
            onStart?.();
          }}
        />
      )}
      <div className="mb-4 flex items-center justify-end gap-2">
        <PronunciationSpeedControl inputRef={inputRef} />
        <PronunciationButton
          text={sentence.en}
          audioUrl={sentence.audioUrl}
          onPlay={onAudioPlay}
          autoPlay={hasStarted}
          resetKey={sentence.id}
          inputRef={inputRef}
          kokoroVoiceId={sentenceVoiceId}
          contentType="sentence"
          contentId={sentence.id}
          variant="outline"
          className="border-border/60 bg-background/85 shadow-sm backdrop-blur-md"
        />
      </div>

      <div className="flex flex-col gap-5 lg:flex-1 lg:justify-center">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          {mode === "conversation" && sentence.speaker
            ? `${sentence.speaker} · ${t.dictation.listenAndType}`
            : t.dictation.listenAndType}
        </p>

        {!result && blanks.length > 0 && (
          <div
            aria-hidden="true"
            dir="ltr"
            className="flex flex-wrap gap-x-5 gap-y-3 text-3xl sm:text-4xl"
            style={textStyle}
          >
            {blanks.map((length, wordIndex) => (
              <span key={wordIndex} className="inline-flex gap-1">
                {Array.from({ length }, (_unused, letterIndex) => (
                  <span
                    key={letterIndex}
                    className="border-foreground/30 inline-block h-[1.1em] w-[0.6em] border-b-2"
                  />
                ))}
              </span>
            ))}
          </div>
        )}

        <input
          ref={inputRef}
          type="text"
          value={value}
          readOnly={result !== null}
          onChange={(event) => {
            if (result) return;
            if (startedAtRef.current === null && event.target.value.length > 0) {
              startedAtRef.current = Date.now();
            }
            setValue(event.target.value);
            onKeystroke?.();
          }}
          onKeyDown={handleKeyDown}
          // Same rule as the keystroke engine: this exercise is typed, not pasted.
          onPaste={(event) => event.preventDefault()}
          placeholder={t.dictation.placeholder}
          aria-label={t.dictation.inputLabel}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
          dir="ltr"
          style={textStyle}
          className={cn(
            "border-border/70 bg-background/60 focus-visible:border-ring focus-visible:ring-ring/40 w-full rounded-xl border-2 px-4 py-3.5 text-2xl outline-none focus-visible:ring-4 sm:text-3xl",
            result && "opacity-70",
          )}
        />

        {!result ? (
          <div className="flex items-center gap-4">
            <Button type="button" onClick={check} disabled={value.trim().length === 0}>
              {t.dictation.check}
            </Button>
            <span className="text-muted-foreground text-sm">{t.dictation.pressEnter}</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4" aria-live="polite">
            <p
              className={cn(
                "flex items-center gap-2 text-lg font-semibold",
                result.exact ? "text-success" : "text-accent",
              )}
            >
              {result.exact && <CheckCircle2 className="size-5" aria-hidden="true" />}
              {result.exact ? t.dictation.perfect : t.dictation.almost}
            </p>

            <SentenceDiff result={result} textStyle={textStyle} />
            {result.exact && (
              <p dir="ltr" className="text-xl sm:text-2xl" style={textStyle}>
                {sentence.en}
              </p>
            )}

            <p className="text-lg text-[var(--lesson-subtitle)] select-none" dir={dir}>
              {supportText}
            </p>

            <div className="flex items-center gap-4">
              <Button type="button" onClick={next}>
                {t.dictation.continue}
              </Button>
              <span className="text-muted-foreground text-sm">
                {t.dictation.pressEnterContinue}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
