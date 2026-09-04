import type {
  SentenceDirection,
  VoiceEmotion,
  VoiceEnergy,
  VoicePace,
  VoicePause,
} from "@/lib/voice/director-types";

/**
 * The pure, deterministic translator from a Voice Director decision into an
 * Azure Cognitive Services Speech SSML document — the Azure counterpart to
 * direction-to-tags.ts's toElevenLabsInput. Same contract: the same
 * direction + text + voice name always produces byte-identical SSML, no
 * randomness, which is what makes direction-to-ssml.test.ts meaningful and
 * lets story-voice-generation.ts/book-voice-generation.ts fold this into a
 * stable cache identity exactly like the ElevenLabs path.
 *
 * Every technique used here is a real, currently-documented Azure Speech
 * SSML feature — mstts:express-as styles, <prosody> rate/pitch, <break>,
 * <emphasis> (see
 * https://learn.microsoft.com/azure/ai-services/speech-service/speech-synthesis-markup).
 * Not every VoiceEmotion has a genuine Azure express-as style on every
 * voice — EXPRESS_AS_STYLE below is honest about which ones do; an emotion
 * with no real style match still gets its energy/pace/pause delivered via
 * prosody alone rather than inventing a style name Azure doesn't support.
 * Unlike ElevenLabs (see direction-to-tags.ts's doc comment on why
 * emphasisWord is never applied there), Azure's SSML reference does
 * document a real per-word <emphasis> control, so this module actually
 * applies it.
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

/** Regex-escapes a literal string so it can be safely dropped into a `new RegExp(...)` pattern. */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Real mstts:express-as style names Azure's most expressive English neural
 * voices (e.g. en-US-AriaNeural) document support for — null means no
 * genuine style match exists for that emotion, so toAzureInput falls back
 * to prosody-only delivery for it instead of guessing a style name that
 * might not exist, or might be silently ignored by the target voice.
 */
const EXPRESS_AS_STYLE: Record<VoiceEmotion, string | null> = {
  neutral: null,
  excited: "excited",
  curious: null,
  sad: "sad",
  happy: "cheerful",
  whispering: "whispering",
  sarcastic: null,
  angry: "angry",
  crying: "sad",
  mischievous: null,
  sighing: null,
  laughing: "cheerful",
};

/**
 * Additive prosody deltas — percent rate/pitch shifts and a style intensity
 * (Azure's own documented styledegree range is 0.01-2), layered on top of
 * whichever express-as style applies (or carrying the entire emotional
 * color alone, for an emotion with no style match).
 */
const ENERGY_PROSODY: Record<VoiceEnergy, { rate: number; pitch: number; styleDegree: number }> = {
  low: { rate: -10, pitch: -3, styleDegree: 0.7 },
  medium: { rate: 0, pitch: 0, styleDegree: 1 },
  high: { rate: 10, pitch: 4, styleDegree: 1.6 },
};

const PACE_RATE_DELTA: Record<VoicePace, number> = {
  slow: -15,
  normal: 0,
  fast: 15,
};

const BREAK_MS: Record<VoicePause, number> = {
  none: 0,
  short: 400,
  long: 900,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function signedPercent(value: number): string {
  return value >= 0 ? `+${value}%` : `${value}%`;
}

/**
 * Wraps `emphasisWord`'s first whole-word occurrence in a real Azure
 * `<emphasis>` tag. Both arguments must already be XML-escaped; matching
 * happens on the escaped text so the returned string stays valid to splice
 * straight into the SSML document. A non-match (shouldn't happen —
 * validateVoiceDirectionOutput already checked emphasisWord is a literal
 * substring of the sentence's raw text) just leaves the text unemphasized
 * rather than throwing.
 */
function applyEmphasis(escapedText: string, escapedWord: string | null): string {
  if (!escapedWord) return escapedText;
  const pattern = new RegExp(`\\b${escapeRegExp(escapedWord)}\\b`);
  const match = pattern.exec(escapedText);
  if (!match) return escapedText;
  return (
    escapedText.slice(0, match.index) +
    `<emphasis level="strong">${match[0]}</emphasis>` +
    escapedText.slice(match.index + match[0].length)
  );
}

/** en-US is the only language this app's Stories/Books narration content is authored in (see director.ts's system prompt) — hardcoded here rather than plumbed through as a parameter until a non-English narration voice is ever needed. */
const SPEAK_LANG = "en-US";

export interface AzureDirectionInput {
  /** A complete `<speak>...</speak>` SSML document, ready to POST as-is to Azure's REST TTS endpoint (see providers/azure.ts). */
  ssml: string;
}

export function toAzureInput(
  direction: SentenceDirection,
  text: string,
  voiceName: string,
): AzureDirectionInput {
  const escapedWord = direction.emphasisWord ? escapeXml(direction.emphasisWord) : null;
  const escapedText = applyEmphasis(escapeXml(text), escapedWord);

  const style = EXPRESS_AS_STYLE[direction.emotion];
  const energy = ENERGY_PROSODY[direction.energy];
  const rate = clamp(energy.rate + PACE_RATE_DELTA[direction.pace], -50, 50);
  const pitch = clamp(energy.pitch, -20, 20);
  const breakMs = BREAK_MS[direction.pauseBefore];

  const breakTag = breakMs > 0 ? `<break time="${breakMs}ms"/>` : "";
  const body = `${breakTag}<prosody rate="${signedPercent(rate)}" pitch="${signedPercent(pitch)}">${escapedText}</prosody>`;
  const styled = style
    ? `<mstts:express-as style="${style}" styledegree="${energy.styleDegree.toFixed(2)}">${body}</mstts:express-as>`
    : body;

  const ssml =
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" ` +
    `xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${SPEAK_LANG}">` +
    `<voice name="${escapeXml(voiceName)}">${styled}</voice></speak>`;

  return { ssml };
}

/** A plain, neutral-delivery SSML document for one-off previews (see previewAzureAction) — no direction, no emotion, just the voice speaking the given text as-is. Azure's endpoint requires valid SSML for every request, even a plain preview, so this exists rather than sending raw text. */
export function wrapPlainTextSsml(voiceName: string, text: string): string {
  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${SPEAK_LANG}">` +
    `<voice name="${escapeXml(voiceName)}">${escapeXml(text)}</voice></speak>`
  );
}
