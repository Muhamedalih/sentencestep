"use client";

import { useCallback, useEffect, useRef } from "react";

import { DEFAULT_SOUND_PACK, SOUND_PACKS } from "@/lib/typing-sound-packs";
import type { SoundPack, SoundVariant } from "@/lib/typing-sound-packs";
import {
  DEFAULT_SENTENCE_COMPLETE_SOUND,
  SENTENCE_COMPLETE_SOUNDS,
} from "@/lib/sentence-complete-sounds";
import type { SentenceCompleteSound } from "@/lib/sentence-complete-sounds";

export type { SoundPack, SoundVariant } from "@/lib/typing-sound-packs";
export { DEFAULT_SOUND_PACK, SOUND_PACK_LABELS, SOUND_PACK_NAMES } from "@/lib/typing-sound-packs";
export type { SentenceCompleteSound } from "@/lib/sentence-complete-sounds";
export {
  DEFAULT_SENTENCE_COMPLETE_SOUND,
  SENTENCE_COMPLETE_SOUND_LABELS,
  SENTENCE_COMPLETE_SOUND_NAMES,
} from "@/lib/sentence-complete-sounds";

interface UseTypingSoundOptions {
  pack?: SoundPack;
  enabled?: boolean;
  /** 0–1, scales every tone's peak gain. */
  volume?: number;
  /** Which sound plays via playSentenceComplete() — independent of `pack` (see src/lib/sentence-complete-sounds.ts). */
  sentenceCompleteSound?: SentenceCompleteSound;
}

/**
 * Every peakGain constant in typing-sound-packs.ts/sentence-complete-sounds.ts
 * was hand-tuned assuming volume=1 meant "the loudest this ever gets," but
 * those constants themselves (0.03–0.11) are quiet enough that even a
 * volume=1 learner reported the loudest setting still feeling weak. Rather
 * than re-tune every individual sound, this single multiplier raises the
 * whole ceiling at once — volume=1 now hits roughly double its old peak, and
 * the 0–1 slider still scales linearly down from there, so "turn it down"
 * keeps working exactly as before.
 */
const GAIN_BOOST = 2.2;

/**
 * Generates keystroke sounds with the Web Audio API instead of audio assets.
 * `play(variant)` is the whole public surface; which pack plays, whether
 * sound is on, and how loud are read once per call from `options` (backed by
 * admin-configured global settings — see TypingSoundSettingsProvider) rather
 * than baked into the hook, so admin changes take effect on the next
 * keystroke without remounting anything.
 */
export function useTypingSound(options: UseTypingSoundOptions = {}) {
  const {
    pack = DEFAULT_SOUND_PACK,
    enabled = true,
    volume = 1,
    sentenceCompleteSound = DEFAULT_SENTENCE_COMPLETE_SOUND,
  } = options;
  const contextRef = useRef<AudioContext | undefined>(undefined);

  // LessonSession/FixYourMistakesSession/WordReviewSession all remount per
  // lesson (route param change under /learn/[mode]/[lessonId]) — without
  // this, every lesson-to-lesson navigation with sound enabled leaks one
  // more unclosed AudioContext for the lifetime of the tab.
  useEffect(() => {
    return () => {
      void contextRef.current?.close();
    };
  }, []);

  const getContext = useCallback(() => {
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }
    if (contextRef.current.state === "suspended") {
      void contextRef.current.resume();
    }
    return contextRef.current;
  }, []);

  const play = useCallback(
    (variant: SoundVariant = "letter", overridePack?: SoundPack) => {
      const gainScale = Math.min(1, Math.max(0, volume)) * GAIN_BOOST;
      if (!enabled || gainScale <= 0) return;

      try {
        const ctx = getContext();
        const now = ctx.currentTime;
        const { type, duration, frequency, peakGain } = SOUND_PACKS[overridePack ?? pack][variant];

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, now);
        if (variant === "complete") {
          oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.5, now + 0.15);
        }
        if (variant === "error") {
          oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.85, now + duration);
        }

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(peakGain * gainScale, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start(now);
        oscillator.stop(now + duration + 0.05);
      } catch {
        // Audio can be blocked by the browser (e.g. no user gesture yet); a
        // missed sound cue isn't worth surfacing an error for.
      }
    },
    [getContext, pack, enabled, volume],
  );

  /**
   * Plays the admin-selected (or section-resolved, via the `overrideSound`
   * argument — see resolveSectionSentenceCompleteSound) sentence-completion
   * sound once, independent of `pack`. Callers invoke this exactly once per
   * sentence, from the same onComplete callback useTypingEngine already
   * guards (via completedRef) against firing more than once per sentence —
   * see lesson-session.tsx/book-reading-session.tsx/etc.
   *
   * Each sound is a sequence of steps (see CompleteSoundStep) that can mix
   * tone steps (an oscillator, like every sound before pageTurn/whoosh) and
   * noise steps (filtered white noise, for the textural/physical-feeling
   * sounds) in the same sequence — branching on `step.kind` here is what
   * lets one sound collection hold both.
   */
  const playSentenceComplete = useCallback(
    (overrideSound?: SentenceCompleteSound) => {
      const gainScale = Math.min(1, Math.max(0, volume)) * GAIN_BOOST;
      if (!enabled || gainScale <= 0) return;

      try {
        const ctx = getContext();
        const now = ctx.currentTime;
        const steps = SENTENCE_COMPLETE_SOUNDS[overrideSound ?? sentenceCompleteSound];

        for (const step of steps) {
          const start = now + step.startOffset;
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(step.peakGain * gainScale, start + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + step.duration);
          gain.connect(ctx.destination);

          if (step.kind === "tone") {
            const oscillator = ctx.createOscillator();
            oscillator.type = step.type;
            oscillator.frequency.setValueAtTime(step.frequency, start);
            oscillator.connect(gain);
            oscillator.start(start);
            oscillator.stop(start + step.duration + 0.05);
          } else {
            const bufferSize = Math.ceil(ctx.sampleRate * step.duration);
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
              data[i] = Math.random() * 2 - 1;
            }

            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = "bandpass";
            filter.Q.setValueAtTime(step.filterQ, start);
            filter.frequency.setValueAtTime(step.filterFrom, start);
            filter.frequency.exponentialRampToValueAtTime(step.filterTo, start + step.duration);

            noise.connect(filter);
            filter.connect(gain);
            noise.start(start);
            noise.stop(start + step.duration + 0.05);
          }
        }
      } catch {
        // Same rationale as play(): a missed sound cue isn't worth surfacing.
      }
    },
    [getContext, sentenceCompleteSound, enabled, volume],
  );

  return { play, playSentenceComplete };
}
