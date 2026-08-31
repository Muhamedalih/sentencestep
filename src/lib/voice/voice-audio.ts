"use server";

import { isTrackableWord, normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { tokenize } from "@/lib/typing";
import { cacheKeyParts, hashText, normalizeTextForVoice } from "@/lib/voice/resolution";
import { generateVoiceClip, KOKORO_GENERATION_VERSION } from "@/lib/voice/generation";
import { uploadVoiceClip, generatedClipPath } from "@/lib/voice/storage";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * The on-demand, cached pronunciation-audio pipeline every lesson type
 * calls through (see PronunciationButton's kokoroVoiceId prop — the single
 * integration point, not four separate ones). Deliberately takes a
 * *content reference*, never raw text: an arbitrary-text parameter here
 * would turn this into an unauthenticated public TTS endpoint (the actual
 * sentence/word is looked up server-side from a real content id, so a
 * caller can only ever request audio for text that's already part of
 * SentenceStep's own content). See MAX_TEXT_LENGTH below for the second
 * layer of that same guard.
 *
 * "sentence_word" is "Fix Your Mistakes"' one addition (see
 * FixYourMistakesSession): pronouncing a single target word in isolation,
 * not the sentence it came from. contentId is `${sentenceId}::${normalized
 * word}`, resolved by re-deriving the word from the real sentence text
 * server-side — never trusting a client-supplied word string directly —
 * so the same "content reference, never raw text" guarantee holds here too.
 *
 * "book_sentence" is the Book Learning Engine's addition — a book_sentences
 * row rather than a sentences row, looked up the same content-reference way
 * (see lookupContentText below). Caching itself needs no changes at all: the
 * voice_audio_cache key is (voice_id, text_hash, generation_version), not
 * contentType/contentId, so a book sentence that happens to share exact text
 * with a lesson sentence already shares its cached clip for free.
 */
export type VoiceAudioContentType = "sentence" | "word" | "sentence_word" | "book_sentence";

const MAX_TEXT_LENGTH = 300;

async function lookupContentText(
  contentType: VoiceAudioContentType,
  contentId: string,
): Promise<string | null> {
  const supabase = createServiceRoleClient();

  if (contentType === "sentence") {
    const { data } = await supabase
      .from("sentences")
      .select("en")
      .eq("id", contentId)
      .maybeSingle();
    return data?.en ?? null;
  }

  if (contentType === "book_sentence") {
    const { data } = await supabase
      .from("book_sentences")
      .select("en")
      .eq("id", contentId)
      .maybeSingle();
    return data?.en ?? null;
  }

  if (contentType === "sentence_word") {
    const [sentenceId, normalizedWord] = contentId.split("::");
    if (!sentenceId || !normalizedWord) return null;
    const { data } = await supabase
      .from("sentences")
      .select("en")
      .eq("id", sentenceId)
      .maybeSingle();
    if (!data?.en) return null;
    return (
      tokenize(data.en).find(
        (token) =>
          token !== " " && isTrackableWord(token) && normalizeMistakeWord(token) === normalizedWord,
      ) ?? null
    );
  }

  const { data } = await supabase
    .from("vocabulary_words")
    .select("target_word")
    .eq("id", contentId)
    .maybeSingle();
  return data?.target_word ?? null;
}

async function lookupVoice(
  voiceId: string,
): Promise<{ providerVoiceId: string; source: string } | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("voices")
    .select("provider_voice_id, source")
    .eq("id", voiceId)
    .maybeSingle();
  return data ? { providerVoiceId: data.provider_voice_id, source: data.source } : null;
}

/**
 * Cache-only lookup, never generates — the server-rendered counterpart of
 * resolvePronunciationAudioAction's own cache check, called from a lesson
 * page's Server Component (see LessonPage) for the sentence about to be
 * shown first. Measured root cause of "every sentence has a noticeable
 * pronunciation delay, even ones already generated": PronunciationButton's
 * on-demand resolve — while correctly cache-hitting — still costs a full
 * client→server round trip plus two sequential Supabase queries
 * (text+voice lookup, then the cache row itself) before the audio URL is
 * even known, every single time a new sentence mounts, regardless of how
 * long that clip has already existed. Calling this here and handing the
 * result to the page as the sentence's ordinary `audioUrl` (see
 * PronunciationButton's own priority order, which already treats a
 * populated audioUrl as "play this directly, never regenerate") lets the
 * very first paint already carry a ready-to-play URL for cache hits — zero
 * client-side resolution round trip. A cache miss here still resolves
 * exactly as before, on demand, client-side; this function never
 * generates, so it can never turn a page load into a Kokoro invocation.
 * Deliberately takes the already-known text directly (the caller already
 * fetched it) rather than a content id — unlike
 * resolvePronunciationAudioAction, there's no untrusted client input here
 * to gate behind a content-reference lookup.
 *
 * Tries the Kokoro-versioned key first (the common case for every existing
 * caller — Normal-lesson/word-list/mistake-review pronunciation, all
 * Kokoro-only), then falls back to an ElevenLabs-shaped lookup (voice_id +
 * text_hash + status='ready', ignoring generation_version — see
 * resolvePronunciationAudioAction's own identical fallback for why an
 * ElevenLabs row's context-dependent version can't be reconstructed from
 * text alone here). The fallback only ever runs on a Kokoro miss, so it
 * adds no extra query for the overwhelmingly common Kokoro path.
 */
