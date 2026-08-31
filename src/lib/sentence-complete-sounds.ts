/**
 * Pure sentence-completion sound data — no "use client" directive, no Web
 * Audio calls — mirrors src/lib/typing-sound-packs.ts's split so both the
 * client-only hook (src/hooks/use-typing-sound.ts) and server-safe modules
 * (src/lib/admin/typing-sound-settings.ts) can share the same sound
 * names/labels/defaults without a server module ever pulling in client-only
 * code.
 *
 * This is a distinct selectable sound from each keystroke pack's own
 * "complete" tone (see SOUND_PACKS): the pack's "complete" variant is one
 * fixed tone per pack, while this collection lets an admin pick a specific
 * sentence-completion sound independent of which keystroke pack is active.
 */

export type SentenceCompleteSound =
  | "chime"
  | "bell"
  | "sparkle"
  | "ding"
  | "harp"
  | "twinkle"
  | "pageTurn"
  | "whoosh"
  | "success"
  | "pop"
  | "keyClick";

interface ToneStep {
  kind: "tone";
  type: OscillatorType;
  frequency: number;
  duration: number;
  peakGain: number;
  /** Seconds after playback starts that this note begins — lets a sound be a short sequence of notes, not just one tone. */
  startOffset: number;
}

/**
 * A short burst of filtered white noise instead of a pitched oscillator —
 * what makes a sound read as a physical/textural effect (a page flipping, an
 * airy whoosh) rather than a musical note. `filterFrom`/`filterTo` sweep a
 * bandpass filter's center frequency across the burst's duration, which is
 * what gives it a sense of motion instead of a flat hiss.
 */
interface NoiseStep {
  kind: "noise";
  duration: number;
  peakGain: number;
  startOffset: number;
  filterFrom: number;
  filterTo: number;
  /** Bandpass Q — lower is broader/airier (whoosh), higher is narrower/crisper (page flip). */
  filterQ: number;
}

export type CompleteSoundStep = ToneStep | NoiseStep;

/**
 * Eleven hand-tuned, short (well under a second) sounds — all synthesized
 * with the Web Audio API (tone steps as oscillators, noise steps as filtered
 * white-noise bursts — see NoiseStep), so no audio assets to ship, decode, or
 * cache. Each reads clearly as "the sentence is finished" without startling
 * the learner. The six original tone-only sounds (chime through twinkle)
 * are unchanged; pageTurn/whoosh/success/pop/keyClick are the newer,
 * texturally distinct additions — pageTurn and whoosh are the only two built
 * from noise steps, everything else is oscillator notes like the originals.
 */
