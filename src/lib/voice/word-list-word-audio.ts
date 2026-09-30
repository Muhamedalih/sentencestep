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
 * Lists for every one of them.
 *
 * The clips are a INVENTORY, built ahead of time, never something a learner
 * waits for. This project's production backend (a free-tier Supabase project
 * behind Netlify functions, whose own scheduled sweeps already time out) is
 * too slow and too bursty to synthesize speech inside a page request — an
 * earlier version of Today's session did exactly that and left learners with
 * a slower page and, whenever synthesis didn't finish, no sound at all. So:
 *  - lookupWordListVoiceAudio is the ONLY thing a page load does: one cheap,
 *    cache-only query (the exact lookup Word Lists itself uses);
 *  - generateWordListVoiceAudio synthesizes the words that have no clip yet,
 *    and runs OFF the request path (after the response is sent, and from a
 *    scheduled background route — see findWordsMissingWordListVoice);
 *  - a word still without a clip falls back the way it always did, so the
 *    learner is never left silent.
 *
 * A synthesized clip is created exactly the way generateWordGroupVoiceDraft
 * creates Word Lists' own: same provider, voice, neutral delivery,
 * generation_version and cache key — indistinguishable from a backfilled
 * clip, and picked up by Word Lists itself the day that word lands in a
 * group.
 *
 * Deliberately NOT in a "use server" module: everything exported from one of
 * those is a public endpoint any client can call with arbitrary arguments,
 * which would turn this into an open text-to-speech service. It is imported
 * only by server code that derives the words itself (from the learner's own
 * data), never from a client-supplied string.
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
 * simply not waited for), so a slow provider can never hold a caller
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

/** voice_audio_cache reads in batches this size — a PostgREST `in (...)` list rides in the URL, so it can't be unbounded. */
const LOOKUP_BATCH = 60;

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

interface VoiceContext {
  supabase: DbClient;
  voiceId: string;
}

/** The Word Lists voice and a service-role client, or null when the server isn't configured for either. */
async function getVoiceContext(): Promise<VoiceContext | null> {
  if (!isServiceRoleConfigured()) return null;
  return { supabase: createServiceRoleClient(), voiceId: await getDefaultPronunciationVoiceId() };
}

/** Ready clips under the Word Lists voice for every spelling of every word: word -> url (keyed by the word exactly as passed in). */
async function lookupReadyClips(
  { supabase, voiceId }: VoiceContext,
  words: readonly string[],
): Promise<Map<string, string>> {
  const resolved = new Map<string, string>();
  for (const batch of chunk(words, LOOKUP_BATCH)) {
    const hashesByWord = new Map(
      batch.map((word) => [word, wordAudioCandidates(word).map((c) => hashText(c))]),
    );
    const { data, error } = await supabase
      .from("voice_audio_cache")
      .select("text_hash, audio_url")
      .eq("voice_id", voiceId)
      .in("text_hash", [...new Set([...hashesByWord.values()].flat())])
      .eq("status", "ready")
      .not("audio_url", "is", null)
      .order("updated_at", { ascending: false });
    if (error) throw error;

    const urlByHash = new Map<string, string>();
    for (const row of data ?? []) {
      // Freshest row per hash wins — same rule as lookupCachedAudioUrl.
      if (row.audio_url && !urlByHash.has(row.text_hash)) {
        urlByHash.set(row.text_hash, row.audio_url);
      }
    }
    for (const [word, hashes] of hashesByWord) {
      const hit = hashes.map((hash) => urlByHash.get(hash)).find((url) => url !== undefined);
      if (hit) resolved.set(word, hit);
    }
  }
  return resolved;
}

/**
 * Word -> Word Lists-voice clip URL for every word that ALREADY has one
 * (keyed by the word exactly as passed in). Cache-only — it never
 * synthesizes, so it is safe on a page's critical path: a couple of indexed
 * reads. A word with no clip is simply absent. Never throws.
 */
export async function lookupWordListVoiceAudio(
  words: readonly string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(words)].filter((word) => wordAudioCandidates(word).length > 0);
  if (unique.length === 0) return new Map();
  try {
    const context = await getVoiceContext();
    return context ? await lookupReadyClips(context, unique) : new Map();
  } catch (error) {
    console.error("[word-list-word-audio] lookupWordListVoiceAudio failed", error);
    return new Map();
  }
}

