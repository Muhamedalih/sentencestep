"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, PartyPopper } from "lucide-react";

import { PronunciationButton } from "@/components/learning/pronunciation-button";
import { PronunciationSpeedControl } from "@/components/learning/pronunciation-speed-control";
import { ShiftReplayHint } from "@/components/learning/shift-replay-hint";
import { VocabularySentence } from "@/components/learning/vocabulary-sentence";
import { useLessonFontSettings } from "@/components/providers/lesson-font-settings-provider";
import { resolveSectionFontFamily } from "@/lib/admin/lesson-font-settings";
import { usePronunciationSettings } from "@/components/providers/pronunciation-settings-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { useTypingSoundSettings } from "@/components/providers/typing-sound-settings-provider";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTypingSound } from "@/hooks/use-typing-sound";
import { useWordProgress } from "@/hooks/use-word-progress";
import { resolveSectionSentenceCompleteSound } from "@/lib/admin/typing-sound-settings";
import { popIn } from "@/lib/motion";
import type { VocabularyWord, WordGroup } from "@/types/word-lists";

/** Words per practice block — see the queue/block state in VocabularyPractice. Groups no longer all share one fixed word count (20-30, see the word-lists content expansion); this just chunks whatever length a group actually has, with a shorter final block when it doesn't divide evenly. */
const BLOCK_SIZE = 5;

/**
 * The Word Lists practice session — deliberately not a re-skin of
 * LessonSession. The unit of progress here is one word, not one sentence
 * in a longer narrative: audio plays the target word alone (never the
 * full sentence — see PronunciationButton's `text` prop below), the
 * Arabic hint explains the word's meaning rather than translating the
 * sentence, and there's no illustration panel competing for attention —
 * the sentence, the blank, and the hint are the whole screen.
 */
