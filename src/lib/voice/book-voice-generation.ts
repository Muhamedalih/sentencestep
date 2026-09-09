import type { SupabaseClient } from "@supabase/supabase-js";

import { getVoiceDirector } from "@/lib/voice/director-registry";
import { validateVoiceDirectionOutput } from "@/lib/voice/director-validate";
import type { SentenceDirection } from "@/lib/voice/director-types";
import { STORIES_AND_BOOKS_PROVIDER } from "@/lib/voice/content-provider-map";
import { createProviderForSource } from "@/lib/voice/provider-registry";
import { cacheKeyParts, hashText, normalizeTextForVoice } from "@/lib/voice/resolution";
import { uploadVoiceClip } from "@/lib/voice/storage";
import {
  baseVoiceSettings,
  buildProviderSynthesisInput,
  claimCacheRow,
  clipPathForProvider,
  isStaleGenerating,
  MAX_VOICE_RETRY_ATTEMPTS,
  type ElevenLabsSettingsRow,
  type PreloadedVoiceWorkContext,
  type SentenceVoiceStatus,
  type VoiceGenerationOutcome,
} from "@/lib/voice/story-voice-generation";
import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

/**
 * The Book Learning Engine's counterpart to story-voice-generation.ts's
 * generateStoryVoiceDraft — the same expressive Voice Director + provider
 * pipeline (see that file's doc comments for the shared reasoning:
 * concurrency-safe claiming, content-addressed caching, provider-agnostic
 * synthesis), applied to a book's sentences instead of a lesson's.
 * Deliberately simpler in one respect: books have no Conversation-style
 * per-speaker voice mapping, so there is exactly one target voice for a
 * whole book — either books.voice_id (a per-book override, mirroring
 * lessons.voice_id exactly, see 20250218000000_book_voice_override.sql) or,
 * when that's unset, the same elevenlabs_settings.default_story_voice_id
 * every Story falls back to too (see the admin settings form's "Default
 * narration voice (Stories & Books)" field).
 *
 * Reuses claimCacheRow/buildProviderSynthesisInput/baseVoiceSettings from
 * story-voice-generation.ts rather than duplicating them — those functions
 * are already fully content-type-agnostic (they operate on a cache
 * key/direction/provider name, never a lesson id), so sharing them is what
 * keeps both content types' generated audio in lockstep with whatever
 * provider is configured, instead of two copies that could silently drift.
 */

interface BookSentenceRow {
  id: string;
  en: string;
  order_index: number;
  section_id: string;
}

function contextHash(prevEn: string | null, en: string, nextEn: string | null): string {
  const parts = [prevEn ?? "", en, nextEn ?? ""].map(normalizeTextForVoice);
  return hashText(parts.join("|"));
}

/** Mirrors story-voice-generation.ts's generationVersionFor exactly (see its own doc comment on why provider identity is deliberately NOT folded in). */
function generationVersionFor(
  model: string,
  prevEn: string | null,
  en: string,
  nextEn: string | null,
): string {
  return `${model}:v1:${contextHash(prevEn, en, nextEn)}`;
}

interface KeyedBookSentence {
  sentence: BookSentenceRow;
  key: { normalizedText: string; textHash: string; voiceId: string; generationVersion: string };
}

interface ExistingCacheRow {
  id: string;
  status: "generating" | "ready" | "failed";
  attempts: number;
  audio_url: string | null;
  updated_at: string;
}

interface LoadedBook {
  sentences: BookSentenceRow[];
  keyedSentences: KeyedBookSentence[];
  voiceId: string | null;
  providerVoiceId: string | null;
  unresolvedReason: string | null;
  existingByKey: Map<string, ExistingCacheRow>;
  settingsRow: ElevenLabsSettingsRow;
}

