import type { SupabaseClient } from "@supabase/supabase-js";

import { getDefaultPronunciationVoiceId } from "@/lib/admin/voices-queries";
import type { SentenceDirection } from "@/lib/voice/director-types";
import { createEdgeTtsProvider } from "@/lib/voice/providers/edge-tts";
import { cacheKeyParts } from "@/lib/voice/resolution";
import { uploadVoiceClip } from "@/lib/voice/storage";
import {
  buildProviderSynthesisInput,
  claimCacheRow,
  clipPathForProvider,
  isStaleGenerating,
  MAX_VOICE_RETRY_ATTEMPTS,
  type VoiceGenerationOutcome,
} from "@/lib/voice/story-voice-generation";
import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

/**
 * The Word Lists counterpart to story-voice-generation.ts's
 * generateStoryVoiceDraft / book-voice-generation.ts's generateBookVoiceDraft
 * — same background pre-generation + content-addressed cache model (see
 * voice-audio.ts's resolvePronunciationAudioAction, which reads this exact
 * cache for a word's pronunciation button), applied to a word group's
 * vocabulary words instead of lesson/book sentences.
 *
 * Deliberately isolated from Stories/Books/Conversation's narration
 * pipeline: always Edge-TTS specifically (never getTTSProvider()'s
 * auto-detected provider), never elevenlabs_settings — that table is
 * Stories/Books' own settings and must never be read from or affect Word
 * Lists. The default voice comes from
 * tts_settings.default_pronunciation_voice_id (see
 * getDefaultPronunciationVoiceId — shared with Normal lessons and Mistake
 * Review, admin-configurable independently of Stories/Books). No per-group
 * voice override exists yet (word_groups has no voice_id column), so every
 * group uses that one shared default.
 *
 * Also skips the Voice Director entirely, unlike Stories/Books: a single
 * vocabulary word has no story arc or character for an LLM to interpret —
 * every word gets the same flat, neutral delivery.
 */
const WORD_LIST_MODEL = "edge-tts";
const WORD_LIST_GENERATION_VERSION = "edge-tts:word-list:v1";

const NEUTRAL_VOICE_SETTINGS = {
  stability: 0.5,
  similarityBoost: 0.75,
  style: 0,
  speed: 1,
  useSpeakerBoost: true,
};

const NEUTRAL_DIRECTION: Omit<SentenceDirection, "sentenceId"> = {
  emotion: "neutral",
  energy: "medium",
  pace: "normal",
  emphasisWord: null,
  pauseBefore: "none",
};

interface VocabularyWordRow {
  id: string;
  target_word: string;
}

interface ExistingCacheRow {
  id: string;
  text_hash: string;
  status: "generating" | "ready" | "failed";
  attempts: number;
  updated_at: string;
}

/**
 * The per-word-group generation attempt — same outcome shape and
 * cache/claim/retry contract as generateStoryVoiceDraft/generateBookVoiceDraft.
 * A cache hit on every word makes a repeat call essentially free, same
 * re-attempt behavior as the other two content types.
 */
export async function generateWordGroupVoiceDraft(
  supabase: DbClient,
  groupId: string,
  forceWordIds?: ReadonlySet<string>,
): Promise<VoiceGenerationOutcome> {
  const provider = createEdgeTtsProvider();

  const { data: words, error: wordsError } = await supabase
    .from("vocabulary_words")
    .select("id, target_word")
    .eq("group_id", groupId);
  if (wordsError)
    return { generated: 0, skipped: 0, failed: 0, error: "Couldn't load the word group's words." };
  if (!words || words.length === 0) return { generated: 0, skipped: 0, failed: 0 };

  const defaultVoiceId = await getDefaultPronunciationVoiceId();
  const { data: voiceRow } = await supabase
    .from("voices")
    .select("id, provider_voice_id, source")
    .eq("id", defaultVoiceId)
    .maybeSingle();
  if (!voiceRow || voiceRow.source !== provider.name) {
    return {
      generated: 0,
      skipped: 0,
      failed: words.length,
      error: `The Word Lists voice (${defaultVoiceId}) is missing or isn't an Edge-TTS voice.`,
    };
  }
  const voiceId = voiceRow.id;
  const providerVoiceId = voiceRow.provider_voice_id;
  const generationVersion = WORD_LIST_GENERATION_VERSION;

  const keyedWords = (words as VocabularyWordRow[]).map((word) => ({
    word,
    key: cacheKeyParts(word.target_word, voiceId, generationVersion),
  }));

  const textHashes = [...new Set(keyedWords.map((k) => k.key.textHash))];
  const { data: existingRowsRaw } = await supabase
    .from("voice_audio_cache")
    .select("id, text_hash, status, attempts, updated_at")
    .eq("voice_id", voiceId)
    .eq("generation_version", generationVersion)
    .in("text_hash", textHashes);
  const existingByTextHash = new Map<string, ExistingCacheRow>(
    (existingRowsRaw ?? []).map((row) => [row.text_hash, row as ExistingCacheRow]),
  );

  let skipped = 0;
  const eligible: typeof keyedWords = [];
  for (const item of keyedWords) {
    const existing = existingByTextHash.get(item.key.textHash);
    const forced = forceWordIds?.has(item.word.id) ?? false;
    if (existing && existing.status === "ready" && !forced) {
      skipped += 1;
      continue;
    }
    if (existing && existing.status === "generating" && !isStaleGenerating(existing.updated_at)) {
      skipped += 1; // another worker already has this
      continue;
    }
    if (
      existing &&
      existing.status === "failed" &&
      existing.attempts >= MAX_VOICE_RETRY_ATTEMPTS &&
      !forced
    ) {
      skipped += 1; // retry budget exhausted; needs manual intervention
      continue;
    }
    eligible.push(item);
  }

  let generated = 0;
  let failed = 0;
  const notes: string[] = [];

  for (const item of eligible) {
    const direction: SentenceDirection = { sentenceId: item.word.id, ...NEUTRAL_DIRECTION };
    const existing = existingByTextHash.get(item.key.textHash);

    // claimCacheRow expects an existingByKey map keyed by
    // `${voiceId}:${textHash}:${generationVersion}` — a one-entry map is
    // all it needs to decide insert-vs-update for this single word.
    const existingByKeyForClaim = existing
      ? new Map([[`${voiceId}:${item.key.textHash}:${generationVersion}`, existing]])
      : new Map();
    const claimed = await claimCacheRow(
      supabase,
      item.key,
      WORD_LIST_MODEL,
      direction,
      existingByKeyForClaim,
      provider.name,
    );
    if (!claimed) {
      skipped += 1; // lost the claim race to a concurrent attempt
      continue;
    }

    try {
      const { text, voiceSettings } = buildProviderSynthesisInput(
        provider.name,
        direction,
        item.word.target_word,
        providerVoiceId,
        NEUTRAL_VOICE_SETTINGS,
      );
      const { audio, durationMs } = await provider.synthesize({
        text,
        voiceId: providerVoiceId,
        model: WORD_LIST_MODEL,
        voiceSettings,
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
      notes.push(`Word ${item.word.id}: ${message}`);
    }
  }

  return { generated, skipped, failed, error: notes.length > 0 ? notes.join(" ") : undefined };
}
