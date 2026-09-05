"use client";

import { useEffect, useRef } from "react";
import { BookOpen } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { CurrentWordCard } from "@/components/learning/current-word-card";
import { PronunciationButton } from "@/components/learning/pronunciation-button";
import { PronunciationSpeedControl } from "@/components/learning/pronunciation-speed-control";
import { TypingStats } from "@/components/learning/typing-stats";
import { TypingText } from "@/components/learning/typing-text";
import { useLocale } from "@/components/providers/locale-provider";
import { useLessonFontSettings } from "@/components/providers/lesson-font-settings-provider";
import { usePronunciationSettings } from "@/components/providers/pronunciation-settings-provider";
import { useAudioClip } from "@/hooks/use-audio-clip";
import { useSpeech } from "@/hooks/use-speech";
import { useTypingEngine } from "@/hooks/use-typing-engine";
import { resolveSectionFontFamily } from "@/lib/admin/lesson-font-settings";
import {
  isMistakeWorthTracking,
  isTrackableWord,
  normalizeMistakeWord,
} from "@/lib/mistakes/normalize";
import { getCurrentWordIndex, locateWordAtCharIndex, tokenize } from "@/lib/typing";
import { cn } from "@/lib/utils";
import type { LearningMode, Sentence } from "@/types/content";

interface TypingSentenceProps {
  sentence: Sentence;
  mode: LearningMode;
  /** Called with this sentence's final WPM once its completion delay elapses. */
  onComplete: (wpm: number) => void;
  onCorrectLetter: () => void;
  onErrorLetter?: () => void;
  onAudioPlay?: () => void;
  /**
   * Fired once, right before onComplete, only when at least one word in
   * this sentence had a wrong keystroke — never per keystroke or per error
   * (see the ref below): "Fix Your Mistakes" registers a word the moment
   * the sentence it was mistyped in is finished, not on every wrong
   * character, which is what keeps this from becoming a database write per
   * keystroke. Words are raw (un-normalized) tokens; normalization happens
   * server-side (see recordSentenceMistakesAction). `errorIndexes` are every
   * distinct wrong-keystroke position within that raw word token itself
   * (not the whole sentence) — what Fix Your Mistakes' red-letter hint is
   * keyed on (see record_mistake's error_indexes column).
   */
  onSentenceMistakes?: (
    sentenceId: string,
    words: { word: string; errorIndexes: number[] }[],
  ) => void;
  /** This lesson's already-resolved voice (lesson.voiceId ?? globalDefaultVoiceId) — see resolveVoiceId. Null means no Kokoro voice applies; PronunciationButton behaves exactly as it always has. */
  resolvedVoiceId?: string | null;
  /** Conversation-mode speaker -> voice_id overrides (see lesson_speaker_voices) — empty/undefined for every other mode, in which case sentenceVoiceId below always falls through to resolvedVoiceId. */
  speakerVoiceMap?: Record<string, string>;
  /** Stories mode only — the lesson's own title, shown in the header row so a learner mid-story still sees which one they're in (previously only screen-reader-only, via LessonSession's own <h1>). Unused by every other mode. */
  storyTitle?: string;
  /** Stories mode only — 1-based position and lesson total, merged into this component's own header row instead of LessonSession's separate counter row (see that component's doc comment). Also drives the small progress ring around the book icon. */
  sentenceNumber?: number;
  totalSentences?: number;
  /** Stories mode only — LessonSession's pre-formatted "~n min left" string (see its own storyTimeRemainingLabel), already localized; this component never computes or formats it itself. */
  storyTimeRemainingLabel?: string;
}