async function loadBookForVoiceWork(
  supabase: DbClient,
  bookId: string,
  providerName: string,
  preloaded?: PreloadedVoiceWorkContext,
): Promise<{ ok: false; error: string } | { ok: true; loaded: LoadedBook }> {
  let settingsRow: ElevenLabsSettingsRow;
  if (preloaded) {
    settingsRow = preloaded.settingsRow;
  } else {
    const { data, error: settingsError } = await supabase
      .from("elevenlabs_settings")
      .select(
        "model, default_story_voice_id, stability, similarity_boost, style, speed, use_speaker_boost",
      )
      .eq("id", 1)
      .maybeSingle();
    if (settingsError || !data) return { ok: false, error: "Couldn't load narration settings." };
    settingsRow = data;
  }

  const { data: bookRow, error: bookError } = await supabase
    .from("books")
    .select("voice_id")
    .eq("id", bookId)
    .maybeSingle();
  if (bookError) return { ok: false, error: "Couldn't load the book." };

  const { data: sections, error: sectionsError } = await supabase
    .from("book_sections")
    .select("id")
    .eq("book_id", bookId)
    .order("order_index");
  if (sectionsError) return { ok: false, error: "Couldn't load the book's sections." };
  const sectionIds = (sections ?? []).map((s) => s.id);

  // One batched query across every section instead of one sequential query
  // per section — a book with N sections used to cost N round trips here
  // alone. Grouped and re-sorted in JS (by sectionIds' own order, then each
  // section's order_index) rather than relying on the query's own .order()
  // across sections, since order_index is only meaningful *within* a
  // section and a single cross-section .order("order_index") would
  // interleave sections whose local indexes happen to overlap.
  const { data: sentenceRows, error: sentencesError } = sectionIds.length
    ? await supabase
        .from("book_sentences")
        .select("id, en, order_index, section_id")
        .in("section_id", sectionIds)
    : { data: [] as BookSentenceRow[], error: null };
  if (sentencesError) return { ok: false, error: "Couldn't load the book's sentences." };
  const sentencesBySection = new Map<string, BookSentenceRow[]>();
  for (const row of sentenceRows ?? []) {
    const list = sentencesBySection.get(row.section_id) ?? [];
    list.push(row);
    sentencesBySection.set(row.section_id, list);
  }
  const sentences: BookSentenceRow[] = sectionIds.flatMap(
    (id) => sentencesBySection.get(id)?.sort((a, b) => a.order_index - b.order_index) ?? [],
  );

  if (sentences.length === 0) {
    return {
      ok: true,
      loaded: {
        sentences,
        keyedSentences: [],
        voiceId: null,
        providerVoiceId: null,
        unresolvedReason: null,
        existingByKey: new Map(),
        settingsRow,
      },
    };
  }

  let voiceId: string | null = null;
  let providerVoiceId: string | null = null;
  let unresolvedReason: string | null = null;

  // books.voice_id (an explicit per-book override, e.g. picked from the
  // "Story audio status" dashboard) always wins when it's actually a voice
  // for the active provider — exactly mirroring how a Story's lesson.voice_id
  // is checked in story-voice-generation.ts's resolveTargetVoices. A
  // mismatched-provider override (left over from switching providers) is
  // silently ignored rather than treated as an error, falling through to the
  // global default below, same as Stories.
  let candidateVoiceId = settingsRow.default_story_voice_id;
  if (bookRow?.voice_id) {
    const overrideVoice = preloaded
      ? (preloaded.voicesById.get(bookRow.voice_id) ?? null)
      : (
          await supabase
            .from("voices")
            .select("id, source, provider_voice_id")
            .eq("id", bookRow.voice_id)
            .maybeSingle()
        ).data;
    if (overrideVoice?.source === providerName) candidateVoiceId = overrideVoice.id;
  }

  if (!candidateVoiceId) {
    unresolvedReason = `No ${providerName} voice configured — set a default narration voice in Admin > Voice.`;
  } else {
    const voiceRow = preloaded
      ? (preloaded.voicesById.get(candidateVoiceId) ?? null)
      : (
          await supabase
            .from("voices")
            .select("id, provider_voice_id, source")
            .eq("id", candidateVoiceId)
            .maybeSingle()
        ).data;
    if (!voiceRow || voiceRow.source !== providerName) {
      unresolvedReason = `The configured narration voice is missing or isn't a ${providerName} voice.`;
    } else {
      voiceId = voiceRow.id;
      providerVoiceId = voiceRow.provider_voice_id;
    }
  }

  if (unresolvedReason || !voiceId || !providerVoiceId) {
    return {
      ok: true,
      loaded: {
        sentences,
        keyedSentences: [],
        voiceId: null,
        providerVoiceId: null,
        unresolvedReason,
        existingByKey: new Map(),
        settingsRow,
      },
    };
  }

  const neighborEn = (index: number): { prev: string | null; next: string | null } => ({
    prev: index > 0 ? sentences[index - 1]!.en : null,
    next: index < sentences.length - 1 ? sentences[index + 1]!.en : null,
  });

  const keyedSentences: KeyedBookSentence[] = sentences.map((s, index) => {
    const { prev, next } = neighborEn(index);
    const generationVersion = generationVersionFor(settingsRow.model, prev, s.en, next);
    return { sentence: s, key: cacheKeyParts(s.en, voiceId!, generationVersion) };
  });

  const textHashes = [...new Set(keyedSentences.map((k) => k.key.textHash))];
  const { data: existingRowsRaw } = await supabase
    .from("voice_audio_cache")
    .select("id, text_hash, generation_version, status, attempts, audio_url, updated_at")
    .eq("voice_id", voiceId)
    .in("text_hash", textHashes);
  const existingByKey = new Map<string, ExistingCacheRow>(
    (existingRowsRaw ?? []).map((row) => [`${row.text_hash}:${row.generation_version}`, row]),
  );

  return {
    ok: true,
    loaded: {
      sentences,
      keyedSentences,
      voiceId,
      providerVoiceId,
      unresolvedReason: null,
      existingByKey,
      settingsRow,
    },
  };
}

