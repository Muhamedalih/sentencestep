import { headers } from "next/headers";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { SentenceDirection } from "@/lib/voice/director-types";
import { createEdgeTtsProvider } from "@/lib/voice/providers/edge-tts";
import type { TTSVoiceSettings } from "@/lib/voice/provider";
import { cacheKeyParts, hashText } from "@/lib/voice/resolution";
import {
  pickWordClip,
  sentenceWordEntries,
  wordTextCandidates,
} from "@/lib/voice/sentence-word-plan";
import { uploadVoiceClip } from "@/lib/voice/storage";
import {
  buildProviderSynthesisInput,
  claimCacheRow,
  clipPathForProvider,
  isStaleGenerating,
  MAX_VOICE_RETRY_ATTEMPTS,
} from "@/lib/voice/story-voice-generation";
import { runWithinBudget } from "@/lib/voice/word-list-word-audio";

/**
 * Everything that finds or makes an ISOLATED word's clip — the part of
 * voice-audio.ts that used to live inside its "use server" module. It moved
 * here because everything exported from a "use server" file is a public,
 * client-callable endpoint, and the batch route (api/voice/sentence-words) needs
 * these same functions: exporting generateIsolatedWordAudio from there would
 * have turned it into an open text-to-speech service. This module is imported
 * only by server code that derives every word itself from a real sentence row —
 * never from a client-supplied string.
 */

export interface WordVoice {
  id: string;
  providerVoiceId: string;
}