export async function lookupCachedAudioUrl(text: string, voiceId: string): Promise<string | null> {
  if (!text || text.length > MAX_TEXT_LENGTH) return null;

  const key = cacheKeyParts(text, voiceId, KOKORO_GENERATION_VERSION);
  const supabase = createServiceRoleClient();

  const { data: cached } = await supabase
    .from("voice_audio_cache")
    .select("audio_url")
    .eq("voice_id", key.voiceId)
    .eq("text_hash", key.textHash)
    .eq("generation_version", key.generationVersion)
    .maybeSingle();
  if (cached) return cached.audio_url;

  const { data: elevenLabsCached } = await supabase
    .from("voice_audio_cache")
    .select("audio_url")
    .eq("voice_id", voiceId)
    .eq("text_hash", key.textHash)
    .eq("status", "ready")
    .not("audio_url", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return elevenLabsCached?.audio_url ?? null;
}

/**
 * Resolves a ready-to-play audio URL for real SentenceStep content spoken
 * by a real, existing voice: cache hit → return immediately; cache miss →
 * generate server-side, persist, then return. Returns null (never throws)
 * on any failure — invalid content/voice id, generation failure, storage
 * failure — so callers (PronunciationButton) can fall back to the existing
 * speech-synthesis path exactly as they already do when audioUrl is null,
 * per the existing resilience convention in this codebase. Errors are
 * still logged server-side, never silently discarded (see each catch
 * below).
 */
export async function resolvePronunciationAudioAction(input: {
  contentType: VoiceAudioContentType;
  contentId: string;
  voiceId: string;
}): Promise<string | null> {
  const { contentType, contentId, voiceId } = input;

  const [text, voice] = await Promise.all([
    lookupContentText(contentType, contentId),
    lookupVoice(voiceId),
  ]);
  if (!text || text.length > MAX_TEXT_LENGTH) return null;
  if (!voice) return null;

  // ElevenLabs-sourced voices are only ever generated in the background
  // (see src/lib/voice/story-voice-generation.ts) — a cache miss here means
  // the background pipeline hasn't produced this clip yet (or never will,
  // e.g. no provider configured), never a reason to call ElevenLabs from an
  // ordinary learner request. Returning null lets PronunciationButton fall
  // back to speech synthesis exactly as it already does for any other
  // resolution failure; the Kokoro path below this check is completely
  // unaffected.
  if (voice.source !== "kokoro") {
    const textHash = hashText(normalizeTextForVoice(text));
    // No generation_version filter here (unlike the Kokoro branch below):
    // an ElevenLabs row's version encodes surrounding-sentence context
    // (see story-voice-generation.ts's contextHash) that this lookup has no
    // way to reconstruct from text alone. (voice_id, text_hash, 'ready')
    // is enough to find the right clip in practice; ordering by most
    // recently updated resolves the rare case where an older row for a
    // since-changed context is still marked 'ready' pending cleanup.
    const { data: cached } = await createServiceRoleClient()
      .from("voice_audio_cache")
      .select("audio_url")
      .eq("voice_id", voiceId)
      .eq("text_hash", textHash)
      .eq("status", "ready")
      .not("audio_url", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return cached?.audio_url ?? null;
  }

  const key = cacheKeyParts(text, voiceId, KOKORO_GENERATION_VERSION);
  const supabase = createServiceRoleClient();

  const { data: cached } = await supabase
    .from("voice_audio_cache")
    .select("audio_url")
    .eq("voice_id", key.voiceId)
    .eq("text_hash", key.textHash)
    .eq("generation_version", key.generationVersion)
    .maybeSingle();
  if (cached) return cached.audio_url;

  try {
    const { mp3 } = await generateVoiceClip(key.normalizedText, voice.providerVoiceId);
    const audioUrl = await uploadVoiceClip(generatedClipPath(voiceId), mp3);

    // Upsert, not insert: a second learner racing the same (voice, text)
    // cache miss at the same time is expected, not an error — see
    // voice_audio_cache's unique constraint. Whichever upsert lands last
    // wins the stored row; both callers still get a real, valid, correctly
    // voiced URL back either way, so no learner ever sees a failure from
    // this race.
    const { error: upsertError } = await supabase.from("voice_audio_cache").upsert(
      {
        voice_id: key.voiceId,
        text_hash: key.textHash,
        normalized_text: key.normalizedText,
        generation_version: key.generationVersion,
        audio_url: audioUrl,
      },
      { onConflict: "voice_id,text_hash,generation_version" },
    );
    if (upsertError) {
      console.error("[voice-audio] cache upsert failed", {
        voiceId,
        contentType,
        contentId,
        upsertError,
      });
    }

    return audioUrl;
  } catch (error) {
    console.error("[voice-audio] generation failed", { voiceId, contentType, contentId, error });
    return null;
  }
}
