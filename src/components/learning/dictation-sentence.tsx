"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { CheckCircle2 } from "lucide-react";

import { ContinueButton, RetryButton } from "@/components/learning/feedback-actions";
import { PronunciationButton } from "@/components/learning/pronunciation-button";
import type { PronunciationButtonHandle } from "@/components/learning/pronunciation-button";
import { PronunciationSpeedControl } from "@/components/learning/pronunciation-speed-control";
import { SentenceDiff } from "@/components/learning/sentence-diff";
import { TapToStartOverlay } from "@/components/learning/typing-sentence";
import { useLessonFontSettings } from "@/components/providers/lesson-font-settings-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { usePronunciationSettings } from "@/components/providers/pronunciation-settings-provider";
import { Button } from "@/components/ui/button";
import { useAudioClip } from "@/hooks/use-audio-clip";
import { useEnterToContinue } from "@/hooks/use-enter-to-continue";
import { resolveSectionFontFamily } from "@/lib/admin/lesson-font-settings";
import {
  compareDictation,
  dictationAccuracy,
  dictationAudioWords,
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
  /** Server-side pre-resolved `{contentId: audioUrl}` word clips for the lesson's first sentence — the same map TypingSentence receives, so a blank's word plays instantly there too. */
  wordAudioUrls?: Record<string, string>;
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

/** How long the mouse has to rest on a blank before its word is spoken, so sweeping across the row doesn't chatter. */
const HOVER_DWELL_MS = 160;

/**
 * The Dictation view of one sentence: the text is hidden, the learner
 * listens (audio autoplays; Shift replays; the speed control still works),
 * types the whole sentence, and presses Enter. Grading is word-by-word and
 * only happens at that point — deliberately NOT the keystroke engine's
 * reject-the-wrong-letter rule, because with the sentence hidden that rule
 * would let a learner guess their way through letter by letter.
 *
 * After grading the learner can continue (Enter or the button) or try the
 * same sentence again as often as they like. Only the FIRST attempt is
 * reported to the lesson: a retry is practice, and letting the last try count
 * would turn "retype what is on screen" into a way to erase a miss.
 *
 * Help while the sentence is hidden: hovering over a blank, or tapping it,
 * says the word that belongs there (Normal and Stories, where words have
 * their own audio).
 */
export function DictationSentence({
  sentence,
  mode,
  resolvedVoiceId,
  speakerVoiceMap,
  showWordBlanks,
  wordAudioUrls,
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
  const pronunciationRef = useRef<PronunciationButtonHandle>(null);
  const startedAtRef = useRef<number | null>(null);
  /** The graded first attempt at this sentence — what onComplete reports, whatever happens on retries. */
  const firstAttemptRef = useRef<{ graded: DictationResult; wpm: number } | null>(null);
  const [value, setValue] = useState("");
  const [result, setResult] = useState<DictationResult | null>(null);
  const [attempt, setAttempt] = useState(0);

  const sentenceVoiceId =
    (mode === "conversation" && sentence.speaker && speakerVoiceMap?.[sentence.speaker]) ||
    resolvedVoiceId;
  const supportText = sentence.supportText ?? sentence.en;

  useEffect(() => {
    if (hasStarted && !result) inputRef.current?.focus();
  }, [hasStarted, sentence.id, attempt, result]);

  // --- Word audio on the blanks -------------------------------------------
  // Same clips, same resolve path and same voice rule as a word click in the
  // normal typing view (TypingSentence.handleWordClick): never a different
  // voice than the sentence itself. Conversation lessons have no per-word
  // audio, so their blanks stay plain.
  const audioWords = useMemo(() => dictationAudioWords(sentence.en), [sentence.en]);
  const wordAudioEnabled =
    showWordBlanks && (mode === "normal" || mode === "stories") && Boolean(sentenceVoiceId);
  const wordClip = useAudioClip();
  const { resolveAudio, prefetchPronunciation, registerResolvedAudio } = usePronunciationSettings();
  const wordRequestRef = useRef(0);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [activeBlank, setActiveBlank] = useState<number | null>(null);
  const [resolvingWord, setResolvingWord] = useState(false);

  useEffect(() => {
    if (!wordAudioUrls) return;
    for (const [contentId, url] of Object.entries(wordAudioUrls)) {
      registerResolvedAudio(contentId, url);
    }
  }, [wordAudioUrls, registerResolvedAudio]);

  // Warm every word's clip shortly after the sentence appears (staggered so it
  // never competes with the sentence's own audio) — a first-time isolated-word
  // synthesis takes seconds, far too slow for a hover.
  useEffect(() => {
    if (!wordAudioEnabled || !sentenceVoiceId) return;
    const keys = Array.from(new Set(audioWords.filter((key): key is string => key !== null)));
    const timers = keys.map((key, index) =>
      setTimeout(
        () => {
          prefetchPronunciation({
            contentType: "sentence_word",
            contentId: `${sentence.id}::${key}`,
            voiceId: sentenceVoiceId,
          });
        },
        600 + index * 150,
      ),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when this sentence/voice actually changes
  }, [sentence.id, sentenceVoiceId, wordAudioEnabled]);

  useEffect(() => () => clearTimeout(hoverTimerRef.current), []);

  async function playWord(blankIndex: number) {
    const key = audioWords[blankIndex];
    if (!wordAudioEnabled || !key || !sentenceVoiceId) return;
    const request = ++wordRequestRef.current;
    setActiveBlank(blankIndex);
    setResolvingWord(true);
    const url = await resolveAudio({
      contentType: "sentence_word",
      contentId: `${sentence.id}::${key}`,
      voiceId: sentenceVoiceId,
    });
    // A newer hover or click took over while this one was resolving.
    if (request !== wordRequestRef.current) return;
    setResolvingWord(false);
    if (!url) return;
    pronunciationRef.current?.stop();
    wordClip.play(url);
  }

  function handleBlankPointerEnter(blankIndex: number, event: ReactPointerEvent) {
    // Touch has no hover: a tap arrives as a click below.
    if (event.pointerType === "touch") return;
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => void playWord(blankIndex), HOVER_DWELL_MS);
  }

  function handleBlankClick(blankIndex: number) {
    clearTimeout(hoverTimerRef.current);
    void playWord(blankIndex);
    // Keep typing uninterrupted: the click must not leave focus on the blank.
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  // --- Grading ------------------------------------------------------------
  function check() {
    if (result || value.trim().length === 0) return;
    const graded = compareDictation(sentence.en, value);
    if (firstAttemptRef.current === null) {
      const elapsed = startedAtRef.current === null ? 0 : Date.now() - startedAtRef.current;
      // Capped at a generous human ceiling: the timer starts at the first
      // keystroke, so an instant paste/autofill would otherwise report an
      // absurd speed into the learner's WPM average.
      firstAttemptRef.current = {
        graded,
        wpm: Math.min(MAX_PLAUSIBLE_WPM, calculateWpm(graded.correctChars, elapsed)),
      };
    }
    setResult(graded);
  }

  function next() {
    const first = firstAttemptRef.current;
    if (!result || !first) return;
    onComplete({
      wpm: first.wpm,
      correctChars: first.graded.correctChars,
      errorChars: first.graded.errorChars,
      accuracy: dictationAccuracy(first.graded),
      mistakes: dictationMistakes(first.graded).filter((mistake) =>
        isMistakeWorthTracking(mistake.word),
      ),
      exact: first.graded.exact,
    });
  }

  function retry() {
    if (!result) return;
    startedAtRef.current = null;
    setValue("");
    setResult(null);
    setAttempt((count) => count + 1);
    // Listen again before typing again.
    pronunciationRef.current?.replay();
  }

  // Enter checks while typing (below); once the correction is on screen it
  // continues, wherever focus is.
  useEnterToContinue(result !== null, next);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    check();
  }

  const blanks = showWordBlanks ? dictationBlanks(sentence.en) : [];
  const anyBlankAudio = wordAudioEnabled && audioWords.some((key) => key !== null);
  const wordBusy = resolvingWord || wordClip.status === "loading" || wordClip.status === "playing";

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
          ref={pronunciationRef}
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
        <p dir={dir} className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          {mode === "conversation" && sentence.speaker
            ? `${sentence.speaker} · ${t.dictation.listenAndType}`
            : t.dictation.listenAndType}
        </p>

        {!result ? (
          <>
            {blanks.length > 0 && (
              <div
                aria-hidden={anyBlankAudio ? undefined : true}
                dir="ltr"
                className="flex flex-wrap gap-x-5 gap-y-3 text-3xl sm:text-4xl"
                style={textStyle}
              >
                {blanks.map((length, wordIndex) => {
                  const hasAudio = wordAudioEnabled && audioWords[wordIndex] != null;
                  const lit = hasAudio && activeBlank === wordIndex && wordBusy;
                  const letters = Array.from({ length }, (_unused, letterIndex) => (
                    <span
                      key={letterIndex}
                      className={cn(
                        "border-foreground/30 inline-block h-[1.1em] w-[0.6em] border-b-2 transition-colors",
                        hasAudio && "group-hover:border-primary",
                        lit && "border-primary",
                      )}
                    />
                  ));
                  if (!hasAudio) {
                    return (
                      <span key={wordIndex} className="inline-flex gap-1">
                        {letters}
                      </span>
                    );
                  }
                  return (
                    <button
                      key={wordIndex}
                      type="button"
                      // Clicked with the mouse or finger only: keyboard users
                      // stay in the answer box (Shift already replays the sentence).
                      tabIndex={-1}
                      aria-label={t.dictation.hearWord.replace("{n}", String(wordIndex + 1))}
                      onClick={() => handleBlankClick(wordIndex)}
                      onPointerEnter={(event) => handleBlankPointerEnter(wordIndex, event)}
                      onPointerLeave={() => clearTimeout(hoverTimerRef.current)}
                      className={cn(
                        "group hover:bg-primary/10 -mx-1.5 inline-flex cursor-pointer gap-1 rounded-lg px-1.5 pt-1 transition-colors",
                        lit && "bg-primary/10",
                      )}
                    >
                      {letters}
                    </button>
                  );
                })}
              </div>
            )}

            {anyBlankAudio && (
              <p dir={dir} className="text-muted-foreground -mt-2 text-sm">
                {t.dictation.blankHint}
              </p>
            )}

            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(event) => {
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
              className="border-border/70 bg-background/60 focus-visible:border-ring focus-visible:ring-ring/40 w-full rounded-xl border-2 px-4 py-3.5 text-2xl outline-none focus-visible:ring-4 sm:text-3xl"
            />

            <div className="flex items-center gap-4">
              <Button type="button" onClick={check} disabled={value.trim().length === 0}>
                {t.dictation.check}
              </Button>
              <span className="text-muted-foreground text-sm" dir={dir}>
                {t.dictation.pressEnter}
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-5" aria-live="polite">
            <p
              dir={dir}
              className={cn(
                "flex items-center gap-2 text-2xl font-bold",
                result.exact ? "text-success" : "text-accent",
              )}
            >
              {result.exact && <CheckCircle2 className="size-6" aria-hidden="true" />}
              {result.exact ? t.dictation.perfect : t.dictation.almost}
            </p>

            <SentenceDiff result={result} sentence={sentence.en} textStyle={textStyle} />

            <p className="text-lg text-[var(--lesson-subtitle)] select-none" dir={dir}>
              {supportText}
            </p>

            {attempt > 0 && (
              <p className="text-muted-foreground text-sm" dir={dir}>
                {t.dictation.retryNote}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <ContinueButton onClick={next}>{t.dictation.continue}</ContinueButton>
              <RetryButton onClick={retry}>{t.dictation.retry}</RetryButton>
              <span className="text-muted-foreground text-sm" dir={dir}>
                {t.dictation.pressEnterContinue}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
