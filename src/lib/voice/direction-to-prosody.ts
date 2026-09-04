import type {
  SentenceDirection,
  VoiceEmotion,
  VoiceEnergy,
  VoicePace,
  VoicePause,
} from "@/lib/voice/director-types";

/**
 * The pure, deterministic translator from a Voice Director decision into an
 * Edge-TTS SSML document — the free, zero-signup narration provider (see
 * providers/edge-tts.ts). Same contract as direction-to-tags.ts/
 * direction-to-ssml.ts: the same direction + text + voice always produces
 * byte-identical SSML.
 *
 * Deliberately narrower than direction-to-ssml.ts's Azure mapper: Edge's
 * Read Aloud endpoint (the unofficial API this app's providers/edge-tts.ts
 * talks to) only honors a single, non-nested `<prosody rate/pitch/volume>`
 * element per voice — empirically verified against the live endpoint before
 * writing this module. `<mstts:express-as>`, `<break>`, `<emphasis>`, and
 * even a second sibling `<prosody>` element all cause the connection to
 * close before any audio is returned (confirmed by hand, not assumed from
 * docs — this endpoint is unofficial and undocumented by Microsoft). So:
 * - emotion/energy/pace are delivered entirely through prosody rate/pitch/
 *   volume, never a style tag this endpoint doesn't actually support.
 * - pauseBefore is simulated with a leading ellipsis in the spoken text
 *   itself (same technique direction-to-tags.ts uses for ElevenLabs),
 *   confirmed to still produce valid, non-truncated audio.
 * - emphasisWord is recorded in voice_direction for admin visibility but
 *   never applied to the output — same honest "no fake control" rule
 *   direction-to-tags.ts documents for ElevenLabs, for the same reason: no
 *   verified per-word emphasis mechanism survives this endpoint's single-
 *   prosody-element limit.
 */

const XML_ESCAPES: [RegExp, string][] = [
  [/&/g, "&amp;"],
  [/</g, "&lt;"],
  [/>/g, "&gt;"],
  [/"/g, "&quot;"],
  [/'/g, "&apos;"],
];

function escapeXml(text: string): string {
  return XML_ESCAPES.reduce(
    (acc, [pattern, replacement]) => acc.replace(pattern, replacement),
    text,
  );
}

/**
 * Volume is the one lever left for conveying emotional "color" once style
 * tags are off the table — a whisper reads as quiet, excitement/anger as
 * loud, everything else at the voice's normal level. Values are Edge/
 * Azure's own documented named `<prosody volume="...">` levels, not
 * invented ones.
 */
const EMOTION_VOLUME: Record<VoiceEmotion, string> = {
  neutral: "default",
  excited: "loud",
  curious: "default",
  sad: "soft",
  happy: "default",
  whispering: "x-soft",
  sarcastic: "default",
  angry: "x-loud",
  crying: "soft",
  mischievous: "default",
  sighing: "soft",
  laughing: "loud",
};

const ENERGY_PROSODY: Record<VoiceEnergy, { rate: number; pitch: number }> = {
  low: { rate: -10, pitch: -3 },
  medium: { rate: 0, pitch: 0 },
  high: { rate: 10, pitch: 4 },
};

const PACE_RATE_DELTA: Record<VoicePace, number> = {
  slow: -15,
  normal: 0,
  fast: 15,
};

/** Same technique and same values as direction-to-tags.ts's PAUSE_PREFIXES — ellipses read as a natural pause by every neural TTS voice this app uses, ElevenLabs included. */
const PAUSE_PREFIXES: Record<VoicePause, string> = {
  none: "",
  short: "... ",
  long: "... ... ",
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function signedPercent(value: number): string {
  return value >= 0 ? `+${value}%` : `${value}%`;
}

export interface ProsodyDirectionInput {
  /** A complete `<speak>...</speak>` SSML document — exactly one `<voice>` containing exactly one `<prosody>`, ready to pass to MsEdgeTTS.rawToStream as-is. */
  ssml: string;
}

export function toProsodyInput(
  direction: SentenceDirection,
  text: string,
  voiceName: string,
): ProsodyDirectionInput {
  const pausePrefix = PAUSE_PREFIXES[direction.pauseBefore];
  const escapedText = escapeXml(`${pausePrefix}${text}`);

  const energy = ENERGY_PROSODY[direction.energy];
  const rate = clamp(energy.rate + PACE_RATE_DELTA[direction.pace], -50, 50);
  const pitch = clamp(energy.pitch, -20, 20);
  const volume = EMOTION_VOLUME[direction.emotion];

  const ssml =
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">` +
    `<voice name="${escapeXml(voiceName)}">` +
    `<prosody rate="${signedPercent(rate)}" pitch="${signedPercent(pitch)}" volume="${volume}">${escapedText}</prosody>` +
    `</voice></speak>`;

  return { ssml };
}

/** A plain, neutral-delivery SSML document for one-off previews (see previewEdgeTtsAction) — mirrors direction-to-ssml.ts's wrapPlainTextSsml. */
export function wrapPlainTextProsodySsml(voiceName: string, text: string): string {
  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">` +
    `<voice name="${escapeXml(voiceName)}">` +
    `<prosody rate="+0%" pitch="+0%" volume="default">${escapeXml(text)}</prosody>` +
    `</voice></speak>`
  );
}
