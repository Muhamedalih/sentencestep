"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Image as ImageIcon, List as ListIcon } from "lucide-react";

import { FixYourMistakesSession } from "@/components/learning/fix-your-mistakes-session";
import { LessonCompletion } from "@/components/learning/lesson-completion";
import { LessonIllustration } from "@/components/learning/lesson-illustration";
import { OnboardingLessonComplete } from "@/components/learning/onboarding-lesson-complete";
import {
  StoryPreviousSentences,
  type CompletedStorySentence,
} from "@/components/learning/story-previous-sentences";
import { ShiftReplayHint } from "@/components/learning/shift-replay-hint";
import { TypingSentence } from "@/components/learning/typing-sentence";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/components/providers/locale-provider";
import { usePronunciationSettings } from "@/components/providers/pronunciation-settings-provider";
import { useTypingSoundSettings } from "@/components/providers/typing-sound-settings-provider";
import { transitions } from "@/lib/motion";
import { trackAudioPlayedAction, trackLessonViewAction } from "@/lib/analytics/track-actions";
import { useMistakes } from "@/hooks/use-mistakes";
import { useProgress } from "@/hooks/use-progress";
import { useTypingSound } from "@/hooks/use-typing-sound";
import { resolveSectionSentenceCompleteSound } from "@/lib/admin/typing-sound-settings";
import { isTrackableWord, normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { OPENING_LESSON_ID } from "@/lib/progress/starting-level";
import { tokenize } from "@/lib/typing";
import { cn } from "@/lib/utils";
import type { Lesson, NextLessonRef } from "@/types/content";

const OPENING_LESSON_IDS = new Set(Object.values(OPENING_LESSON_ID));

export function LessonSession({
  unit,
  nextLesson,
  previewMode = false,
  resolvedVoiceId,
  defaultVoiceId,
  speakerVoiceMap,
  firstSentenceWordAudio,
}: {
  unit: Lesson;
  nextLesson?: NextLessonRef;
  /** Admin content preview (see src/app/admin/content/[lessonId]/preview) — reuses this exact component and the real typing engine, but never writes progress or fires analytics/email triggers for what isn't a real learner session. */
  previewMode?: boolean;
  /** Already resolved server-side (unit.voiceId ?? globalDefaultVoiceId — see resolveVoiceId) and passed straight through to TypingSentence/PronunciationButton; this component never re-derives it. */
  resolvedVoiceId?: string | null;
  /** The site-wide default Kokoro voice, independent of this lesson's own resolvedVoiceId — see FixYourMistakesSession's own doc comment for why it deliberately uses this instead. */
  defaultVoiceId?: string | null;
  /** Conversation-mode speaker -> voice_id overrides (empty for every other mode) — see TypingSentence's own resolution of resolvedVoiceId vs. a sentence's speaker-specific voice. */
  speakerVoiceMap?: Record<string, string>;
  /** Server-side pre-resolved `{contentId: audioUrl}` for the FIRST sentence's trackable words only (see LessonPage's own lookupCachedWordAudioUrls call and its doc comment for the measured root cause this fixes) — passed straight through to the first TypingSentence instance, which registers these into the shared resolved-audio cache on mount so its word clicks skip the resolve round trip entirely, the same way a pre-resolved sentence.audioUrl already does for that sentence's own narration. undefined for every sentence after the first, and for Conversation mode, where word click doesn't exist. */
  firstSentenceWordAudio?: Record<string, string>;
}) {
  // Never true in previewMode: an admin previewing content has no
  // "get started" flow underway, so the real dashboard pitch would be a
  // non-sequitur there — LessonCompletion (the ordinary stats recap) is
  // what preview should always show, same as every other lesson.
  const isOpeningLesson = !previewMode && OPENING_LESSON_IDS.has(unit.id);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isFixingMistakes, setIsFixingMistakes] = useState(false);
  const [finalAccuracy, setFinalAccuracy] = useState(1);
  const [finalWpm, setFinalWpm] = useState(0);
  // The running numbered transcript (see StoryPreviousSentences). Stories
  // mode always shows this in place of the topic illustration; Normal mode
  // collects the same data but only shows it when the learner opts into the
  // list view via illustrationView below (see the toggle in the render).
  // Harmless to hold for every mode — Conversation never renders it and
  // never appends to it.
  const [previousSentences, setPreviousSentences] = useState<CompletedStorySentence[]>([]);
  // Normal mode only — lets the learner swap the topic illustration for the
  // same running sentence transcript Stories mode shows permanently,
  // switching back and forth at will (unlike Stories, where the swap is
  // permanent for the whole lesson).
  const [illustrationView, setIllustrationView] = useState<"image" | "list">("image");
  const {
    markComplete,
    streak,
    xp,
    xpEarned,
    learnerLevel,
    rewards,
    saveStatus,
    retryMarkComplete,
  } = useProgress();
  const mistakes = useMistakes();
  const typingSoundSettings = useTypingSoundSettings();
  const { play, playSentenceComplete } = useTypingSound({
    pack: typingSoundSettings.soundPack,
    enabled: typingSoundSettings.enabled,
    volume: typingSoundSettings.volume,
    sentenceCompleteSound: typingSoundSettings.sentenceCompleteSound,
  });
  const correctCountRef = useRef(0);
  const errorCountRef = useRef(0);
  const wpmSamplesRef = useRef<number[]>([]);
  const hasTrackedAudioRef = useRef(false);
  const { prefetchPronunciation } = usePronunciationSettings();
  const { t } = useLocale();

  // Root-cause fix for "every sentence after the first still shows a
  // pronunciation loading delay": the learner spends real time typing the
  // CURRENT sentence, which is exactly the window in which the NEXT one's
  // audio can resolve in the background — by the time TypingSentence
  // actually mounts for it, its PronunciationButton finds the URL already
  // sitting in the shared cache (see PronunciationSettingsProvider) and
  // skips the resolve round trip entirely, same as a same-sentence replay
  // already did. Deliberately only ONE sentence ahead, never the whole
  // lesson — see prefetchPronunciation's own doc comment for why bulk
  // pre-resolving was avoided.
  //
  // Extended (root-cause fix for "word clicks are still noticeably
  // delayed"): this gave the NEXT sentence's own narration a full
  // typing-the-current-sentence head start, but never did the same for that
  // next sentence's individual WORDS — those only ever started resolving
  // once TypingSentence itself mounted for that sentence (see its own
  // word-prefetch effect, staggered 600ms+ after mount). A learner who reads
  // ahead and clicks a word within the first second or two of a new sentence
  // was still hitting a cold resolve every time, sentence after sentence,
  // which is what made the delay read as "nothing changed" even after the
  // contention fix in TypingSentence. Prefetching this sentence's words too,
  // right alongside its narration, gives them the exact same multi-second
  // lead time — by the time the learner actually reaches this sentence, most
  // clicks land on an already-cached clip instead of a fresh round trip.
  // Only for Normal/Stories (mirrors TypingSentence's own enableWordClick
  // scope — Conversation never enables word click at all), and staggered the
  // same way TypingSentence's own effect is, so this sentence's words don't
  // burst all at once and compete with the CURRENT sentence's own
  // still-in-flight prefetches for the browser's connection limit.
  useEffect(() => {
    const nextSentence = unit.sentences[sentenceIndex + 1];
    if (!nextSentence) return;
    const voiceId =
      (nextSentence.speaker && speakerVoiceMap?.[nextSentence.speaker]) || resolvedVoiceId;
    if (!voiceId) return;
    prefetchPronunciation({
      contentType: "sentence",
      contentId: nextSentence.id,
      voiceId,
    });

    if (unit.mode !== "normal" && unit.mode !== "stories") return;
    const words = Array.from(new Set(tokenize(nextSentence.en).filter(isTrackableWord)));
    const timers = words.map((word, index) =>
      setTimeout(
        () => {
          prefetchPronunciation({
            contentType: "sentence_word",
            contentId: `${nextSentence.id}::${normalizeMistakeWord(word)}`,
            voiceId,
          });
        },
        600 + index * 150,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [
    sentenceIndex,
    unit.sentences,
    unit.mode,
    resolvedVoiceId,
    speakerVoiceMap,
    prefetchPronunciation,
  ]);

  useEffect(() => {
    if (previewMode) return;
    // Fires once per real page visit — deliberately here (client mount),
    // not in the page's Server Component: free lessons are statically
    // pre-rendered, so a server-side call there would only ever run once,
    // at build time, not per visitor. Analytics is inherently best-effort
    // (see track()'s own doc comment) — but that only covers failures
    // *inside* the Server Action. Nothing awaits this call, so if the
    // request itself never reaches the server (dropped connection, or
    // aborted because the learner navigated on before it resolved — both
    // unremarkable here), the rejection needs somewhere to land or it
    // surfaces as an uncaught "Failed to fetch".
    trackLessonViewAction(unit.mode, unit.id, unit.level, unit.isFree).catch((error: unknown) => {
      console.error("[analytics] trackLessonViewAction failed", error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-fire when navigating to a different lesson
  }, [unit.id, previewMode]);

  const total = unit.sentences.length;
  const sentence = unit.sentences[sentenceIndex];

  // Stories mode only — a rough "reading time left" cue for the header (see
  // TypingSentence's storyTimeRemainingLabel prop). Deliberately a coarse
  // estimate, not a measured one: 15 words/minute approximates this app's
  // typing pace (not silent-reading speed), counted from the CURRENT
  // sentence onward so it never counts sentences already completed.
  const storyTimeRemainingLabel =
    unit.mode === "stories"
      ? (() => {
          const wordsLeft = unit.sentences
            .slice(sentenceIndex)
            .reduce((sum, s) => sum + s.en.trim().split(/\s+/).length, 0);
          const minutesLeft = Math.max(1, Math.round(wordsLeft / 15));
          return t.lesson.storyTimeRemaining.replace("{n}", String(minutesLeft));
        })()
      : undefined;

  // One aggregate signal per real session ("pronunciation was used in this
  // lesson"), not one event per click/replay — see the Milestone 13 report
  // for why. Skipped entirely in previewMode, matching trackLessonViewAction.
  function handleAudioPlay() {
    if (previewMode || hasTrackedAudioRef.current) return;
    hasTrackedAudioRef.current = true;
    trackAudioPlayedAction(unit.mode).catch((error: unknown) => {
      console.error("[analytics] trackAudioPlayedAction failed", error);
    });
  }

  function handleSentenceMistakes(
    sentenceId: string,
    words: { word: string; errorIndexes: number[] }[],
  ) {
    mistakes.recordSentenceMistakes(sentenceId, words);
  }

  function handleSentenceComplete(wpm: number) {
    if (wpm > 0) wpmSamplesRef.current.push(wpm);
    playSentenceComplete(resolveSectionSentenceCompleteSound(typingSoundSettings, unit.mode));

    if ((unit.mode === "stories" || unit.mode === "normal") && sentence) {
      setPreviousSentences((prev) => [
        ...prev,
        {
          id: sentence.id,
          number: prev.length + 1,
          text: sentence.en,
          // Same locale-resolution rule as TypingSentence's own supportText
          // (see its doc comment) — never falls back to `sentence.ar`.
          translation: sentence.supportText ?? sentence.en,
        },
      ]);
    }

    if (sentenceIndex + 1 < total) {
      setSentenceIndex((index) => index + 1);
    } else {
      const attempts = correctCountRef.current + errorCountRef.current;
      const accuracy = attempts === 0 ? 1 : correctCountRef.current / attempts;
      const samples = wpmSamplesRef.current;
      const averageWpm =
        samples.length === 0
          ? 0
          : Math.round(samples.reduce((sum, value) => sum + value, 0) / samples.length);
      setFinalAccuracy(accuracy);
      setFinalWpm(averageWpm);
      if (!previewMode) markComplete(unit.mode, unit.id, accuracy, total, averageWpm);
      setIsComplete(true);
    }
  }

  /* lg:h-full (not lg:h-[...svh...]) deliberately: this component is reused
     by the admin content preview (src/app/admin/content/[lessonId]/preview),
     which embeds it inside the ordinary admin page flow with no definite
     height of its own — there, a percentage height simply resolves to auto
     (normal CSS behavior for a percentage height with no sized ancestor),
     so the preview keeps flowing naturally exactly as before. The real
     learner route instead wraps this component in an `h-svh` container
     (see src/app/learn/[mode]/[lessonId]/page.tsx) specifically so it can
     render truly full-viewport with no header/sidebar — giving this
     lg:h-full something concrete to fill there. Below lg:, no height is
     imposed at all (unchanged from before): mobile keeps its natural,
     content-driven scroll instead of being forced into a fixed box. */
  const sessionLabel = (
    <>
      {/* No visible back/exit link here by design — the browser's own Back
          control already returns a learner to wherever they came from,
          so this carries only the sentence counter. The title still gets
          a real (visually hidden) heading for screen readers and document
          structure, matching PremiumLocked/LessonCompletion's headings on
          the same route's other two states. */}
      <h1 className="sr-only">{unit.title}</h1>
      <p className="sr-only" aria-live="polite">
        {isComplete
          ? t.lesson.completeHeading
          : t.lesson.sentenceProgress
              .replace("{n}", String(sentenceIndex + 1))
              .replace("{total}", String(total))}
      </p>
    </>
  );

  return (
    <div className="lg:h-full">
      {/* Kept as one persistent, invisible (sr-only has no layout footprint)
          sibling outside the AnimatePresence switch below, rather than
          duplicated into both of its branches — AnimatePresence can mount
          an exiting and an entering branch at once mid-transition, and two
          <h1>s in the DOM at the same moment is worth avoiding even though
          neither is ever visible. */}
      {sessionLabel}
      {!isComplete && <ShiftReplayHint />}

      {/* isComplete switches the ENTIRE content region, not just the
          sentence side — completion is a full state transition (lesson
          content gone, completion experience in its place), not another
          thing squeezed into the sentence column while the illustration
          panel sits there unchanged beside it. */}
      <AnimatePresence>
        {isComplete && isOpeningLesson ? (
          <OnboardingLessonComplete key="onboarding-complete" />
        ) : isComplete && isFixingMistakes ? (
          <div key="fix-mistakes" className="flex flex-col lg:h-full">
            <FixYourMistakesSession
              lessonId={unit.id}
              defaultVoiceId={defaultVoiceId}
              nextLesson={nextLesson}
            />
          </div>
        ) : isComplete ? (
          <div key="complete" className="flex flex-col bg-black lg:h-full">
            {previewMode && (
              <div className="shrink-0 px-6 pt-4 lg:px-16 lg:pt-5">
                <div className="border-accent/40 bg-accent/10 text-accent-foreground mb-4 rounded-lg border px-4 py-2.5 text-sm font-medium">
                  {t.wordLists.previewModeNotice}
                </div>
              </div>
            )}
            {/* No centering/padding/max-width wrapper here — LessonCompletion
                is a full-bleed, full-screen experience by design (see its
                own doc comment) and owns its own internal layout. */}
            <div className="flex-1 lg:min-h-0">
              <LessonCompletion
                mode={unit.mode}
                accuracy={finalAccuracy}
                wpm={finalWpm}
                nextLesson={nextLesson}
                vocabulary={unit.vocabulary}
                streak={streak.currentStreak}
                xp={xp}
                xpEarned={previewMode ? 0 : xpEarned}
                learnerLevel={learnerLevel}
                rewards={previewMode ? [] : rewards}
                mistakeCount={previewMode ? 0 : mistakes.count}
                onFixMistakes={previewMode ? undefined : () => setIsFixingMistakes(true)}
                saveStatus={previewMode ? "saved" : saveStatus}
                onRetrySave={previewMode ? undefined : retryMarkComplete}
              />
            </div>
          </div>
        ) : (
          // Illustration/transcript stays mounted for the whole session
          // (never keyed to the sentence) so it never reloads or flickers as
          // the learner advances — only the content on the right changes per
          // sentence. On mobile this stacks above the typing content instead
          // of beside it (see the lg:grid-cols-* breakpoint) so the
          // sentence — the primary task — is never squeezed. Non-stories
          // modes keep the 30/70 fr split (not 40/60): the illustration is
          // meant to read as a full-bleed photo/scene panel, not a boxed-in
          // thumbnail beside the real task, which is typing. Stories mode
          // instead gives its left column a fixed, narrow track (rather than
          // a fr share of the row) — StoryPreviousSentences is a compact
          // numbered transcript, not a full-bleed panel, so it doesn't need
          // (or want) 30% of the row's width the way a photo does; sizing it
          // via the grid track here, not via width classes on the component
          // itself, is what lets it stay a plain w-full fill of whatever
          // track it's handed. That track itself widens once there's
          // something to show (195px empty-spacer / 275px once the numbered
          // list has real entries and needs a bit more room), keyed off the
          // same `previousSentences` state StoryPreviousSentences itself
          // reads, so the two always agree on which width applies.
          <div
            key="content"
            className={
              unit.mode === "stories"
                ? previousSentences.length > 0
                  ? "grid gap-0 lg:h-full lg:grid-cols-[275px_minmax(0,1fr)] lg:items-stretch"
                  : "grid gap-0 lg:h-full lg:grid-cols-[195px_minmax(0,1fr)] lg:items-stretch"
                : "grid gap-4 lg:h-full lg:grid-cols-[minmax(0,3fr)_minmax(0,7fr)] lg:items-stretch"
            }
          >
            {unit.mode === "stories" ? (
              <StoryPreviousSentences sentences={previousSentences} />
            ) : (
              <div className="relative lg:h-full">
                {illustrationView === "list" ? (
                  <StoryPreviousSentences sentences={previousSentences} />
                ) : (
                  <LessonIllustration
                    mode={unit.mode}
                    lessonId={unit.id}
                    title={unit.title}
                    illustrationUrl={unit.illustrationUrl}
                  />
                )}
                {unit.mode === "normal" && (
                  <div className="border-border/60 bg-background/85 absolute end-3 top-3 z-10 flex items-center gap-1 rounded-full border p-1 shadow-sm backdrop-blur-md">
                    <button
                      type="button"
                      onClick={() => setIllustrationView("image")}
                      aria-pressed={illustrationView === "image"}
                      aria-label={t.lesson.illustrationViewImage}
                      title={t.lesson.illustrationViewImage}
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full transition-colors",
                        illustrationView === "image"
                          ? "bg-[var(--lesson-secondary)] text-[var(--lesson-icon)]"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <ImageIcon className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIllustrationView("list")}
                      aria-pressed={illustrationView === "list"}
                      aria-label={t.lesson.illustrationViewList}
                      title={t.lesson.illustrationViewList}
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full transition-colors",
                        illustrationView === "list"
                          ? "bg-[var(--lesson-secondary)] text-[var(--lesson-icon)]"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <ListIcon className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* justify-center below lg: is fine either way — that breakpoint
                never stretches this column to the row's full height (see
                the grid above), so there's nothing extra to center within.
                At lg:+ this column becomes lg:h-full, matching whatever
                height the two-column row (illustration/transcript + sentence)
                is stretched to — routinely taller than a single sentence's
                own content. Normal and Stories modes both go lg:justify-center:
                the current sentence should sit in the middle of the leftover
                row height rather than pinned to the top with empty space
                below (Normal previously top-aligned against a fixed photo,
                but reads better centered like the rest of the lesson
                screen). Conversation alone stays lg:justify-start — its chat
                bubbles read top-down like a real conversation log, so the
                current line starts right under the lesson counter instead of
                drifting toward the middle of the row. */}
            <div
              className={cn(
                "flex flex-col lg:h-full lg:overflow-y-auto",
                unit.mode === "stories" && "relative",
              )}
            >
              {/* Soft spotlight behind the sentence column, Stories mode only
                  — a still, off-center radial glow (not centered on the
                  column, which would visibly compete with the sentence text
                  sitting above/left of true center) that reads as ambient
                  depth against the mode's pure-black canvas rather than the
                  flat fill every other mode's illustration panel already
                  breaks up. pointer-events-none + -z-10 keep it purely
                  decorative and never in the way of the textbox/buttons
                  above it. */}
              {unit.mode === "stories" && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -z-10"
                  style={{
                    background:
                      "radial-gradient(60% 50% at 50% 35%, color-mix(in oklch, var(--lesson-primary) 10%, transparent), transparent 70%)",
                  }}
                />
              )}
              <div
                className={
                  unit.mode === "stories"
                    ? "shrink-0 px-6 pt-4 lg:px-12 lg:pt-5"
                    : "shrink-0 px-6 pt-4 lg:px-16 lg:pt-5"
                }
              >
                {previewMode && (
                  <div className="border-accent/40 bg-accent/10 text-accent-foreground mb-4 rounded-lg border px-4 py-2.5 text-sm font-medium">
                    {t.wordLists.previewModeNotice}
                  </div>
                )}
                <div className="mb-3 flex flex-col gap-1.5">
                  {unit.mode !== "stories" && (
                    <div className="flex justify-end">
                      <span
                        className="text-muted-foreground shrink-0 text-sm font-medium"
                        dir="ltr"
                      >
                        {Math.min(sentenceIndex + 1, total)} / {total}
                      </span>
                    </div>
                  )}
                  {/* How much of the lesson is already behind the learner —
                      complements the counter above rather than duplicating
                      it: the counter reads as "position," this reads as
                      "how far I've come." Deliberately thinner than the
                      shared Progress default (h-1 vs h-2) so it stays a
                      quiet, secondary cue beside the sentence, never
                      competing with it for attention. Stories mode moves the
                      counter itself into TypingSentence's own header row
                      (alongside the story label/reading time/sound button)
                      instead of duplicating it up here — this bar is all
                      that's left of the original counter row for that mode. */}
                  <Progress value={(sentenceIndex / total) * 100} className="h-1" />
                </div>
              </div>
              <div
                className={
                  unit.mode === "stories"
                    ? "flex flex-1 flex-col justify-center px-6 pb-8 lg:px-12"
                    : unit.mode === "normal"
                      ? "flex flex-1 flex-col justify-center px-6 pb-8 lg:justify-center lg:px-16"
                      : "flex flex-1 flex-col justify-center px-6 pb-8 lg:justify-start lg:px-16"
                }
              >
                {sentence &&
                  (() => {
                    const typingSentence = (
                      <TypingSentence
                        key={sentence.id}
                        sentence={sentence}
                        mode={unit.mode}
                        resolvedVoiceId={resolvedVoiceId}
                        speakerVoiceMap={speakerVoiceMap}
                        wordAudioUrls={sentenceIndex === 0 ? firstSentenceWordAudio : undefined}
                        onComplete={handleSentenceComplete}
                        onCorrectLetter={() => {
                          correctCountRef.current += 1;
                          play("letter");
                        }}
                        onErrorLetter={() => {
                          errorCountRef.current += 1;
                          play("error");
                        }}
                        onAudioPlay={handleAudioPlay}
                        onSentenceMistakes={previewMode ? undefined : handleSentenceMistakes}
                        storyTitle={unit.title}
                        sentenceNumber={sentenceIndex + 1}
                        totalSentences={total}
                        storyTimeRemainingLabel={storyTimeRemainingLabel}
                      />
                    );
                    // Stories only: a plain mount-in transition (no
                    // AnimatePresence, no exit) so each new sentence visibly
                    // slides in from the right and settles at its normal
                    // position — see TypingSentence's own doc comment for
                    // why an exit animation on this subtree (two useSpeech
                    // instances plus a layout-effect-driven underline) is
                    // deliberately avoided.
                    if (unit.mode !== "stories") return typingSentence;
                    return (
                      <motion.div
                        key={sentence.id}
                        initial={{ opacity: 0, x: 28 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={transitions.snappy}
                      >
                        {typingSentence}
                      </motion.div>
                    );
                  })()}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
