"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";

import { LessonSettings } from "@/components/learning/lesson-settings";
import { PronunciationButton } from "@/components/learning/pronunciation-button";
import { SharedInputHost, SharedInputProvider } from "@/components/learning/shared-input";
import { ShiftReplayHint } from "@/components/learning/shift-replay-hint";
import { VocabularySentence } from "@/components/learning/vocabulary-sentence";
import { useLessonFontSettings } from "@/components/providers/lesson-font-settings-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { usePronunciationSettings } from "@/components/providers/pronunciation-settings-provider";
import { useTypingSoundSettings } from "@/components/providers/typing-sound-settings-provider";
import { Button } from "@/components/ui/button";
import { useTypingSound } from "@/hooks/use-typing-sound";
import { resolveSectionFontFamily } from "@/lib/admin/lesson-font-settings";
import { resolveSectionSentenceCompleteSound } from "@/lib/admin/typing-sound-settings";
import {
  answerWord,
  blankSentenceFor,
  findWordInSentences,
  isRunFinished,
  startWordsRun,
  wordMeaning,
  type StoryWordOutcomes,
} from "@/lib/story-words";
import { BLANK_TOKEN } from "@/types/word-lists";
import type { Sentence, VocabularyItem } from "@/types/content";

/** Same direction-aware slide as VocabularyLearn (src/components/learning/vocabulary-learn.tsx) — kept in sync deliberately so the two "one word at a time" screens feel identical. */
const wordVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction === 0 ? 0 : direction > 0 ? 48 : -48,
    scale: 0.96,
  }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction === 0 ? 0 : direction > 0 ? -48 : 48,
    scale: 0.96,
  }),
};

interface StoryWordsScreenProps {
  lessonId: string;
  /** The story's title, shown at the top left. */
  title: string;
  vocabulary: VocabularyItem[];
  sentences: Sentence[];
  /** The voice every word is pronounced in — see StoryWordsPanel's own `narratorVoiceId`/`defaultVoiceId`. */
  voiceId?: string | null;
  /** Set when the step was opened again from the finish page: the title then goes back there. */
  onExit?: () => void;
}

/**
 * The words step at the end of a story: the story's own target words, shown one at a time as in
 * Word Lists' Learn view (VocabularyLearn), then typed one at a time as in Word Lists' practice
 * (VocabularyPractice) — the same engine (VocabularySentence), and the same rule for a miss: the
 * word goes to the back of the queue and comes round again, for as long as it keeps coming back
 * wrong. Reused at the user's explicit request rather than invented fresh, just re-sourced from a
 * story's 2-3 curated VocabularyItem entries instead of a 20+ word WordGroup, and swapped in over
 * the finish page in place (see LessonSession) since everything it needs is already in the
 * lesson's own data.
 *
 * It is the step between the last sentence and the finish page, so it is not skippable: there is
 * no way out other than typing every word (the Logo link above is the way to leave the lesson, and
 * the lesson was already recorded when the last sentence was done). Opened again from the finish
 * page it gets `onExit`, which adds a way back. `onFinished` receives how each word ended.
 */
