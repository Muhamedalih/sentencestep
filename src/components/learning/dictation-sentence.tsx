"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, CornerDownLeft, Headphones, Keyboard, Loader2, Volume2 } from "lucide-react";

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
import { useSpeech } from "@/hooks/use-speech";
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

/** How long the mouse rests on a blank before its word's clip is quietly fetched in the background (no sound: hovering only lights the blank up). */
const HOVER_WARM_MS = 250;

/**
 * If a word's real clip hasn't arrived this long after a tap, the browser's
 * own voice says the word right away instead of leaving the learner in
 * silence: resolving a clip that has never been generated takes seconds.
 */
const WORD_FALLBACK_MS = 1000;

/** Shared look of the cards' outer stage. */
const STAGE =
  "relative flex flex-col gap-6 overflow-hidden rounded-[28px] border border-border/60 bg-card/60 p-5 shadow-[0_24px_70px_-30px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-8 [@media(max-height:760px)]:gap-4 [@media(max-height:760px)]:sm:p-6";

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
 * Help while the sentence is hidden: every blank is a word-shaped pill.
 * Hovering one only lights it up (and quietly prepares that word's audio);
 * tapping it says the word (Normal and Stories, where words have their own
 * audio).
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
  const reducedMotion = useReducedMotion() ?? false;
  const sectionFontFamily = resolveSectionFontFamily(useLessonFontSettings(), mode);
  const textStyle = sectionFontFamily ? { fontFamily: sectionFontFamily } : undefined;
  const inputRef = useRef<HTMLInputElement>(null);
  const pronunciationRef = useRef<PronunciationButtonHandle>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
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

  // On a short screen the buttons under a tall correction can start below the
  // fold: once the card has settled, bring them into view (a no-op when they
  // are already visible).
  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(() => {
      actionsRef.current?.scrollIntoView({
        block: "nearest",
        behavior: reducedMotion ? "auto" : "smooth",
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [result, reducedMotion]);

  // --- Word audio on the blanks -------------------------------------------
  // Same clips, same resolve path and same voice rule as a word click in the
  // normal typing view (TypingSentence.handleWordClick): never a different
  // voice than the sentence itself. Conversation lessons have no per-word
  // audio, so their blanks stay plain.
  const audioWords = useMemo(() => dictationAudioWords(sentence.en), [sentence.en]);
  const wordAudioEnabled =
    showWordBlanks && (mode === "normal" || mode === "stories") && Boolean(sentenceVoiceId);
  const wordClip = useAudioClip();
  const speech = useSpeech();
  const { resolveAudio, getResolvedAudio, prefetchPronunciation, registerResolvedAudio } =
    usePronunciationSettings();
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

  useEffect(() => () => clearTimeout(hoverTimerRef.current), []);

  function wordContentId(blankIndex: number): string | null {
    const key = audioWords[blankIndex];
    return key ? `${sentence.id}::${key}` : null;
  }

  // Deliberately NOT a bulk prefetch of every word when the sentence appears:
  // that fired a dozen server calls at once, each a possible speech synthesis
  // (see resolvePronunciationAudioAction's rate limit), queued one behind the
  // other with the learner's own tap stuck at the back. A word is prepared
  // only when the mouse actually rests on it.
  function handleBlankPointerEnter(blankIndex: number, event: ReactPointerEvent) {
    if (event.pointerType === "touch" || !sentenceVoiceId) return;
    const contentId = wordContentId(blankIndex);
    if (!contentId || getResolvedAudio(contentId)) return;
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      prefetchPronunciation({ contentType: "sentence_word", contentId, voiceId: sentenceVoiceId });
    }, HOVER_WARM_MS);
  }

  async function playWord(blankIndex: number) {
    const contentId = wordContentId(blankIndex);
    const key = audioWords[blankIndex];
    if (!wordAudioEnabled || !contentId || !key || !sentenceVoiceId) return;

    const request = ++wordRequestRef.current;
    setActiveBlank(blankIndex);
    setResolvingWord(true);
    // Never talk over the sentence, and cut off the previous word at once.
    pronunciationRef.current?.stop();
    wordClip.stop();
    speech.stopSpeech();

    let spokeFallback = false;
    const speakFallback = () => {
      if (request !== wordRequestRef.current || spokeFallback) return;
      spokeFallback = true;
      speech.speakWord(key);
    };

    const known = getResolvedAudio(contentId);
    const fallbackTimer = known ? undefined : setTimeout(speakFallback, WORD_FALLBACK_MS);
    const url =
      known ??
      (await resolveAudio({ contentType: "sentence_word", contentId, voiceId: sentenceVoiceId }));
    clearTimeout(fallbackTimer);

    // A newer tap took over while this one was resolving.
    if (request !== wordRequestRef.current) return;
    setResolvingWord(false);
    if (spokeFallback) return; // the browser voice is already saying it; the real clip is cached for the next tap
    if (url) wordClip.play(url);
    else speakFallback();
  }

  function handleBlankClick(blankIndex: number) {
    clearTimeout(hoverTimerRef.current);
    void playWord(blankIndex);
    // Keep typing uninterrupted: the tap must not leave focus on the blank.
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
  const listenLabel =
    mode === "conversation" && sentence.speaker
      ? `${sentence.speaker} · ${t.dictation.listenAndType}`
      : t.dictation.listenAndType;
  const canCheck = value.trim().length > 0;

  return (
    <div className="relative lg:flex lg:h-full lg:flex-col lg:justify-center">
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

      <motion.section
        initial={reducedMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className={STAGE}
      >
        {/* A soft glow behind the header — pure decoration. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 left-1/2 h-56 w-3/4 -translate-x-1/2 rounded-full bg-[var(--lesson-primary)]/15 blur-3xl"
        />

        <header className="relative flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--lesson-secondary)] text-[var(--lesson-icon)] ring-1 ring-[var(--lesson-primary)]/30">
              <Headphones className="size-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p
                dir={dir}
                className="text-lg leading-tight font-bold text-[var(--lesson-title)] sm:text-xl"
              >
                {t.dictation.toggleLabel}
              </p>
              {!result && (
                <p dir={dir} className="text-muted-foreground mt-0.5 text-sm leading-snug">
                  {listenLabel}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
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
        </header>

        {!result ? (
          <div className="relative flex flex-col gap-5">
            {blanks.length > 0 && (
              <div className="flex flex-col gap-3">
                <div
                  aria-hidden={anyBlankAudio ? undefined : true}
                  dir="ltr"
                  className="flex flex-wrap gap-2.5 sm:gap-3"
                  style={textStyle}
                >
                  {blanks.map((length, wordIndex) => {
                    const hasAudio = wordAudioEnabled && audioWords[wordIndex] != null;
                    const lit = hasAudio && activeBlank === wordIndex && wordBusy;
                    const letters = Array.from({ length }, (_unused, letterIndex) => (
                      <span
                        key={letterIndex}
                        className={cn(
                          "border-foreground/35 block h-6 w-3.5 border-b-[3px] transition-colors sm:h-7 sm:w-4",
                          hasAudio && "group-hover:border-[var(--lesson-primary)]",
                          lit && "border-[var(--lesson-primary)]",
                        )}
                      />
                    ));
                    const pill =
                      "border-border/60 bg-background/50 relative inline-flex items-end gap-1 rounded-2xl border px-3 pt-3.5 pb-3";
                    if (!hasAudio) {
                      return (
                        <span key={wordIndex} className={pill}>
                          {letters}
                        </span>
                      );
                    }
                    return (
                      <button
                        key={wordIndex}
                        type="button"
                        // Tapped with the mouse or a finger only: keyboard users
                        // stay in the answer box (Shift already replays the sentence).
                        tabIndex={-1}
                        aria-label={t.dictation.hearWord.replace("{n}", String(wordIndex + 1))}
                        onClick={() => handleBlankClick(wordIndex)}
                        onPointerEnter={(event) => handleBlankPointerEnter(wordIndex, event)}
                        onPointerLeave={() => clearTimeout(hoverTimerRef.current)}
                        className={cn(
                          pill,
                          "group cursor-pointer transition-all duration-200",
                          "hover:-translate-y-0.5 hover:border-[var(--lesson-primary)] hover:bg-[var(--lesson-secondary)] hover:shadow-[var(--lesson-primary)]/15 hover:shadow-lg",
                          "active:translate-y-0 active:scale-95",
                          lit &&
                            "border-[var(--lesson-primary)] bg-[var(--lesson-secondary)] shadow-[var(--lesson-primary)]/20 shadow-lg",
                        )}
                      >
                        {letters}
                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute -top-2.5 -right-2 grid size-6 scale-75 place-items-center rounded-full bg-[var(--lesson-primary)] text-white opacity-0 shadow-md transition-all duration-200",
                            "group-hover:scale-100 group-hover:opacity-100",
                            lit && "scale-100 opacity-100",
                          )}
                        >
                          {resolvingWord && lit ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Volume2 className="size-3.5" />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {anyBlankAudio && (
                  <p dir={dir} className="text-muted-foreground text-sm">
                    {t.dictation.blankHint}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <div className="relative flex flex-col gap-3 sm:block">
                <Keyboard
                  aria-hidden="true"
                  className="text-muted-foreground pointer-events-none absolute top-8 left-5 hidden size-5 -translate-y-1/2 sm:block"
                />
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
                  className="border-border/70 bg-background/70 placeholder:text-muted-foreground/70 h-16 w-full rounded-2xl border-2 px-5 text-2xl shadow-inner transition-shadow outline-none focus-visible:border-[var(--lesson-primary)] focus-visible:ring-4 focus-visible:ring-[var(--lesson-primary)]/25 sm:pr-40 sm:pl-14 sm:text-3xl"
                />
                <Button
                  type="button"
                  size="lg"
                  onClick={check}
                  disabled={!canCheck}
                  className="w-full sm:absolute sm:inset-y-2 sm:right-2 sm:h-auto sm:w-auto sm:rounded-xl"
                >
                  {t.dictation.check}
                  <CornerDownLeft aria-hidden="true" />
                </Button>
              </div>
              <span className="text-muted-foreground flex items-center gap-1.5 text-sm" dir={dir}>
                <CornerDownLeft className="size-3.5" aria-hidden="true" />
                {t.dictation.pressEnter}
              </span>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col gap-6" aria-live="polite">
            <p
              dir={dir}
              className={cn(
                "inline-flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-lg font-bold ring-1",
                result.exact
                  ? "bg-success/15 text-success ring-success/30"
                  : "bg-accent/15 text-accent ring-accent/30",
              )}
            >
              {result.exact && <CheckCircle2 className="size-5" aria-hidden="true" />}
              {result.exact ? t.dictation.perfect : t.dictation.almost}
            </p>

            <SentenceDiff result={result} sentence={sentence.en} textStyle={textStyle} bare />

            <p
              className="border-border/60 rounded-xl border border-dashed px-4 py-3 text-lg text-[var(--lesson-subtitle)] select-none"
              dir={dir}
            >
              {supportText}
            </p>

            {attempt > 0 && (
              <p className="text-muted-foreground -mt-2 text-sm" dir={dir}>
                {t.dictation.retryNote}
              </p>
            )}

            <div ref={actionsRef} className="flex flex-wrap items-center gap-3">
              <ContinueButton onClick={next}>{t.dictation.continue}</ContinueButton>
              <RetryButton onClick={retry}>{t.dictation.retry}</RetryButton>
              <span className="text-muted-foreground flex items-center gap-1.5 text-sm" dir={dir}>
                <CornerDownLeft className="size-3.5" aria-hidden="true" />
                {t.dictation.pressEnterContinue}
              </span>
            </div>
          </div>
        )}
      </motion.section>
    </div>
  );
}
