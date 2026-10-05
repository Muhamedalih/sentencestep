"use client";

import { useCallback, useEffect, useRef } from "react";

import { useKeySoundMuted } from "@/hooks/use-key-sound-muted";
import {
  DEFAULT_SOUND_PACK,
  LAYERED_SOUND_PACKS,
  SAMPLE_SOUND_PACKS,
  SOUND_PACKS,
  isLayeredSoundPack,
  isSampleSoundPack,
} from "@/lib/typing-sound-packs";
import type { SoundPack, SoundVariant } from "@/lib/typing-sound-packs";
import { detuneRatio, jitterRatio, pickTakeIndex, scheduleTake } from "@/lib/typing-sound-synth";
import { loadSamplePack, loadedSamples, playSample } from "@/lib/typing-sound-samples";
import type { SamplePack } from "@/lib/typing-sound-sample-packs";
import {
  DEFAULT_SENTENCE_COMPLETE_SOUND,
  SENTENCE_COMPLETE_SOUNDS,
} from "@/lib/sentence-complete-sounds";
import type { SentenceCompleteSound } from "@/lib/sentence-complete-sounds";
import { DEFAULT_LESSON_END_SOUND, LESSON_END_SOUNDS } from "@/lib/lesson-end-sounds";
import type { LessonEndSound } from "@/lib/lesson-end-sounds";

export type { SoundPack, SoundVariant } from "@/lib/typing-sound-packs";
export {
  DEFAULT_SOUND_PACK,
  SOUND_PACK_DESCRIPTIONS,
  SOUND_PACK_LABELS,
  SOUND_PACK_NAMES,
  getSoundPackVariationCount,
} from "@/lib/typing-sound-packs";
export type { SentenceCompleteSound } from "@/lib/sentence-complete-sounds";
export {
  DEFAULT_SENTENCE_COMPLETE_SOUND,
  SENTENCE_COMPLETE_SOUND_LABELS,
  SENTENCE_COMPLETE_SOUND_NAMES,
} from "@/lib/sentence-complete-sounds";
export type { LessonEndSound } from "@/lib/lesson-end-sounds";
export {
  DEFAULT_LESSON_END_SOUND,
  LESSON_END_SOUND_LABELS,
  LESSON_END_SOUND_NAMES,
} from "@/lib/lesson-end-sounds";

interface UseTypingSoundOptions {
  pack?: SoundPack;
  enabled?: boolean;
  /** 0–1, scales every tone's peak gain. */
  volume?: number;
  /** Which sound plays via playSentenceComplete() — independent of `pack` (see src/lib/sentence-complete-sounds.ts). */
  sentenceCompleteSound?: SentenceCompleteSound;
  /** Gates playLessonComplete() independently of `enabled` above (see src/lib/admin/typing-sound-settings.ts). */
  lessonEndSoundEnabled?: boolean;
  /** Which sound plays via playLessonComplete() — independent of `pack`/`sentenceCompleteSound` (see src/lib/lesson-end-sounds.ts). */
  lessonEndSound?: LessonEndSound;
  /**
   * Silences play() — the per-keystroke sound only, never the sentence/lesson
   * completion cues. Left unset, it follows the learner's own "mute typing
   * sound" switch (see useKeySoundMuted / LessonSettings); the admin preview
   * passes false so a learner's mute never silences the admin's Preview buttons.
   */
  keystrokesMuted?: boolean;
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
 * How the recorded packs voice a mistake: the same recording played at a
 * lower speed (about 8 semitones down) through a low-pass, so a wrong key is
 * the pack's own keyboard "sagging" into a dull thud rather than a separate,
 * unrelated alert sound.
 */
const SAMPLE_ERROR_RATE = 0.62;
const SAMPLE_ERROR_LOWPASS = 1800;
const SAMPLE_ERROR_LEVEL = 0.9;
/** The unused-by-the-app "complete" variant: the recording a third higher, as a small rising cue. */
const SAMPLE_COMPLETE_RATE = 1.26;

/**
 * Generates keystroke sounds with the Web Audio API — synthesized for most
 * packs, or by playing the short recordings in public/sounds/typing for the
 * "Real Recordings" packs (see src/lib/typing-sound-samples.ts).
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
    lessonEndSoundEnabled = true,
    lessonEndSound = DEFAULT_LESSON_END_SOUND,
  } = options;
  const { muted: learnerMuted } = useKeySoundMuted();
  const keystrokesMuted = options.keystrokesMuted ?? learnerMuted;
  const contextRef = useRef<AudioContext | undefined>(undefined);
  // Index of the take each layered pack/variant played last, so a pack with
  // several takes never plays the same one twice in a row. Per hook instance
  // on purpose: the admin form's preview button owns its own instance, so
  // previewing a pack can never shift which take a learner's next keystroke
  // gets.
  const lastTakeRef = useRef<Record<string, number>>({});

  // LessonSession/FixYourMistakesSession/WordReviewSession all remount per
  // lesson (route param change under /learn/[mode]/[lessonId]) — without
  // this, every lesson-to-lesson navigation with sound enabled leaks one
  // more unclosed AudioContext for the lifetime of the tab.
  useEffect(() => {
    return () => {
      void contextRef.current?.close();
      // Forget it too: React StrictMode (dev) runs this cleanup and then the
      // effects again on the same instance, and a closed context must never
      // be handed back out by ensureContext below.
      contextRef.current = undefined;
    };
  }, []);

  /** The shared AudioContext, created on first use — without resuming it, so preloading recordings on mount never trips the browser's autoplay policy. */
  const ensureContext = useCallback(() => {
    if (!contextRef.current || contextRef.current.state === "closed") {
      contextRef.current = new AudioContext();
    }
    return contextRef.current;
  }, []);

