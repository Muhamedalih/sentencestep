"use server";

import { isTrackableWord, normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { tokenize } from "@/lib/typing";
import { hashText, normalizeTextForVoice } from "@/lib/voice/resolution";
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
 * Every voice's audio is generated ahead of time by the background
 * narration pipeline (see story-voice-generation.ts, which covers Normal
 * lessons exactly like Stories/Conversation) — this module never runs TTS
 * inference itself, it only ever serves an already-cached clip. A cache
 * miss (new content the background sweep hasn't reached yet, or no
 * narration provider configured) falls back to the browser's own speech
 * synthesis exactly like any other resolution failure (see
 * PronunciationButton).
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
 * (voice_id, text_hash, status='ready') is the lookup — no
 * generation_version filter, since a narration-provider row's version
 * encodes surrounding-sentence context (see story-voice-generation.ts's
 * contextHash) that can't be reconstructed from text alone here; ordering
 * by most recently updated resolves the rare case where an older row for a
 * since-changed context is still marked 'ready' pending cleanup.
 */
export async function lookupCachedAudioUrl(text: string, voiceId: string): Promise<string | null> {
  if (!text || text.length > MAX_TEXT_LENGTH) return null;

  const textHash = hashText(normalizeTextForVoice(text));
  const supabase = createServiceRoleClient();

  const { data: cached } = await supabase
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

/**
 * Resolves a ready-to-play audio URL for real SentenceStep content spoken
 * by a real, existing voice — cache-only (see lookupCachedAudioUrl); a miss
 * returns null (never throws) so PronunciationButton falls back to the
 * browser's speech synthesis exactly as it does for any other resolution
 * failure. Validates the content id and voice id are real before looking up
 * the cache, unlike lookupCachedAudioUrl, which trusts its caller.
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

  return lookupCachedAudioUrl(text, voiceId);
}
