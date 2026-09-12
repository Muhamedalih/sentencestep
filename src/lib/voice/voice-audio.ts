"use server";

import { isTrackableWord, normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { tokenize } from "@/lib/typing";
import { cacheKeyParts, hashText, normalizeTextForVoice } from "@/lib/voice/resolution";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { SentenceDirection } from "@/lib/voice/director-types";
import { createEdgeTtsProvider } from "@/lib/voice/providers/edge-tts";
import type { TTSVoiceSettings } from "@/lib/voice/provider";
import {
  buildProviderSynthesisInput,
  claimCacheRow,
  clipPathForProvider,
  isStaleGenerating,
  MAX_VOICE_RETRY_ATTEMPTS,
} from "@/lib/voice/story-voice-generation";
import { uploadVoiceClip } from "@/lib/voice/storage";
import { headers } from "next/headers";

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
 * lessons exactly like Stories/Conversation) — this module only runs TTS
 * inference itself for the one narrow "sentence_word" exception documented
 * below; every other content type stays purely cache-only. A cache miss for
 * those (new content the background sweep hasn't reached yet, or no
 * narration provider configured) falls back to the browser's own speech
 * synthesis exactly like any other resolution failure (see
 * PronunciationButton).
 *
 * "sentence_word"/"book_sentence_word" pronounce a single target word in
 * isolation, not the sentence it came from — used by both "Fix Your
 * Mistakes" (see FixYourMistakesSession) and the in-lesson word-click while
 * reading/typing a Normal/Stories/Book sentence (see TypingSentence/
 * BookSentenceReader). contentId is `${sentenceId}::${normalized word}`,
 * resolved by re-deriving the word from the real sentence text server-side
 * — never trusting a client-supplied word string directly — so the same
 * "content reference, never raw text" guarantee holds here too;
 * "book_sentence_word" is identical except resolved against book_sentences
 * instead of sentences. Unlike every other content type, a cache miss here
 * doesn't just fall back to the browser: an Edge-TTS-sourced voice (Normal
 * lessons — free, no account needed) gets the word synthesized on demand
 * with that exact voice (see generateIsolatedWordAudio); a Story sentence's
 * paid-provider voice never triggers a real synthesis call on that provider
 * — a gender-matched free Edge-TTS voice stands in for just this one word
 * instead (see pickGenderMatchedEdgeTtsVoice), leaving the narrator's own
 * paid voice — and its own already-generated sentence audio — completely
 * untouched. This applies identically to Books' "book_sentence_word": an
 * earlier same-day special case that made a book_sentence_word cache miss
 * return null instead of reaching this substitute (leaving Books' word
 * clicks permanently silent, since nothing else ever populates that cache)
 * was reverted at the user's explicit request — see the resolution logic
 * inside resolvePronunciationAudioAction below.
 *
 * "book_sentence" is the Book Learning Engine's addition — a book_sentences
 * row rather than a sentences row, looked up the same content-reference way
 * (see lookupContentText below). Caching itself needs no changes at all: the
 * voice_audio_cache key is (voice_id, text_hash, generation_version), not
 * contentType/contentId, so a book sentence that happens to share exact text
 * with a lesson sentence already shares its cached clip for free.
 */
export type VoiceAudioContentType =
  "sentence" | "word" | "sentence_word" | "book_sentence" | "book_sentence_word";

const MAX_TEXT_LENGTH = 300;

/**
 * Caps how often a single caller can trigger a *new* word-audio synthesis
 * (never a cache hit — those stay free) via resolvePronunciationAudioAction.
 * Guests aren't authenticated (guest access to /learn is intentional), so
 * the only identity available is IP. In-memory and per-server-instance by
 * design — cheap (no DB/Redis round trip, no added Netlify function cost)
 * at the price of not being perfectly accurate across instances; enough to
 * blunt a scripted client enumerating content to force mass generation
 * without touching normal lesson use, since a real learner's new-word rate
 * is far below this ceiling.
 */
const SYNTHESIS_RATE_LIMIT = 20;
const SYNTHESIS_RATE_WINDOW_MS = 60_000;
const synthesisRateBuckets = new Map<string, { count: number; windowStart: number }>();

