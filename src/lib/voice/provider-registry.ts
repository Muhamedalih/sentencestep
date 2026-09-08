import { createCartesiaProvider } from "@/lib/voice/providers/cartesia";
import { createEdgeTtsProvider } from "@/lib/voice/providers/edge-tts";
import { createElevenLabsProvider } from "@/lib/voice/providers/elevenlabs";
import { createHumeProvider } from "@/lib/voice/providers/hume";
import type { TTSProvider } from "@/lib/voice/provider";

/**
 * Mirrors src/lib/translation/provider-registry.ts's shape and reasoning,
 * with one deliberate difference: this never returns null. Precedence,
 * highest to lowest:
 *
 * 1. ElevenLabs (ELEVENLABS_API_KEY set) — the original provider, still
 *    supported for a deployment already paying for it.
 * 2. Cartesia (CARTESIA_API_KEY set) — a paid, low-latency alternative for
 *    a deployment that specifically wants Cartesia's voice catalog.
 * 3. Hume AI (HUME_API_KEY set) — a paid alternative for a deployment that
 *    specifically wants Hume's voice catalog.
 * 4. Edge-TTS (providers/edge-tts.ts) — always available, zero
 *    configuration, zero cost, no account of any kind required. The
 *    guaranteed fallback so a deployment with none of the above configured
 *    still gets real neural narration rather than nothing at all.
 *
 * Only one provider is ever "active" at a time — an admin who wants
 * Cartesia or Hume voices to actually generate audio must have that
 * provider's key set with no higher-priority key also present (a per-lesson
 * voice_id override from a lower-priority provider is silently ignored, see
 * story-voice-generation.ts's resolveTargetVoices).
 *
 * Azure Speech and Gemini were removed as narration providers (deliberately
 * dropped, not a bug) — Cartesia and Hume AI replace them in this
 * precedence chain.
 *
 * Deliberately has nothing to do with Kokoro/Normal-lesson pronunciation
 * (src/lib/voice/generation.ts) — this registry exists only for the
 * Stories/Conversation/Books expressive-narration pipeline.
 */
export function getTTSProvider(): TTSProvider {
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
  if (elevenLabsKey) return createElevenLabsProvider(elevenLabsKey);

  const cartesiaKey = process.env.CARTESIA_API_KEY;
  if (cartesiaKey) return createCartesiaProvider(cartesiaKey);

  const humeKey = process.env.HUME_API_KEY;
  if (humeKey) return createHumeProvider(humeKey);

  return createEdgeTtsProvider();
}
