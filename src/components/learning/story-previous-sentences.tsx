"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { useSpeech } from "@/hooks/use-speech";
import { transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Entries older than this many positions from the newest fade to MIN_ENTRY_OPACITY, so the eye is drawn to the most recent one without older entries disappearing outright. */
const RECENCY_FADE_STEPS = 4;
const MIN_ENTRY_OPACITY = 0.4;

export interface CompletedStorySentence {
  id: string;
  number: number;
  text: string;
  /** Locale-resolved translation (see Sentence.supportText), shown beneath the English line. */
  translation: string;
}

/**
 * Stories mode's replacement for LessonIllustration (see LessonSession) — a
 * running, numbered transcript of the sentences the learner has already
 * typed in this lesson, instead of a topic illustration. Occupies the same
 * grid slot as LessonIllustration (same outer aspect-[16/9] shell), but a
 * narrower, fixed-width one — LessonSession gives Stories mode's left column
 * its own grid-template-columns track (see that component's doc comment)
 * rather than the fr-based split every other mode's LessonIllustration
 * fills, and this box simply stays a plain w-full fill of whatever track
 * it's handed rather than sizing itself.
 *
 * Each completed sentence appears here the instant LessonSession appends it
 * to `sentences` (right after TypingSentence's onComplete fires) — a fresh
 * list item animating in, rather than a literal shared-element flight from
 * the large current-sentence text: TypingSentence's own doc comment records
 * that wrapping its subtree (two useSpeech instances plus a layout-effect-
 * driven underline) in an exit/enter AnimatePresence previously produced
 * stuck renders, so this box deliberately never reaches into that subtree
 * or coordinates timing with it — it only reacts to state LessonSession
 * already owns.
 *
 * Before the first sentence completes (`sentences` empty), this renders as a
 * completely bare, unstyled spacer — no background, border, or icon
 * placeholder — so the very first sentence reads as the only thing on
 * screen. At the lg:+ two-column layout this spacer still occupies its grid
 * column (a plain block stretches to fill its grid area by default, same as
 * the populated box always has) purely so the sentence column beside it
 * never shifts horizontally once the box's chrome fades in; below lg:, with
 * no aspect-ratio forced while empty, it collapses to zero height and
 * reserves no space at all. The moment the first sentence lands, the box's
 * background/border fades in around it.
 *
 * Pure black fill (not the muted-surface gradient LessonIllustration uses in
 * every other mode) with only a hairline border for definition — Stories
 * mode deliberately runs its whole lesson-shell canvas pure black (see
 * "lesson-shell-stories" in globals.css/page.tsx) regardless of the viewer's
 * light/dark theme, and this box's own fill matches that canvas exactly
 * rather than standing out as a lighter card against it.
 */
export function StoryPreviousSentences({
  sentences,
  className,
}: {
  sentences: CompletedStorySentence[];
  className?: string;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const { dir, t } = useLocale();
  const { speakSentence } = useSpeech();
  const hasSentences = sentences.length > 0;

  // Keeps the newest entry in view as the list grows past the box's own
  // height — smooth, not instant, matching every other transition in this
  // box, but scoped to the list's own scroll container so it never touches
  // the page's own scroll position.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [sentences.length]);

  return (
    <div
      className={cn(
        "relative flex w-full flex-col overflow-hidden lg:h-full",
        // No width class of its own — always fills whatever grid track
        // LessonSession hands it (see that component's doc comment on the
        // "content" grid: Stories mode gives this a fixed, narrow track
        // instead of the fr-based split every other mode's LessonIllustration
        // gets, which is where this box's actual on-screen width comes from).
        hasSentences && "aspect-[16/9] rounded-2xl lg:aspect-auto",
        className,
      )}
    >
      <AnimatePresence>
        {hasSentences && (
          <motion.div
            key="chrome"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transitions.smooth}
            className="border-foreground/15 pointer-events-none absolute inset-0 rounded-2xl border bg-black shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]"
          />
        )}
      </AnimatePresence>

      {hasSentences && (
        // min-h-0 is what actually lets this list scroll within the flex
        // column instead of stretching the whole box past its own
        // aspect-[16/9]/lg:h-full bounds — without it a long story quietly
        // grows the box (and therefore the whole illustration row) taller
        // with every sentence instead of scrolling internally.
        <ul
          ref={listRef}
          dir="ltr"
          className="relative min-h-0 flex-1 space-y-6 overflow-y-auto p-6 sm:p-8"
        >
          <AnimatePresence initial={false} mode="popLayout">
            {sentences.map((sentence, index) => {
              const distanceFromNewest = sentences.length - 1 - index;
              const entryOpacity = Math.max(
                MIN_ENTRY_OPACITY,
                1 - distanceFromNewest / RECENCY_FADE_STEPS,
              );
              // A quiet divider every 5 entries, purely to break up a long
              // transcript into readable groups — never on the very last
              // entry, which would leave a divider with nothing beneath it.
              const showDividerAfter =
                sentence.number % 5 === 0 && sentence.number !== sentences.length;

              return (
                <motion.li
                  key={sentence.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: entryOpacity, y: 0 }}
                  transition={transitions.snappy}
                >
                  <button
                    type="button"
                    onClick={() => speakSentence(sentence.text)}
                    aria-label={`${t.pronunciation.replayLabel}: ${sentence.text}`}
                    className="hover:bg-foreground/5 -m-1.5 flex w-full flex-col gap-1.5 rounded-lg p-1.5 text-left transition-colors"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="shrink-0 text-xs font-semibold text-[var(--lesson-story-label)] tabular-nums">
                        {sentence.number}.
                      </span>
                      <span className="text-foreground/85 line-clamp-2 text-[1.3125rem] leading-snug">
                        {sentence.text}
                      </span>
                    </div>
                    <span
                      className="text-foreground/45 line-clamp-2 pl-6 text-sm leading-snug"
                      dir={dir}
                    >
                      {sentence.translation}
                    </span>
                  </button>
                  {showDividerAfter && (
                    <div aria-hidden="true" className="bg-foreground/10 mt-4 h-px w-full" />
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
