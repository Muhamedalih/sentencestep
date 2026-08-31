import { createElevenLabsProvider } from "@/lib/voice/providers/elevenlabs";
import type { TTSProvider } from "@/lib/voice/provider";

/**
 * Mirrors src/lib/translation/provider-registry.ts's shape and reasoning
 * exactly: returns null, honestly, when no provider is configured —
 * story-voice-generation.ts treats that as a real, handled state ("no
 * ElevenLabs key set yet"), never a thrown error. Gated on
 * ELEVENLABS_API_KEY so the provider choice stays configuration, not a code
 * change.
 *
 * Deliberately has nothing to do with Kokoro/Normal-lesson pronunciation
 * (src/lib/voice/generation.ts) — this registry exists only for the
 * Stories/Conversation expressive-narration pipeline. Kokoro has no
 * "provider registry" of its own because it's the one and only provider for
 * that content type; ElevenLabs is additive, optional, and content-type
 * scoped from the start.
 */
export function getTTSProvider(): TTSProvider | null {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return null;

  return createElevenLabsProvider(apiKey);
}
