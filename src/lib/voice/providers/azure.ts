import type { SynthesizeInput, SynthesizedAudio, TTSProvider } from "@/lib/voice/provider";

/**
 * Azure Cognitive Services (Speech) REST TTS endpoint — the free-tier-
 * friendly narration provider provider-registry.ts prefers by default (F0
 * tier: 500,000 characters/month at no cost — see
 * https://azure.microsoft.com/pricing/details/cognitive-services/speech-services/).
 * `input.text` here is always a complete SSML document already built by
 * direction-to-ssml.ts — this module never constructs SSML itself, exactly
 * like providers/elevenlabs.ts never builds its own bracketed-tag string.
 */

const OUTPUT_FORMAT = "audio-24khz-48kbitrate-mono-mp3";

/**
 * Maps an Azure Speech API failure to a message safe to log/store in
 * voice_audio_cache.last_error — never the raw response body verbatim
 * beyond a short, truncated excerpt, and never the API key, which is only
 * ever sent as a request header, never interpolated into any string this
 * function builds or throws.
 */
function describeFailure(status: number, bodyText: string): string {
  if (status === 401 || status === 403) return `Azure Speech rejected the API key (${status}).`;
  if (status === 429) return "Azure Speech rate limit or quota exceeded (429).";
  if (status === 400)
    return `Azure Speech rejected the request as malformed (400): ${bodyText.slice(0, 200)}`;
  return `Azure Speech request failed (${status}): ${bodyText.slice(0, 200)}`;
}

/**
 * The only file that talks to Azure's Speech REST API directly — everything
 * else in this app goes through the TTSProvider interface. Never imported
 * from a "use client" file; the API key only ever lives in this
 * server-side closure, never returned to a caller or included in a thrown
 * error. `region` is the Azure Speech resource's region (e.g. "eastus") —
 * part of the endpoint hostname itself, not a header, so it's passed
 * alongside the key rather than folded into it.
 *
 * `input.voiceId`/`input.model`/`input.voiceSettings` are unused: the voice
 * name and every delivery detail (emotion, energy, pace, pauses, emphasis)
 * are already baked into the SSML document (`input.text`) by
 * direction-to-ssml.ts before this function ever sees it — Azure has no
 * separate "voice settings" request field the way ElevenLabs does.
 */
export function createAzureProvider(apiKey: string, region: string): TTSProvider {
  return {
    name: "azure",
    async synthesize(input: SynthesizeInput): Promise<SynthesizedAudio> {
      const response = await fetch(
        `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": apiKey,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": OUTPUT_FORMAT,
            "User-Agent": "SentenceStep",
          },
          body: input.text,
        },
      );

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");
        throw new Error(describeFailure(response.status, bodyText));
      }

      const arrayBuffer = await response.arrayBuffer();
      // Same reasoning as providers/elevenlabs.ts: Azure's endpoint returns
      // a raw audio stream, not a JSON envelope with duration in it.
      return { audio: Buffer.from(arrayBuffer), durationMs: null };
    },
  };
}
