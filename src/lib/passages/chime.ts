/**
 * The sound a learner hears when they pick the right answer in Passages: a
 * short, soft, rising chime — four bell notes that climb and land, with a faint
 * sparkle riding on the last one and a little room around the whole thing, so
 * it reads as a small reward and never as an alarm. Synthesized with the Web
 * Audio API (no audio file to ship, decode or cache), like every other sound in
 * the app (see sentence-complete-sounds.ts).
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

/** G major, climbing and landing: G5 B5 D6 G6. The last note is held the longest. */
export const CORRECT_CHIME_NOTES: readonly ChimeNote[] = [
  { frequency: 783.99, at: 0, decay: 0.55, level: 1 },
  { frequency: 987.77, at: 0.07, decay: 0.6, level: 1 },
  { frequency: 1174.66, at: 0.14, decay: 0.7, level: 1 },
  { frequency: 1567.98, at: 0.23, decay: 1.1, level: 1.15 },
];

/** The sparkle on the landing: higher, much quieter, a touch later. */
export const CORRECT_CHIME_SPARKLE: readonly ChimeNote[] = [
  { frequency: 2349.32, at: 0.27, decay: 0.8, level: 0.35 },
  { frequency: 3135.96, at: 0.31, decay: 0.7, level: 0.22 },
];

/**
 * What gives a note its bell colour: the fundamental plus a few overtones that
 * are weaker and fade faster. The last two sit a little off the whole-number
 * series on purpose — that slight mismatch is what makes it glassy, not a
 * flute.
 */
export const BELL_PARTIALS: readonly { ratio: number; gain: number; decayScale: number }[] = [
  { ratio: 1, gain: 1, decayScale: 1 },
  { ratio: 2, gain: 0.34, decayScale: 0.55 },
  { ratio: 3.01, gain: 0.13, decayScale: 0.32 },
  { ratio: 4.16, gain: 0.05, decayScale: 0.2 },
];

/** Peak gain of one note's fundamental at full volume (before the learner's volume setting). */
export const CHIME_PEAK = 0.075;
/** How much of the sound is sent through the small room, and how long that room rings. */
export const CHIME_ROOM = { wet: 0.28, seconds: 1.2, decayPower: 3.2 } as const;
/** Nothing is audible after this long, whichever note started last. */
export const CHIME_TAIL_SECONDS = 1.7;
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
