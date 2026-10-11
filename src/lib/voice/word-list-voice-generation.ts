import type { SupabaseClient } from "@supabase/supabase-js";

import { getDefaultPronunciationVoiceId } from "@/lib/admin/voices-queries";
import type { SentenceDirection } from "@/lib/voice/director-types";
import { isWordListProvider, wordListModelFor } from "@/lib/voice/content-provider-map";
import type { TTSProvider } from "@/lib/voice/provider";
import { createProviderForSource } from "@/lib/voice/provider-registry";
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
 * pipeline: only the providers in content-provider-map.ts's
 * WORD_LIST_PROVIDERS (Edge-TTS and Fish Audio — chosen by the resolved
 * voice's own `source`, never auto-detected; the Edge-TTS default was
 * reassigned from Cartesia 2026-09-10), never elevenlabs_settings — that
 * table is Stories/Books' own settings and must never be read from or
 * affect Word Lists. The default voice comes from
 * tts_settings.default_pronunciation_voice_id (see
 * getDefaultPronunciationVoiceId, admin-configurable independently of
 * Stories/Books and of Normal lessons' own
 * default_normal_lesson_voice_id); a group's own word_groups.voice_id wins
 * over it when it resolves to a Word Lists provider's voice.
 *
 * Also skips the Voice Director entirely, unlike Stories/Books: a single
 * vocabulary word has no story arc or character for an LLM to interpret —
 * every word gets the same flat, neutral delivery.
 */
/** Edge-TTS ignores the model argument entirely (see providers/edge-tts.ts's doc comment) — "edge-tts" here only satisfies buildProviderSynthesisInput/synthesize's shared shape and is stored as voice_audio_cache.model, mirroring voice-audio.ts's identical `model: "edge-tts"` for isolated word clips. */
export const WORD_LIST_MODEL = "edge-tts";

/** How long one generation call keeps STARTING new words before leaving the rest for the next trigger/sweep — Fish takes ~1-2s per word (Edge-TTS well under 1s), and a serverless function has a hard ceiling. */
const DEFAULT_GENERATION_DEADLINE_MS = 40_000;
/** Fish's free tier allows 5 concurrent requests; 2 leaves headroom for a second group generating at the same moment (and keeps a 429 from burning a word's retry budget). Edge-TTS keeps its original one-at-a-time behaviour. */
const FISH_AUDIO_CONCURRENCY = 2;
/**
 * generation_version is intentionally unchanged across the Cartesia ->
 * Edge-TTS reassignment (2026-09-10): provider identity was already dropped
 * from this string (see content-provider-map.ts's doc comment), because a
 * different provider's voice_id is already a different cache key on its
 * own (see resolution.ts's cacheKeyParts). Switching to the
 * edge-tts-en-us-emma voice id naturally produces fresh cache rows without
 * touching or invalidating the existing Cartesia-voiced rows still sitting
 * in voice_audio_cache.
 */
export const WORD_LIST_GENERATION_VERSION = "word-list:v2";

export const NEUTRAL_VOICE_SETTINGS = {
  stability: 0.5,
  similarityBoost: 0.75,
  style: 0,
  speed: 1,
  useSpeakerBoost: true,
};

export const NEUTRAL_DIRECTION: Omit<SentenceDirection, "sentenceId"> = {
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
  options: { deadlineMs?: number } = {},
): Promise<VoiceGenerationOutcome> {
  const deadlineAt = Date.now() + (options.deadlineMs ?? DEFAULT_GENERATION_DEADLINE_MS);

  const { data: words, error: wordsError } = await supabase
    .from("vocabulary_words")
    .select("id, target_word")
    .eq("group_id", groupId);
  if (wordsError)
    return { generated: 0, skipped: 0, failed: 0, error: "Couldn't load the word group's words." };
  if (!words || words.length === 0) return { generated: 0, skipped: 0, failed: 0 };

  // A group's own voice_id wins when it actually resolves to a Word Lists
  // provider's voice (Edge-TTS or Fish Audio) — same override-then-fallback
  // precedence resolveStoryNarratorVoice/resolveTargetVoices already use for
  // a lesson/book's voice_id, applied here to word_groups.voice_id (see
  // 20250311000000_word_group_voice_override.sql). A voice_id left over
  // from some other provider (there's no admin path that could set one
  // today, but nothing prevents it at the DB level) is silently ignored
  // rather than rejected — falls through to the site-wide default exactly
  // as if the group had no override at all.
  const { data: group } = await supabase
    .from("word_groups")
    .select("voice_id")
    .eq("id", groupId)
    .maybeSingle();

  let candidateVoiceId = await getDefaultPronunciationVoiceId();
  if (group?.voice_id) {
    const { data: overrideVoice } = await supabase
      .from("voices")
      .select("id, source")
      .eq("id", group.voice_id)
      .maybeSingle();
    if (overrideVoice && isWordListProvider(overrideVoice.source)) {
      candidateVoiceId = overrideVoice.id;
    }
  }

  const { data: voiceRow } = await supabase
    .from("voices")
    .select("id, provider_voice_id, source")
    .eq("id", candidateVoiceId)
    .maybeSingle();
  if (!voiceRow || !isWordListProvider(voiceRow.source)) {
    return {
      generated: 0,
      skipped: 0,
      failed: words.length,
      error: `The Word Lists voice (${candidateVoiceId}) is missing or isn't an Edge-TTS or Fish Audio voice.`,
    };
  }
  // The adapter comes from the voice's own source (see
  // content-provider-map.ts's WORD_LIST_PROVIDERS) — a missing API key
  // throws here rather than substituting another provider.
  let provider: TTSProvider;
  try {
    provider = createProviderForSource(voiceRow.source);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { generated: 0, skipped: 0, failed: 0, error: message };
  }
  const model = wordListModelFor(voiceRow.source);
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

  // Workers pull from one shared cursor and stop STARTING words once the
  // deadline passes (a started word is always finished, so no row is ever
  // abandoned mid-"generating"); whatever is left is picked up by the next
  // trigger or sweep, since a word without a ready clip stays eligible.
  // Edge-TTS keeps its original one-at-a-time pace.
  async function generateOne(item: (typeof eligible)[number]): Promise<void> {
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
      model,
      direction,
      existingByKeyForClaim,
      provider.name,
    );
    if (!claimed) {
      skipped += 1; // lost the claim race to a concurrent attempt
      return;
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
        model,
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

  let cursor = 0;
  const worker = async (): Promise<void> => {
    while (cursor < eligible.length && Date.now() < deadlineAt) {
      const item = eligible[cursor++];
      if (item) await generateOne(item);
    }
  };
  const concurrency = provider.name === "fish-audio" ? FISH_AUDIO_CONCURRENCY : 1;
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  return { generated, skipped, failed, error: notes.length > 0 ? notes.join(" ") : undefined };
}
