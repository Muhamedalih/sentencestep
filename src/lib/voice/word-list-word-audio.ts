import type { SupabaseClient } from "@supabase/supabase-js";

import { getDefaultPronunciationVoiceId } from "@/lib/admin/voices-queries";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/service-role";
import type { SentenceDirection } from "@/lib/voice/director-types";
import { WORD_LIST_PROVIDER } from "@/lib/voice/content-provider-map";
import type { TTSProvider } from "@/lib/voice/provider";
import { createProviderForSource } from "@/lib/voice/provider-registry";
import { cacheKeyParts, hashText, normalizeTextForVoice } from "@/lib/voice/resolution";
import { uploadVoiceClip } from "@/lib/voice/storage";
import {
  buildProviderSynthesisInput,
  claimCacheRow,
  clipPathForProvider,
  isStaleGenerating,
  MAX_VOICE_RETRY_ATTEMPTS,
} from "@/lib/voice/story-voice-generation";
import {
  NEUTRAL_DIRECTION,
  NEUTRAL_VOICE_SETTINGS,
  WORD_LIST_GENERATION_VERSION,
  WORD_LIST_MODEL,
} from "@/lib/voice/word-list-voice-generation";
import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

/**
 * Word Lists' own pronunciation voice, for ANY single English word — not just
 * the words that happen to sit in a Word Lists group. Built for Today's
 * session, which mixes words from Word Lists with words from typing
 * mistakes, Vocabulary Recall and saved cards, and must sound like Word
 * Lists for every one of them (the learner-facing requirement was "the same
 * voice as the word lists, all of them, no exceptions").
 *
 * Why this exists instead of reusing PronunciationButton's on-demand path:
 *  - the mistakes list pre-attaches clips recorded in the *Normal lessons*
 *    voice (see fetchAllMistakesAction), which is a different narrator;
 *  - on-demand synthesis (resolvePronunciationAudioAction's "sentence_word")
 *    needs a real sentence to re-derive the word from, which a personal card
 *    saved without one doesn't have, and it gives up silently (falling back to
 *    the browser's own voice) on a rate limit or a slow provider.
 * Here the server already knows the exact words (they came from the learner's
 * own data, never from a client-supplied string), so it can resolve every
 * one of them up front, under the one global Word Lists voice, in one pass.
 *
 * Reads exactly what Word Lists reads: voice_audio_cache rows under
 * `tts_settings.default_pronunciation_voice_id` (see lookupCachedAudioUrl —
 * any generation_version, freshest wins). A word nobody has spoken yet is
 * synthesized with the same provider, voice, neutral delivery,
 * generation_version and cache key generateWordGroupVoiceDraft uses, so the
 * clip is indistinguishable from one the Word Lists backfill made and is
 * picked up by Word Lists itself the day that word lands in a group.
 *
 * Deliberately NOT in a "use server" module: everything exported from one of
 * those is a public endpoint any client can call with arbitrary arguments,
 * which would turn this into an open text-to-speech service. It is imported
 * only by server code that builds the word list itself.
 */

/** A single word/short phrase — never a sentence. Caps what this pipeline will ever synthesize. */
const MAX_WORD_LENGTH = 60;