export function TypingSentence({
  sentence,
  mode,
  onComplete,
  onCorrectLetter,
  onErrorLetter,
  onAudioPlay,
  onSentenceMistakes,
  resolvedVoiceId,
  speakerVoiceMap,
  storyTitle,
  sentenceNumber,
  totalSentences,
  storyTimeRemainingLabel,
}: TypingSentenceProps) {
  // This exact sentence's voice: a Conversation speaker's assigned voice
  // when one exists, otherwise the lesson-wide resolvedVoiceId (unchanged
  // behavior for Normal/Stories, and for a Conversation speaker with no
  // assignment yet). Named distinctly from the `kokoroVoiceId` prop below
  // it feeds — that prop name predates ElevenLabs and is now misleading
  // (it's "the resolved voice for this sentence, whichever provider"), but
  // is left as-is to keep this diff small.
  const sentenceVoiceId =
    (mode === "conversation" && sentence.speaker && speakerVoiceMap?.[sentence.speaker]) ||
    resolvedVoiceId;
  const reducedMotion = useReducedMotion() ?? false;
  const { dir, t } = useLocale();
  // Admin -> Fonts' per-section override (see resolveSectionFontFamily) —
  // `mode` is exactly a LearningSection value ("normal"/"stories"/
  // "conversation"), so this reads directly off it. undefined (no admin
  // override for this section) leaves every mode's font exactly as it was
  // before this setting existed, Stories' own font-serif utility included.
  const sectionFontFamily = resolveSectionFontFamily(useLessonFontSettings(), mode);
  const textStyle = sectionFontFamily ? { fontFamily: sectionFontFamily } : undefined;
  // The support-language translation for the CURRENT locale, resolved
  // server-side (see fetchLessons'/fetchLessonById's optional `locale`
  // param and Sentence.supportText's doc comment in types/content.ts).
  // Falls back to the English sentence itself — NEVER to `sentence.ar` —
  // when no translation exists yet for the active locale (e.g. Spanish
  // content not authored yet): showing Arabic under a Spanish-selected UI
  // would be silently wrong, whereas English is always literally true and
  // the fetch layer already logs a dev-only warning for this exact case.
  const supportText = sentence.supportText ?? sentence.en;
  // A fresh Map per TypingSentence instance — this component remounts once
  // per sentence (see its `key={sentence.id}` in LessonSession), so no
  // explicit reset-on-resetKey-change is needed; a brand new ref is exactly
  // "this sentence attempt's mistakes so far," keyed on the raw word token
  // with every distinct word-relative wrong-keystroke position seen this
  // attempt (a Set, since retyping the same wrong position twice — e.g.
  // after a shake-and-retry — must still only count once).
  const mistakeWordsRef = useRef<Map<string, Set<number>>>(new Map());

  function handleComplete(wpm: number) {
    if (mistakeWordsRef.current.size > 0) {
      onSentenceMistakes?.(
        sentence.id,
        [...mistakeWordsRef.current.entries()].map(([word, indexes]) => ({
          word,
          errorIndexes: [...indexes].sort((a, b) => a - b),
        })),
      );
    }
    onComplete(wpm);
  }

  const engine = useTypingEngine({
    target: sentence.en,
    resetKey: sentence.id,
    onComplete: handleComplete,
    onCorrectChar: onCorrectLetter,
    onErrorChar: onErrorLetter,
  });

  // Fires once per genuinely new wrong keystroke (errorIndex transitions
  // null → a position, including a repeat wrong attempt at the same
  // position once the engine's own error flash has cleared it back to
  // null) — every distinct wrong position for a word is added to that
  // word's own Set, so a word mistyped at more than one letter this attempt
  // is remembered at all of them, not just the first.
  useEffect(() => {
    if (engine.errorIndex === null) return;
    const located = locateWordAtCharIndex(sentence.en, engine.errorIndex);
    if (!located || !isMistakeWorthTracking(located.word)) return;
    const positions = mistakeWordsRef.current.get(located.word) ?? new Set<number>();
    positions.add(engine.errorIndex - located.startOffset);
    mistakeWordsRef.current.set(located.word, positions);
  }, [engine.errorIndex, sentence.en]);
  // Independent of PronunciationButton's own speech instance — a word click
  // never restarts or interrupts the full-sentence audio (see items 3-4).
  const wordSpeech = useSpeech();
  const wordClip = useAudioClip();
  const { resolveAudio, prefetchPronunciation } = usePronunciationSettings();

  /**
   * A word click's real voice, same rule as PronunciationButton's own
   * `kokoroVoiceId` prop (sentenceVoiceId, computed above) — never a
   * different provider/voice than the sentence it's part of. Cache hit or a
   * free Edge-TTS on-demand synthesis (Normal lessons) plays the resolved
   * clip directly; a Stories paid-provider voice instead gets a
   * gender-matched free Edge-TTS substitute for just this one word (see
   * resolvePronunciationAudioAction's own doc comment) — the narrator's own
   * paid voice is never touched, only this isolated word is spoken by a
   * different (free) voice. No resolvable voice, or a token that isn't a
   * real trackable word (stray punctuation), falls back to the browser's
   * own speech synthesis exactly as this always did before.
   */
  async function handleWordClick(word: string) {
    if (sentenceVoiceId && isTrackableWord(word)) {
      const contentId = `${sentence.id}::${normalizeMistakeWord(word)}`;
      const url = await resolveAudio({
        contentType: "sentence_word",
        contentId,
        voiceId: sentenceVoiceId,
      });
      if (url) {
        wordClip.play(url);
        return;
      }
    }
    wordSpeech.speakWord(word);
  }

  // Warms every trackable word's clip in the background the moment this
  // sentence mounts, the same prefetchPronunciation mechanism/dedup
  // PronunciationButton's own next-sentence prefetch uses — a first-time
  // isolated-word synthesis measured ~3-4s (a real Edge-TTS round trip plus
  // a Storage upload), which felt like a hang when it only started the
  // instant a learner actually clicked. Firing it here instead means most
  // clicks land well after the learner has started reading/typing the
  // sentence, by which point the word is very likely already cached — a
  // near-instant play instead of a multi-second wait. Only for
  // Normal/Stories (enableWordClick's own scope — Conversation never
  // enables word click at all), and only once real content/voice exist.
  useEffect(() => {
    if (mode !== "normal" && mode !== "stories") return;
    if (!sentenceVoiceId) return;
    const words = new Set(tokenize(sentence.en).filter(isTrackableWord));
    for (const word of words) {
      prefetchPronunciation({
        contentType: "sentence_word",
        contentId: `${sentence.id}::${normalizeMistakeWord(word)}`,
        voiceId: sentenceVoiceId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when this sentence/voice actually changes, not on every render
  }, [sentence.id, sentenceVoiceId, mode]);

  const currentWord =
    sentence.supportWordTranslations?.[getCurrentWordIndex(sentence.en, engine.typed.length)];

  // No enter/exit animation here (initial: false, no exit prop) —
  // animating this element on mount/unmount, combined with
  // AnimatePresence's exit-then-enter sequencing, reliably produced a
  // stuck render in testing (the next sentence's content committed to the
  // DOM but never painted, sometimes for several seconds) once this
  // component grew a second useSpeech() instance and a layout-effect-
  // driven underline sharing the same animating subtree. Rendering the
  // next sentence instantly, with no transition to wait on, sidesteps it
  // entirely and is more important here than the transition polish.
  const enterExit = {
    initial: false as const,
  };

  // Story Vocabulary feature (see src/lib/content/story-vocabulary.ts) —
  // only stories-mode sentences ever carry targetVocabularyIndices, but the
  // mode check here is what keeps this scoped to Stories even if that ever
  // changed; normal/conversation rendering is completely unaffected.
  const targetVocabularyIndices =
    mode === "stories" && sentence.targetVocabularyIndices
      ? new Set(sentence.targetVocabularyIndices)
      : undefined;

  function renderText(sizeClass: string, enableWordClick = false) {
    return (
      <TypingText
        target={sentence.en}
        typed={engine.typed}
        letterStates={engine.letterStates}
        inputRef={engine.inputRef}
        onChange={engine.handleChange}
        onPaste={engine.handlePaste}
        reducedMotion={reducedMotion}
        textClassName={sizeClass}
        textStyle={textStyle}
        onWordClick={enableWordClick ? (word) => void handleWordClick(word) : undefined}
        targetVocabularyIndices={targetVocabularyIndices}
      />
    );
  }

  if (mode === "conversation") {
    const isReplier = sentence.speaker === "B";
    return (
      <motion.div
        {...enterExit}
        className={cn("flex", isReplier ? "justify-end" : "justify-start")}
      >
        <PronunciationSpeedControl inputRef={engine.inputRef} />
        <div
          className={cn(
            "flex max-w-[92%] items-start gap-3 sm:max-w-[75%]",
            isReplier && "flex-row-reverse",
          )}
        >
          <div
            aria-hidden="true"
            className={cn(
              "mt-1 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
              isReplier
                ? "text-primary-foreground bg-[var(--lesson-speaker)]"
                : "bg-[var(--lesson-secondary)] text-[var(--lesson-speaker)]",
            )}
          >
            {sentence.speaker}
          </div>
          <div
            className={cn(
              "border-border min-w-0 rounded-2xl border p-5 sm:p-6",
              isReplier ? "bg-primary/5 rounded-tr-sm" : "bg-card rounded-tl-sm",
            )}
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                {renderText("text-[clamp(1.5rem,1.1rem+2.2vw,2.75rem)]")}
              </div>
              <PronunciationButton
                text={sentence.en}
                audioUrl={sentence.audioUrl}
                onPlay={onAudioPlay}
                autoPlay
                resetKey={sentence.id}
                inputRef={engine.inputRef}
                kokoroVoiceId={sentenceVoiceId}
                contentType="sentence"
                contentId={sentence.id}
              />
            </div>
            <p className="mt-4 text-base text-[var(--lesson-subtitle)]" dir={dir}>
              {supportText}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Shared by normal/stories below: on desktop this column is stretched to
  // the full illustration-row height (see LessonSession's items-stretch),
  // but a plain block child only ever grows to its own content's height —
  // nothing was claiming the leftover. lg:h-full + lg:flex-col here, plus
  // the flex-1 spacer placed before the translation line, hands that
  // leftover space to the gap between the sentence and its
  // translation/stats — using the space through container sizing instead
  // of inflating the sentence's own font/line-height (which is
  // width-calibrated to keep line-wrapping predictable; growing it was
  // tried and it changed real sentences from 2 lines to 3). When content is
  // already tall enough to fill or exceed the row (long Story sentences),
  // the spacer simply resolves to 0 height — verified live, byte-for-byte
  // identical layout to before.
  const spacer = <div aria-hidden="true" className="lg:flex-1" />;

  if (mode === "stories") {
    return (
      <motion.div {...enterExit} className="relative lg:flex lg:h-full lg:flex-col">
        <PronunciationSpeedControl inputRef={engine.inputRef} />
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <StoryProgressRing current={sentenceNumber} total={totalSentences} />
            <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--lesson-story-label)] uppercase">
              {t.lesson.story}
            </span>
            {storyTitle && (
              <span className="text-foreground/40 min-w-0 truncate text-xs" dir="ltr">
                · {storyTitle}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div
              className="text-muted-foreground hidden items-center gap-1.5 text-xs font-medium tabular-nums sm:flex"
              dir="ltr"
            >
              {sentenceNumber != null && totalSentences != null && (
                <span>
                  {sentenceNumber} / {totalSentences}
                </span>
              )}
              {storyTimeRemainingLabel && <span className="text-foreground/30">·</span>}
              {storyTimeRemainingLabel && <span>{storyTimeRemainingLabel}</span>}
            </div>
            <PronunciationButton
              text={sentence.en}
              audioUrl={sentence.audioUrl}
              onPlay={onAudioPlay}
              autoPlay
              resetKey={sentence.id}
              inputRef={engine.inputRef}
              kokoroVoiceId={sentenceVoiceId}
              contentType="sentence"
              contentId={sentence.id}
            />
          </div>
        </div>
        <div className="mb-4 min-h-20">
          <CurrentWordCard word={currentWord} dir={dir} />
        </div>
        {/* lg:text-[68px] (not clamp-scaled, unlike every other mode's
            renderText call): sized specifically for the narrow fixed-width
            Stories left column (see LessonSession's "content" grid) rather
            than as a share of the row's remaining width, so it no longer
            needs to shrink/grow with that column. Below lg:, where Stories'
            left column collapses to a plain stacked spacer, the original
            clamp() keeps governing size exactly as it always has.
            font-serif here (not on the translation line below, which is
            Arabic/Spanish/Turkish support text a Latin-serif stack doesn't
            actually cover) is deliberately scoped to only this mode's own
            English sentence text — the one place a "storybook" feel reads as
            intentional rather than just a random font swap. */}
        {renderText("font-serif text-[clamp(3rem,1.4rem+4.5vw,7rem)] lg:text-[68px]", true)}
        {spacer}
        <p className="mt-6 text-2xl text-[var(--lesson-subtitle)]" dir={dir}>
          {supportText}
        </p>
        <TypingStats wpm={engine.wpm} accuracy={engine.accuracy} centered />
      </motion.div>
    );
  }

  return (
    <motion.div {...enterExit} className="relative lg:flex lg:h-full lg:flex-col">
      <PronunciationSpeedControl inputRef={engine.inputRef} />
      <div className="mb-4 flex justify-end">
        <PronunciationButton
          text={sentence.en}
          audioUrl={sentence.audioUrl}
          onPlay={onAudioPlay}
          autoPlay
          resetKey={sentence.id}
          inputRef={engine.inputRef}
          kokoroVoiceId={sentenceVoiceId}
          contentType="sentence"
          contentId={sentence.id}
        />
      </div>
      {/* The current-word card sits right under the audio-button row, top-
          anchored, not inside the centered group below — matching Stories
          mode's own word-card placement (see that branch above) and the
          reference layout this was aligned to. The sentence/translation/
          stats group centers as one block within whatever leftover column
          height remains under the word card: lg:flex-1 lets this div claim
          that space, lg:justify-center centers its own children inside it,
          and the group's internal spacing (mt-6 on the translation,
          TypingStats' own mt-7 in its centered form) stays exactly as tight
          as it always was — only where the whole group sits within the
          column changes. */}
      <div className="mb-3 min-h-11">
        <CurrentWordCard word={currentWord} dir={dir} />
      </div>
      <div className="lg:flex lg:flex-1 lg:flex-col lg:justify-center">
        {renderText("text-[clamp(2.75rem,1.5rem+3.7vw,6rem)]", true)}
        <p className="mt-6 text-lg text-[var(--lesson-subtitle)]" dir={dir}>
          {supportText}
        </p>
        <TypingStats wpm={engine.wpm} accuracy={engine.accuracy} centered />
      </div>
    </motion.div>
  );
}

/**
 * Small book icon ringed by this story's overall completion (current
 * sentence / total), Stories mode's header only. Falls back to a plain
 * (un-ringed) icon when either number is missing rather than guessing a
 * percentage — callers that don't pass sentenceNumber/totalSentences get
 * exactly the old bare-icon look.
 */
function StoryProgressRing({ current, total }: { current?: number; total?: number }) {
  if (!current || !total) {
    return <BookOpen className="size-3.5 text-[var(--lesson-story-label)]" aria-hidden="true" />;
  }

  const size = 20;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(1, current / total);
  const offset = circumference * (1 - percent);

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-[var(--lesson-story-label)] opacity-20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-[var(--lesson-story-label)] transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <BookOpen className="absolute size-2.5 text-[var(--lesson-story-label)]" aria-hidden="true" />
    </span>
  );
}