export const SENTENCE_COMPLETE_SOUNDS: Record<SentenceCompleteSound, CompleteSoundStep[]> = {
  chime: [
    {
      kind: "tone",
      type: "sine",
      frequency: 783.99,
      duration: 0.18,
      peakGain: 0.08,
      startOffset: 0,
    },
    {
      kind: "tone",
      type: "sine",
      frequency: 1046.5,
      duration: 0.24,
      peakGain: 0.08,
      startOffset: 0.08,
    },
  ],
  bell: [
    {
      kind: "tone",
      type: "triangle",
      frequency: 659.25,
      duration: 0.5,
      peakGain: 0.09,
      startOffset: 0,
    },
    {
      kind: "tone",
      type: "sine",
      frequency: 1318.5,
      duration: 0.35,
      peakGain: 0.03,
      startOffset: 0,
    },
  ],
  sparkle: [
    {
      kind: "tone",
      type: "sine",
      frequency: 1046.5,
      duration: 0.12,
      peakGain: 0.06,
      startOffset: 0,
    },
    {
      kind: "tone",
      type: "sine",
      frequency: 1318.5,
      duration: 0.12,
      peakGain: 0.06,
      startOffset: 0.06,
    },
    {
      kind: "tone",
      type: "sine",
      frequency: 1567.98,
      duration: 0.16,
      peakGain: 0.06,
      startOffset: 0.12,
    },
  ],
  ding: [
    { kind: "tone", type: "sine", frequency: 880, duration: 0.25, peakGain: 0.09, startOffset: 0 },
  ],
  harp: [
    {
      kind: "tone",
      type: "triangle",
      frequency: 523.25,
      duration: 0.3,
      peakGain: 0.06,
      startOffset: 0,
    },
    {
      kind: "tone",
      type: "triangle",
      frequency: 659.25,
      duration: 0.3,
      peakGain: 0.06,
      startOffset: 0.08,
    },
    {
      kind: "tone",
      type: "triangle",
      frequency: 783.99,
      duration: 0.35,
      peakGain: 0.07,
      startOffset: 0.16,
    },
  ],
  twinkle: [
    {
      kind: "tone",
      type: "triangle",
      frequency: 1318.5,
      duration: 0.14,
      peakGain: 0.06,
      startOffset: 0,
    },
    {
      kind: "tone",
      type: "triangle",
      frequency: 1760,
      duration: 0.2,
      peakGain: 0.06,
      startOffset: 0.07,
    },
  ],
  /** A crisp, quick paper-flip swoosh — a narrow, rising-then-falling bandpass sweep over noise, not a tone at all. Reads as physical (a page turning), fitting Book Reading by default. */
  pageTurn: [
    {
      kind: "noise",
      duration: 0.16,
      peakGain: 0.11,
      startOffset: 0,
      filterFrom: 1000,
      filterTo: 2800,
      filterQ: 1.1,
    },
    {
      kind: "noise",
      duration: 0.14,
      peakGain: 0.07,
      startOffset: 0.1,
      filterFrom: 2200,
      filterTo: 1400,
      filterQ: 1.4,
    },
  ],
  /** A softer, longer, lower airy sweep than pageTurn — a scene settling rather than a page flipping. Fits Stories by default. */
  whoosh: [
    {
      kind: "noise",
      duration: 0.42,
      peakGain: 0.09,
      startOffset: 0,
      filterFrom: 500,
      filterTo: 1600,
      filterQ: 0.6,
    },
  ],
  /** A bright three-note ascending major arpeggio — more festive/complete-sounding than chime, for a generic "great job." */
  success: [
    {
      kind: "tone",
      type: "sine",
      frequency: 659.25,
      duration: 0.14,
      peakGain: 0.08,
      startOffset: 0,
    },
    {
      kind: "tone",
      type: "sine",
      frequency: 830.61,
      duration: 0.14,
      peakGain: 0.08,
      startOffset: 0.07,
    },
    {
      kind: "tone",
      type: "sine",
      frequency: 1046.5,
      duration: 0.22,
      peakGain: 0.09,
      startOffset: 0.14,
    },
  ],
  /** A single quick tone with a fast downward pitch slide — playful and snappy, good for quick-fire vocabulary drills. */
  pop: [
    {
      kind: "tone",
      type: "triangle",
      frequency: 1200,
      duration: 0.1,
      peakGain: 0.09,
      startOffset: 0,
    },
  ],
  /** A mechanical double-tick — two very short, high square-wave blips — a crisp "logged" cue rather than a musical one. */
  keyClick: [
    {
      kind: "tone",
      type: "square",
      frequency: 1600,
      duration: 0.035,
      peakGain: 0.07,
      startOffset: 0,
    },
    {
      kind: "tone",
      type: "square",
      frequency: 2000,
      duration: 0.05,
      peakGain: 0.07,
      startOffset: 0.06,
    },
  ],
};

export const SENTENCE_COMPLETE_SOUND_NAMES = Object.keys(
  SENTENCE_COMPLETE_SOUNDS,
) as SentenceCompleteSound[];

export const SENTENCE_COMPLETE_SOUND_LABELS: Record<SentenceCompleteSound, string> = {
  chime: "Chime",
  bell: "Bell",
  sparkle: "Sparkle",
  ding: "Ding",
  harp: "Harp",
  twinkle: "Twinkle",
  pageTurn: "Page turn",
  whoosh: "Whoosh",
  success: "Success",
  pop: "Pop",
  keyClick: "Key click",
};

export const DEFAULT_SENTENCE_COMPLETE_SOUND: SentenceCompleteSound = "chime";