/** Letters (any script — the Word Lists voice is English, but names/loanwords carry accents), plus the joiners real words use. */
const SYNTHESIZABLE_WORD = /^\p{L}[\p{L}'’\-. ]*$/u;

/**
 * True for text this pipeline will synthesize: one short, letters-only word
 * or phrase. A second guard behind the fact that callers only ever pass
 * words the server itself derived — it keeps stray punctuation, digits and
 * long strings out of the TTS provider regardless.
 */
export function isSynthesizableWord(word: string): boolean {
  const text = normalizeTextForVoice(word);
  return text.length > 0 && text.length <= MAX_WORD_LENGTH && SYNTHESIZABLE_WORD.test(text);
}

/**
 * The spellings worth looking up for a word, most specific first: exactly as
 * given, then lower-case, then Capitalized. The voice cache is
 * case-sensitive (see normalizeTextForVoice), and the same word is stored as
 * "went" by one source and "Went" by another (a Word List entry vs a
 * normalized mistake word) — a TTS voice reads them identically, so any of
 * them is the right clip.
 */
export function wordAudioCandidates(word: string): string[] {
  const exact = normalizeTextForVoice(word);
  if (!exact) return [];
  const lower = exact.toLowerCase();
  const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
  return [...new Set([exact, lower, capitalized])];
}

/**
 * Runs `task` over `items` with at most `concurrency` in flight and stops
 * STARTING new ones once `deadlineAt` (epoch ms) has passed. Resolves when
 * every started task has finished OR the deadline passes, whichever is
 * first — a task still running at that point isn't cancelled (its result is
 * simply not waited for), so a slow provider can never hold the page
 * hostage, yet whatever it does finish still lands in the cache for next
 * time. Results come back in `items` order; an item that was never started
 * (or didn't finish in time) is `undefined`.
 */
export async function runWithinBudget<T, R>(
  items: readonly T[],
  task: (item: T) => Promise<R>,
  options: { concurrency: number; deadlineAt: number; now?: () => number },
): Promise<(R | undefined)[]> {
  const now = options.now ?? Date.now;
  const results: (R | undefined)[] = new Array<R | undefined>(items.length).fill(undefined);
  let next = 0;

  const worker = async (): Promise<void> => {
    while (next < items.length && now() < options.deadlineAt) {
      const index = next++;
      const item = items[index] as T;
      try {
        results[index] = await task(item);
      } catch {
        results[index] = undefined;
      }
    }
  };

  const workers = Array.from({ length: Math.max(1, options.concurrency) }, () => worker());
  const allDone = Promise.all(workers).then(() => undefined);

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, Math.max(0, options.deadlineAt - now()));
  });
  try {
    await Promise.race([allDone, timedOut]);
  } finally {
    if (timer) clearTimeout(timer);
  }
  return results.slice();
}

interface ExistingRow {
  id: string;
  text_hash: string;
  status: "generating" | "ready" | "failed";
  attempts: number;
  updated_at: string;
  audio_url: string | null;
}

