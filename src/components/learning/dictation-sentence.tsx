"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, CornerDownLeft, Gift, Lightbulb, Star } from "lucide-react";

import { DictationHelp } from "@/components/learning/dictation-help";
import { DictationStreak, type StreakMode } from "@/components/learning/dictation-streak";
import { DictationText } from "@/components/learning/dictation-text";
import {
  ContinueButton,
  RetryButton,
  SmallRetryButton,
} from "@/components/learning/feedback-actions";
import { LessonSettings } from "@/components/learning/lesson-settings";
import type { PronunciationButtonHandle } from "@/components/learning/pronunciation-button";
import { ConversationBubble, StoryHeaderRow } from "@/components/learning/sentence-chrome";
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
  advanceDictationGift,
  applyDictationInput,
  applyStrictDictationInput,
  compareDictation,
  dictationAccuracy,
  dictationAudioWords,
  dictationLetterCount,
  dictationMissStarsLost,
  dictationMistakes,
  dictationStarCapacity,
  dictationStars,
  dictationTypedPrefix,
  dictationView,
  dictationWordLengths,
  DICTATION_GIFT_EVERY,
  DICTATION_MAX_GIFTS,
  isDictationComplete,
  normalizedIndexesToRaw,
  rawDictationTokens,
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
  /** The celebration sound already played for an exact answer (on this sentence's first try or a retry), so the lesson must not play the sentence-complete sound again on Continue. */
  celebrated: boolean;
  /** Letter-by-letter mode: every letter was already reported as it was typed (onCorrectLetter / onErrorLetter), so the lesson must not add correctChars / errorChars to its tallies a second time. */
  lettersReported: boolean;
  /** Letter-by-letter mode: how many times the word was shown on the first try (0 in the exam). A sentence with none keeps the lesson's help-free streak going. */
  helps: number;
  /** Letter-by-letter mode: the sentence cost a star on the first try (the word shown, or a letter wrong three times at one blank). A sentence that used none counts towards the lesson's gift star. */
  usedStar: boolean;
}

/** Where a letter-by-letter answer stands, handed to the lesson so a sentence can carry on in the normal typing view (the learner gave up, or switched Dictation off) without losing what was typed. */
export interface DictationProgress {
  sentenceId: string;
  /** The part of the sentence typed so far, written the way the typing view's own buffer is. */
  typed: string;
  /** Words with a wrong letter (or that needed help) so far — already filtered to ones worth tracking. */
  mistakes: { word: string; errorIndexes: number[] }[];
}

interface DictationSentenceProps {
  sentence: Sentence;
  mode: LearningMode;
  resolvedVoiceId?: string | null;
  speakerVoiceMap?: Record<string, string>;
  /** Admin option: draw a blank per letter for the hidden sentence. Off, the learner only sees what they have typed. */
  showWordBlanks: boolean;
  /** The learner just switched Dictation on for this sentence: show the real text first and dissolve it into the blanks. Every later sentence starts hidden. */
  playIntro?: boolean;
  /** Server-side pre-resolved `{contentId: audioUrl}` word clips for the lesson's first sentence — the same map TypingSentence receives, so a blank's word plays instantly there too. */
  wordAudioUrls?: Record<string, string>;
  /** Same mobile "tap to start" gate TypingSentence honors — audio autoplay and input focus wait for it. */
  hasStarted?: boolean;
  onStart?: () => void;
  onAudioPlay?: () => void;
  /** Fired per keystroke so the lesson's typing sound / haptics behave like the normal engine. */
  onKeystroke?: () => void;
  /** Fired each time an answer is checked and every word is right: the lesson plays its sentence-complete sound, as when a sentence is finished by typing. */
  onExact?: () => void;
  onComplete: (outcome: DictationOutcome) => void;
  /** Check every letter the moment it is typed (the admin's letter-by-letter option) instead of grading the whole sentence on Enter. */
  letterByLetter?: boolean;
  /** Letter-by-letter mode: fired for each letter that is right / turned away, so the lesson counts, sounds and vibrates exactly as it does for the typing view. `counted` is false in a practice try (the retry button): it still sounds, but only the first try goes into the lesson's tallies. */
  onCorrectLetter?: (counted: boolean) => void;
  onErrorLetter?: (counted: boolean) => void;
  /** Letter-by-letter mode: sentences in a row the learner has finished without Show the word, before this one (shown as a chip from two). */
  helpFreeStreak?: number;
  /** Letter-by-letter mode: gift stars this lesson has earned (0–2): every sentence starts with that many stars on top of its three. */
  giftStars?: number;
  /** Letter-by-letter mode: sentences in a row finished without using a star, before this one — the run towards the next gift star. */
  giftRun?: number;
  /** Letter-by-letter mode: the learner gave up on this sentence — carry on in the normal view from what they typed. */
  onGiveUp?: (progress: DictationProgress) => void;
  /** Letter-by-letter mode: the answer after every change (null once the sentence is finished), so switching Dictation off mid-sentence can keep it too. */
  onProgress?: (progress: DictationProgress | null) => void;
  /** Stories mode only — the same header row TypingSentence draws (title, counter, step buttons, time left). */
  storyTitle?: string;
  sentenceNumber?: number;
  totalSentences?: number;
  storyTimeRemainingLabel?: string;
  onGoBack?: () => void;
  onGoForward?: () => void;
}

