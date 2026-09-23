"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

import { PronunciationButton } from "@/components/learning/pronunciation-button";
import { ShiftReplayHint } from "@/components/learning/shift-replay-hint";
import { VocabularySentence } from "@/components/learning/vocabulary-sentence";
import { useLocale } from "@/components/providers/locale-provider";
import { usePronunciationSettings } from "@/components/providers/pronunciation-settings-provider";
import { Button } from "@/components/ui/button";
import { resolveVocabularySupportText } from "@/lib/content-helpers";
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

function stripPunctuation(word: string): string {
  return word.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, "");
}

/** Finds the first sentence containing `word` (case-insensitive, whole word) and rebuilds it with BLANK_TOKEN standing in for that occurrence — the exact shape VocabularySentence expects (see its own `sentence` prop doc comment), constructed here from plain sentence text since a story's VocabularyItem carries no pre-blanked sentence of its own the way a WordGroup's VocabularyWord does. */
function findBlankedSentence(word: string, sentences: Sentence[]): string | null {
  const target = word.toLowerCase();
  for (const sentence of sentences) {
    const words = sentence.en.split(/\s+/);
    const index = words.findIndex((w) => stripPunctuation(w).toLowerCase() === target);
    if (index !== -1) {
      const prefix = words.slice(0, index).join(" ");
      const suffix = words.slice(index + 1).join(" ");
      return [prefix, BLANK_TOKEN, suffix].filter(Boolean).join(" ");
    }
  }
  return null;
}

/** Same lookup, but returns the plain (unblanked) prefix/word/suffix split — used for the non-practicing preview, where the word should read normally in context rather than through VocabularySentence's blank+typing machinery. */
function findExample(word: string, sentences: Sentence[]) {
  const target = word.toLowerCase();
  for (const sentence of sentences) {
    const words = sentence.en.split(/\s+/);
    const index = words.findIndex((w) => stripPunctuation(w).toLowerCase() === target);
    if (index !== -1) {
      return {
        prefix: words.slice(0, index).join(" "),
        word: words[index]!,
        suffix: words.slice(index + 1).join(" "),
      };
    }
  }
  return null;
}

/**
 * Stories completion screen's "words from this lesson" panel — a deliberate
 * visual twin of the Word Lists "Learn" screen (VocabularyLearn), reused at
 * the user's explicit request rather than invented fresh, just re-sourced
 * from a lesson's 2-3 curated VocabularyItem entries instead of a 20+ word
 * WordGroup, and swapped in over the completion screen in place (see
 * LessonSession's isViewingWords branch) rather than a real route — the
 * vocabulary/sentences it needs are already sitting in that lesson's own
 * already-fetched data, so opening this costs no additional request.
 *
 * Practice mode reuses VocabularySentence — the exact same Enter-to-submit
 * typing engine Word Lists' own Practice session runs (see that
 * component's doc comment: exact match settles instantly, anything else
 * only grades on Enter and then reveals the correct spelling letter by
 * letter) — rather than a bespoke mask-and-match input, per explicit
 * instruction to match "the same system as the Word Lists section."
 */
export function StoryWordsPanel({
  vocabulary,
  sentences,
  defaultVoiceId,
  onBack,
}: {
  vocabulary: VocabularyItem[];
  sentences: Sentence[];
  defaultVoiceId?: string | null;
  onBack: () => void;
}) {
  const { t, dir, locale } = useLocale();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [practicing, setPracticing] = useState(false);
  const total = vocabulary.length;
  const item = vocabulary[index];
  const inputRef = useRef<HTMLInputElement>(null);

  const example = useMemo(() => (item ? findExample(item.en, sentences) : null), [item, sentences]);
  const blankedSentence = useMemo(
    () => (item ? findBlankedSentence(item.en, sentences) : null),
    [item, sentences],
  );

  // Same fix as VocabularyLearn's identical effect: resolve neighboring
  // words' pronunciation in the background so PronunciationButton's autoPlay
  // finds it already cached instead of paying the resolve round trip live
  // on every navigation — this is what was causing the visible stutter when
  // stepping between words (see this feature's own UI feedback).
  const { prefetchPronunciation } = usePronunciationSettings();
  useEffect(() => {
    if (!defaultVoiceId) return;
    for (const neighbor of [vocabulary[index + 1], vocabulary[index - 1]]) {
      if (!neighbor) continue;
      prefetchPronunciation({
        contentType: "word",
        contentId: neighbor.id,
        voiceId: defaultVoiceId,
      });
    }
  }, [vocabulary, index, defaultVoiceId, prefetchPronunciation]);

  if (!item) return null;

  function goTo(nextIndex: number, dir: number) {
    const clamped = Math.min(Math.max(nextIndex, 0), total - 1);
    if (clamped === index) return;
    setDirection(dir);
    setIndex(clamped);
    setPracticing(false);
  }

  return (
    <div className="flex h-svh w-full flex-col">
      <ShiftReplayHint />

      <div className="shrink-0 px-6 pt-4 lg:px-16 lg:pt-5">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span dir={dir}>{t.lesson.vocabularyHeading}</span>
          </button>
          <PronunciationButton
            text={item.en}
            autoPlay
            resetKey={item.id}
            inputRef={inputRef}
            kokoroVoiceId={defaultVoiceId}
            contentType="word"
            contentId={item.id}
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
          {practicing && blankedSentence ? (
            <VocabularySentence
              sentence={blankedSentence}
              targetWord={item.en}
              onResult={() => setPracticing(false)}
              inputRef={inputRef}
            />
          ) : (
            <>
              <p
                className="text-foreground text-[clamp(1.75rem,1.4rem+1.6vw,2.25rem)] leading-tight font-bold text-balance"
                dir={dir}
              >
                {resolveVocabularySupportText(item, locale)}
              </p>

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
                  <span className="bg-primary/10 text-primary mx-1 inline-block rounded-md px-2 py-0.5 font-semibold">
                    {example.word}
                  </span>
                  {example.suffix && <span> {example.suffix}</span>}
                </p>
              )}
            </>
          )}

          {total > 1 && (
            <div className="mt-1 flex items-center gap-4">
              <button
                type="button"
                onClick={() => goTo(index - 1, -1)}
                disabled={index === 0}
                aria-label={t.wordLists.prevWordAria}
                className="text-muted-foreground hover:text-foreground hover:border-primary/40 border-border flex size-8 items-center justify-center rounded-full border transition-colors disabled:opacity-30"
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
                className="text-muted-foreground hover:text-foreground hover:border-primary/40 border-border flex size-8 items-center justify-center rounded-full border transition-colors disabled:opacity-30"
              >
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {!practicing && blankedSentence && (
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
              className="mt-2"
            >
              {/* Filled in the same primary color as the big word above (not
                  a plain outline) — a deliberate visual echo, per explicit
                  request, so the button reads as "practice THIS word." */}
              <Button type="button" size="lg" onClick={() => setPracticing(true)}>
                <Sparkles className="size-4" aria-hidden="true" />
                {t.lesson.practiceWord}
              </Button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
