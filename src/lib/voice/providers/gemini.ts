import { encodeMp3 } from "@/lib/voice/mp3-encoding";
import type { SynthesizeInput, SynthesizedAudio, TTSProvider } from "@/lib/voice/provider";

/**
 * Google's Gemini API TTS models (`generateContent` with
 * `responseModalities: ["AUDIO"]`) — a genuine free tier (no billing/card
 * required to get an API key, unlike Azure — see the setup instructions in
 * .env.example), natural-language style control instead of SSML (see
 * direction-to-gemini-prompt.ts), and very cheap paid-tier pricing beyond
 * the free tier (https://ai.google.dev/gemini-api/docs/pricing).
 *
 * `input.text` here is always the exact request text already built by
 * direction-to-gemini-prompt.ts (the Director's natural-language
 * instruction, if any, prefixed onto the sentence) — this module never
 * builds that text itself, exactly like providers/azure.ts and
 * providers/edge-tts.ts never build their own SSML. `input.model` carries
 * which Gemini model to call (see GEMINI_MODEL below for the default);
 * `input.voiceSettings` is unused — Gemini has no equivalent request
 * field, only the plain-English instruction already folded into the text.
 *
 * Audio comes back as raw 16-bit PCM at 24kHz mono (documented, and
 * confirmed across multiple independent sources while building this — see
 * this module's own doc comment on direction-to-gemini-prompt.ts for what
 * *wasn't* independently verified here). Encoded to MP3 with the same
 * encodeMp3 helper generation.ts uses for Kokoro's own PCM output, so every
 * provider's clips end up in the same storage format.
 */

const GEMINI_SAMPLE_RATE = 24000;
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function describeFailure(status: number, bodyText: string): string {
  if (status === 401 || status === 403) return `Gemini API rejected the API key (${status}).`;
  if (status === 429) return "Gemini API rate limit or quota exceeded (429).";
  if (status === 400)
    return `Gemini API rejected the request as malformed (400): ${bodyText.slice(0, 200)}`;
  return `Gemini API request failed (${status}): ${bodyText.slice(0, 200)}`;
}

/** Decodes a base64 PCM string into an Int16Array of samples — the exact format encodeMp3 expects (see generation.ts's floatTo16BitPCM for the Kokoro-side equivalent; Gemini's output is already 16-bit, so no float conversion is needed here). */
function decodeBase64Pcm16(base64: string): Int16Array {
  const buffer = Buffer.from(base64, "base64");
  return new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);
}

/**
 * The only file that talks to the Gemini API directly — everything else in
 * this app goes through the TTSProvider interface. The API key only ever
 * lives in this server-side closure, never returned to a caller or
 * included in a thrown error.
 */
export function createGeminiProvider(apiKey: string): TTSProvider {
  return {
    name: "gemini",
    async synthesize(input: SynthesizeInput): Promise<SynthesizedAudio> {
      const response = await fetch(`${API_BASE}/${input.model}:generateContent`, {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: input.text }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: input.voiceId } },
            },
          },
        }),
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");
        throw new Error(describeFailure(response.status, bodyText));
      }

      const json = await response.json();
      const base64Audio: string | undefined =
        json?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error("Gemini API response contained no audio data.");
      }

      const pcm16 = decodeBase64Pcm16(base64Audio);
      const audio = await encodeMp3(pcm16, GEMINI_SAMPLE_RATE);
      return { audio, durationMs: null };
    },
  };
}
