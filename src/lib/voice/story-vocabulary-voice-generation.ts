import type { SupabaseClient } from "@supabase/supabase-js";

import { fetchLessonById } from "@/lib/supabase/queries/content";
import type { SentenceDirection } from "@/lib/voice/director-types";
import { STORIES_AND_BOOKS_PROVIDER } from "@/lib/voice/content-provider-map";
import { createProviderForSource } from "@/lib/voice/provider-registry";
import { cacheKeyParts } from "@/lib/voice/resolution";
import type { TTSVoiceSettings } from "@/lib/voice/provider";
import { uploadVoiceClip } from "@/lib/voice/storage";
import {
  baseVoiceSettings,
  buildProviderSynthesisInput,
  claimCacheRow,
  clipPathForProvider,
  isStaleGenerating,
  MAX_VOICE_RETRY_ATTEMPTS,
  resolveStoryNarratorVoice,
  type VoiceGenerationOutcome,
} from "@/lib/voice/story-voice-generation";
import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

/**
 * generation_version for a story's own target vocabulary words —
 * content-addressed by (voiceId, text_hash) directly, same convention as
 * generateWordGroupVoiceDraft's own words, since a story's target
 * vocabulary is derived on the fly from its sentences (see
 * story-vocabulary.ts's own doc comment) rather than persisted as its own
 * `vocabulary_words` row. Bump this if the synthesis approach below
 * (model/voice settings/direction) ever changes in a way that should
 * invalidate every existing cached word clip.
 */
const STORY_VOCAB_GENERATION_VERSION = "story-vocab:v1";

/** A single isolated word has no narrative context for the Voice Director to interpret — same reasoning generateWordGroupVoiceDraft/generateIsolatedWordAudio already apply to isolated words elsewhere. */
const NEUTRAL_DIRECTION: Omit<SentenceDirection, "sentenceId"> = {
  emotion: "neutral",
  energy: "medium",
  pace: "normal",
  emphasisWord: null,
  pauseBefore: "none",
};

/** Only reached if elevenlabs_settings' singleton row is somehow missing (it's seeded by migration and never deleted) — mirrors DEFAULT_ELEVENLABS_SETTINGS in elevenlabs-queries.ts so a word clip made this way still sounds reasonable rather than erroring outright. */
const FALLBACK_MODEL = "eleven_v3";
const FALLBACK_VOICE_SETTINGS: TTSVoiceSettings = {
  stability: 0.5,
  similarityBoost: 0.75,
  style: 0.3,
  speed: 1,
  useSpeakerBoost: true,
};

interface ExistingCacheRow {
  id: string;
  text_hash: string;
  status: "generating" | "ready" | "failed";
  attempts: number;
  updated_at: string;
}

/**
 * Generates a Story's own 2-6 target vocabulary words (StoryWordsPanel's
 * "words from this lesson" screen, shown on the completion recap) in that
 * exact story's own ElevenLabs narrator voice — called alongside
 * generateStoryVoiceDraft from generateLessonVoice so one "Generate" click
 * covers both (see that function's own doc comment). A no-op for anything
 * other than a Stories lesson (Normal/Conversation have no per-word
 * practice flow — see lesson-completion.tsx) or one with no curated/derived
 * target words.
 *
 * Reuses fetchLessonById rather than re-deriving the vocabulary selection
 * itself — story-vocabulary.ts's own doc comment is explicit that the
 * recap list and the in-context markers "cannot diverge because they're two
 * views of one array, not two separate derivations"; calling the exact same
 * function the learner-facing page calls is what keeps admin-generated
 * audio guaranteed to match what a learner will actually see, instead of a
 * second, potentially-drifting reimplementation of the curated/heuristic
 * selection logic.
 *
 * Skips the Voice Director entirely, like generateWordGroupVoiceDraft: a
 * single isolated word has no story arc for an LLM to interpret.
 */