export function VocabularyPractice({
  group,
  previewMode = false,
  defaultVoiceId,
}: {
  group: WordGroup;
  previewMode?: boolean;
  /** Word Lists always uses the global default voice — there's no per-word-group override (word groups have no admin editor to set one from yet; see resolveVoiceId's callers for the lesson-level equivalent). */
  defaultVoiceId?: string | null;
}) {
  const { t, dir } = useLocale();
  // Words are practiced in fixed-size blocks (see BLOCK_SIZE), not straight
  // through the whole group: a wrong word doesn't get corrected on the spot
  // (that would just be per-keystroke rejection wearing a different hat) —
  // it's requeued to the back of its own block's queue and re-asked after
  // the rest of the block, repeating for as long as it keeps coming back
  // wrong. `queue` holds indices into the CURRENT block (`blocks[blockIndex]`),
  // never raw word ids, since the same word can legitimately reappear in it
  // more than once.
  const words = group.words;
  const blocks = useMemo(() => {
    const chunks: VocabularyWord[][] = [];
    for (let i = 0; i < words.length; i += BLOCK_SIZE) {
      chunks.push(words.slice(i, i + BLOCK_SIZE));
    }
    return chunks;
  }, [words]);
  const [blockIndex, setBlockIndex] = useState(0);
  const [queue, setQueue] = useState<number[]>(() => blocks[0]?.map((_, i) => i) ?? []);
  // Distinct slots resolved correctly in the CURRENT block — grows only on a
  // right answer (a retry that finally lands doesn't double-count), purely
  // to drive the "n / blockSize" counter below.
  const [doneInBlock, setDoneInBlock] = useState<Set<number>>(() => new Set());
  const [isComplete, setIsComplete] = useState(false);
  const { isWordCompleted, completedCountIn, markWordComplete } = useWordProgress();
  // A word already awarded progress this session (via markWordComplete)
  // never needs to be awarded it again if a later block somehow reintroduces
  // it — resets alongside everything else on "Practice again".
  const markedWordIdsRef = useRef<Set<string>>(new Set());

  const currentBlock = blocks[blockIndex] ?? [];
  const currentSlot: number | undefined = queue[0];
  const blockSize = currentBlock.length;
  const positionInBlock = Math.min(doneInBlock.size + 1, blockSize || 1);

  // Once every slot in the current block has been resolved correctly (the
  // queue drains to empty), advance to the next block or finish the lesson.
  // Runs as an effect (not inline in handleWordResult) because a slot can
  // resolve correctly via either branch below and either one needs the same
  // "is the block now done" check afterward.
  useEffect(() => {
    if (queue.length > 0 || currentBlock.length === 0) return;
    if (blockIndex + 1 < blocks.length) {
      const nextIndex = blockIndex + 1;
      setBlockIndex(nextIndex);
      setQueue(blocks[nextIndex]!.map((_, i) => i));
      setDoneInBlock(new Set());
    } else {
      setIsComplete(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the queue/block actually change
  }, [queue, blockIndex]);
  // Owned here, not inside VocabularySentence (which remounts every word) —
  // this is what lets PronunciationButton's own built-in refocus-after-click
  // (see its inputRef prop) find the currently-mounted input no matter which
  // word is showing. Same fix TypingSentence gets for free by owning both
  // the engine and the button itself; here they're one level apart, so the
  // ref is what's shared instead.
  const inputRef = useRef<HTMLInputElement>(null);
  const sectionFontFamily = resolveSectionFontFamily(useLessonFontSettings(), "wordLists");
  const typingSoundSettings = useTypingSoundSettings();
  const { play, playSentenceComplete } = useTypingSound({
    pack: typingSoundSettings.soundPack,
    enabled: typingSoundSettings.enabled,
    volume: typingSoundSettings.volume,
    sentenceCompleteSound: typingSoundSettings.sentenceCompleteSound,
  });

  const total = group.words.length;
  const word = currentSlot !== undefined ? currentBlock[currentSlot] : undefined;
  const completedCount = completedCountIn(group.words.map((w) => w.id));

  // Same fix as LessonSession's identical effect: while the learner types
  // the current word, resolve the NEXT word's pronunciation in the
  // background so its PronunciationButton finds it already cached (see
  // PronunciationSettingsProvider) instead of paying the resolve round
  // trip when it becomes active. "Next" here follows the queue, not a flat
  // index — usually the next slot in this block, but the first word of the
  // next block once the current one is down to its last slot.
  const nextWord = queue.length > 1 ? currentBlock[queue[1]!] : blocks[blockIndex + 1]?.[0];
  const { prefetchPronunciation } = usePronunciationSettings();
  useEffect(() => {
    if (!defaultVoiceId || !nextWord) return;
    prefetchPronunciation({
      contentType: "word",
      contentId: nextWord.id,
      voiceId: defaultVoiceId,
    });
  }, [nextWord, defaultVoiceId, prefetchPronunciation]);

  // Grades one attempt at the current word (see VocabularySentence.onResult):
  // right answers retire their slot and count toward this block's progress;
  // wrong ones go back to the end of the SAME block's queue, so the learner
  // finishes the rest of the block first and only then sees this word again
  // — repeating for as long as it keeps coming back wrong (see the
  // block-advance effect above for what happens once the queue drains).
  function handleWordResult(correct: boolean) {
    if (!word || currentSlot === undefined) return;
    if (correct) {
      playSentenceComplete(resolveSectionSentenceCompleteSound(typingSoundSettings, "wordLists"));
      if (!previewMode && !markedWordIdsRef.current.has(word.id)) {
        markedWordIdsRef.current.add(word.id);
        markWordComplete(group.id, word.id);
      }
      setDoneInBlock((prev) => new Set(prev).add(currentSlot));
      setQueue((prev) => prev.slice(1));
    } else {
      play("error");
      setQueue((prev) => [...prev.slice(1), prev[0]!]);
    }
  }

  return (
    <div className="flex h-svh w-full flex-col">
      {!isComplete && (
        <>
          <ShiftReplayHint />
          <PronunciationSpeedControl inputRef={inputRef} />
        </>
      )}
      <div className="shrink-0 px-6 pt-4 lg:px-16 lg:pt-5">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/learn/word-lists"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t.wordLists.navLabel}
          </Link>
          {!isComplete && blockSize > 0 && (
            <span className="text-muted-foreground shrink-0 text-sm font-medium" dir="ltr">
              {positionInBlock} / {blockSize}
            </span>
          )}
        </div>
        {previewMode && (
          <div className="border-accent/40 bg-accent/10 text-accent-foreground mt-4 rounded-lg border px-4 py-2.5 text-sm font-medium">
            {t.wordLists.previewModeNotice}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isComplete ? (
          <motion.div
            key="complete"
            className="flex flex-1 items-center justify-center px-6 py-8 lg:px-16"
          >
            <motion.div
              variants={popIn}
              initial="hidden"
              animate="visible"
              className="border-border bg-card flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border p-12 text-center"
            >
              <div className="bg-success/15 text-success flex size-14 items-center justify-center rounded-full">
                <PartyPopper className="size-7" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">{t.wordLists.complete}</h2>
                <p className="text-muted-foreground mt-1" dir="ltr">
                  {group.title}
                </p>
              </div>
              <div className="w-full max-w-xs text-left">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">
                    {t.wordLists.progressLabel}
                  </span>
                  <span className="text-muted-foreground" dir="ltr">
                    {completedCount} / {total} {t.wordLists.wordsUnit}
                  </span>
                </div>
                <Progress value={(completedCount / total) * 100} />
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                <Button variant="outline" asChild>
                  <Link href="/learn/word-lists">{t.wordLists.backToWordLists}</Link>
                </Button>
                <Button
                  onClick={() => {
                    setBlockIndex(0);
                    setQueue(blocks[0]?.map((_, i) => i) ?? []);
                    setDoneInBlock(new Set());
                    markedWordIdsRef.current = new Set();
                    setIsComplete(false);
                  }}
                >
                  {t.wordLists.practiceAgain}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          word && (
            <motion.div
              key={word.id}
              initial={false}
              className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-8 lg:px-16"
            >
              <div className="flex w-full max-w-2xl items-center justify-between">
                <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {t.wordLists.wordListBadge}
                </span>
                <PronunciationButton
                  // Only the target word is pronounced — never the full
                  // sentence. This is the one rule this whole screen is
                  // built around; see the component doc comment above.
                  text={word.targetWord}
                  audioUrl={word.audioUrl}
                  onPlay={undefined}
                  autoPlay
                  resetKey={word.id}
                  inputRef={inputRef}
                  kokoroVoiceId={defaultVoiceId}
                  contentType="word"
                  contentId={word.id}
                />
              </div>

              {/* The support-language meaning first, English sentence second
                  and clearly larger — the learner reads what the word means,
                  hears it (above), then has to recall and type it below.
                  Never falls back to word.hintAr for Spanish (same rule as
                  typing-sentence.tsx's supportText) — and unlike sentence
                  translations, there's no neutral English hint field to fall
                  back to either (see types/word-lists.ts's hintAr doc
                  comment), so a genuinely missing translation renders
                  nothing here rather than a semantically wrong stand-in. */}
              {word.supportHint && (
                <p
                  className="text-foreground w-full max-w-2xl text-center text-2xl font-semibold text-balance sm:text-3xl"
                  dir={dir}
                >
                  {word.supportHint}
                </p>
              )}

              <div className="w-full max-w-2xl">
                <VocabularySentence
                  sentence={word.sentence}
                  targetWord={word.targetWord}
                  onResult={handleWordResult}
                  inputRef={inputRef}
                  fontFamily={sectionFontFamily}
                />
              </div>

              {isWordCompleted(word.id) && (
                <span className="text-success text-xs font-medium">
                  {t.wordLists.completedBefore}
                </span>
              )}
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
