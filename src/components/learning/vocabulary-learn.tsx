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

  function goTo(nextIndex: number) {
    setIndex(Math.min(Math.max(nextIndex, 0), total - 1));
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

      <div className="flex min-w-0 flex-1 flex-col">
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

        <AnimatePresence mode="wait">
          <motion.div
            key={word.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-8 lg:px-16"
          >
            <div className="flex w-full max-w-2xl flex-col items-center gap-2 text-center">
              {term && (
                <p className="text-muted-foreground text-sm font-medium" dir={dir}>
                  {term}
                </p>
              )}
              {definition && (
                <p className="text-foreground text-lg font-medium text-balance" dir={dir}>
                  {definition}
                </p>
              )}
            </div>

            <p
              dir="ltr"
              className="text-primary text-[clamp(2.75rem,1.5rem+5vw,6rem)] leading-none font-extrabold tracking-tight"
            >
              {word.targetWord}
            </p>

            <p
              dir="ltr"
              className="text-foreground w-full max-w-2xl text-center text-[clamp(1.15rem,1rem+1.2vw,1.5rem)] leading-relaxed font-medium text-balance"
            >
              {prefix && <span>{prefix} </span>}
              <span className="bg-primary/10 text-primary mx-1 inline-block rounded-md px-2 py-0.5 font-semibold">
                {word.targetWord}
              </span>
              {suffix && <span> {suffix}</span>}
            </p>

            <div className="mt-2 flex items-center gap-4">
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                disabled={index === 0}
                aria-label={t.wordLists.prevWordAria}
                className="text-muted-foreground hover:text-foreground border-border flex size-8 items-center justify-center rounded-full border disabled:opacity-30"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
              </button>
              <span className="text-muted-foreground text-sm font-medium tabular-nums" dir="ltr">
                {index + 1} / {total}
              </span>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                disabled={index === total - 1}
                aria-label={t.wordLists.nextWordAria}
                className="text-muted-foreground hover:text-foreground border-border flex size-8 items-center justify-center rounded-full border disabled:opacity-30"
              >
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>

            <Button asChild size="lg" variant="secondary" className="mt-4">
              <Link href={`/learn/word-lists/${group.id}`}>{t.wordLists.startTest}</Link>
            </Button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
