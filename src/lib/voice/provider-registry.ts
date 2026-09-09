import { createCartesiaProvider } from "@/lib/voice/providers/cartesia";
import { createEdgeTtsProvider } from "@/lib/voice/providers/edge-tts";
import { createElevenLabsProvider } from "@/lib/voice/providers/elevenlabs";
import { createHumeProvider } from "@/lib/voice/providers/hume";
import type { TTSProvider } from "@/lib/voice/provider";

/**
 * Builds the real TTSProvider for a given `voices.source` value.
 *
 * Replaces the old getTTSProvider() — a single "whichever API key is set,
 * highest precedence wins" auto-detected provider shared by every content
 * type. That design is what let one env var change (removing/adding a key)
 * silently reroute Stories, Conversation, and Books to a different provider
 * all at once — see content-provider-map.ts's doc comment for the incident
 * this caused. Each content type now calls this with a fixed provider name
 * from content-provider-map.ts, so a synthesis call always uses exactly the
 * provider it was assigned, never a fallback substituted from a precedence
 * chain.
 *
 * Throws when the required API key is missing, rather than silently
 * falling back to a different paid provider or to Edge-TTS — a
 * misconfigured deployment should fail loudly (visible as an "unresolved"
 * row on the Story audio status dashboard) instead of quietly generating
 * audio with the wrong narrator.
 */
export function createProviderForSource(source: string): TTSProvider {
  switch (source) {
    case "elevenlabs": {
      const key = process.env.ELEVENLABS_API_KEY;
      if (!key) throw new Error("ELEVENLABS_API_KEY is not configured.");
      return createElevenLabsProvider(key);
    }
    case "cartesia": {
      const key = process.env.CARTESIA_API_KEY;
      if (!key) throw new Error("CARTESIA_API_KEY is not configured.");
      return createCartesiaProvider(key);
    }
    case "hume": {
      const key = process.env.HUME_API_KEY;
      if (!key) throw new Error("HUME_API_KEY is not configured.");
      return createHumeProvider(key);
    }
    case "edge-tts":
      return createEdgeTtsProvider();
    default:
      throw new Error(`Unknown voice provider "${source}".`);
  }
}
