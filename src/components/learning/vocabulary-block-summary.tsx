"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, PencilLine, Star } from "lucide-react";

import { PronunciationButton } from "@/components/learning/pronunciation-button";
import { useLocale } from "@/components/providers/locale-provider";
import { usePronunciationSettings } from "@/components/providers/pronunciation-settings-provider";
import { Button } from "@/components/ui/button";
import { easeOut, popIn } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { formatIpa } from "@/lib/word-lists-ipa";
import { wordStars } from "@/lib/word-mastery/schedule";
import type { WordOutcome } from "@/lib/word-mastery/schedule";
import { splitWordHint } from "@/lib/word-lists-hint";
import { BLANK_TOKEN } from "@/types/word-lists";
import type { VocabularyWord } from "@/types/word-lists";

/** How long the Next button waits before taking keyboard focus — long enough that a stray Enter from the last word's typing can't press it by accident. */
const FOCUS_DELAY_MS = 700;

/**
 * What a learner sees after every block of five words (see VocabularyPractice's
 * BLOCK_SIZE): the five words they just got right, in one tidy list, with a
 * single button under it that moves on. Each row is closed to a line — the
 * word, its meaning in the support language, a speaker and a Practice button that
 * opens a free practice of just that word — and opens on tap to show how the
 * word is pronounced (IPA), the rest of its definition and the context sentence
 * it was practiced in. The first row starts open so the list never looks like a
 * wall of closed doors.
 *
 * The whole screen is built to fit one viewport without scrolling (a compact
 * one-line header, tight rows, the button in the flow rather than stuck to the
 * bottom); the scroll is only a fallback for a very short window.
 *
 * The same screen ends the group: on the last block the button reads Finish
 * and hands over to the group-complete screen instead of opening more words.
 */
