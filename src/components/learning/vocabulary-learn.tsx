"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, List, X } from "lucide-react";

import { PronunciationButton } from "@/components/learning/pronunciation-button";
import { ShiftReplayHint } from "@/components/learning/shift-replay-hint";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { splitWordHint } from "@/lib/word-lists-hint";
import { BLANK_TOKEN } from "@/types/word-lists";
import type { VocabularyWord, WordGroup } from "@/types/word-lists";

/**
 * Direction-aware slide/fade/scale for the word-to-word transition —
 * forward feels like stepping ahead (enters from the right, exits left),
 * backward the mirror of that, and jumping in from the sidebar (direction
 * 0) just crossfades in place rather than picking an arbitrary side. A
 * spring, not a fixed-duration tween, so it settles with a touch of
 * momentum instead of a mechanical linear stop — the "premium" feel is
 * mostly this one detail plus the scale dip on exit/entry.
 */
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

/**
 * The Word Lists "Learn" view — a browse-at-your-own-pace flashcard for
 * every word in a group, distinct from Practice (vocabulary-practice.tsx),
 * which is the recall exercise. Nothing here is graded and nothing writes
 * to word progress: this is the "see it, hear it, read it in a sentence"
 * step a learner does before attempting Practice, not a substitute for it —
 * see the "Start the test" button below, which is the deliberate hand-off
 * to that exercise once the learner is ready.
 */
export function VocabularyLearn({
  group,
  defaultVoiceId,
}: {
  group: WordGroup;
  defaultVoiceId?: string | null;
}) {
  const { t, dir } = useLocale();
  const words = useMemo(() => [...group.words].sort((a, b) => a.order - b.order), [group.words]);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const total = words.length;
  const word: VocabularyWord | undefined = words[index];

  const hint = word ? (word.supportHint ?? word.hintAr) : undefined;
  const { term, definition } = hint
    ? splitWordHint(hint)
    : { term: undefined, definition: undefined };

  const [prefix, suffix] = useMemo(() => {
    if (!word) return ["", ""];
    const parts = word.sentence.split(BLANK_TOKEN);
    return [parts[0]?.trim() ?? "", parts[1]?.trim() ?? ""];
  }, [word]);

  if (!word) return null;

  function goTo(nextIndex: number, dir: number) {
    const clamped = Math.min(Math.max(nextIndex, 0), total - 1);
    if (clamped === index) return;
    setDirection(dir);
    setIndex(clamped);
  }

  return (
    <div className="flex h-svh w-full">
      <ShiftReplayHint />

      {sidebarOpen && (
        <button
          type="button"
          aria-label={t.wordLists.wordListPanelAria}
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={cn(
          "border-border bg-card fixed inset-y-0 left-0 z-30 w-72 shrink-0 overflow-y-auto border-r p-3",
          "lg:static lg:z-auto lg:block",
          sidebarOpen ? "block" : "hidden",
        )}
      >
        <div className="mb-1 flex items-center justify-between px-1 pb-2 lg:hidden">
          <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {t.wordLists.wordListPanelAria}
          </span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label={t.wordLists.wordListPanelAria}
            className="text-muted-foreground hover:text-foreground rounded-md p-1"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <ul className="flex flex-col gap-0.5">
          {words.map((item, itemIndex) => {
            const active = itemIndex === index;
            const itemHint = item.supportHint ?? item.hintAr;
            const itemTerm = itemHint ? splitWordHint(itemHint).term : undefined;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    setDirection(itemIndex > index ? 1 : itemIndex < index ? -1 : 0);
                    setIndex(itemIndex);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-start transition-colors",
                    active ? "bg-primary/10" : "hover:bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      active ? "text-primary" : "text-foreground",
                    )}
                    dir="ltr"
                  >
                    {item.targetWord}
                  </span>
                  {itemTerm && (
                    <span className="text-muted-foreground text-xs" dir={dir}>
                      {itemTerm}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
        <div className="shrink-0 px-6 pt-4 lg:px-16 lg:pt-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/learn/word-lists"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                <span dir="ltr">{group.title}</span>
              </Link>
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label={t.wordLists.wordListPanelAria}
                className="text-muted-foreground hover:text-foreground rounded-md p-1.5 lg:hidden"
              >
                <List className="size-4" aria-hidden="true" />
              </button>
            </div>
            <PronunciationButton
              text={word.targetWord}
              audioUrl={word.audioUrl}
              autoPlay
              resetKey={word.id}
              kokoroVoiceId={defaultVoiceId}
              contentType="word"
              contentId={word.id}
              label={t.wordLists.replayAction}
              variant="outline"
              size="sm"
            />
          </div>
        </div>

        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={word.id}
            custom={direction}
            variants={wordVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 340, damping: 32, mass: 0.9 }}
            className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-6 lg:-ml-72 lg:px-16"
          >
            <div className="flex w-full max-w-2xl flex-col items-center gap-1.5 text-center">
              {term && (
                <p
                  className="text-foreground text-[clamp(1.75rem,1.4rem+1.6vw,2.25rem)] leading-tight font-bold text-balance"
                  dir={dir}
                >
                  {term}
                </p>
              )}
              {definition && (
                <p
                  className="text-muted-foreground text-[clamp(0.85rem,0.8rem+0.3vw,1rem)] font-medium"
                  dir={dir}
                >
                  {definition}
                </p>
              )}
            </div>

            <p
              dir="ltr"
              className="text-primary text-[clamp(3.75rem,2.06rem+6.75vw,8.25rem)] leading-none font-extrabold tracking-tight"
            >
              {word.targetWord}
            </p>

            <p
              dir="ltr"
              className="text-foreground w-full max-w-2xl text-center text-[clamp(1.35rem,1.17rem+1.43vw,1.76rem)] leading-relaxed font-medium text-balance"
            >
              {prefix && <span>{prefix} </span>}
              <span className="bg-primary/10 text-primary mx-1 inline-block rounded-md px-2 py-0.5 font-semibold">
                {word.targetWord}
              </span>
              {suffix && <span> {suffix}</span>}
            </p>

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

            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
              className="mt-3"
            >
              <Button
                asChild
                size="lg"
                className="shadow-primary/25 hover:shadow-primary/35 shadow-lg transition-shadow"
              >
                <Link href={`/learn/word-lists/${group.id}`}>{t.wordLists.startTest}</Link>
              </Button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