async function isSynthesisRateLimited(): Promise<boolean> {
  const forwardedFor = (await headers()).get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

  const now = Date.now();
  const bucket = synthesisRateBuckets.get(ip);
  if (!bucket || now - bucket.windowStart >= SYNTHESIS_RATE_WINDOW_MS) {
    synthesisRateBuckets.set(ip, { count: 1, windowStart: now });
    return false;
  }
  bucket.count += 1;
  return bucket.count > SYNTHESIS_RATE_LIMIT;
}

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

  if (contentType === "sentence_word" || contentType === "book_sentence_word") {
    const [sentenceId, normalizedWord] = contentId.split("::");
    if (!sentenceId || !normalizedWord) return null;
    const { data } = await supabase
      .from(contentType === "sentence_word" ? "sentences" : "book_sentences")
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
): Promise<{ providerVoiceId: string; source: string; gender: "female" | "male" } | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("voices")
    .select("provider_voice_id, source, gender")
    .eq("id", voiceId)
    .maybeSingle();
  return data
    ? { providerVoiceId: data.provider_voice_id, source: data.source, gender: data.gender }
    : null;
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
 * Batched sibling of lookupCachedAudioUrl, for many isolated words in ONE
 * Supabase round trip instead of one per word — measured root cause of "the
 * very first sentence's word clicks take 10-20+ seconds, every single
 * lesson, every single time" (live-tested across two full lessons,
 * mode=normal and mode=stories: sentence 1 consistently 15-19s, every later
 * sentence a consistent ~200-300ms). Only the sentence's own narration
 * ever got this same server-side, cache-only pre-resolution treatment (see
 * LessonPage's firstSentence handling below) — its individual WORDS had no
 * server-side head start at all, so a click on the very first sentence
 * (before TypingSentence's own within-sentence prefetch, or
 * LessonSession's next-sentence prefetch, have ever had a chance to run)
 * raced cold against a page that's simultaneously still loading its own JS,
 * images, and the sentence's own narration — the same connection/resource
 * contention documented on the Books narration fix, just far worse here
 * because literally everything on the page is loading at once.
 *
 * Takes a Map of normalizedWord -> the caller's own contentId (so this
 * function never needs to know about sentence ids) and returns
 * `{ [contentId]: audioUrl }` for every cache hit; a miss for any word is
 * simply absent from the result, left to resolve on demand client-side
 * exactly as before. Never generates. Callers register the result into the
 * shared resolved-audio cache (see PronunciationSettingsProvider's
 * registerResolvedAudio) so a word click never even calls resolveAudio's
 * own network path in the first place — an instant, synchronous cache hit,
 * not just a faster one.
 */
export async function lookupCachedWordAudioUrls(
  contentIdByNormalizedWord: Map<string, string>,
  voiceId: string,
): Promise<Record<string, string>> {
  if (contentIdByNormalizedWord.size === 0) return {};

  const contentIdsByHash = new Map<string, string[]>();
  for (const [word, contentId] of contentIdByNormalizedWord) {
    const hash = hashText(normalizeTextForVoice(word));
    const existing = contentIdsByHash.get(hash);
    if (existing) existing.push(contentId);
    else contentIdsByHash.set(hash, [contentId]);
  }

  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("voice_audio_cache")
    .select("text_hash, audio_url, updated_at")
    .eq("voice_id", voiceId)
    .in("text_hash", [...contentIdsByHash.keys()])
    .eq("status", "ready")
    .not("audio_url", "is", null)
    .order("updated_at", { ascending: false });

  const result: Record<string, string> = {};
  for (const row of data ?? []) {
    if (!row.audio_url) continue;
    const contentIds = contentIdsByHash.get(row.text_hash);
    if (!contentIds) continue;
    // Rows arrive most-recently-updated first, so the first row seen for a
    // given contentId is already the freshest — later, older duplicate rows
    // for the same hash are skipped.
    for (const contentId of contentIds) {
      if (!(contentId in result)) result[contentId] = row.audio_url;
    }
  }
  return result;
}

/** A single isolated word has no narrative context (no neighboring sentences, no character arc) for the Voice Director to interpret — the exact same reasoning generateWordGroupVoiceDraft already applies to vocabulary words, reused here for the same shape of content. */
const NEUTRAL_DIRECTION: Omit<SentenceDirection, "sentenceId"> = {
  emotion: "neutral",
  energy: "medium",
  pace: "normal",
  emphasisWord: null,
  pauseBefore: "none",
};

/** Edge-TTS ignores voiceSettings entirely (see providers/edge-tts.ts's doc comment) — this exists only to satisfy buildProviderSynthesisInput/synthesize's shared shape, mirrors generateWordGroupVoiceDraft's identical constant for the same reason. */
const NEUTRAL_VOICE_SETTINGS: TTSVoiceSettings = {
  stability: 0.5,
  similarityBoost: 0.75,
  style: 0,
  speed: 1,
  useSpeakerBoost: true,
};

const EDGE_TTS_GENERATION_VERSION = "edge-tts:sentence-word:v1";

/**
 * The one on-demand synthesis path in this otherwise cache-only module —
 * "Fix Your Mistakes" asking to hear a single word in isolation from within
 * a Normal lesson's sentence, when that exact word (under that exact voice)
 * has never been generated by any background pipeline: Normal lessons only
 * ever pre-generate whole sentences, and Word Lists only ever pre-generates
 * its own vocabulary words, so an arbitrary mistake word has no guaranteed
 * pre-existing clip anywhere. Deliberately Edge-TTS only — the caller
 * (resolvePronunciationAudioAction) only ever reaches this for an
 * edge-tts-sourced voice, since Edge-TTS is free and requires no account,
 * unlike Stories/Books' paid narration providers (see
 * fallbackToParentSentenceAudio for those instead). Always synthesizes with
 * the exact same `voiceId`/`providerVoiceId` the caller already resolved for
 * that lesson, so this one word never sounds like a different narrator than
 * the sentence it came from. Same claim/generate/cache-write shape as
 * generateWordGroupVoiceDraft (content-addressed by (voice_id, text_hash,
 * generation_version), same bounded retry budget, same
 * stale-'generating'-row reclaim), just inlined here for a single word
 * instead of a whole word group. Best-effort: any failure (provider error,
 * upload error) is swallowed and returns null, leaving the caller with its
 * existing cache-miss fallback (the browser's own speech synthesis) — never
 * surfaced as an error.
 */
async function generateIsolatedWordAudio(
  word: string,
  voiceId: string,
  providerVoiceId: string,
): Promise<string | null> {
  const provider = createEdgeTtsProvider();
  const supabase = createServiceRoleClient();
  const key = cacheKeyParts(word, voiceId, EDGE_TTS_GENERATION_VERSION);

  const { data: existingRow } = await supabase
    .from("voice_audio_cache")
    .select("id, status, attempts, updated_at")
    .eq("voice_id", voiceId)
    .eq("text_hash", key.textHash)
    .eq("generation_version", EDGE_TTS_GENERATION_VERSION)
    .maybeSingle();

  if (existingRow) {
    if (existingRow.status === "generating" && !isStaleGenerating(existingRow.updated_at)) {
      return null; // another request is already generating this exact word
    }
    if (existingRow.status === "failed" && existingRow.attempts >= MAX_VOICE_RETRY_ATTEMPTS) {
      return null; // retry budget exhausted; needs the background sweep or an admin to intervene
    }
  }

  const existingByKey = existingRow
    ? new Map([[`${voiceId}:${key.textHash}:${EDGE_TTS_GENERATION_VERSION}`, existingRow]])
    : new Map();
  const direction: SentenceDirection = { sentenceId: `word:${voiceId}`, ...NEUTRAL_DIRECTION };
  const claimed = await claimCacheRow(
    supabase,
    key,
    "edge-tts",
    direction,
    existingByKey,
    provider.name,
  );
  if (!claimed) return null; // lost the claim race to a concurrent identical request

  try {
    const { text, voiceSettings } = buildProviderSynthesisInput(
      provider.name,
      direction,
      word,
      providerVoiceId,
      NEUTRAL_VOICE_SETTINGS,
    );
    const { audio, durationMs } = await provider.synthesize({
      text,
      voiceId: providerVoiceId,
      model: "edge-tts",
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
    return audioUrl;
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
    return null;
  }
}

/**
 * Picks a free Edge-TTS voice to stand in for a paid narration provider's
 * voice when isolating a single word (see resolvePronunciationAudioAction) —
 * never the narrator's own paid voice itself, so a word click on a
 * Story/Book sentence can never trigger a real ElevenLabs/Azure/Gemini
 * charge. Matched by gender only (never touches the real narrator voice
 * itself, just picks the closest free substitute for this one word): an
 * American-accented Edge-TTS voice of the same gender when one is
 * registered, falling back to any accent of that gender, so the isolated
 * word at least sounds like a plausible narrator of the right gender rather
 * than a random default. Returns null only if no Edge-TTS voice of that
 * gender is registered at all (practically never — Edge-TTS ships several
 * of each).
 */
async function pickGenderMatchedEdgeTtsVoice(
  gender: "female" | "male",
): Promise<{ id: string; providerVoiceId: string } | null> {
  const supabase = createServiceRoleClient();

  const { data: american } = await supabase
    .from("voices")
    .select("id, provider_voice_id")
    .eq("source", "edge-tts")
    .eq("gender", gender)
    .eq("accent", "American")
    .order("id")
    .limit(1)
    .maybeSingle();
  if (american) return { id: american.id, providerVoiceId: american.provider_voice_id };

  const { data: any } = await supabase
    .from("voices")
    .select("id, provider_voice_id")
    .eq("source", "edge-tts")
    .eq("gender", gender)
    .order("id")
    .limit(1)
    .maybeSingle();
  return any ? { id: any.id, providerVoiceId: any.provider_voice_id } : null;
}

/**
 * The voice_id a WORD-level cache row (sentence_word/book_sentence_word)
 * actually lives under for a given narrator/lesson voice: that voice's own
 * id unchanged if it's already Edge-TTS, otherwise the same free
 * gender-matched Edge-TTS substitute resolvePronunciationAudioAction's own
 * word branch below picks (see pickGenderMatchedEdgeTtsVoice) — never a
 * second, drifting copy of that decision, just this one exposed for a
 * caller that needs to look several words up in bulk (see
 * lookupCachedWordAudioUrls above) rather than one at a time. Read-only:
 * never generates, never claims a cache row, so calling this can never
 * itself kick off a synthesis.
 */
export async function resolveWordCacheVoiceId(narratorVoiceId: string): Promise<string | null> {
  const voice = await lookupVoice(narratorVoiceId);
  if (!voice) return null;
  if (voice.source === "edge-tts") return narratorVoiceId;
  const substitute = await pickGenderMatchedEdgeTtsVoice(voice.gender);
  return substitute?.id ?? null;
}

/**
 * Resolves a ready-to-play audio URL for real SentenceStep content spoken
 * by a real, existing voice. Cache-only for every content type except
 * "sentence_word"/"book_sentence_word" (see generateIsolatedWordAudio) — a
 * miss for any other type returns null (never throws) so PronunciationButton
 * falls back to the browser's speech synthesis exactly as it does for any
 * other resolution failure. Validates the content id and voice id are real
 * before looking up the cache, unlike lookupCachedAudioUrl, which trusts its
 * caller.
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

  const cached = await lookupCachedAudioUrl(text, voiceId);
  if (cached) return cached;

  if (contentType !== "sentence_word" && contentType !== "book_sentence_word") return null;

  if (await isSynthesisRateLimited()) return null;

  if (voice.source === "edge-tts") {
    return generateIsolatedWordAudio(text, voiceId, voice.providerVoiceId);
  }

  // A Story/Book sentence's narrator is a paid provider (ElevenLabs) — never
  // spend a real synthesis call isolating just one word of content that's
  // already fully narrated. Substitute a gender-matched free Edge-TTS voice
  // instead (see pickGenderMatchedEdgeTtsVoice): the narrator's own voice —
  // and its own already-generated sentence audio — is never touched, only
  // this one isolated-word request is served by a different (free) voice.
  //
  // Books briefly special-cased "book_sentence_word" to return null here
  // instead of reaching this substitute ("never a different voice, silence
  // instead" — 2026-09-11) — which in practice meant a book's word clicks
  // never made any sound at all, since nothing else ever populates a
  // book_sentence_word cache row. Reverted the same day at the user's
  // explicit request: Books now get the identical free Edge-TTS substitute
  // Story/Normal words already use successfully (>99.8% resolve success
  // measured in production) instead of permanent silence.
  const substitute = await pickGenderMatchedEdgeTtsVoice(voice.gender);
  if (!substitute) return null;
  return generateIsolatedWordAudio(text, substitute.id, substitute.providerVoiceId);
}