export async function lookupVoice(
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
 * Picks a free Edge-TTS voice to stand in for a paid narration provider's
 * voice when isolating a single word — never the narrator's own paid voice, so
 * a word click can never trigger a real ElevenLabs/Cartesia charge. Matched by
 * gender only: an American-accented Edge-TTS voice of the same gender when one
 * is registered, falling back to any accent of that gender. Returns null only
 * if no Edge-TTS voice of that gender is registered at all (practically never).
 */
export async function pickGenderMatchedEdgeTtsVoice(
  gender: "female" | "male",
): Promise<WordVoice | null> {
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

/** How long a narrator -> word-voice mapping is reused. Voices are admin-configured and change rarely; the cost of a stale entry is one lookup under the previous substitute for a few minutes. */
const WORD_VOICE_TTL_MS = 10 * 60_000;
const wordVoiceCache = new Map<string, { promise: Promise<WordVoice | null>; expiresAt: number }>();

async function computeWordVoice(narratorVoiceId: string): Promise<WordVoice | null> {
  const voice = await lookupVoice(narratorVoiceId);
  if (!voice) return null;
  return voice.source === "edge-tts"
    ? { id: narratorVoiceId, providerVoiceId: voice.providerVoiceId }
    : pickGenderMatchedEdgeTtsVoice(voice.gender);
}

/**
 * The voice an isolated word's clip really lives under for a given narrator:
 * the narrator itself when it is already Edge-TTS (free), otherwise the free
 * gender-matched Edge-TTS substitute (see pickGenderMatchedEdgeTtsVoice) — a
 * paid narrator never pays for a single word. null when the narrator voice
 * doesn't exist (or no substitute is registered).
 *
 * Memoized per server instance, concurrent callers sharing one lookup: this
 * mapping used to cost two or three sequential Supabase round trips on every
 * word of every lesson load, before the clip itself was even looked up. Only a
 * successful resolution is kept, so a missing voice is re-checked on the next
 * call rather than remembered.
 */
export function resolveWordVoice(narratorVoiceId: string): Promise<WordVoice | null> {
  const now = Date.now();
  const cached = wordVoiceCache.get(narratorVoiceId);
  if (cached && cached.expiresAt > now) return cached.promise;

  const promise = computeWordVoice(narratorVoiceId).then(
    (voice) => {
      if (!voice) wordVoiceCache.delete(narratorVoiceId);
      return voice;
    },
    (error: unknown) => {
      wordVoiceCache.delete(narratorVoiceId);
      throw error;
    },
  );
  wordVoiceCache.set(narratorVoiceId, { promise, expiresAt: now + WORD_VOICE_TTL_MS });
  return promise;
}

/**
 * Caps how often a single caller can trigger a *new* word-audio synthesis
 * (never a cache hit — those stay free). Guests aren't authenticated (guest
 * access to /learn is intentional), so the only identity available is IP.
 * In-memory and per-server-instance by design — cheap (no DB/Redis round trip)
 * at the price of not being perfectly accurate across instances; enough to
 * blunt a scripted client enumerating content to force mass generation without
 * touching normal lesson use, since a real learner's new-word rate is far below
 * this ceiling.
 */
const SYNTHESIS_RATE_LIMIT = 20;
const SYNTHESIS_RATE_WINDOW_MS = 60_000;
const synthesisRateBuckets = new Map<string, { count: number; windowStart: number }>();

export async function isSynthesisRateLimited(): Promise<boolean> {
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
 * The one on-demand synthesis path for an isolated word — a word that no
 * background pipeline has generated yet (Normal lessons only ever pre-generate
 * whole sentences, and Word Lists only its own vocabulary). Deliberately
 * Edge-TTS only: free and account-free, unlike Stories/Books' paid narration
 * providers. Content-addressed by (voice_id, text_hash, generation_version),
 * same bounded retry budget and stale-'generating'-row reclaim as
 * generateWordGroupVoiceDraft. Best-effort: any failure (provider error, upload
 * error) is swallowed and returns null, leaving the caller with its existing
 * cache-miss fallback — never surfaced as an error.
 */
export async function generateIsolatedWordAudio(
  word: string,
  voiceId: string,
  providerVoiceId: string,
): Promise<string | null> {
  const provider = createEdgeTtsProvider();
  const supabase = createServiceRoleClient();
  const key = cacheKeyParts(word, voiceId, EDGE_TTS_GENERATION_VERSION);

  const { data: existingRow } = await supabase
    .from("voice_audio_cache")
    .select("id, status, attempts, updated_at, audio_url")
    .eq("voice_id", voiceId)
    .eq("text_hash", key.textHash)
    .eq("generation_version", EDGE_TTS_GENERATION_VERSION)
    .maybeSingle();

  if (existingRow) {
    // Already generated: hand it back instead of claiming the row and
    // synthesizing (and uploading) the same word all over again.
    if (existingRow.status === "ready" && existingRow.audio_url) return existingRow.audio_url;
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
 * Newest ready clip per (voice, text hash), for any of `texts` under any of
 * `voiceIds`, in ONE query. Keyed `${voiceId}:${hash}`; a text or voice with no
 * ready clip is simply absent.
 */
async function lookupReadyClips(
  texts: readonly string[],
  voiceIds: readonly string[],
): Promise<Map<string, string>> {
  const clips = new Map<string, string>();
  if (texts.length === 0 || voiceIds.length === 0) return clips;

  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("voice_audio_cache")
    .select("voice_id, text_hash, audio_url, updated_at")
    .in("voice_id", [...voiceIds])
    .in("text_hash", [...new Set(texts.map((text) => hashText(text)))])
    .eq("status", "ready")
    .not("audio_url", "is", null)
    .order("updated_at", { ascending: false });

  for (const row of data ?? []) {
    const key = `${row.voice_id}:${row.text_hash}`;
    // Newest first, so the first row seen for a key is the freshest.
    if (row.audio_url && !clips.has(key)) clips.set(key, row.audio_url);
  }
  return clips;
}

/**
 * The clip for a word cached under ANY of `texts` (best spelling first) for one
 * voice, in a single query — or null. Cache-only.
 */
export async function lookupCachedClipForTexts(
  texts: readonly string[],
  voiceId: string,
): Promise<string | null> {
  return pickWordClip(texts, [voiceId], await lookupReadyClips(texts, [voiceId])) ?? null;
}

export interface SentenceWordAudio {
  /** contentId -> clip URL, for every word of the sentence that has a clip. */
  urls: Record<string, string>;
  /** contentIds of the words that still have none. */
  missing: string[];
}

/** Longest a generating request may run — well inside a serverless function's own timeout, so a slow provider returns what it finished instead of a gateway error. */
const GENERATE_DEADLINE_MS = 6_000;
const GENERATE_CONCURRENCY = 3;
/** A sentence never has this many distinct words in practice; the cap keeps one request's synthesis bounded whatever a caller asks. */
const MAX_WORDS_PER_SENTENCE = 40;

/**
 * Every isolated-word clip of one lesson sentence, in a couple of Supabase round
 * trips instead of one Server Action per word. The caller hands over the
 * sentence's text, so it must be text the server itself read from a real
 * sentence row (the batch route goes through resolveSentenceWordAudio below,
 * which does that read) — never a client-supplied string.
 *
 * Cache-only by default. With `generate`, the words still missing are
 * synthesized (bounded: concurrency, deadline, the shared per-IP rate limit)
 * under the canonical normalized spelling — the same one the backfill script
 * wrote — so a word is generated once per voice whatever its position or
 * punctuation in any sentence. Returns null when the voice isn't real. Never
 * throws for a synthesis failure: a word that couldn't be made is just still in
 * `missing`.
 */
export async function resolveWordAudioForText(input: {
  sentenceId: string;
  text: string;
  voiceId: string;
  generate?: boolean;
}): Promise<SentenceWordAudio | null> {
  const { sentenceId, text, voiceId, generate = false } = input;
  const wordVoice = await resolveWordVoice(voiceId);
  if (!wordVoice) return null;

  const entries = sentenceWordEntries(sentenceId, text).slice(0, MAX_WORDS_PER_SENTENCE);
  if (entries.length === 0) return { urls: {}, missing: [] };

  // The narrator's own id first: a one-word sentence ("Yes.") is a real
  // narrator clip, which is what this lookup has always preferred. Otherwise
  // the word voice — where every other isolated word actually lives.
  const voiceIds = [...new Set([voiceId, wordVoice.id])];
  const candidatesByEntry = entries.map((entry) => wordTextCandidates(entry.raw, entry.key));
  const clips = await lookupReadyClips(candidatesByEntry.flat(), voiceIds);

  const urls: Record<string, string> = {};
  const missingEntries: typeof entries = [];
  entries.forEach((entry, index) => {
    const url = pickWordClip(candidatesByEntry[index] ?? [], voiceIds, clips);
    if (url) urls[entry.contentId] = url;
    else missingEntries.push(entry);
  });

  if (generate && missingEntries.length > 0) {
    const generated = await runWithinBudget(
      missingEntries,
      async (entry) => {
        if (await isSynthesisRateLimited()) return null;
        return generateIsolatedWordAudio(entry.key, wordVoice.id, wordVoice.providerVoiceId);
      },
      { concurrency: GENERATE_CONCURRENCY, deadlineAt: Date.now() + GENERATE_DEADLINE_MS },
    );
    generated.forEach((url, index) => {
      const entry = missingEntries[index];
      if (url && entry) urls[entry.contentId] = url;
    });
  }

  return {
    urls,
    missing: entries.map((entry) => entry.contentId).filter((contentId) => !(contentId in urls)),
  };
}

/** resolveWordAudioForText for a sentence named by id: the text is read from the real row (so the caller can only ask about SentenceStep's own content), in parallel with resolving the voice. Null when the sentence or voice isn't real. */
export async function resolveSentenceWordAudio(input: {
  sentenceId: string;
  voiceId: string;
  generate?: boolean;
}): Promise<SentenceWordAudio | null> {
  const { sentenceId, voiceId, generate } = input;
  const supabase = createServiceRoleClient();
  const [sentenceRow] = await Promise.all([
    supabase.from("sentences").select("en").eq("id", sentenceId).maybeSingle(),
    resolveWordVoice(voiceId), // warms the memo the call below reads
  ]);
  const text = sentenceRow.data?.en;
  if (!text) return null;
  return resolveWordAudioForText({ sentenceId, text, voiceId, generate });
}