/** Synthesizes one word under the Word Lists voice and records it in the cache; null on any failure (never throws). */
async function synthesizeWord(
  supabase: DbClient,
  provider: TTSProvider,
  word: string,
  voice: { id: string; providerVoiceId: string },
  existing: ExistingRow | undefined,
): Promise<string | null> {
  if (existing) {
    if (existing.status === "ready" && existing.audio_url) return existing.audio_url;
    if (existing.status === "generating" && !isStaleGenerating(existing.updated_at)) return null; // another request is already on it
    if (existing.status === "failed" && existing.attempts >= MAX_VOICE_RETRY_ATTEMPTS) return null; // retry budget spent; needs the backfill script / an admin
  }

  const key = cacheKeyParts(word, voice.id, WORD_LIST_GENERATION_VERSION);
  const direction: SentenceDirection = { sentenceId: `word:${key.textHash}`, ...NEUTRAL_DIRECTION };
  const existingByKey = existing
    ? new Map([[`${voice.id}:${key.textHash}:${WORD_LIST_GENERATION_VERSION}`, existing]])
    : new Map();
  const claimed = await claimCacheRow(
    supabase,
    key,
    WORD_LIST_MODEL,
    direction,
    existingByKey,
    provider.name,
  );
  if (!claimed) return null; // lost the claim race to a concurrent identical request

  try {
    const { text, voiceSettings } = buildProviderSynthesisInput(
      provider.name,
      direction,
      key.normalizedText,
      voice.providerVoiceId,
      NEUTRAL_VOICE_SETTINGS,
    );
    const { audio, durationMs } = await provider.synthesize({
      text,
      voiceId: voice.providerVoiceId,
      model: WORD_LIST_MODEL,
      voiceSettings,
    });
    const audioUrl = await uploadVoiceClip(clipPathForProvider(provider.name, voice.id), audio);
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
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

/** Defaults sized for a page load: a 30-word session that has never been heard still finishes inside a few seconds, and a provider outage can't stall the page past the deadline. */
const DEFAULT_CONCURRENCY = 5;
const DEFAULT_DEADLINE_MS = 8_000;

/**
 * Word -> Word Lists-voice clip URL for every word it could resolve (keyed by
 * the word exactly as passed in). Cache hits cost one batched query; misses
 * are synthesized in the Word Lists voice (see this module's doc comment)
 * within `deadlineMs`, in the order given — so pass the words in the order
 * they'll be needed and the ones that run out of time are the last ones.
 * Anything unresolved is simply absent from the map (the caller decides what
 * to do; it must not fall back to a different voice). Never throws.
 */
export async function resolveWordListVoiceAudio(
  words: readonly string[],
  options: { deadlineMs?: number; concurrency?: number } = {},
): Promise<Map<string, string>> {
  const resolved = new Map<string, string>();
  const unique = [...new Set(words)].filter((word) => wordAudioCandidates(word).length > 0);
  if (unique.length === 0 || !isServiceRoleConfigured()) return resolved;
  const deadlineAt = Date.now() + (options.deadlineMs ?? DEFAULT_DEADLINE_MS);

  try {
    const voiceId = await getDefaultPronunciationVoiceId();
    const supabase = createServiceRoleClient();

    // 1) Cache: one query for every candidate spelling of every word.
    const hashesByWord = new Map(
      unique.map((word) => [word, wordAudioCandidates(word).map((c) => hashText(c))]),
    );
    const { data: rows } = await supabase
      .from("voice_audio_cache")
      .select("text_hash, audio_url")
      .eq("voice_id", voiceId)
      .in("text_hash", [...new Set([...hashesByWord.values()].flat())])
      .eq("status", "ready")
      .not("audio_url", "is", null)
      .order("updated_at", { ascending: false });
    const urlByHash = new Map<string, string>();
    for (const row of rows ?? []) {
      // Freshest row per hash wins — same rule as lookupCachedAudioUrl.
      if (row.audio_url && !urlByHash.has(row.text_hash))
        urlByHash.set(row.text_hash, row.audio_url);
    }
    for (const [word, hashes] of hashesByWord) {
      const hit = hashes.map((hash) => urlByHash.get(hash)).find((url) => url !== undefined);
      if (hit) resolved.set(word, hit);
    }

    // 2) Misses: speak them now, in the Word Lists voice.
    const misses = unique.filter((word) => !resolved.has(word) && isSynthesizableWord(word));
    if (misses.length === 0) return resolved;

    const { data: voiceRow } = await supabase
      .from("voices")
      .select("id, provider_voice_id, source")
      .eq("id", voiceId)
      .maybeSingle();
    if (!voiceRow || voiceRow.source !== WORD_LIST_PROVIDER) {
      console.error(
        `[word-list-word-audio] the Word Lists voice (${voiceId}) is missing or isn't a ${WORD_LIST_PROVIDER} voice; serving cached clips only.`,
      );
      return resolved;
    }
    const voice = { id: voiceRow.id, providerVoiceId: voiceRow.provider_voice_id };
    const provider = createProviderForSource(WORD_LIST_PROVIDER);

    const missHashes = misses.map((word) =>
      cacheKeyParts(word, voice.id, WORD_LIST_GENERATION_VERSION),
    );
    const { data: existingRows } = await supabase
      .from("voice_audio_cache")
      .select("id, text_hash, status, attempts, updated_at, audio_url")
      .eq("voice_id", voice.id)
      .eq("generation_version", WORD_LIST_GENERATION_VERSION)
      .in("text_hash", [...new Set(missHashes.map((key) => key.textHash))]);
    const existingByHash = new Map<string, ExistingRow>(
      (existingRows ?? []).map((row) => [row.text_hash, row as ExistingRow]),
    );

    const urls = await runWithinBudget(
      misses,
      (word) =>
        synthesizeWord(
          supabase,
          provider,
          word,
          voice,
          existingByHash.get(cacheKeyParts(word, voice.id, WORD_LIST_GENERATION_VERSION).textHash),
        ),
      { concurrency: options.concurrency ?? DEFAULT_CONCURRENCY, deadlineAt },
    );
    misses.forEach((word, index) => {
      const url = urls[index];
      if (url) resolved.set(word, url);
    });
  } catch (error) {
    console.error("[word-list-word-audio] resolveWordListVoiceAudio failed", error);
  }
  return resolved;
}