export async function generateStoryVocabularyVoiceDraft(
  supabase: DbClient,
  lessonId: string,
): Promise<VoiceGenerationOutcome> {
  const lesson = await fetchLessonById("stories", lessonId);
  if (!lesson) return { generated: 0, skipped: 0, failed: 0 };
  const vocabulary = lesson.vocabulary ?? [];
  if (vocabulary.length === 0) return { generated: 0, skipped: 0, failed: 0 };

  let provider;
  try {
    provider = createProviderForSource(STORIES_AND_BOOKS_PROVIDER);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { generated: 0, skipped: 0, failed: 0, error: message };
  }

  const resolvedVoice = await resolveStoryNarratorVoice(supabase, lesson.voiceId ?? null);
  if (!resolvedVoice) {
    return {
      generated: 0,
      skipped: 0,
      failed: vocabulary.length,
      error: "No ElevenLabs voice configured — set a default narration voice in Admin > Voice.",
    };
  }
  const { voiceId, providerVoiceId } = resolvedVoice;

  const { data: settingsRow } = await supabase
    .from("elevenlabs_settings")
    .select("model, stability, similarity_boost, style, speed, use_speaker_boost")
    .eq("id", 1)
    .maybeSingle();
  const model = settingsRow?.model ?? FALLBACK_MODEL;
  const voiceSettings = settingsRow
    ? baseVoiceSettings({ ...settingsRow, default_story_voice_id: null })
    : FALLBACK_VOICE_SETTINGS;

  const keyedWords = vocabulary.map((word) => ({
    word,
    key: cacheKeyParts(word.en, voiceId, STORY_VOCAB_GENERATION_VERSION),
  }));

  const textHashes = [...new Set(keyedWords.map((k) => k.key.textHash))];
  const { data: existingRowsRaw } = await supabase
    .from("voice_audio_cache")
    .select("id, text_hash, status, attempts, updated_at")
    .eq("voice_id", voiceId)
    .eq("generation_version", STORY_VOCAB_GENERATION_VERSION)
    .in("text_hash", textHashes);
  const existingByTextHash = new Map<string, ExistingCacheRow>(
    (existingRowsRaw ?? []).map((row) => [row.text_hash, row as ExistingCacheRow]),
  );

  let skipped = 0;
  const eligible: typeof keyedWords = [];
  for (const item of keyedWords) {
    const existing = existingByTextHash.get(item.key.textHash);
    if (existing && existing.status === "ready") {
      skipped += 1;
      continue;
    }
    if (existing && existing.status === "generating" && !isStaleGenerating(existing.updated_at)) {
      skipped += 1; // another worker already has this
      continue;
    }
    if (existing && existing.status === "failed" && existing.attempts >= MAX_VOICE_RETRY_ATTEMPTS) {
      skipped += 1; // retry budget exhausted; needs manual intervention
      continue;
    }
    eligible.push(item);
  }

  let generated = 0;
  let failed = 0;
  const notes: string[] = [];

  for (const item of eligible) {
    const direction: SentenceDirection = {
      sentenceId: `story-vocab:${lessonId}:${item.word.en}`,
      ...NEUTRAL_DIRECTION,
    };
    const existing = existingByTextHash.get(item.key.textHash);
    const existingByKeyForClaim = existing
      ? new Map([[`${voiceId}:${item.key.textHash}:${STORY_VOCAB_GENERATION_VERSION}`, existing]])
      : new Map();
    const claimed = await claimCacheRow(
      supabase,
      item.key,
      model,
      direction,
      existingByKeyForClaim,
      provider.name,
    );
    if (!claimed) {
      skipped += 1; // lost the claim race to a concurrent attempt
      continue;
    }

    try {
      const { text, voiceSettings: synthesisVoiceSettings } = buildProviderSynthesisInput(
        provider.name,
        direction,
        item.word.en,
        providerVoiceId,
        voiceSettings,
      );
      const { audio, durationMs } = await provider.synthesize({
        text,
        voiceId: providerVoiceId,
        model,
        voiceSettings: synthesisVoiceSettings,
      });
      const audioUrl = await uploadVoiceClip(clipPathForProvider(provider.name, voiceId), audio);

      await supabase
        .from("voice_audio_cache")
        .update({
          status: "ready",
          audio_url: audioUrl,
          duration_ms: durationMs,
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", claimed.id);
      generated += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await supabase
        .from("voice_audio_cache")
        .update({
          status: "failed",
          last_error: message.slice(0, 500),
          updated_at: new Date().toISOString(),
        })
        .eq("id", claimed.id);
      failed += 1;
      notes.push(`Word "${item.word.en}": ${message}`);
    }
  }

  return { generated, skipped, failed, error: notes.length > 0 ? notes.join(" ") : undefined };
}