/**
 * Read-only per-sentence status for a book — the book-voice-generation.ts
 * counterpart to getLessonVoiceStatus, sharing the exact same
 * SentenceVoiceStatus shape so the admin dashboard can render Stories and
 * Books rows identically. Never claims or generates anything, just reports
 * what generateBookVoiceDraft would see if run right now.
 */
export async function getBookVoiceStatus(
  supabase: DbClient,
  bookId: string,
  preloaded?: PreloadedVoiceWorkContext,
): Promise<{ statuses: SentenceVoiceStatus[]; error?: string }> {
  const result = await loadBookForVoiceWork(
    supabase,
    bookId,
    STORIES_AND_BOOKS_PROVIDER,
    preloaded,
  );
  if (!result.ok) return { statuses: [], error: result.error };
  const { sentences, keyedSentences, unresolvedReason, existingByKey } = result.loaded;

  if (unresolvedReason) {
    return {
      statuses: sentences.map((s) => ({
        sentenceId: s.id,
        status: "unresolved",
        audioUrl: null,
        error: unresolvedReason,
        attempts: 0,
      })),
    };
  }

  const keyedBySentenceId = new Map(keyedSentences.map((k) => [k.sentence.id, k]));
  const statuses: SentenceVoiceStatus[] = sentences.map((s) => {
    const item = keyedBySentenceId.get(s.id);
    if (!item) {
      return {
        sentenceId: s.id,
        status: "unresolved",
        audioUrl: null,
        error: "Couldn't resolve a voice.",
        attempts: 0,
      };
    }
    const existing = existingByKey.get(`${item.key.textHash}:${item.key.generationVersion}`);
    if (!existing) {
      return { sentenceId: s.id, status: "pending", audioUrl: null, error: null, attempts: 0 };
    }
    return {
      sentenceId: s.id,
      status: existing.status,
      audioUrl: existing.audio_url,
      error:
        existing.status === "failed" ? "Generation failed — see server logs for details." : null,
      attempts: existing.attempts,
    };
  });

  return { statuses };
}

/**
 * The per-book generation attempt — same outcome shape and same
 * best-effort/idempotent contract as generateStoryVoiceDraft. Regenerates
 * every eligible sentence across the whole book in one call (books are
 * shorter than a full novel — a handful of sections — so this doesn't need
 * story-voice-generation's per-lesson scoping); a cache hit on every
 * sentence makes a repeat call essentially free, exactly like the Stories
 * pipeline's own re-attempt behavior.
 */
