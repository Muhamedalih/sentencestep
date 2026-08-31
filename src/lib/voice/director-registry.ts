import { createAnthropicVoiceDirector, DEFAULT_VOICE_DIRECTOR_MODEL } from "@/lib/voice/director";
import { createLocalVoiceDirector } from "@/lib/voice/director-local";
import type { VoiceDirector } from "@/lib/voice/director-types";

/**
 * Mirrors src/lib/translation/provider-registry.ts's shape, with one
 * deliberate difference: translation has no local fallback (a translation
 * with no real provider is just wrong), but voice direction's fallback
 * space is small and closed (emotion/energy/pace/emphasis/pause tags), so a
 * deterministic rule-based director (director-local.ts) can produce
 * reasonable-if-simpler direction without an LLM call at all. Prefers
 * Anthropic — reusing ANTHROPIC_API_KEY, the same credential the
 * translation pipeline already requires — whenever it's configured (richer,
 * context-aware direction); falls back to the local heuristic director
 * otherwise, so the ElevenLabs Stories/Conversation pipeline never needs a
 * second paid API just to produce *some* expressive direction. The model is
 * separately configurable via VOICE_DIRECTOR_MODEL (defaults to Claude
 * Sonnet 5, the same tier translation defaults to) without needing a
 * different provider.
 */
export function getVoiceDirector(): VoiceDirector | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    const model = process.env.VOICE_DIRECTOR_MODEL || DEFAULT_VOICE_DIRECTOR_MODEL;
    return createAnthropicVoiceDirector(apiKey, model);
  }
  return createLocalVoiceDirector();
}
