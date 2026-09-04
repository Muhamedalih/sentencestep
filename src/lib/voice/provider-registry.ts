import { createAzureProvider } from "@/lib/voice/providers/azure";
import { createEdgeTtsProvider } from "@/lib/voice/providers/edge-tts";
import { createElevenLabsProvider } from "@/lib/voice/providers/elevenlabs";
import { createGeminiProvider } from "@/lib/voice/providers/gemini";
import type { TTSProvider } from "@/lib/voice/provider";

/**
 * Mirrors src/lib/translation/provider-registry.ts's shape and reasoning,
 * with one deliberate difference: this never returns null. Precedence,
 * highest to lowest:
 *
 * 1. Azure Speech (AZURE_SPEECH_KEY + AZURE_SPEECH_REGION both set) — the
 *    officially-supported, SLA-backed option with real mstts:express-as
 *    emotional styles (see direction-to-ssml.ts). Requires an Azure
 *    account, which isn't available to every user/region (a real, common
 *    failure mode — Microsoft's "You're not eligible for an Azure
 *    account") — highest precedence only for whoever can actually get one.
 * 2. Gemini (GEMINI_API_KEY set) — a genuine free tier with no billing/
 *    card required to obtain a key, natural-language style control (see
 *    direction-to-gemini-prompt.ts), and very cheap paid-tier pricing.
 *    Ranked above ElevenLabs because it's the more accessible/affordable
 *    real option for most deployments once configured.
 * 3. ElevenLabs (ELEVENLABS_API_KEY set) — the original provider, still
 *    supported for a deployment already paying for it.
 * 4. Edge-TTS (providers/edge-tts.ts) — always available, zero
 *    configuration, zero cost, no account of any kind required. The
 *    guaranteed fallback so a deployment with none of the above configured
 *    still gets real neural narration rather than nothing at all.
 *
 * Deliberately has nothing to do with Kokoro/Normal-lesson pronunciation
 * (src/lib/voice/generation.ts) — this registry exists only for the
 * Stories/Conversation/Books expressive-narration pipeline.
 */
export function getTTSProvider(): TTSProvider {
  const azureKey = process.env.AZURE_SPEECH_KEY;
  const azureRegion = process.env.AZURE_SPEECH_REGION;
  if (azureKey && azureRegion) return createAzureProvider(azureKey, azureRegion);

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) return createGeminiProvider(geminiKey);

  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
  if (elevenLabsKey) return createElevenLabsProvider(elevenLabsKey);

  return createEdgeTtsProvider();
}
