"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronsLeft } from "lucide-react";
import { useEffect, useRef } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { usePronunciationSettings } from "@/components/providers/pronunciation-settings-provider";
import { useAudioClip } from "@/hooks/use-audio-clip";
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
  /**
   * A static, pre-recorded clip for this sentence (Sentence.audioUrl), when
   * one exists — the rare, highest-priority case (matches
   * PronunciationButton's own priority order). In this app almost every
   * sentence's real narration instead comes from the on-demand
   * Kokoro/ElevenLabs resolution this component's own click handler now
   * also uses (see `replay`'s own doc comment) — this field is kept purely
   * for parity with that same priority order, never fetched or regenerated
   * here.
   */
  audioUrl?: string;
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
 *
 * Collapsible (Stories mode only — see LessonSession's own doc comment on
 * why `collapsed`/`onToggleCollapsed` are only wired up for that mode's grid
 * track): the small button in the top-right corner shrinks the box down to a
 * thin rail rather than removing it outright, so the toggle itself — and the
 * option to reopen it — stays reachable no matter how long the learner
 * leaves it closed.
 */
export function StoryPreviousSentences({
  sentences,
  resolvedVoiceId,
  className,
  collapsed = false,
  onToggleCollapsed,
}: {
  sentences: CompletedStorySentence[];
  /**
   * This lesson's resolved narration voice (LessonSession's own
   * `resolvedVoiceId` — the exact same value TypingSentence/
   * PronunciationButton use for every sentence's OWN narration). Required
   * for `replay` to reach the real narrator: without it, every past
   * sentence falls back straight to the browser's speech synthesis, since
   * there's no voice to resolve Kokoro/ElevenLabs audio against. Undefined
   * for a lesson with no resolved voice at all — same fallback, unchanged
   * from before this prop existed.
   */
  resolvedVoiceId?: string | null;
  className?: string;
  /** Whether the box is shrunk to its collapsed rail. Ignored (always expanded, no button) while `onToggleCollapsed` is undefined. */
  collapsed?: boolean;
  /** Omit to render the box with no collapse button at all (e.g. Normal mode's list view, which doesn't offer this). */
  onToggleCollapsed?: () => void;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const { dir, t } = useLocale();
  const { speakSentence } = useSpeech();
  const { resolveAudio } = usePronunciationSettings();
  // Plays a past entry's own narration — a plain, no-frills replay, never a
  // second synthesis: `resolveAudio` below is the SAME cache
  // PronunciationButton already populated the moment this sentence first
  // autoplayed, so this call is a synchronous-fast cache hit, not a fresh
  // generation. this never triggers new audio; it only ever reuses what's
  // already there.
  const narrationClip = useAudioClip();
  const hasSentences = sentences.length > 0;

  /**
   * Same priority order PronunciationButton itself uses for a sentence's
   * narration: (1) a static, pre-recorded clip when the sentence happens to
   * have one; (2) the lesson's resolved Kokoro/ElevenLabs voice, via the
   * exact same `resolveAudio({ contentType: "sentence", contentId, voiceId
   * })` call every sentence's own PronunciationButton already made — a
   * cache hit here almost always, since this sentence autoplayed under that
   * same voice moments ago; (3) only if neither resolves (no voice
   * configured, or a genuine resolution failure), the browser's own speech
   * synthesis. Never generates or overwrites any lesson's audio — this is a
   * read-only lookup against whatever's already cached.
   */
  async function replay(sentence: CompletedStorySentence) {
    if (sentence.audioUrl) {
      narrationClip.play(sentence.audioUrl);
      return;
    }
    if (resolvedVoiceId) {
      const url = await resolveAudio({
        contentType: "sentence",
        contentId: sentence.id,
        voiceId: resolvedVoiceId,
      });
      if (url) {
        narrationClip.play(url);
        return;
      }
    }
    speakSentence(sentence.text);
  }

  // Keeps the newest entry in view as the list grows past the box's own
  // height — smooth, not instant, matching every other transition in this
  // box, but scoped to the list's own scroll container so it never touches
  // the page's own scroll position.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [sentences.length]);

  const showToggle = hasSentences && Boolean(onToggleCollapsed);

  return (
    <div
      className={cn(
        "relative flex w-full flex-col overflow-hidden lg:h-full",
        // No width class of its own — always fills whatever grid track
        // LessonSession hands it (see that component's doc comment on the
        // "content" grid: Stories mode gives this a fixed, narrow track
        // instead of the fr-based split every other mode's LessonIllustration
        // gets, which is where this box's actual on-screen width comes from).
        hasSentences && "aspect-[16/9] rounded-[20px] lg:aspect-auto",
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
            className="border-foreground/10 pointer-events-none absolute inset-0 rounded-[20px] border bg-black shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_12px_40px_-8px_rgba(0,0,0,0.6),0_2px_10px_rgba(0,0,0,0.4)]"
          >
            <div className="absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_oklch,var(--lesson-story-label)_35%,transparent),transparent)]" />
          </motion.div>
        )}
      </AnimatePresence>

      {showToggle && (
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? t.lesson.storyPanelShow : t.lesson.storyPanelHide}
          title={collapsed ? t.lesson.storyPanelShow : t.lesson.storyPanelHide}
          className={cn(
            "absolute z-10 flex size-[30px] items-center justify-center rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-md transition-[top,right,left,transform,background-color,border-color] duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-white/20 hover:bg-white/[0.13]",
            collapsed
              ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              : "top-[14px] right-[14px]",
          )}
        >
          <ChevronsLeft
            aria-hidden="true"
            className="size-[14px] text-white/75 transition-transform duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </button>
      )}

      {hasSentences && (
        // min-h-0 is what actually lets this list scroll within the flex
        // column instead of stretching the whole box past its own
        // aspect-[16/9]/lg:h-full bounds — without it a long story quietly
        // grows the box (and therefore the whole illustration row) taller
        // with every sentence instead of scrolling internally. min-w-[252px]
        // keeps the content from reflowing mid-animation as the box's own
        // width (the grid track LessonSession hands it) transitions down to
        // the collapsed rail — the outer div's overflow-hidden clips it
        // instead, matching the opacity fade below.
        <ul
          ref={listRef}
          dir="ltr"
          className={cn(
            "relative min-h-0 min-w-[252px] flex-1 space-y-6 overflow-y-auto p-6 transition-opacity sm:p-8",
            collapsed
              ? "pointer-events-none opacity-0 duration-[160ms] ease-out"
              : "opacity-100 delay-[140ms] duration-[280ms] ease-out",
          )}
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
                    onClick={() => void replay(sentence)}
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
