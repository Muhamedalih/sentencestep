/**
 * The "Real Recordings" collection — keystroke packs built from actual
 * recordings of real hardware (an office keyboard, a tactile mechanical
 * switch, a close-mic'd button click) instead of synthesis. Pure data, no
 * "use client" directive and no Web Audio calls, so server-safe modules can
 * share the pack names through src/lib/typing-sound-packs.ts.
 *
 * The audio lives in public/sounds/typing/<pack>/ as short mono 16-bit WAV
 * files (trimmed of lead-in silence so the click lands immediately, faded out,
 * peak-normalized). Every file's origin, author and license is recorded in
 * src/lib/TYPING_SOUND_CREDITS.md — only CC0 / public-domain recordings ship.
 * Playback (fetch + decode once per AudioContext, rotate through the takes,
 * tiny pitch/level variation) is in src/lib/typing-sound-samples.ts and the
 * useTypingSound hook.
 */

export interface SamplePack {
  /** Public URLs of the alternative recordings of one keystroke — one is picked per press, never the same one twice in a row. */
  files: string[];
  /** Optional key-up recordings played a moment after each press, like the second half of a real "click-clack". */
  release?: {
    files: string[];
    /** Milliseconds after the press that the release sounds. */
    delayMs: number;
    /** Release level relative to the press (0–1). */
    gain: number;
  };
  /**
   * Level trim applied on top of the master volume. The files are normalized
   * to -3 dBFS so they keep their full resolution; this brings a pack down to
   * the same loudness as the synthesized packs so switching packs never jumps
   * in volume.
   */
  gain: number;
  /** ± cents of random pitch variation applied to each correct keystroke. */
  detuneCents: number;
  /** ± fraction of random level variation applied to each correct keystroke. */
  gainVariation: number;
}

const takes = (pack: string, count: number): string[] =>
  Array.from(
    { length: count },
    (_, index) => `/sounds/typing/${pack}/${String(index + 1).padStart(2, "0")}.wav`,
  );

export const SAMPLE_SOUND_PACKS = {
  classicOffice: {
    files: takes("classicOffice", 12),
    gain: 0.14,
    detuneCents: 20,
    gainVariation: 0.06,
  },
  tactileSwitch: {
    files: takes("tactileSwitch", 10),
    gain: 0.14,
    detuneCents: 20,
    gainVariation: 0.06,
  },
  softOffice: {
    files: takes("softOffice", 12),
    gain: 0.14,
    detuneCents: 20,
    gainVariation: 0.06,
  },
  deepThock: {
    files: takes("deepThock", 10),
    gain: 0.14,
    detuneCents: 20,
    gainVariation: 0.06,
  },
  studioClick: {
    files: takes("studioClick", 3),
    release: { files: ["/sounds/typing/studioClick/release-01.wav"], delayMs: 58, gain: 0.45 },
    gain: 0.14,
    detuneCents: 25,
    gainVariation: 0.06,
  },
} satisfies Record<string, SamplePack>;

export type SampleSoundPack = keyof typeof SAMPLE_SOUND_PACKS;

export const SAMPLE_SOUND_PACK_NAMES = Object.keys(SAMPLE_SOUND_PACKS) as SampleSoundPack[];
