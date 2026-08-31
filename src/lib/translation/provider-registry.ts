import {
  createAnthropicTranslationProvider,
  DEFAULT_TRANSLATION_MODEL,
} from "@/lib/translation/anthropic-provider";
import type { TranslationProvider } from "@/lib/translation/provider";

/**
 * Mirrors src/lib/email/provider-registry.ts's shape and reasoning exactly:
 * returns null, honestly, when no provider is configured — see generate.ts,
 * which requires every caller to handle "no provider configured" as a real
 * state (a generation attempt that fails cleanly, not one that pretends to
 * have run). Gated on ANTHROPIC_API_KEY so the provider choice stays
 * configuration, not a code change scattered through the app; the model is
 * separately configurable via TRANSLATION_MODEL (defaults to Claude Sonnet
 * 5) without needing a different provider.
 */
export function getTranslationProvider(): TranslationProvider | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const model = process.env.TRANSLATION_MODEL || DEFAULT_TRANSLATION_MODEL;
  return createAnthropicTranslationProvider(apiKey, model);
}