/** No human dictation answer is typed faster than this; anything above is a timing artifact. */
const MAX_PLAUSIBLE_WPM = 200;

/**
 * If a word's real clip hasn't arrived this long after a tap, the browser's
 * own voice says the word instead of leaving the learner in silence. Long
 * enough that a clip the preloader is still fetching (a batched request, well
 * under this) arrives first and is the only voice heard; it only ever fires for
 * a word that has never been generated, where synthesis takes seconds.
 */
const WORD_FALLBACK_MS = 2500;

/** Letter-by-letter mode: this many wrong letters in a row at the same blank bring up Show the word / Give up. */
const HELP_AFTER_MISSES = 2;
/**
 * How long Show the word keeps a word up before it starts to fade (it ends
 * sooner when the learner types its next letter). The letters rise in over
 * about half a second and dissolve over about half a second more, so the whole
 * peek is two seconds with the word fully on screen for roughly one of them.
 */
const PEEK_MS = 1500;
/** How long a turned-away letter stays on its blank, shaking, before it clears. */
const REJECTION_MS = 350;

/** The sentence's size per mode — exactly what TypingSentence uses, so switching Dictation on never resizes the text. */
const TEXT_SIZE: Record<LearningMode, string> = {
  normal: "text-3xl sm:text-[clamp(2.75rem,1.5rem+3.7vw,6rem)] lesson-sentence",
  stories:
    "font-serif max-sm:text-[2rem] text-[clamp(3rem,1.4rem+4.5vw,7rem)] lg:text-[68px] lesson-sentence",
  conversation: "text-[clamp(1.5rem,1.1rem+2.2vw,2.75rem)] lesson-sentence",
};

/**
 * The Dictation view of one sentence. It looks like the typing view — same
 * frame, same text size, same audio controls — except the letters are hidden
 * behind blanks (they dissolve into them when Dictation is switched on) and
 * there is no answer box: the learner listens (audio autoplays; Shift replays;
 * the speed control still works) and types straight onto the blanks, the whole
 * sentence, then presses Enter. Grading is word-by-word and only happens at
 * that point — deliberately NOT the keystroke engine's reject-the-wrong-letter
 * rule, because with the sentence hidden that rule would let a learner guess
 * their way through letter by letter.
 *
 * After grading the learner can continue (Enter or the button) or try the
 * same sentence again as often as they like. Only the FIRST attempt is
 * reported to the lesson: a retry is practice, and letting the last try count
 * would turn "retype what is on screen" into a way to erase a miss.
 *
 * Letter by letter (the default; an admin option turns it off) is the other
 * way to play it: every letter is checked as it is typed, the way the keystroke
 * engine checks the visible sentence, so a wrong letter never goes in. The
 * guard against guessing is that nothing is free: each wrong letter is counted
 * (it lowers the sentence's stars and the lesson's accuracy), shows in red on
 * its blank, and plays the word again, so a guess costs a listen. After two
 * wrong letters in a row at the same blank, Show the word (peek at the word for
 * a moment, or until its next letter is typed) and Give up appear. A letter wrong
 * three times at one blank costs a star; the word shown at the last star spends
 * it; three sentences in a row without using a star earn a gift star for the
 * rest of the lesson (up to five). Giving
 * up hands the sentence to the normal typing view, which carries on from what
 * was typed.
 *
 * Help while the sentence is hidden: tapping a word says it (Normal and
 * Stories, where words have their own audio) — from the same clips, loaded by
 * the same rolling window (LessonSession's word-audio window), as a word click
 * in the typing view, so a tap plays from memory here too; hovering one only
 * lights it up.
 */
