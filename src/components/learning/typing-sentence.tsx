"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { CurrentWordLabel } from "@/components/learning/current-word-label";
import { LessonSettings } from "@/components/learning/lesson-settings";
import { ConversationBubble, StoryHeaderRow } from "@/components/learning/sentence-chrome";
import { TypingStats } from "@/components/learning/typing-stats";
import { TypingText } from "@/components/learning/typing-text";
import { useLocale } from "@/components/providers/locale-provider";
import { useLessonFontSettings } from "@/components/providers/lesson-font-settings-provider";
import { usePronunciationSettings } from "@/components/providers/pronunciation-settings-provider";
import { useAudioClip } from "@/hooks/use-audio-clip";
import type { WordCardsApi } from "@/hooks/use-saved-cards";
import { useTypingEngine } from "@/hooks/use-typing-engine";
import { resolveSectionFontFamily } from "@/lib/admin/lesson-font-settings";
import {
  isMistakeWorthTracking,
  isTrackableWord,
  isWordWorthSaving,
  normalizeMistakeWord,
  savableWordIndices,
} from "@/lib/mistakes/normalize";
import { getCurrentWordIndex, locateWordAtCharIndex } from "@/lib/typing";
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
  /** Server-side pre-resolved `{contentId: audioUrl}` for this sentence's trackable words (LessonSession passes this only for the lesson's first sentence — see its own doc comment and LessonPage's lookupCachedWordAudioUrls call). Registered into the shared resolved-audio cache on mount so a word click here skips the resolve round trip entirely, closing the one gap the next-sentence word prefetch below can't: the very first sentence has no PREVIOUS sentence to have prefetched its words during. undefined for every other sentence, which behaves exactly as before. */
  wordAudioUrls?: Record<string, string>;
  /**
   * Whether this lesson session has already been started (LessonSession
   * owns this, not local state here, precisely because it must survive
   * this component's own per-sentence remount — see the `key={sentence.id}`
   * on every caller). Gates the input's focus-on-mount and the narration's
   * autoPlay — never the overlay's own presence in the DOM, see
   * `showTapToStart`'s doc comment for why those two had to be split.
   * Normal/Stories only: Conversation never gates on it. Undefined behaves
   * as already-started (every other caller, and the admin preview, keeps
   * today's immediate-autofocus/autoplay behavior unchanged).
   */
  hasStarted?: boolean;
  /**
   * Whether to render TapToStartOverlay at all — deliberately NOT derived
   * from `hasStarted` (which folds in a client-only "is this actually a
   * mobile viewport" check LessonSession can't know during SSR). A value
   * that mismatches between the server-rendered HTML and the client's first
   * render is exactly what a hydration mismatch is, and for a WHOLE EXTRA
   * ELEMENT (not just an attribute), that reliably left the overlay never
   * actually appearing in the committed DOM at all in testing — the
   * server's "no overlay" version won even once the client "corrected"
   * itself. `showTapToStart` instead reflects only `tapped` (LessonSession's
   * own plain `useState(false)`, identical on server and client, so there's
   * nothing to reconcile), and relies purely on TapToStartOverlay's own
   * `sm:hidden` CSS class — evaluated by the browser at paint time, not
   * baked into the markup one way or the other — to stay invisible on
   * tablet/desktop. Undefined behaves as "never show it" (every caller that
   * doesn't pass it, including Conversation and the admin preview).
   */
  showTapToStart?: boolean;
  /** Fired once, the first time the learner taps the mobile-only "tap to start" overlay below — see `showTapToStart`'s own doc comment. */
  onStart?: () => void;
  /** Personal word cards (admin feature): when present, the current-word label shows a save star. null/undefined = the feature is off here. */
  wordCards?: WordCardsApi | null;
  /** Stories mode only — steps back one sentence (LessonSession owns the actual state change). Rendered as a small button beside the counter only when provided AND sentenceNumber > 1; every other mode gets its own copy of this button from LessonSession's separate counter row instead. */
  onGoBack?: () => void;
  /** Stories mode only — steps forward again, one sentence. LessonSession only ever passes this when sentenceNumber is still behind maxSentenceIndexReached (see its own doc comment) — undefined otherwise, which is what hides the button entirely rather than this component re-deriving that condition itself. */
  onGoForward?: () => void;
  /** Dictation handing a half-typed sentence back (the learner gave up, or switched Dictation off): the part already typed correctly, as the keystroke engine's own buffer. Read once, when this sentence mounts. */
  initialTyped?: string;
  /** The words that already had wrong letters in that dictation attempt, folded into this sentence's own mistakes so Fix Your Mistakes hears about them once, when the sentence is finished. Read once, on mount. */
  initialMistakes?: { word: string; errorIndexes: number[] }[];
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
  wordAudioUrls,
  hasStarted = true,
  showTapToStart = false,
  onStart,
  onGoBack,
  onGoForward,
  wordCards,
  initialTyped,
  initialMistakes,
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
  useEffect(() => {
    // Mount-only: mistakes a dictation attempt at this same sentence already
    // made. (An effect, not the ref's initial value, so Strict Mode's second
    // run merges into the same sets instead of doubling anything.)
    for (const { word, errorIndexes } of initialMistakes ?? []) {
      const positions = mistakeWordsRef.current.get(word) ?? new Set<number>();
      for (const index of errorIndexes) positions.add(index);
      mistakeWordsRef.current.set(word, positions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // The actual root cause of the keyboard opening before the mobile "tap
    // to start" gate was tapped: this hook refocuses the input on every
    // resetKey change independently of TypingText's own autoFocus prop
    // (which only ever covered TypingText's OWN mount-time focus call) —
    // both need to read the same gate.
    autoFocus: hasStarted,
    initialTyped,
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
  const wordClip = useAudioClip();
  const { resolveSentenceWord, registerResolvedAudio } = usePronunciationSettings();
  // Only the latest click plays: a slow earlier word must not start after a later, faster one.
  const wordRequestRef = useRef(0);

  // Feeds LessonPage's server-side pre-resolution (see wordAudioUrls' own
  // doc comment) into the SAME shared cache resolveAudio itself checks
  // first — a word click below is then a synchronous cache hit, not just a
  // faster network call. Effect (not read during render) because
  // registerResolvedAudio writes to a ref, never triggers a re-render, and
  // only needs to happen once when this data arrives.
  useEffect(() => {
    if (!wordAudioUrls) return;
    for (const [contentId, url] of Object.entries(wordAudioUrls)) {
      registerResolvedAudio(contentId, url);
    }
  }, [wordAudioUrls, registerResolvedAudio]);

  /**
   * A word click's real voice, same rule as PronunciationButton's own
   * `kokoroVoiceId` prop (sentenceVoiceId, computed above) — never a
   * different provider/voice than the sentence it's part of. Normally a
   * synchronous cache hit, already downloaded into memory: LessonSession's
   * word-audio window loads this sentence's words the moment the lesson opens
   * and the next sentence's while this one is being typed (see
   * WordAudioPreloader). Only a click that beats that preload joins it — moved
   * to the front of the queue — instead of starting its own request. A
   * paid-provider sentence voice (Cartesia for Normal lessons, ElevenLabs for
   * Stories) gets a gender-matched free Edge-TTS substitute for just this one
   * word (see resolvePronunciationAudioAction's own doc comment) — the
   * sentence's own paid voice is never touched, only this isolated word is
   * spoken by a different (free) voice.
   *
   * The word-timing "play a slice of the sentence's own clip" path
   * (2026-09-11) was tried here and pulled back the same day: it never
   * reproduced cleanly for the user despite fixing every issue found in
   * testing (see git history on this function for that whole arc) — kept as
   * standalone, unused infrastructure (word-timing.ts, the
   * sentence_word_timings table) rather than deleted, in case it's revisited
   * later, but this call site never calls resolveWordTimings or slice-plays.
   */
  async function handleWordClick(word: string) {
    if (!sentenceVoiceId || !isTrackableWord(word)) return;
    const request = ++wordRequestRef.current;
    const url = await resolveSentenceWord({
      sentenceId: sentence.id,
      text: sentence.en,
      voiceId: sentenceVoiceId,
      key: normalizeMistakeWord(word),
    });
    if (url && request === wordRequestRef.current) wordClip.play(url);
  }

  const currentWordIndex = getCurrentWordIndex(sentence.en, engine.typed.length);
  const currentWord = sentence.supportWordTranslations?.[currentWordIndex];
  // The current word's save star (Personal word cards) — only for a real
  // word (never a bare punctuation token), and only when the feature is open.
  const currentWordKey = currentWord ? normalizeMistakeWord(currentWord.en) : "";
  const currentWordSave =
    wordCards && currentWord && isWordWorthSaving(currentWord.en)
      ? {
          saved: wordCards.isSaved(currentWordKey),
          label: wordCards.isSaved(currentWordKey) ? t.myCards.removeWord : t.myCards.saveWord,
          onToggle: () => {
            wordCards.toggle({
              word: currentWordKey,
              meaning: currentWord.text,
              wordIndex: currentWordIndex,
              sentenceId: sentence.id,
              sentenceEn: sentence.en,
            });
            engine.inputRef.current?.focus();
          },
        }
      : undefined;

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

  // Personal word cards: only some words can be saved (see isWordWorthSaving),
  // so in Normal lessons those words carry a dotted underline — the learner
  // can see at a glance which words are worth a star instead of wondering
  // about every one. Stories keeps its own vocabulary marks untouched.
  const savableIndices = useMemo(
    () => (wordCards && mode === "normal" ? savableWordIndices(sentence.en) : undefined),
    [wordCards, mode, sentence.en],
  );

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
        savableWordIndices={savableIndices}
        autoFocus={hasStarted}
      />
    );
  }

  if (mode === "conversation") {
    return (
      <ConversationBubble speaker={sentence.speaker}>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-start sm:gap-2">
          <div className="min-w-0 flex-1">
            {renderText("text-[clamp(1.5rem,1.1rem+2.2vw,2.75rem)]")}
          </div>
          <div className="flex shrink-0 items-center gap-2 max-sm:self-end">
            <LessonSettings
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
        <p className="mt-4 text-base text-[var(--lesson-subtitle)] select-none" dir={dir}>
          {supportText}
        </p>
      </ConversationBubble>
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
        {showTapToStart && (
          <TapToStartOverlay
            heading={t.lesson.tapToStartHeading}
            body={t.lesson.tapToStartBody}
            onStart={() => {
              engine.inputRef.current?.focus();
              onStart?.();
            }}
          />
        )}
        <StoryHeaderRow
          storyTitle={storyTitle}
          sentenceNumber={sentenceNumber}
          totalSentences={totalSentences}
          storyTimeRemainingLabel={storyTimeRemainingLabel}
          onGoBack={onGoBack}
          onGoForward={onGoForward}
        />
        <div className="mb-4 flex items-center justify-end gap-2">
          {/* autoPlay is gated on hasStarted — mobile only (see its own doc
              comment): a guest who hasn't tapped the "tap to start" overlay
              yet shouldn't hear the first sentence narrate itself before
              they've even engaged with the lesson. Every sentence after the
              first, and every desktop/tablet session, keeps the original
              always-autoPlay behavior. */}
          <LessonSettings
            text={sentence.en}
            audioUrl={sentence.audioUrl}
            onPlay={onAudioPlay}
            autoPlay={hasStarted}
            resetKey={sentence.id}
            inputRef={engine.inputRef}
            kokoroVoiceId={sentenceVoiceId}
            contentType="sentence"
            contentId={sentence.id}
          />
        </div>
        {/* Centers this group (word label through stats) within whatever
            leftover height sits below the header row above — mirrors the
            "normal" branch's identical wrapper further down this file. Kept
            separate from the header on purpose: LessonSession's own column
            now top-aligns this whole component (see its own doc comment) so
            the header sits right under the progress bar, and this wrapper is
            what still centers the rest exactly as it always looked.
            Deliberately does NOT include the shared `spacer` (lg:flex-1) the
            "normal" branch below uses: that spacer only ever did anything
            once this wrapper actually had leftover height to give it (which
            it didn't until the header was pulled out above), and once it
            does, a flex-grow child inside a `justify-center` parent consumes
            ALL of that leftover space for itself, leaving nothing for
            justify-center to distribute — collapsing word label + sentence
            to the very top and shoving translation + stats to the very
            bottom instead of centering the group. Omitting it here is what
            keeps this group reading as one centered block, same as before
            the header was split out. */}
        <div className="lg:flex lg:flex-1 lg:flex-col lg:justify-center">
          <div className="mb-1">
            <CurrentWordLabel word={currentWord} dir={dir} save={currentWordSave} />
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
          {renderText(
            "font-serif max-sm:text-[2rem] text-[clamp(3rem,1.4rem+4.5vw,7rem)] lg:text-[68px]",
            true,
          )}
          <p
            className="mt-6 text-xl text-[var(--lesson-subtitle)] select-none sm:text-2xl"
            dir={dir}
          >
            {supportText}
          </p>
          <div className="compact-hide">
            <div className="compact-hide">
              <TypingStats wpm={engine.wpm} accuracy={engine.accuracy} centered />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div {...enterExit} className="relative lg:flex lg:h-full lg:flex-col">
      {showTapToStart && (
        <TapToStartOverlay
          heading={t.lesson.tapToStartHeading}
          body={t.lesson.tapToStartBody}
          onStart={() => {
            engine.inputRef.current?.focus();
            onStart?.();
          }}
        />
      )}
      <div className="mb-4 flex items-center justify-end gap-2">
        {/* autoPlay gated on hasStarted — see the Stories branch's identical comment above. */}
        <LessonSettings
          text={sentence.en}
          audioUrl={sentence.audioUrl}
          onPlay={onAudioPlay}
          autoPlay={hasStarted}
          resetKey={sentence.id}
          inputRef={engine.inputRef}
          kokoroVoiceId={sentenceVoiceId}
          contentType="sentence"
          contentId={sentence.id}
        />
      </div>
      {/* The current-word translation now lives INSIDE this centered group,
          immediately before the sentence it belongs to — not as a sibling
          before the group (an earlier version tried that, top-anchored
          "matching Stories mode's placement"). On a tall viewport, lg:flex-1
          + lg:justify-center centers this whole group within whatever
          column height is left, which pushed the sentence well down the
          page while the label stayed pinned at the very top — the two read
          as unrelated, with a huge gap between them, even though the actual
          margin between them was tiny. Being part of the same centered
          group is what keeps it snug against the sentence at every
          viewport height, not just the short ones this was ever actually
          tested against. */}
      <div className="lg:flex lg:flex-1 lg:flex-col lg:justify-center">
        <div className="mb-1">
          <CurrentWordLabel word={currentWord} dir={dir} save={currentWordSave} />
        </div>
        {/* A fixed, smaller size below sm: (the illustration panel above is
            hidden there too — see LessonSession — so this no longer needs to
            share the screen with it) instead of the same fluid clamp every
            other viewport uses, which sat at a flat 44px floor on any phone
            width and read as oversized/inconsistent from one phone to the
            next. sm:+ keeps the exact original clamp, untouched. */}
        {renderText("text-3xl sm:text-[clamp(2.75rem,1.5rem+3.7vw,6rem)]", true)}
        <p className="mt-6 text-lg text-[var(--lesson-subtitle)] select-none" dir={dir}>
          {supportText}
        </p>
        <div className="compact-hide">
          <TypingStats wpm={engine.wpm} accuracy={engine.accuracy} centered />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Mobile-only (sm:hidden) gate shown once per lesson, before the learner has
 * tapped anything yet: dims the sentence behind it and asks for a deliberate
 * tap before the keyboard opens, rather than the keyboard trying to appear
 * on its own the instant the lesson loads (unreliable on a phone — most
 * mobile browsers only open the soft keyboard in response to a real user
 * gesture, never a programmatic autoFocus) with no explanation of what's
 * about to happen. Tapping anywhere in it (not just the small card) both
 * focuses the underlying input and tells the caller (LessonSession, via
 * `hasStarted`) that this lesson is now underway, so it never reappears on
 * a later sentence in the same session. Absent on tablet/desktop, where the
 * sentence was always click-to-focus already (see TypingText's own
 * container onClick) and there's no keyboard-appearing surprise to soften.
 *
 * `fixed inset-0` (not `absolute`, despite living inside a `relative`
 * parent): that parent only grows as tall as the audio row/word card/
 * sentence/translation actually are on mobile (no lg:h-full below that
 * breakpoint), so an absolutely-positioned overlay centered on IT lands
 * wherever that content happens to end — routinely nowhere near the middle
 * of the actual screen. Anchoring to the viewport instead is what reliably
 * centers the card in the middle of the screen, a little below the
 * sentence, matching the reference layout this was built from. A light
 * dim (bg-background/45, no blur) — not the earlier heavy 85%-opacity/
 * blurred version — is deliberate too: the sentence should still read as
 * present and legible-ish behind the card, not obscured.
 */
export function TapToStartOverlay({
  heading,
  body,
  onStart,
}: {
  heading: string;
  body: string;
  onStart: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onStart}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onStart();
      }}
      className="bg-background/45 fixed inset-0 z-20 flex cursor-pointer items-center justify-center sm:hidden"
    >
      <div className="border-border/60 bg-card/95 mx-6 flex flex-col items-center gap-1.5 rounded-2xl border px-7 py-5 text-center shadow-xl shadow-black/30">
        <span className="text-foreground text-base font-semibold">{heading}</span>
        <span className="text-muted-foreground text-sm">{body}</span>
      </div>
    </div>
  );
}
