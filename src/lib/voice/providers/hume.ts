import { fetchWithTimeout } from "@/lib/voice/providers/fetch-with-timeout";
import type { SynthesizeInput, SynthesizedAudio, TTSProvider } from "@/lib/voice/provider";

const API_BASE = "https://api.hume.ai/v0/tts";

function describeFailure(status: number, bodyText: string): string {
  if (status === 401 || status === 403) return `Hume AI rejected the API key (${status}).`;
  if (status === 429) return "Hume AI rate limit or quota exceeded (429).";
  if (status === 400)
    return `Hume AI rejected the request as malformed (400): ${bodyText.slice(0, 200)}`;
  return `Hume AI request failed (${status}): ${bodyText.slice(0, 200)}`;
}

/**
 * The only file that talks to Hume AI's HTTP API directly — everything else
 * in this app goes through the TTSProvider interface, exactly like
 * providers/elevenlabs.ts. `input.model` is unused — Hume's /v0/tts has no
 * model_id concept, only a voice reference — mirroring how
 * providers/gemini.ts leaves voiceSettings unused when a provider has no
 * equivalent request field. Requests plain mp3 (no `format` field needed —
 * mp3 is Hume's documented default).
 */
export function createHumeProvider(apiKey: string): TTSProvider {
  return {
    name: "hume",
    async synthesize(input: SynthesizeInput): Promise<SynthesizedAudio> {
      const response = await fetchWithTimeout(API_BASE, {
        method: "POST",
        headers: {
          "X-Hume-Api-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          utterances: [{ text: input.text, voice: { id: input.voiceId, provider: "HUME_AI" } }],
          strip_headers: true,
        }),
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");
        throw new Error(describeFailure(response.status, bodyText));
      }

      const json = await response.json();
      const base64Audio: string | undefined = json?.generations?.[0]?.audio;
      if (!base64Audio) throw new Error("Hume AI response contained no audio data.");

      return { audio: Buffer.from(base64Audio, "base64"), durationMs: null };
    },
  };
}

export interface HumeVoiceSummary {
  id: string;
  name: string;
}

/**
 * Lists voices from Hume's shared Voice Library (`provider=HUME_AI` — the
 * curated catalog every account can use, as opposed to `CUSTOM_VOICE`, an
 * account's own saved voices) for the admin "browse voices" picker
 * (hume-actions.ts). Deliberately not part of the TTSProvider interface —
 * mirrors listCartesiaVoices' reasoning in providers/cartesia.ts.
 */
export async function listHumeVoices(
  apiKey: string,
  opts: { pageSize?: number } = {},
): Promise<HumeVoiceSummary[]> {
  const params = new URLSearchParams({
    provider: "HUME_AI",
    page_size: String(opts.pageSize ?? 50),
  });

  const response = await fetchWithTimeout(`${API_BASE}/voices?${params.toString()}`, {
    headers: { "X-Hume-Api-Key": apiKey },
  });
  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    throw new Error(describeFailure(response.status, bodyText));
  }

  const json = await response.json();
  const items: unknown[] = Array.isArray(json?.voices_page) ? json.voices_page : [];
  return items.map((raw) => {
    const v = raw as Record<string, unknown>;
    return { id: String(v.id), name: String(v.name ?? v.id) };
  });
}