export function VocabularyBlockSummary({
  words,
  blockNumber,
  blockCount,
  firstWordNumber,
  totalWords,
  onContinue,
  defaultVoiceId,
  results,
  onPracticeWord,
}: {
  /** The block's words, in practice order. */
  words: VocabularyWord[];
  /** 1-based position of this block in the group. */
  blockNumber: number;
  blockCount: number;
  /** 1-based position, within the whole group, of this block's first word. */
  firstWordNumber: number;
  totalWords: number;
  onContinue: () => void;
  defaultVoiceId?: string | null;
  /** Smart word practice only: how each word of the block ended (clean, hint, miss), shown as its 1–3 stars and as a "right on the first try" count. Absent, the summary is exactly what it always was. */
  results?: ReadonlyMap<string, WordOutcome>;
  /** Opens a free practice of one word of the block. Absent, the rows have no Practice button. */
  onPracticeWord?: (word: VocabularyWord) => void;
}) {
  const { t, dir } = useLocale();
  const reducedMotion = useReducedMotion() ?? false;
  const [open, setOpen] = useState<ReadonlySet<string>>(
    () => new Set(words[0] ? [words[0].id] : []),
  );
  const continueRef = useRef<HTMLButtonElement>(null);

  const cleanCount = results ? words.filter((word) => results.get(word.id) === "clean").length : 0;
  const isLastBlock = blockNumber >= blockCount;
  const lastWordNumber = firstWordNumber + words.length - 1;
  const allOpen = words.length > 0 && words.every((word) => open.has(word.id));
  const nextFrom = lastWordNumber + 1;
  const nextTo = Math.min(lastWordNumber + words.length, totalWords);

  // Warm the pronunciations so a tap on a speaker plays at once. Most are
  // already cached from practice; this covers any word that was never heard
  // (a first try needs no replay).
  const { prefetchPronunciation } = usePronunciationSettings();
  useEffect(() => {
    if (!defaultVoiceId) return;
    for (const word of words) {
      if (word.audioUrl) continue;
      prefetchPronunciation({ contentType: "word", contentId: word.id, voiceId: defaultVoiceId });
    }
  }, [words, defaultVoiceId, prefetchPronunciation]);

  // The learner's hands are on the keyboard (they were just typing), so let
  // Enter / Space carry on — after a beat, see FOCUS_DELAY_MS.
  useEffect(() => {
    const timer = setTimeout(
      () => continueRef.current?.focus({ preventScroll: true }),
      FOCUS_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, []);

  function toggle(id: string) {
    setOpen((previous) => {
      const next = new Set(previous);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setOpen(allOpen ? new Set() : new Set(words.map((word) => word.id)));
  }

  return (
    <motion.div initial={false} className="flex min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto my-auto flex w-full max-w-2xl flex-col gap-3 px-6 py-3">
        <motion.header
          variants={popIn}
          initial={reducedMotion ? false : "hidden"}
          animate="visible"
          dir={dir}
          className="flex flex-wrap items-center gap-x-3 gap-y-2"
        >
          <div className="bg-success/15 text-success flex size-11 shrink-0 items-center justify-center rounded-full">
            <Check className="size-5" strokeWidth={2.5} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl leading-tight font-bold tracking-tight text-balance">
              {t.wordLists.blockDoneTitle}
            </h2>
            <p className="text-muted-foreground mt-0.5 text-xs">{t.wordLists.blockDoneHint}</p>
          </div>
          <div className="flex w-full shrink-0 flex-col items-end gap-1 sm:w-36">
            <div
              role="img"
              aria-label={t.wordLists.blockProgressAria
                .replace("{current}", String(blockNumber))
                .replace("{total}", String(blockCount))}
              className="flex w-full gap-1"
            >
              {Array.from({ length: blockCount }, (_, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    index < blockNumber ? "bg-success" : "bg-border",
                  )}
                />
              ))}
            </div>
            <p className="text-muted-foreground text-xs font-semibold tabular-nums">
              {t.wordLists.blockRange
                .replace("{from}", String(firstWordNumber))
                .replace("{to}", String(lastWordNumber))
                .replace("{total}", String(totalWords))}
            </p>
          </div>
        </motion.header>

        <div className="flex items-center justify-between gap-3" dir={dir}>
          {results ? (
            <p className="text-success text-xs font-semibold tabular-nums">
              {t.wordLists.smart.firstTry
                .replace("{n}", String(cleanCount))
                .replace("{total}", String(words.length))}
            </p>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={toggleAll}
            className="text-primary focus-visible:ring-ring min-h-8 rounded-md px-1 text-sm font-semibold outline-none focus-visible:ring-2"
          >
            {allOpen ? t.wordLists.collapseAll : t.wordLists.expandAll}
          </button>
        </div>

        <ul className="-mt-1.5 flex flex-col gap-1.5">
          {words.map((word, index) => (
            <SummaryRow
              key={word.id}
              word={word}
              position={firstWordNumber + index}
              index={index}
              open={open.has(word.id)}
              onToggle={() => toggle(word.id)}
              defaultVoiceId={defaultVoiceId}
              reducedMotion={reducedMotion}
              outcome={results?.get(word.id)}
              onPractice={onPracticeWord ? () => onPracticeWord(word) : undefined}
            />
          ))}
        </ul>

        <div className="flex flex-col items-center gap-1.5 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <motion.div
            whileHover={reducedMotion ? undefined : { scale: 1.03, y: -2 }}
            whileTap={reducedMotion ? undefined : { scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
            className="w-full sm:w-auto"
          >
            <Button
              ref={continueRef}
              size="lg"
              onClick={onContinue}
              className="shadow-primary/25 hover:shadow-primary/35 w-full shadow-lg transition-shadow sm:min-w-64"
            >
              {isLastBlock ? t.wordLists.finishBlock : t.wordLists.nextBlock}
              {isLastBlock ? (
                <Check aria-hidden="true" />
              ) : (
                <ArrowRight className="rtl:rotate-180" aria-hidden="true" />
              )}
            </Button>
          </motion.div>
          <p className="text-muted-foreground text-center text-xs tabular-nums" dir={dir}>
            {isLastBlock
              ? t.wordLists.finishBlockHint
              : t.wordLists.nextBlockHint
                  .replace("{from}", String(nextFrom))
                  .replace("{to}", String(nextTo))}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function SummaryRow({
  word,
  position,
  index,
  open,
  onToggle,
  defaultVoiceId,
  reducedMotion,
  outcome,
  onPractice,
}: {
  word: VocabularyWord;
  position: number;
  index: number;
  open: boolean;
  onToggle: () => void;
  defaultVoiceId?: string | null;
  reducedMotion: boolean;
  /** Smart word practice only — see VocabularyBlockSummary's `results`. */
  outcome?: WordOutcome;
  /** Opens a free practice of this word (see VocabularyBlockSummary's `onPracticeWord`). */
  onPractice?: () => void;
}) {
  const { t, dir } = useLocale();
  // The support-language meaning only — never a fall back to the Arabic hint
  // for another locale, same rule as VocabularyPractice.
  const hint = word.supportHint ? splitWordHint(word.supportHint) : null;
  const ipa = formatIpa(word.ipa);
  const [prefix = "", suffix = ""] = word.sentence.split(BLANK_TOKEN).map((part) => part.trim());
  const panelId = `block-summary-${word.id}`;

  // The closed row keeps the meaning to one line, so a long one is cut off
  // there. When it is, the open row repeats it in full — otherwise the part
  // that is cut off could not be read anywhere.
  const termRef = useRef<HTMLSpanElement>(null);
  const [termClipped, setTermClipped] = useState(false);
  useEffect(() => {
    const element = termRef.current;
    if (!element) return;
    const measure = () => setTermClipped(element.scrollWidth > element.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [hint?.term]);

  return (
    <motion.li
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: easeOut, delay: 0.1 + index * 0.07 }}
      data-open={open}
      className={cn(
        "bg-card overflow-hidden rounded-2xl border transition-colors duration-200",
        open ? "border-primary/40" : "border-border",
      )}
    >
      <div className="flex items-center gap-2 py-1 ps-3 pe-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="focus-visible:ring-ring flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-lg text-start outline-none focus-visible:ring-2"
        >
          <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums">
            {position}
          </span>
          <span dir="ltr" lang="en" className="shrink-0 text-xl font-extrabold tracking-tight">
            {word.targetWord}
          </span>
          {hint && (
            <span
              ref={termRef}
              className="text-muted-foreground min-w-0 flex-1 truncate text-sm"
              dir={dir}
            >
              {hint.term}
            </span>
          )}
          {outcome && <WordStars outcome={outcome} label={t.wordLists.smart.starsAria} />}
          <ChevronDown
            className={cn(
              "text-muted-foreground size-4.5 shrink-0 transition-transform duration-200 max-sm:hidden",
              outcome ? "ms-1" : "ms-auto",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
        <PronunciationButton
          text={word.targetWord}
          audioUrl={word.audioUrl}
          resetKey={word.id}
          kokoroVoiceId={defaultVoiceId}
          contentType="word"
          contentId={word.id}
          variant="outline"
          className="text-primary rounded-full"
        />
        {onPractice && (
          <Button
            type="button"
            variant="outline"
            onClick={onPractice}
            aria-label={t.wordLists.practiceWordAria.replace("{word}", word.targetWord)}
            className="text-primary h-9 shrink-0 gap-1.5 rounded-full px-3 max-sm:px-2.5"
          >
            <PencilLine className="size-4" aria-hidden="true" />
            <span className="max-sm:sr-only">{t.wordLists.practiceWord}</span>
          </Button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            key="panel"
            initial={reducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.28, ease: easeOut }}
            className="overflow-hidden"
          >
            <div className="border-border mx-3 flex flex-col gap-1.5 border-t border-dashed pt-2.5 pb-3">
              {ipa && (
                <p dir="ltr" className="text-muted-foreground text-base font-medium">
                  {ipa}
                </p>
              )}
              {hint && termClipped && (
                <p className="text-foreground text-sm font-semibold" dir={dir}>
                  {hint.term}
                </p>
              )}
              {hint?.definition && (
                <p className="text-muted-foreground text-sm" dir={dir}>
                  {hint.definition}
                </p>
              )}
              <p
                dir="ltr"
                lang="en"
                className="text-muted-foreground text-start text-[0.95rem] leading-relaxed"
              >
                {prefix && <span>{prefix} </span>}
                <span className="bg-primary/10 text-primary rounded-md px-1.5 py-0.5 font-semibold">
                  {word.targetWord}
                </span>
                {suffix && <span> {suffix}</span>}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

/**
 * A word's result as 1-3 small stars: three for right on the first try, two
 * after one hint, one after a miss (or a second hint) — the same three steps
 * that decide what happens to the word's schedule (see wordStars).
 */
function WordStars({ outcome, label }: { outcome: WordOutcome; label: string }) {
  const lit = wordStars({ missed: outcome === "missed", hints: outcome === "assisted" ? 1 : 0 });
  return (
    <span
      role="img"
      aria-label={label.replace("{n}", String(lit))}
      className="ms-auto flex shrink-0 items-center gap-0.5"
    >
      {[1, 2, 3].map((n) => (
        <Star
          key={n}
          aria-hidden="true"
          className={cn(
            "size-3.5",
            n <= lit ? "fill-accent text-accent" : "text-muted-foreground/40 fill-transparent",
          )}
        />
      ))}
    </span>
  );
}