export async function generateBookVoiceDraft(
  supabase: DbClient,
  bookId: string,
  forceSentenceIds?: ReadonlySet<string>,
): Promise<VoiceGenerationOutcome> {
  let provider;
  try {
    provider = createProviderForSource(STORIES_AND_BOOKS_PROVIDER);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { generated: 0, skipped: 0, failed: 0, error: message };
  }
  const result = await loadBookForVoiceWork(supabase, bookId, STORIES_AND_BOOKS_PROVIDER);
  if (!result.ok) return { generated: 0, skipped: 0, failed: 0, error: result.error };
  const {
    sentences,
    keyedSentences,
    voiceId,
    providerVoiceId,
    unresolvedReason,
    existingByKey,
    settingsRow,
  } = result.loaded;
  if (sentences.length === 0) return { generated: 0, skipped: 0, failed: 0 };
  if (unresolvedReason || !voiceId || !providerVoiceId) {
    return {
      generated: 0,
      skipped: 0,
      failed: sentences.length,
      error: unresolvedReason ?? undefined,
    };
  }

  let skipped = 0;
  const eligible: typeof keyedSentences = [];
  for (const item of keyedSentences) {
    const k = `${item.key.textHash}:${item.key.generationVersion}`;
    const existing = existingByKey.get(k);
    const forced = forceSentenceIds?.has(item.sentence.id) ?? false;
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

  if (eligible.length === 0) return { generated: 0, skipped, failed: 0 };

  const director = getVoiceDirector();
  if (!director) {
    return {
      generated: 0,
      skipped,
      failed: eligible.length,
      error: "No Voice Director configured (ANTHROPIC_API_KEY is not set).",
    };
  }
  let rawDirection: unknown;
  try {
    rawDirection = await director.directStory(sentences.map((s) => ({ id: s.id, en: s.en })));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      generated: 0,
      skipped,
      failed: eligible.length,
      error: `Voice direction failed: ${message}`,
    };
  }

  const validation = validateVoiceDirectionOutput(rawDirection, {
    sentenceIds: sentences.map((s) => s.id),
    textById: new Map(sentences.map((s) => [s.id, s.en])),
  });
  if (!validation.valid) {
    return {
      generated: 0,
      skipped,
      failed: eligible.length,
      error: `Malformed voice direction: ${validation.errors.join(" ")}`,
    };
  }
  const directionBySentenceId = new Map<string, SentenceDirection>(
    validation.value.map((d) => [d.sentenceId, d]),
  );

  // claimCacheRow expects its existingByKey map keyed the same way it keys
  // rows internally (`${voiceId}:${textHash}:${generationVersion}`) — see
  // its own doc comment in story-voice-generation.ts. This book's
  // existingByKey is keyed without the (constant, single-voice) voiceId
  // prefix purely to keep loadBookForVoiceWork's query/map simpler; this
  // re-adds that prefix once, up front, rather than rebuilding it on every
  // claim attempt below.
  const claimLookup = new Map(
    [...existingByKey].map(([k, v]) => [
      `${voiceId}:${k}`,
      { id: v.id, attempts: v.attempts, status: v.status },
    ]),
  );

  let generated = 0;
  let failed = 0;
  const notes: string[] = [];

  for (const item of eligible) {
    const direction = directionBySentenceId.get(item.sentence.id);
    if (!direction) {
      failed += 1;
      notes.push(`No direction returned for sentence ${item.sentence.id}.`);
      continue;
    }

    const claimed = await claimCacheRow(
      supabase,
      item.key,
      settingsRow.model,
      direction,
      claimLookup,
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
        item.sentence.en,
        providerVoiceId,
        baseVoiceSettings(settingsRow),
      );
      const { audio, durationMs } = await provider.synthesize({
        text,
        voiceId: providerVoiceId,
        model: settingsRow.model,
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
      notes.push(`Sentence ${item.sentence.id}: ${message}`);
    }
  }

  return { generated, skipped, failed, error: notes.length > 0 ? notes.join(" ") : undefined };
}