interface ExistingRow {
  id: string;
  text_hash: string;
  status: "generating" | "ready" | "failed";
  attempts: number;
  updated_at: string;
  audio_url: string | null;
}

type SynthesisOutcome = { url: string; reason?: undefined } | { url: null; reason: string };

/** Synthesizes one word under the Word Lists voice and records it in the cache; never throws. */
async function synthesizeWord(
  supabase: DbClient,
  provider: TTSProvider,
  word: string,
  voice: { id: string; providerVoiceId: string },
  existing: ExistingRow | undefined,
): Promise<SynthesisOutcome> {
  if (existing) {
    if (existing.status === "ready" && existing.audio_url) return { url: existing.audio_url };
    if (existing.status === "generating" && !isStaleGenerating(existing.updated_at)) {
      return { url: null, reason: "another request is already generating it" };
    }
    if (existing.status === "failed" && existing.attempts >= MAX_VOICE_RETRY_ATTEMPTS) {
      return { url: null, reason: "retry budget spent" };
    }
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
  if (!claimed) return { url: null, reason: "couldn't claim the cache row" };

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
    return { url: audioUrl };
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
    return { url: null, reason: message };
  }
}

export interface WordListVoiceGeneration {
  /** word (as passed in) -> clip URL, for the words that now have one. */
  urls: Map<string, string>;
  /** One short line per word that didn't — the reason, so a failing provider is visible in the logs instead of silent. */
  errors: string[];
}

const DEFAULT_CONCURRENCY = 3;
const DEFAULT_DEADLINE_MS = 20_000;

/**
 * Synthesizes the given words in the Word Lists voice (see this module's doc
 * comment), in the order given and within `deadlineMs`, so pass them in the
 * order they'll be needed and the ones that run out of time are the last
 * ones. Words that already have a clip are handed straight back. Never
 * throws; every failure is logged with its reason and returned in `errors`.
 * Meant to run off the request path — `after()` or a cron route.
 */
export async function generateWordListVoiceAudio(
  words: readonly string[],
  options: { deadlineMs?: number; concurrency?: number } = {},
): Promise<WordListVoiceGeneration> {
  const result: WordListVoiceGeneration = { urls: new Map(), errors: [] };
  const unique = [...new Set(words)].filter((word) => isSynthesizableWord(word));
  if (unique.length === 0) return result;
  const deadlineAt = Date.now() + (options.deadlineMs ?? DEFAULT_DEADLINE_MS);

  try {
    const context = await getVoiceContext();
    if (!context) {
      result.errors.push("the server has no Supabase service-role configuration");
      return result;
    }
    const { supabase, voiceId } = context;

    // A clip that appeared since the caller last looked needs no synthesis.
    const existingClips = await lookupReadyClips(context, unique);
    for (const [word, url] of existingClips) result.urls.set(word, url);
    const misses = unique.filter((word) => !result.urls.has(word));
    if (misses.length === 0) return result;

    const { data: voiceRow } = await supabase
      .from("voices")
      .select("id, provider_voice_id, source")
      .eq("id", voiceId)
      .maybeSingle();
    if (!voiceRow || voiceRow.source !== WORD_LIST_PROVIDER) {
      result.errors.push(
        `the Word Lists voice (${voiceId}) is missing or isn't a ${WORD_LIST_PROVIDER} voice`,
      );
      return result;
    }
    const voice = { id: voiceRow.id, providerVoiceId: voiceRow.provider_voice_id };
    const provider = createProviderForSource(WORD_LIST_PROVIDER);

    const hashOf = (word: string) =>
      cacheKeyParts(word, voice.id, WORD_LIST_GENERATION_VERSION).textHash;
    const existingByHash = new Map<string, ExistingRow>();
    for (const batch of chunk(misses, LOOKUP_BATCH)) {
      const { data } = await supabase
        .from("voice_audio_cache")
        .select("id, text_hash, status, attempts, updated_at, audio_url")
        .eq("voice_id", voice.id)
        .eq("generation_version", WORD_LIST_GENERATION_VERSION)
        .in("text_hash", [...new Set(batch.map(hashOf))]);
      for (const row of data ?? []) existingByHash.set(row.text_hash, row as ExistingRow);
    }

    const outcomes = await runWithinBudget(
      misses,
      (word) => synthesizeWord(supabase, provider, word, voice, existingByHash.get(hashOf(word))),
      { concurrency: options.concurrency ?? DEFAULT_CONCURRENCY, deadlineAt },
    );
    misses.forEach((word, index) => {
      const outcome = outcomes[index];
      if (outcome?.url) result.urls.set(word, outcome.url);
      else result.errors.push(`${word}: ${outcome?.reason ?? "ran out of time"}`);
    });
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  if (result.errors.length > 0) {
    console.error(
      `[word-list-word-audio] ${result.errors.length} of ${unique.length} word(s) not generated:`,
      result.errors.slice(0, 10),
    );
  }
  return result;
}

/**
 * Merges several newest-first word lists round-robin (so no single source
 * monopolizes a run's small budget), dropping duplicates and anything that
 * isn't a synthesizable word. Each word comes back whitespace-normalized.
 */
export function interleaveWordLists(lists: readonly (readonly string[])[]): string[] {
  const normalized = lists.map((list) => list.map((word) => normalizeTextForVoice(word)));
  const out: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; normalized.some((list) => i < list.length); i++) {
    for (const list of normalized) {
      const word = list[i];
      if (word && !seen.has(word) && isSynthesizableWord(word)) {
        seen.add(word);
        out.push(word);
      }
    }
  }
  return out;
}

