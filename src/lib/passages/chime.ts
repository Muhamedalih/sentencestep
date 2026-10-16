/**
 * The sound a learner hears when they pick the right answer in Passages: a
 * quiet "glow" — a soft G major chord, strummed upward in under a tenth of a
 * second and left to fade in a small room. It stays in the low register on
 * purpose (nothing above D5, no high sparkle): the earlier bright, glassy
 * four-note chime was found annoying. Synthesized with the Web Audio API (no
 * audio file to ship, decode or cache), like every other sound in the app (see
 * sentence-complete-sounds.ts).
 *
 * The notes and the way a bell is built are plain data here so the sound can be
 * tuned in one place and checked by a test; `scheduleCorrectChime` turns them
 * into audio nodes on whatever context it is given (a real one in the browser, a
 * recording fake in the test).
 */

export interface ChimeNote {
  /** The pitch of the note's fundamental, in Hz. */
  frequency: number;
  /** Seconds after the chime starts that this note begins. */
  at: number;
  /** Seconds the fundamental takes to fade away. */
  decay: number;
  /** Relative strength of this note. */
  level: number;
}

/** G major, strummed upward and softer the higher it goes: G4 B4 D5, each fading a little later than the one before. */
export const CORRECT_CHIME_NOTES: readonly ChimeNote[] = [
  { frequency: 392, at: 0, decay: 0.7, level: 1 },
  { frequency: 493.88, at: 0.04, decay: 0.75, level: 0.85 },
  { frequency: 587.33, at: 0.08, decay: 0.8, level: 0.7 },
];

/** Extra high, quiet notes on the landing — none: a sparkle up there is what made the old chime annoying. */
export const CORRECT_CHIME_SPARKLE: readonly ChimeNote[] = [];

/**
 * What gives a note its colour: the fundamental plus one faint octave overtone
 * that fades faster — enough to keep it from being a bare tone, with nothing
 * glassy or bright on top.
 */
export const BELL_PARTIALS: readonly { ratio: number; gain: number; decayScale: number }[] = [
  { ratio: 1, gain: 1, decayScale: 1 },
  { ratio: 2, gain: 0.1, decayScale: 0.4 },
];

/** Peak gain of one note's fundamental at full volume (before the learner's volume setting). */
export const CHIME_PEAK = 0.05;
/** How much of the sound is sent through the small room, and how long that room rings. */
export const CHIME_ROOM = { wet: 0.3, seconds: 1.0, decayPower: 3.2 } as const;
/** Every note has stopped by this long after the chime starts (the room's own tail rings a little past it). */
export const CHIME_TAIL_SECONDS = 1.0;
/** Overtones above this are left out — inaudible for most ears and a source of harshness. */
const HIGHEST_PARTIAL_HZ = 9000;

/** The smallest part of an AudioContext the chime needs — a real context satisfies it, and so does a test's recording fake. */
export interface ChimeContext {
  readonly currentTime: number;
  readonly sampleRate: number;
  readonly destination: AudioNode;
  createGain(): GainNode;
  createOscillator(): OscillatorNode;
  createConvolver(): ConvolverNode;
  createBuffer(channels: number, length: number, sampleRate: number): AudioBuffer;
}

/** A short, dark-to-silent burst of noise: the "room" the chime rings in. */
function roomImpulse(ctx: ChimeContext): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * CHIME_ROOM.seconds));
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let index = 0; index < length; index += 1) {
      data[index] = (Math.random() * 2 - 1) * Math.pow(1 - index / length, CHIME_ROOM.decayPower);
    }
  }
  return buffer;
}

/** The nodes the chime plays into — built once per context and reused by every answer. */
export interface ChimeBus {
  input: GainNode;
}

export function createChimeBus(ctx: ChimeContext): ChimeBus {
  const input = ctx.createGain();
  const dry = ctx.createGain();
  const wet = ctx.createGain();
  const room = ctx.createConvolver();
  room.buffer = roomImpulse(ctx);
  dry.gain.value = 1;
  wet.gain.value = CHIME_ROOM.wet;
  input.connect(dry);
  dry.connect(ctx.destination);
  input.connect(room);
  room.connect(wet);
  wet.connect(ctx.destination);
  return { input };
}

/**
 * Starts the chime now. `volume` is the learner-facing 0-1 level (the admin's
 * global sound volume); 0 plays nothing. Returns how many oscillators it
 * started, which is what the test counts.
 */
export function scheduleCorrectChime(ctx: ChimeContext, bus: ChimeBus, volume: number): number {
  const level = Math.min(1, Math.max(0, volume)) * 2;
  if (level <= 0) return 0;

  const start = ctx.currentTime;
  let started = 0;
  for (const note of [...CORRECT_CHIME_NOTES, ...CORRECT_CHIME_SPARKLE]) {
    const noteStart = start + note.at;
    for (const partial of BELL_PARTIALS) {
      const frequency = note.frequency * partial.ratio;
      if (frequency > HIGHEST_PARTIAL_HZ) continue;

      const ring = note.decay * partial.decayScale;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, noteStart);
      gain.gain.linearRampToValueAtTime(
        CHIME_PEAK * level * note.level * partial.gain,
        noteStart + 0.006,
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + ring);
      gain.connect(bus.input);

      const oscillator = ctx.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, noteStart);
      oscillator.connect(gain);
      oscillator.start(noteStart);
      oscillator.stop(noteStart + ring + 0.05);
      started += 1;
    }
  }
  return started;
}
