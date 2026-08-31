/**
 * Pure voice-selection logic for the Web Speech API — no DOM/browser APIs
 * here, just scoring plain data, so it's directly unit-testable (see
 * speech.test.ts) the same way src/lib/typing.ts's pure helpers are. The
 * browser-facing half (reading real SpeechSynthesisVoice objects, watching
 * `voiceschanged`, persisting a choice) lives in src/hooks/use-speech.ts,
 * which converts real voices to VoiceInfo and calls into this module.
 *
 * There is no paid TTS API anywhere in this app — every browser already
 * ships some set of free system/OS voices via window.speechSynthesis, and
 * this is the only lever available for quality: picking the best of
 * whatever a given user's browser/OS actually offers, never assuming any
 * specific voice exists on every device.
 */

export interface VoiceInfo {
  voiceURI: string;
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
}

export interface VoiceScore {
  voice: VoiceInfo;
  score: number;
  /** Human-readable reasons this score was assigned — surfaced only in the dev-only console diagnostic (see use-speech.ts), never in the learner-facing UI. */
  reasons: string[];
}

/** A voice whose lang isn't English is rejected outright — see rankVoices. Never used as a real score. */
const REJECTED_SCORE = -1000;

/**
 * Names browsers/OSes use for their higher-quality, often cloud-backed
 * voices — this is what actually distinguishes a good voice from a
 * decades-old robotic SAPI voice, far more reliably than any single voice
 * name, since the exact name differs by OS/browser (Edge's "... Online
 * (Natural)", macOS's "... (Enhanced)"/"(Premium)", etc.).
 */
const HIGH_QUALITY_NAME_PATTERN = /natural|neural|online|premium|enhanced/i;

/** Common female-voice names across Windows, macOS, and Chrome/Google voices. */
const FEMALE_NAME_PATTERN =
  /female|woman|zira|samantha|ava|allison|aria|jenny|susan|karen|victoria|serena|kate|salli|joanna|kimberly|amy|emma|olivia|sonia|libby|fiona|moira|tessa/i;

/** Common male-voice names — deprioritized (a female voice is preferred), never rejected outright, since a male voice is still a perfectly usable fallback. */
const MALE_NAME_PATTERN =
  /\bmale\b|\bman\b|david|mark|guy|daniel|george|ryan|matthew|brian|justin|russell|arthur|oliver|fred|alex\b/i;

/**
 * Scores a single voice. Higher is better. Rejects non-English voices with
 * a large negative score so they can never outrank a genuinely available
 * English voice (see rankVoices, which filters these out entirely) — the
 * app must never fall back to a non-English voice while an English one
 * exists. Every contributing factor is recorded in `reasons`.
 */
export function scoreVoice(voice: VoiceInfo): VoiceScore {
  const lang = voice.lang.toLowerCase();
  const name = voice.name;

  if (!lang.startsWith("en")) {
    return { voice, score: REJECTED_SCORE, reasons: ["rejected: not an English voice"] };
  }

  const reasons: string[] = ["English voice"];
  let score = 0;

  if (lang === "en-us" || lang === "en-gb") {
    score += 50;
    reasons.push(`preferred locale (${voice.lang})`);
  } else {
    score += 20;
    reasons.push(`other English locale (${voice.lang})`);
  }

  if (HIGH_QUALITY_NAME_PATTERN.test(name)) {
    score += 100;
    reasons.push("high-quality/natural voice name");
  }

  if (FEMALE_NAME_PATTERN.test(name)) {
    score += 30;
    reasons.push("female-voice name pattern (preferred)");
  } else if (MALE_NAME_PATTERN.test(name)) {
    score -= 20;
    reasons.push("male-voice name pattern (deprioritized, not rejected)");
  }

  // Small tiebreakers only — neither should be able to outrank a clearly
  // higher-quality match on its own (both are worth far less than the
  // +100 high-quality bonus above).
  if (voice.localService) {
    score += 2;
    reasons.push("local service (minor reliability tiebreaker)");
  }
  if (voice.default) {
    score += 5;
    reasons.push("marked as the system default voice");
  }

  return { voice, score, reasons };
}

/** Every English voice, scored and sorted best-first. Non-English voices are excluded entirely, not just ranked low. */
export function rankVoices(voices: VoiceInfo[]): VoiceScore[] {
  return voices
    .map(scoreVoice)
    .filter((entry) => entry.score > REJECTED_SCORE)
    .sort((a, b) => b.score - a.score);
}

/** The single best available English voice, or null if the device/browser exposes no English voice at all. */
export function getBestVoice(voices: VoiceInfo[]): VoiceInfo | null {
  return rankVoices(voices)[0]?.voice ?? null;
}

/** Converts a real browser voice into the plain data scoreVoice/rankVoices operate on — shared by use-speech.ts and the admin voice-settings form so both rank the same live voice list the same way. */
export function toVoiceInfo(voice: SpeechSynthesisVoice): VoiceInfo {
  return {
    voiceURI: voice.voiceURI,
    name: voice.name,
    lang: voice.lang,
    localService: voice.localService,
    default: voice.default,
  };
}