  const getContext = useCallback(() => {
    const ctx = ensureContext();
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    return ctx;
  }, [ensureContext]);

  /**
   * Starts fetching and decoding a recorded pack (a no-op for synthesized
   * packs) so the first keystroke plays instantly instead of waiting on the
   * network. Called for the active pack on mount and, by the admin picker, when
   * an admin points at a pack's Preview button.
   */
  const preload = useCallback(
    (overridePack?: SoundPack) => {
      const target = overridePack ?? pack;
      if (!isSampleSoundPack(target)) return;
      try {
        void loadSamplePack(ensureContext(), SAMPLE_SOUND_PACKS[target]);
      } catch {
        // No Web Audio (or blocked): the pack just stays silent, like any missed cue.
      }
    },
    [ensureContext, pack],
  );

  useEffect(() => {
    if (enabled) preload();
  }, [enabled, preload]);

  const play = useCallback(
    (variant: SoundVariant = "letter", overridePack?: SoundPack) => {
      const gainScale = Math.min(1, Math.max(0, volume)) * GAIN_BOOST;
      if (!enabled || keystrokesMuted || gainScale <= 0) return;

      try {
        const ctx = getContext();
        const now = ctx.currentTime;
        const resolvedPack = overridePack ?? pack;

        if (isLayeredSoundPack(resolvedPack)) {
          const layered = LAYERED_SOUND_PACKS[resolvedPack];
          const takes = layered[variant];
          const cursorKey = `${resolvedPack}:${variant}`;
          const takeIndex = pickTakeIndex(
            takes.length,
            layered.order,
            lastTakeRef.current[cursorKey],
          );
          lastTakeRef.current[cursorKey] = takeIndex;

          // Only correct keystrokes get the per-press random detune/level
          // variation — an error or completion cue stays exactly as tuned,
          // so it's always instantly recognizable.
          const varied = variant === "letter";
          scheduleTake(ctx, ctx.destination, takes[takeIndex]!, now, {
            gainScale,
            pitchRatio: varied ? detuneRatio(layered.detuneCents ?? 0) : 1,
            gainRatio: varied ? jitterRatio(layered.gainVariation ?? 0) : 1,
          });
          return;
        }

        if (isSampleSoundPack(resolvedPack)) {
          const sample: SamplePack = SAMPLE_SOUND_PACKS[resolvedPack];
          const playRecording = () => {
            const takes = loadedSamples(ctx, sample.files);
            if (takes.length === 0) return;
            const cursorKey = `${resolvedPack}:${variant}`;
            const takeIndex = pickTakeIndex(takes.length, "random", lastTakeRef.current[cursorKey]);
            lastTakeRef.current[cursorKey] = takeIndex;

            const isLetter = variant === "letter";
            const level =
              gainScale *
              sample.gain *
              (isLetter ? jitterRatio(sample.gainVariation) : SAMPLE_ERROR_LEVEL);
            const rate = isLetter
              ? detuneRatio(sample.detuneCents)
              : variant === "error"
                ? SAMPLE_ERROR_RATE
                : SAMPLE_COMPLETE_RATE;
            const when = ctx.currentTime;

            playSample(ctx, ctx.destination, takes[takeIndex]!, when, {
              gain: level,
              rate,
              lowpass: variant === "error" ? SAMPLE_ERROR_LOWPASS : undefined,
            });

            const releases =
              isLetter && sample.release ? loadedSamples(ctx, sample.release.files) : [];
            if (sample.release && releases.length > 0) {
              const release = releases[Math.floor(Math.random() * releases.length)]!;
              playSample(ctx, ctx.destination, release, when + sample.release.delayMs / 1000, {
                gain: level * sample.release.gain,
                rate,
              });
            }
          };

          // Preloaded on mount, so this is the normal path; if a keystroke
          // (or a first Preview click) beats the download, play once it lands.
          if (loadedSamples(ctx, sample.files).length > 0) playRecording();
          else void loadSamplePack(ctx, sample).then(playRecording);
          return;
        }

        const { type, duration, frequency, peakGain } = SOUND_PACKS[resolvedPack][variant];

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
    [getContext, pack, enabled, keystrokesMuted, volume],
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

  /**
   * Plays the admin-selected lesson-end sound once, when a whole lesson (not
   * just one sentence) finishes — see LessonSession's isComplete transition,
   * which is the only call site and already guards against firing more than
   * once per lesson (the branch only runs once, on the final sentence).
   * Shares the same step-sequence player as playSentenceComplete (tone and
   * noise steps alike — see CompleteSoundStep) since LESSON_END_SOUNDS uses
   * the identical shape, just longer/more celebratory sequences.
   */
  const playLessonComplete = useCallback(
    (overrideSound?: LessonEndSound) => {
      const gainScale = Math.min(1, Math.max(0, volume)) * GAIN_BOOST;
      if (!lessonEndSoundEnabled || gainScale <= 0) return;

      try {
        const ctx = getContext();
        const now = ctx.currentTime;
        const steps = LESSON_END_SOUNDS[overrideSound ?? lessonEndSound];

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
    [getContext, lessonEndSound, lessonEndSoundEnabled, volume],
  );

  return { play, preload, playSentenceComplete, playLessonComplete };
}