export function DictationSentence({
  sentence,
  mode,
  resolvedVoiceId,
  speakerVoiceMap,
  showWordBlanks,
  playIntro = false,
  wordAudioUrls,
  hasStarted = true,
  onStart,
  onAudioPlay,
  onKeystroke,
  onExact,
  onComplete,
  letterByLetter = false,
  onCorrectLetter,
  onErrorLetter,
  helpFreeStreak = 0,
  giftStars = 0,
  giftRun = 0,
  onGiveUp,
  onProgress,
  storyTitle,
  sentenceNumber,
  totalSentences,
  storyTimeRemainingLabel,
  onGoBack,
  onGoForward,
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
  const celebratedRef = useRef(false);
  const [value, setValue] = useState("");
  const [result, setResult] = useState<DictationResult | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Letter by letter. A sentence with no letters in it has nothing to check
  // one by one (and could never be finished), so it falls back to the exam.
  const letterMode = useMemo(
    () => letterByLetter && dictationWordLengths(sentence.en).length > 0,
    [letterByLetter, sentence.en],
  );
  const finished = letterMode && isDictationComplete(sentence.en, value);
  /** A retry of a finished sentence: nothing is at stake, so no stars, no price, no streak, and nothing goes into the lesson's tallies. */
  const practice = letterMode && attempt > 0;
  /** Wrong letters turned away so far / times a word was shown. */
  const [misses, setMisses] = useState(0);
  const [helps, setHelps] = useState(0);
  /** Wrong tries per blank, and the stars they have cost: every third wrong try at the same blank takes one. */
  const missesByBlankRef = useRef<Map<string, number>>(new Map());
  const [missStarsLost, setMissStarsLost] = useState(0);
  /** The word was shown at the last star, which spent it: the sentence has no stars left. */
  const [spent, setSpent] = useState(false);
  // What the lesson had earned when this sentence began: its stars and the run
  // towards the next gift star are settled here, whatever Continue does to them.
  const [capacity] = useState(() => dictationStarCapacity(giftStars));
  const [giftAtStart] = useState(() => ({ gifts: giftStars, run: giftRun }));
  /** Wrong letters in a row at the same blank — what brings up the help. */
  const [streak, setStreak] = useState<{ word: number; letter: number; count: number } | null>(
    null,
  );
  const [rejection, setRejection] = useState<{
    word: number;
    letter: number;
    char: string;
    nonce: number;
  } | null>(null);
  const [peekWord, setPeekWord] = useState<number | null>(null);
  /** The first try at this sentence, once it is finished: the only one the lesson hears about, whatever the practice tries after it do. */
  const [first, setFirst] = useState<{
    misses: number;
    helps: number;
    missStarsLost: number;
    spent: boolean;
    wpm: number;
    correct: number;
    mistakes: { word: string; errorIndexes: number[] }[];
  } | null>(null);
  /** The pointer is on Show the word (which would end the streak), and the streak chip has said its piece. */
  const [atRisk, setAtRisk] = useState(false);
  const [streakGone, setStreakGone] = useState(false);
  const streakGoneTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /** Per graded word, the letter positions (within the word) that went wrong or needed help — what Fix Your Mistakes is told. */
  const missedLettersRef = useRef<Map<number, Set<number>>>(new Map());
  const correctLettersRef = useRef(0);
  const rejectionNonceRef = useRef(0);
  const rejectionTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const peekTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /** When the last letter went in, and the speed of the whole sentence at that moment. */
  const finishedAtRef = useRef(0);
  const finishedWpmRef = useRef(0);

  useEffect(
    () => () => {
      clearTimeout(rejectionTimerRef.current);
      clearTimeout(peekTimerRef.current);
      clearTimeout(streakGoneTimerRef.current);
    },
    [],
  );

  const sentenceVoiceId =
    (mode === "conversation" && sentence.speaker && speakerVoiceMap?.[sentence.speaker]) ||
    resolvedVoiceId;
  const supportText = sentence.supportText ?? sentence.en;

  useEffect(() => {
    if (hasStarted && !result) inputRef.current?.focus();
  }, [hasStarted, sentence.id, attempt, result]);

  // Typing always wins the keyboard while the sentence is hidden, whatever was
  // clicked last (the replay button, the speed control, a word): a character
  // key pressed with focus anywhere but a text field goes to the answer, the
  // same rule the typing engine applies. Refocusing during keydown, before the
  // browser's default action, is what lets that very keystroke land.
  useEffect(() => {
    if (result || finished) return;
    function refocus(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
      if (event.key.length !== 1 && event.key !== "Backspace") return;
      const active = document.activeElement;
      if (active === inputRef.current) return;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLElement && active.isContentEditable)
      ) {
        return;
      }
      inputRef.current?.focus();
    }
    document.addEventListener("keydown", refocus);
    return () => document.removeEventListener("keydown", refocus);
  }, [result, finished]);

  // On a short screen the buttons under a tall correction can start below the
  // fold: once the correction has settled, bring them into view (a no-op when
  // they are already visible).
  useEffect(() => {
    if (!result && !finished) return;
    const timer = setTimeout(() => {
      actionsRef.current?.scrollIntoView({
        block: "nearest",
        behavior: reducedMotion ? "auto" : "smooth",
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [result, finished, reducedMotion]);

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
  const { resolveSentenceWord, getResolvedAudio, getPlayableUrl, registerResolvedAudio } =
    usePronunciationSettings();
  const wordRequestRef = useRef(0);
  const [activeBlank, setActiveBlank] = useState<number | null>(null);
  const [resolvingWord, setResolvingWord] = useState(false);

  useEffect(() => {
    if (!wordAudioUrls) return;
    for (const [contentId, url] of Object.entries(wordAudioUrls)) {
      registerResolvedAudio(contentId, url);
    }
  }, [wordAudioUrls, registerResolvedAudio]);

  function wordContentId(blankIndex: number): string | null {
    const key = audioWords[blankIndex];
    return key ? `${sentence.id}::${key}` : null;
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
    const url = known
      ? getPlayableUrl(known)
      : await resolveSentenceWord({
          sentenceId: sentence.id,
          text: sentence.en,
          voiceId: sentenceVoiceId,
          key,
        });
    clearTimeout(fallbackTimer);

    // A newer tap took over while this one was resolving.
    if (request !== wordRequestRef.current) return;
    setResolvingWord(false);
    if (spokeFallback) return; // the browser voice is already saying it; the real clip is cached for the next tap
    if (url) wordClip.play(url);
    else speakFallback();
  }

  function handleBlankClick(blankIndex: number) {
    void playWord(blankIndex);
    // Keep typing uninterrupted: the tap must not leave focus on the blank.
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  // --- Letter by letter -----------------------------------------------------
  function clearPeek() {
    clearTimeout(peekTimerRef.current);
    setPeekWord(null);
  }

  function startPeek(word: number) {
    clearTimeout(peekTimerRef.current);
    setPeekWord(word);
    peekTimerRef.current = setTimeout(() => setPeekWord(null), PEEK_MS);
  }

  /** The words that went wrong so far, in sentence order, as Fix Your Mistakes records them (letter positions mapped back onto the printed word). */
  function collectMistakes(): { word: string; errorIndexes: number[] }[] {
    const tokens = rawDictationTokens(sentence.en);
    return [...missedLettersRef.current.entries()]
      .sort(([a], [b]) => a - b)
      .map(([word, letters]) => {
        const raw = tokens[word] ?? "";
        return {
          word: raw,
          errorIndexes: normalizedIndexesToRaw(
            raw,
            [...letters].sort((a, b) => a - b),
          ),
        };
      })
      .filter((mistake) => mistake.word !== "" && isMistakeWorthTracking(mistake.word));
  }

  function progressAt(answer: string): DictationProgress {
    return {
      sentenceId: sentence.id,
      typed: dictationTypedPrefix(sentence.en, answer),
      mistakes: collectMistakes(),
    };
  }

  function noteMissedLetter(word: number, letter: number) {
    const letters = missedLettersRef.current.get(word) ?? new Set<number>();
    letters.add(letter);
    missedLettersRef.current.set(word, letters);
  }

  function handleLetterInput(nextValue: string) {
    if (finished) return;
    const step = applyStrictDictationInput(sentence.en, value, nextValue);
    const changed = step.value !== value;
    if (!changed && step.rejected === null) return;
    if (startedAtRef.current === null && (step.value.length > 0 || step.rejected !== null)) {
      startedAtRef.current = Date.now();
    }

    if (changed) {
      setValue(step.value);
      const gained = dictationLetterCount(step.value) - dictationLetterCount(value);
      if (gained > 0) {
        // The next letter is in: whatever was holding the learner up is over.
        setStreak(null);
        clearPeek();
        correctLettersRef.current += gained;
        for (let letter = 0; letter < gained; letter++) onCorrectLetter?.(!practice);
      } else if (step.value.length < value.length) {
        setStreak(null);
      }
    }

    if (step.rejected !== null && step.at !== null) {
      const { word, letter } = step.at;
      noteMissedLetter(word, letter);
      setMisses((count) => count + 1);
      const blank = `${word}:${letter}`;
      missesByBlankRef.current.set(blank, (missesByBlankRef.current.get(blank) ?? 0) + 1);
      setMissStarsLost(dictationMissStarsLost(missesByBlankRef.current.values()));
      setStreak((current) =>
        current && current.word === word && current.letter === letter
          ? { ...current, count: current.count + 1 }
          : { word, letter, count: 1 },
      );
      rejectionNonceRef.current += 1;
      setRejection({ word, letter, char: step.rejected, nonce: rejectionNonceRef.current });
      clearTimeout(rejectionTimerRef.current);
      rejectionTimerRef.current = setTimeout(() => setRejection(null), REJECTION_MS);
      onErrorLetter?.(!practice);
      // A guess costs a listen: the word is said again.
      void playWord(word);
    }

    if (isDictationComplete(sentence.en, step.value)) {
      const elapsed = startedAtRef.current === null ? 0 : Date.now() - startedAtRef.current;
      finishedAtRef.current = Date.now();
      finishedWpmRef.current = Math.min(
        MAX_PLAUSIBLE_WPM,
        calculateWpm(correctLettersRef.current, elapsed),
      );
      clearPeek();
      setStreak(null);
      setRejection(null);
      if (!practice) {
        setFirst({
          misses,
          helps,
          missStarsLost,
          spent,
          wpm: finishedWpmRef.current,
          correct: correctLettersRef.current,
          mistakes: collectMistakes(),
        });
      }
      if (misses === 0 && helps === 0) {
        celebratedRef.current = true;
        onExact?.();
      }
      onProgress?.(null);
      return;
    }
    // A practice try is never handed over to the typing view: the first try's
    // results are already settled and would be lost with it.
    onProgress?.(practice ? null : progressAt(step.value));
  }

  function handleShowWord() {
    const word = view.cursor?.word;
    if (word === undefined || finished) return;
    // The first help of a first try ends the streak: its chip shows that for a
    // moment and then leaves.
    if (!practice && helps === 0) {
      clearTimeout(streakGoneTimerRef.current);
      streakGoneTimerRef.current = setTimeout(() => setStreakGone(true), 2600);
    }
    setHelps((count) => count + 1);
    // The word shown at the last star spends it: the sentence's stars are gone.
    if (!practice && liveStars <= 1) setSpent(true);
    noteMissedLetter(word, view.cursor?.letter ?? 0);
    startPeek(word);
    // Said as well as shown.
    void playWord(word);
    onProgress?.(practice ? null : progressAt(value));
    inputRef.current?.focus();
  }

  /** Reports the first try to the lesson — whichever way the learner leaves the sentence, and however many practice tries came after it. */
  function finishWithFirstTry() {
    if (!first) return;
    onComplete({
      wpm: first.wpm,
      correctChars: first.correct,
      errorChars: first.misses,
      accuracy:
        first.correct + first.misses === 0 ? 1 : first.correct / (first.correct + first.misses),
      mistakes: first.mistakes,
      exact: first.misses === 0 && first.helps === 0,
      celebrated: celebratedRef.current,
      lettersReported: true,
      helps: first.helps,
      usedStar: first.missStarsLost + first.helps > 0,
    });
  }

  function handleGiveUp() {
    clearPeek();
    // In a practice try there is nothing to hand over: leaving it is just moving on.
    if (practice) finishWithFirstTry();
    else onGiveUp?.(progressAt(value));
  }

  function nextAfterLetters() {
    if (finished) finishWithFirstTry();
  }

  /** Type the finished sentence again as practice: fresh blanks, the audio again, nothing at stake. */
  function retrySentence() {
    clearTimeout(rejectionTimerRef.current);
    clearPeek();
    startedAtRef.current = null;
    finishedAtRef.current = 0;
    correctLettersRef.current = 0;
    missedLettersRef.current = new Map();
    missesByBlankRef.current = new Map();
    setValue("");
    setMisses(0);
    setHelps(0);
    setMissStarsLost(0);
    setSpent(false);
    setStreak(null);
    setRejection(null);
    setAttempt((count) => count + 1);
    pronunciationRef.current?.replay();
  }

  // Enter in the answer: checks the exam; in letter mode only continues, and
  // not within a moment of the last letter (a reflex Enter must not skip the
  // result unread).
  function handleEnter() {
    if (!letterMode) {
      check();
      return;
    }
    if (finished && Date.now() - finishedAtRef.current > 250) nextAfterLetters();
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
    if (graded.exact) {
      celebratedRef.current = true;
      onExact?.();
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
      celebrated: celebratedRef.current,
      lettersReported: false,
      helps: 0,
      usedStar: false,
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

  // Enter checks while typing (DictationText calls check); once the
  // correction is on screen it continues, wherever focus is.
  useEnterToContinue(letterMode ? finished : result !== null, letterMode ? nextAfterLetters : next);

  // The system, not the learner, decides where each word ends (see
  // applyDictationInput): a word that has all its letters hands over to the
  // next one by itself. An input that changes nothing is dropped, which snaps
  // the field back to the accepted answer, like a rejected keystroke in the
  // typing view.
  function handleChange(nextValue: string) {
    if (letterMode) {
      handleLetterInput(nextValue);
      return;
    }
    const accepted = applyDictationInput(showWordBlanks ? sentence.en : "", value, nextValue);
    if (accepted === value) return;
    if (startedAtRef.current === null && accepted.length > 0) startedAtRef.current = Date.now();
    setValue(accepted);
    onKeystroke?.();
  }

  const view = useMemo(
    () => dictationView(showWordBlanks ? sentence.en : "", value),
    [showWordBlanks, sentence.en, value],
  );
  const anyBlankAudio = wordAudioEnabled && audioWords.some((key) => key !== null);
  const wordBusy = resolvingWord || wordClip.status === "loading" || wordClip.status === "playing";
  const listenLabel =
    mode === "conversation" && sentence.speaker
      ? `${sentence.speaker} · ${t.dictation.listenAndType}`
      : t.dictation.listenAndType;
  const canCheck = value.trim().length > 0;

  const audioControls = (
    <LessonSettings
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
    />
  );

  // The hidden sentence itself, where the typing view draws the real one.
  const text = (
    <DictationText
      // A retry starts from fresh blanks, drawn in again.
      key={attempt}
      view={view}
      value={value}
      inputRef={inputRef}
      onChange={handleChange}
      onEnter={handleEnter}
      ariaLabel={t.dictation.inputLabel}
      showBlanks={showWordBlanks}
      playIntro={playIntro && attempt === 0}
      reducedMotion={reducedMotion}
      textClassName={TEXT_SIZE[mode]}
      textStyle={textStyle}
      rejection={letterMode ? rejection : null}
      peekWord={letterMode ? peekWord : null}
      finished={finished}
      words={
        wordAudioEnabled
          ? {
              hasAudio: (word) => audioWords[word] != null,
              label: (word) => t.dictation.hearWord.replace("{n}", String(word + 1)),
              onTap: handleBlankClick,
              litWord: wordBusy ? activeBlank : null,
              litPulse: resolvingWord,
            }
          : undefined
      }
    />
  );

  // What sits under the sentence while it is hidden, in the spot the
  // translation has in the typing view (the translation would give it away).
  const listening = (
    <>
      <p
        className={cn(
          "text-[var(--lesson-subtitle)] select-none",
          mode === "conversation" ? "mt-4 text-base" : "mt-6 text-lg",
        )}
        dir={dir}
      >
        {listenLabel}
      </p>
      {anyBlankAudio && (
        <p className="text-muted-foreground mt-1.5 text-sm select-none" dir={dir}>
          {t.dictation.blankHint}
        </p>
      )}
      {practice && (
        <p className="text-muted-foreground mt-1.5 text-sm select-none" dir={dir}>
          {t.dictation.retryNote}
        </p>
      )}
    </>
  );

  // Letter by letter: Show the word / Give up, once the learner is stuck at one
  // blank. The strip keeps its height while empty so the sentence never jumps
  // when it appears.
  const stuck = letterMode && !finished && (streak?.count ?? 0) >= HELP_AFTER_MISSES;
  const liveStars = dictationStars(capacity, missStarsLost + helps, spent);
  const helpStrip = letterMode && (
    <div
      className={cn(
        "flex min-h-[6.5rem] items-center sm:min-h-14",
        mode === "conversation" ? "mt-3" : "mt-5 justify-center",
      )}
    >
      <span className="sr-only" role="status">
        {rejection ? t.dictation.wrongLetter : ""}
      </span>
      {stuck && (
        <DictationHelp
          dir={dir}
          prompt={t.dictation.stuckPrompt}
          stars={liveStars}
          maxStars={capacity}
          showStakes={!practice}
          starsLabel={t.dictation.starsLabel}
          lastStarCosts
          hintStaysOpen
          stablePrice
          noStarsLabel={t.dictation.noStars}
          onShowWord={showWordBlanks ? handleShowWord : undefined}
          showWordLabel={t.dictation.help}
          showWordTitle={t.dictation.helpTitle}
          showingWord={peekWord !== null}
          costLabel={t.dictation.costLabel}
          costRecorded={t.dictation.costRecorded}
          onRiskChange={setAtRisk}
          onGiveUp={practice || onGiveUp ? handleGiveUp : undefined}
          giveUpLabel={t.dictation.giveUp}
          giveUpTitle={t.dictation.giveUpTitle}
        />
      )}
    </div>
  );

  // Letter by letter, the end of a sentence: how it went, what it means (the
  // translation was hidden while it would have given the answer away), and the
  // way on. The sentence itself stays where it was, filled in.
  // What the panel shows is always the first try, the one that counts, even
  // after practice tries.
  const counted = first ?? { misses, helps, missStarsLost, spent };
  const clean = counted.misses === 0 && counted.helps === 0;
  const stars = dictationStars(capacity, counted.missStarsLost + counted.helps, counted.spent);
  const gift = advanceDictationGift(giftAtStart, counted.missStarsLost + counted.helps > 0);
  const finishedPanel = finished && (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("flex flex-col gap-5", mode === "conversation" ? "mt-4" : "mt-7")}
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-3">
        <p
          dir={dir}
          className={cn(
            "inline-flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-lg font-bold ring-1",
            clean
              ? "bg-success/15 text-success ring-success/30"
              : "bg-accent/15 text-accent ring-accent/30",
          )}
        >
          {clean && <CheckCircle2 className="size-5" aria-hidden="true" />}
          {clean ? t.dictation.perfect : t.dictation.done}
        </p>
        <div
          role="img"
          aria-label={t.dictation.starsLabel
            .replace("{n}", String(stars))
            .replace("{max}", String(capacity))}
          className="flex items-center gap-1"
        >
          {Array.from({ length: capacity }, (_unused, index) => index + 1).map((star) => (
            <Star
              key={star}
              aria-hidden="true"
              className={cn(
                "size-6",
                star <= stars ? "fill-accent text-accent" : "text-muted-foreground/40",
              )}
            />
          ))}
        </div>
        {stars === 0 && (
          <span
            className="bg-danger/10 text-danger inline-flex items-center rounded-full px-3 py-0.5 text-sm font-medium"
            dir={dir}
          >
            {t.dictation.noStars}
          </span>
        )}
        {counted.misses > 0 && (
          <span
            className="bg-muted text-muted-foreground inline-flex items-center rounded-full px-3 py-0.5 text-sm"
            dir={dir}
          >
            {t.dictation.mistakeCount.replace("{n}", String(counted.misses))}
          </span>
        )}
        {counted.helps > 0 && (
          <span
            className="bg-accent/15 text-accent inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-sm font-medium"
            dir={dir}
          >
            <Lightbulb className="size-3.5" aria-hidden="true" />
            {t.dictation.helpCount.replace("{n}", String(counted.helps))}
          </span>
        )}
        {gift.earned ? (
          <motion.span
            initial={reducedMotion ? false : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 360, damping: 14, delay: 0.25 }}
            className="bg-success/15 text-success ring-success/30 inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-sm font-semibold ring-1"
            dir={dir}
          >
            <Gift className="size-3.5" aria-hidden="true" />
            {t.dictation.giftEarned.replace("{n}", String(dictationStarCapacity(gift.gifts)))}
          </motion.span>
        ) : (
          giftAtStart.gifts < DICTATION_MAX_GIFTS &&
          counted.missStarsLost + counted.helps === 0 && (
            <span
              className="bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-sm"
              dir={dir}
            >
              <Gift className="size-3.5" aria-hidden="true" />
              {t.dictation.giftProgress
                .replace("{n}", String(gift.run))
                .replace("{total}", String(DICTATION_GIFT_EVERY))}
            </span>
          )
        )}
      </div>

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
        <ContinueButton onClick={nextAfterLetters}>{t.dictation.continue}</ContinueButton>
        <SmallRetryButton onClick={retrySentence} title={t.dictation.retrySentenceTitle}>
          {t.dictation.retrySentence}
        </SmallRetryButton>
        <span className="text-muted-foreground flex items-center gap-1.5 text-sm" dir={dir}>
          <CornerDownLeft className="size-3.5" aria-hidden="true" />
          {t.dictation.pressEnterContinue}
        </span>
      </div>
    </motion.div>
  );

  const checkRow = (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3",
        mode === "conversation" ? "mt-5" : "mt-7 justify-center",
      )}
    >
      <Button type="button" size="lg" onClick={check} disabled={!canCheck} className="gap-2">
        {t.dictation.check}
        <CornerDownLeft aria-hidden="true" />
      </Button>
      <span className="text-muted-foreground flex items-center gap-1.5 text-sm" dir={dir}>
        <CornerDownLeft className="size-3.5" aria-hidden="true" />
        {t.dictation.pressEnter}
      </span>
    </div>
  );

  const correction = result && (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative flex flex-col gap-6"
      aria-live="polite"
    >
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
    </motion.div>
  );

  // The streak chip, in the lesson's top corner beside the audio controls: it
  // shows from the second help-free sentence, is the one the learner's pointer
  // warns when it reaches Show the word, and ends when the word is shown.
  const helpedFirstTry = first ? first.helps > 0 : attempt === 0 && helps > 0;
  const streakCount = helpedFirstTry ? helpFreeStreak : helpFreeStreak + (first ? 1 : 0);
  const streakMode: StreakMode = helpedFirstTry
    ? "broke"
    : atRisk && !finished && !practice
      ? "risk"
      : "steady";
  const streakChip = (
    <AnimatePresence>
      {letterMode && !streakGone && streakCount >= 2 && (
        <DictationStreak
          key="streak"
          count={streakCount}
          mode={streakMode}
          compact={mode === "conversation"}
          label={t.dictation.streakLabel}
          riskLabel={t.dictation.streakRisk}
          brokenLabel={t.dictation.streakBroken}
          ariaLabel={t.dictation.streakAria.replace("{n}", String(streakCount))}
        />
      )}
    </AnimatePresence>
  );

  const tapToStart = !hasStarted && (
    <TapToStartOverlay
      heading={t.lesson.tapToStartHeading}
      body={t.lesson.tapToStartBody}
      onStart={() => {
        inputRef.current?.focus();
        onStart?.();
      }}
    />
  );

  // Conversation: the sentence sits in its chat bubble, exactly where the
  // typing view puts it, and the correction takes the sentence's place inside
  // it. The audio controls keep their spot across both states, so the replay
  // button is never remounted (which would autoplay the clip again).
  if (mode === "conversation") {
    return (
      <div className="relative">
        {tapToStart}
        <ConversationBubble speaker={sentence.speaker}>
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">{result ? correction : text}</div>
            <div className="flex shrink-0 items-center gap-2">
              {streakChip}
              {audioControls}
            </div>
          </div>
          {letterMode ? (
            finished ? (
              finishedPanel
            ) : (
              <>
                {listening}
                {helpStrip}
              </>
            )
          ) : (
            <>
              {!result && listening}
              {!result && checkRow}
            </>
          )}
        </ConversationBubble>
      </div>
    );
  }

  const body: ReactNode = letterMode ? (
    <>
      {text}
      {finished ? (
        finishedPanel
      ) : (
        <>
          {listening}
          {helpStrip}
        </>
      )}
    </>
  ) : result ? (
    correction
  ) : (
    <>
      {text}
      {listening}
      {checkRow}
    </>
  );

  return (
    <div className="relative lg:flex lg:h-full lg:flex-col">
      {tapToStart}
      {mode === "stories" && (
        <StoryHeaderRow
          storyTitle={storyTitle}
          sentenceNumber={sentenceNumber}
          totalSentences={totalSentences}
          storyTimeRemainingLabel={storyTimeRemainingLabel}
          onGoBack={onGoBack}
          onGoForward={onGoForward}
        />
      )}
      <div className="mb-4 flex items-center justify-end gap-2">
        {streakChip}
        {audioControls}
      </div>
      <div className="lg:flex lg:flex-1 lg:flex-col lg:justify-center">{body}</div>
    </div>
  );
}