export function StoryWordsPanel({
  lessonId,
  title,
  vocabulary,
  sentences,
  defaultVoiceId,
  narratorVoiceId,
  onFinished,
  onExit,
}: Omit<StoryWordsScreenProps, "voiceId"> & {
  defaultVoiceId?: string | null;
  /** This story's own resolved ElevenLabs narrator voice (see resolveStoryNarratorVoice) — preferred over defaultVoiceId whenever it resolves, so a word plays in the exact same voice as the story's sentences. Falls back to defaultVoiceId when null (no ElevenLabs voice configured yet for this story), preserving the pre-existing behavior rather than rendering no audio at all. */
  narratorVoiceId?: string | null;
  /** Every word has been typed right; how each one ended. */
  onFinished: (outcomes: StoryWordOutcomes) => void;
}) {
  const voiceId = narratorVoiceId ?? defaultVoiceId;
  const [phase, setPhase] = useState<"learn" | "test">("learn");

  // Resolves every word's pronunciation up front, once, on mount — stronger
  // than VocabularyLearn's own neighbor-only prefetch (fine for its 20+ word
  // lists, where prefetching everything would be wasteful) but this step only
  // ever holds 2-3 words, so eagerly warming all of them costs nothing and
  // guarantees PronunciationButton's autoPlay never pays a live resolve
  // round trip while the slide transition is also animating — that overlap
  // is what was reading as stutter/glitching when stepping between words.
  const { prefetchPronunciation } = usePronunciationSettings();
  useEffect(() => {
    if (!voiceId) return;
    for (const word of vocabulary) {
      prefetchPronunciation({
        contentType: "story_vocab_word",
        contentId: `${lessonId}::${word.en}`,
        voiceId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberately once-on-mount, not re-run per navigation (see comment above)
  }, []);

  const screen = { lessonId, title, vocabulary, sentences, voiceId, onExit };
  return phase === "learn" ? (
    <WordsLearn {...screen} onStart={() => setPhase("test")} />
  ) : (
    <WordsTest {...screen} onFinished={onFinished} />
  );
}

/** The top-left of both screens: the story's title, which goes back to the finish page when the step was opened from there. */
function StoryTitle({ title, onExit }: { title: string; onExit?: () => void }) {
  const { t } = useLocale();
  const className =
    "text-muted-foreground inline-flex min-w-0 items-center gap-1.5 text-sm font-medium";
  if (onExit) {
    return (
      <button
        type="button"
        onClick={onExit}
        aria-label={`${t.lesson.storyEnd.wordsBack}: ${title}`}
        className={`${className} hover:text-foreground pointer-coarse:min-h-11`}
      >
        <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
        <span dir="ltr" className="truncate">
          {title}
        </span>
      </button>
    );
  }
  return (
    <span className={className}>
      <BookOpen className="size-4 shrink-0" aria-hidden="true" />
      <span dir="ltr" className="truncate">
        {title}
      </span>
    </span>
  );
}

/** Word Lists' Learn view, over the story's words: the meaning, the word large, the sentence it came from, arrows between words and the button that starts the test. */
function WordsLearn({
  lessonId,
  title,
  vocabulary,
  sentences,
  voiceId,
  onExit,
  onStart,
}: StoryWordsScreenProps & { onStart: () => void }) {
  const { t, dir, locale } = useLocale();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const total = vocabulary.length;
  const item = vocabulary[index];
  const example = useMemo(
    () => (item ? findWordInSentences(item.en, sentences) : null),
    [item, sentences],
  );
  const meaning = item ? wordMeaning(item, locale) : null;

  if (!item) return null;

  function goTo(nextIndex: number, dir: number) {
    const clamped = Math.min(Math.max(nextIndex, 0), total - 1);
    if (clamped === index) return;
    setDirection(dir);
    setIndex(clamped);
  }

  return (
    // flex-1, not a fixed h-svh: LessonSession already spends part of the screen on its brand
    // bar, and a full-height box under it ran past the bottom and made the page scroll.
    <div className="bg-background flex min-h-0 w-full flex-1 flex-col">
      <h2 className="sr-only">{t.lesson.storyEnd.wordsHeading}</h2>
      <ShiftReplayHint />

      <div className="shrink-0 px-6 pt-4 lg:px-16 lg:pt-5">
        <div className="flex items-center justify-between gap-4">
          <StoryTitle title={title} onExit={onExit} />
          <PronunciationButton
            text={item.en}
            autoPlay
            resetKey={item.id}
            kokoroVoiceId={voiceId}
            contentType="story_vocab_word"
            contentId={`${lessonId}::${item.en}`}
            label={t.wordLists.replayAction}
            variant="outline"
            size="sm"
          />
        </div>
      </div>

      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={item.id}
          custom={direction}
          variants={wordVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 340, damping: 32, mass: 0.9 }}
          className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-6 lg:px-16"
        >
          {meaning && (
            <p
              className="text-foreground text-[clamp(1.75rem,1.4rem+1.6vw,2.25rem)] leading-tight font-bold text-balance"
              dir={dir}
            >
              {meaning}
            </p>
          )}

          <p
            dir="ltr"
            className="text-primary text-[clamp(3.75rem,2.06rem+6.75vw,8.25rem)] leading-none font-extrabold tracking-tight"
          >
            {item.en}
          </p>

          {example && (
            <p
              dir="ltr"
              className="text-foreground w-full max-w-2xl text-center text-[clamp(1.35rem,1.17rem+1.43vw,1.76rem)] leading-relaxed font-medium text-balance"
            >
              {example.prefix && <span>{example.prefix} </span>}
              {example.lead}
              <span className="bg-primary/10 text-primary mx-1 inline-block rounded-md px-2 py-0.5 font-semibold">
                {example.word}
              </span>
              {example.tail}
              {example.suffix && <span> {example.suffix}</span>}
            </p>
          )}

          {total > 1 && (
            <div className="mt-1 flex items-center gap-4">
              <button
                type="button"
                onClick={() => goTo(index - 1, -1)}
                disabled={index === 0}
                aria-label={t.wordLists.prevWordAria}
                className="text-muted-foreground hover:text-foreground hover:border-primary/40 border-border flex size-8 items-center justify-center rounded-full border transition-colors disabled:opacity-30 pointer-coarse:size-11"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
              </button>
              <span className="text-muted-foreground text-sm font-medium tabular-nums" dir="ltr">
                {index + 1} / {total}
              </span>
              <button
                type="button"
                onClick={() => goTo(index + 1, 1)}
                disabled={index === total - 1}
                aria-label={t.wordLists.nextWordAria}
                className="text-muted-foreground hover:text-foreground hover:border-primary/40 border-border flex size-8 items-center justify-center rounded-full border transition-colors disabled:opacity-30 pointer-coarse:size-11"
              >
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          )}

          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
            className="mt-3"
          >
            <Button
              type="button"
              size="lg"
              onClick={onStart}
              className="shadow-primary/25 hover:shadow-primary/35 shadow-lg transition-shadow"
            >
              {t.wordLists.startTest}
            </Button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * Word Lists' practice over the story's words: each word's meaning above its sentence with the
 * word blanked out, typed in the blank. A wrong word is sent to the back of the queue (see
 * answerWord) and the test ends once every word has been typed right.
 */
function WordsTest({
  lessonId,
  title,
  vocabulary,
  sentences,
  voiceId,
  onExit,
  onFinished,
}: StoryWordsScreenProps & { onFinished: (outcomes: StoryWordOutcomes) => void }) {
  const { t, dir, locale } = useLocale();
  const [run, setRun] = useState(() => startWordsRun(vocabulary.map((word) => word.id)));
  const byId = useMemo(() => new Map(vocabulary.map((word) => [word.id, word])), [vocabulary]);
  const item = run.queue[0] ? byId.get(run.queue[0]) : undefined;
  const total = vocabulary.length;
  // Owned here, not inside VocabularySentence (which remounts every word) — this is what lets
  // LessonSettings' own refocus-after-click find the currently-mounted input whichever word is
  // showing. Same arrangement as VocabularyPractice.
  const inputRef = useRef<HTMLInputElement>(null);
  const fontFamily = resolveSectionFontFamily(useLessonFontSettings(), "wordLists");
  const typingSoundSettings = useTypingSoundSettings();
  const { play, playSentenceComplete } = useTypingSound({
    pack: typingSoundSettings.soundPack,
    enabled: typingSoundSettings.enabled,
    volume: typingSoundSettings.volume,
    sentenceCompleteSound: typingSoundSettings.sentenceCompleteSound,
  });

  function handleResult(correct: boolean) {
    // Same chimes as Word Lists' own practice (VocabularyPractice): the section's configured
    // sentence-complete sound for a right word, the error sound for a wrong one.
    if (correct) {
      playSentenceComplete(resolveSectionSentenceCompleteSound(typingSoundSettings, "stories"));
    } else {
      play("error");
    }
    const next = answerWord(run, correct);
    setRun(next);
    if (isRunFinished(next)) onFinished(next.outcomes);
  }

  const meaning = item ? wordMeaning(item, locale) : null;
  const askKey = item ? `${item.id}:${run.asked}` : "";

  return (
    <SharedInputProvider>
      <div className="bg-background relative flex min-h-0 w-full flex-1 flex-col">
        <SharedInputHost />
        <h2 className="sr-only">{t.lesson.storyEnd.wordsHeading}</h2>
        <ShiftReplayHint />

        <div className="shrink-0 px-6 pt-4 lg:px-16 lg:pt-5 [html[data-keyboard]_&]:pt-2">
          <div className="flex items-center justify-between gap-4">
            <StoryTitle title={title} onExit={onExit} />
            {item && (
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-muted-foreground text-sm font-medium" dir="ltr">
                  {total - run.queue.length} / {total}
                </span>
                <LessonSettings
                  // Only the target word is pronounced — never the full sentence, as in Word Lists.
                  text={item.en}
                  autoPlay
                  resetKey={askKey}
                  inputRef={inputRef}
                  kokoroVoiceId={voiceId}
                  contentType="story_vocab_word"
                  contentId={`${lessonId}::${item.en}`}
                />
              </div>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {item && (
            <motion.div
              // The answer count is part of the key: a word that comes round again is a new
              // question, so its sentence starts over even when it is the only word left.
              key={askKey}
              initial={false}
              className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-8 lg:px-16 [html[data-keyboard]_&]:gap-3 [html[data-keyboard]_&]:py-3"
            >
              {meaning && (
                <div className="flex w-full max-w-2xl flex-col items-center gap-2 text-center">
                  <p
                    className="text-foreground/85 text-[1.8rem] font-bold text-balance sm:text-[2.16rem]"
                    dir={dir}
                  >
                    {meaning}
                  </p>
                </div>
              )}

              <div className="bg-border compact-hide h-10 w-px" aria-hidden="true" />

              <div className="flex w-full max-w-2xl flex-col items-center gap-3">
                <VocabularySentence
                  sentence={blankSentenceFor(item.en, sentences) ?? BLANK_TOKEN}
                  targetWord={item.en}
                  onResult={handleResult}
                  inputRef={inputRef}
                  fontFamily={fontFamily}
                  enlarged
                  inline
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SharedInputProvider>
  );
}