/** How many of each table's newest rows the background sweep looks at per run — bounded so a run stays cheap however big the tables get. */
const SWEEP_ROWS_PER_TABLE = 150;

/**
 * Words learners actually have in their queues (typing mistakes, Vocabulary
 * Recall, saved cards — the sources Today's session draws from) that have no
 * Word Lists-voice clip yet and are still worth attempting, newest first, at
 * most `limit`. A word whose attempts are used up, or that another request is
 * generating right now, is skipped so one stubborn word can never occupy the
 * front of every run (the stuck-window failure voice-sweep's own notes
 * describe). Read-only.
 */
export async function findWordsMissingWordListVoice(limit: number): Promise<string[]> {
  const context = await getVoiceContext();
  if (!context || limit <= 0) return [];
  const { supabase, voiceId } = context;

  const [mistakes, recall, cards] = await Promise.all([
    supabase
      .from("mistakes")
      .select("word")
      .order("updated_at", { ascending: false })
      .limit(SWEEP_ROWS_PER_TABLE),
    supabase
      .from("vocabulary_encounters")
      .select("word")
      .order("created_at", { ascending: false })
      .limit(SWEEP_ROWS_PER_TABLE),
    supabase
      .from("saved_words")
      .select("word")
      .order("created_at", { ascending: false })
      .limit(SWEEP_ROWS_PER_TABLE),
  ]);
  for (const read of [mistakes, recall, cards]) if (read.error) throw read.error;

  const candidates = interleaveWordLists(
    [mistakes.data, recall.data, cards.data].map((rows) => (rows ?? []).map((row) => row.word)),
  );

  const missing: string[] = [];
  for (const batch of chunk(candidates, LOOKUP_BATCH)) {
    if (missing.length >= limit) break;
    const hasClip = await lookupReadyClips(context, batch);
    const { data: rows, error } = await supabase
      .from("voice_audio_cache")
      .select("text_hash, status, attempts, updated_at")
      .eq("voice_id", voiceId)
      .eq("generation_version", WORD_LIST_GENERATION_VERSION)
      .in("text_hash", [...new Set(batch.map((word) => hashText(word)))]);
    if (error) throw error;
    const blocked = new Set(
      (rows ?? [])
        .filter(
          (row) =>
            (row.status === "failed" && row.attempts >= MAX_VOICE_RETRY_ATTEMPTS) ||
            (row.status === "generating" && !isStaleGenerating(row.updated_at)),
        )
        .map((row) => row.text_hash),
    );
    for (const word of batch) {
      if (missing.length >= limit) break;
      if (!hasClip.has(word) && !blocked.has(hashText(word))) missing.push(word);
    }
  }
  return missing;
}
