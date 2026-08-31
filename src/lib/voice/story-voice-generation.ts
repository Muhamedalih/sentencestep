import type { SupabaseClient } from "@supabase/supabase-js";

import { getVoiceDirector } from "@/lib/voice/director-registry";
import { validateVoiceDirectionOutput } from "@/lib/voice/director-validate";
import type { SentenceDirection } from "@/lib/voice/director-types";
import { toElevenLabsInput } from "@/lib/voice/direction-to-tags";
import { getTTSProvider } from "@/lib/voice/provider-registry";
import type { TTSVoiceSettings } from "@/lib/voice/provider";
import { cacheKeyParts, hashText, normalizeTextForVoice } from "@/lib/voice/resolution";
import { generatedElevenLabsClipPath, uploadVoiceClip } from "@/lib/voice/storage";
import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

export interface VoiceGenerationOutcome {
  generated: number;
  skipped: number;
  failed: number;
  /** Human-readable, safe to show an admin — never a raw provider/DB error object. */
  error?: string;
}

/** Mirrors MAX_AUTO_RETRY_ATTEMPTS in translation/candidates.ts. */
export const MAX_VOICE_RETRY_ATTEMPTS = 5;

interface SentenceRow {
  id: string;
  en: string;
  speaker: string | null;
  order_index: number;
}

/**
 * The context a sentence's delivery is folded into: its own text plus its
 * immediate neighbors' text, hashed together into the cache key's
 * generation_version (see resolution.ts's cacheKeyParts, reused unchanged
 * below — `text` stays the sentence's own raw English, only the *version*
 * string carries context-sensitivity). Editing sentence N changes N's own
 * identity; editing sentence N also changes N-1's and N+1's identity (their
 * "next"/"previous" neighbor text changed) even though their own text
 * didn't — which is exactly the desired re-direction behavior, scoped to
 * ±1 sentence, not the whole story.
 */
function contextHash(prevEn: string | null, en: string, nextEn: string | null): string {
  const parts = [prevEn ?? "", en, nextEn ?? ""].map(normalizeTextForVoice);
  return hashText(parts.join("|"));
}

function generationVersionFor(
  model: string,
  prevEn: string | null,
  en: string,
  nextEn: string | null,
): string {
  return `elevenlabs:${model}:v1:${contextHash(prevEn, en, nextEn)}`;
}

interface ElevenLabsSettingsRow {
  model: string;
  default_story_voice_id: string | null;
  stability: number;
  similarity_boost: number;
  style: number;
  speed: number;
  use_speaker_boost: boolean;
}

function baseVoiceSettings(settings: ElevenLabsSettingsRow): TTSVoiceSettings {
  return {
    stability: settings.stability,
    similarityBoost: settings.similarity_boost,
    style: settings.style,
    speed: settings.speed,
    useSpeakerBoost: settings.use_speaker_boost,
  };
}

/**
 * Resolves each sentence's target ElevenLabs voice id, or a human-readable
 * reason it can't be resolved (never a silent default). Batches every
 * `voices` lookup this lesson could possibly need into one query.
 *
 * Stories: `lesson.voice_id` is reused as the per-lesson override exactly
 * like the existing Kokoro resolveVoiceId() convention — but only when that
 * voice is actually ElevenLabs-sourced. `lessons.voice_id` also serves the
 * unrelated Kokoro word-level fallback path (see voice-audio.ts, D4 in the
 * project plan: word-level pronunciation inside Stories/Conversations stays
 * on Kokoro), so a Kokoro voice sitting in that column must never be
 * mistaken for this story's ElevenLabs narrator — it's simply ignored here,
 * falling through to the global elevenlabs_settings default instead.
 *
 * Conversations: each sentence's `speaker` must have an explicit
 * lesson_speaker_voices mapping — no default, no fallback. A conversation
 * with two characters accidentally sharing one voice is a real, silent
 * correctness bug (the one this feature fixes), so an unmapped speaker
 * fails loudly instead.
 */
/** This lesson/speaker's resolved voice — `voiceId` (the app's own `voices.id`) is what the cache is keyed on, `providerVoiceId` is the actual id sent to ElevenLabs (see providers/elevenlabs.ts's synthesize) — the two are different strings and must never be conflated, which is exactly the bug this type exists to make impossible. */
interface ResolvedVoice {
  voiceId: string;
  providerVoiceId: string;
}

async function resolveTargetVoices(
  supabase: DbClient,
  lesson: { id: string; mode: string; voice_id: string | null },
  sentences: SentenceRow[],
  settings: ElevenLabsSettingsRow,
): Promise<{ resolved: Map<string, ResolvedVoice>; unresolved: Map<string, string> }> {
  const resolved = new Map<string, ResolvedVoice>();
  const unresolved = new Map<string, string>();

  if (lesson.mode === "stories") {
    let voiceId = settings.default_story_voice_id;
    if (lesson.voice_id) {
      const { data: overrideVoice } = await supabase
        .from("voices")
        .select("id, source")
        .eq("id", lesson.voice_id)
        .maybeSingle();
      if (overrideVoice?.source === "elevenlabs") voiceId = overrideVoice.id;
    }
    if (!voiceId) {
      const reason = "No ElevenLabs voice configured — set a default story voice in Admin > Voice.";
      for (const s of sentences) unresolved.set(s.id, reason);
      return { resolved, unresolved };
    }

    const { data: voiceRow } = await supabase
      .from("voices")
      .select("id, provider_voice_id, source")
      .eq("id", voiceId)
      .maybeSingle();
    if (!voiceRow || voiceRow.source !== "elevenlabs") {
      const reason = "The configured story voice is missing or is not an ElevenLabs voice.";
      for (const s of sentences) unresolved.set(s.id, reason);
      return { resolved, unresolved };
    }

    for (const s of sentences) {
      resolved.set(s.id, { voiceId: voiceRow.id, providerVoiceId: voiceRow.provider_voice_id });
    }
    return { resolved, unresolved };
  }

  // Conversation: one voice per distinct speaker, no default.
  const { data: speakerVoices, error } = await supabase
    .from("lesson_speaker_voices")
    .select("speaker, voice_id")
    .eq("lesson_id", lesson.id);
  if (error) {
    for (const s of sentences) unresolved.set(s.id, "Couldn't load speaker voice assignments.");
    return { resolved, unresolved };
  }
  const voiceIdBySpeaker = new Map((speakerVoices ?? []).map((row) => [row.speaker, row.voice_id]));

  const distinctVoiceIds = [...new Set(voiceIdBySpeaker.values())];
  const { data: voiceRows } = distinctVoiceIds.length
    ? await supabase.from("voices").select("id, provider_voice_id").in("id", distinctVoiceIds)
    : { data: [] };
  const providerVoiceIdByVoiceId = new Map(
    (voiceRows ?? []).map((v) => [v.id, v.provider_voice_id]),
  );

  for (const s of sentences) {
    if (!s.speaker) {
      unresolved.set(s.id, "This sentence has no speaker set.");
      continue;
    }
    const voiceId = voiceIdBySpeaker.get(s.speaker);
    if (!voiceId) {
      unresolved.set(
        s.id,
        `No voice assigned for speaker "${s.speaker}" — set one in the lesson editor's Speaker Voices section.`,
      );
      continue;
    }
    const providerVoiceId = providerVoiceIdByVoiceId.get(voiceId);
    if (!providerVoiceId) {
      unresolved.set(
        s.id,
        `Speaker "${s.speaker}"'s assigned voice ("${voiceId}") no longer exists.`,
      );
      continue;
    }
    resolved.set(s.id, { voiceId, providerVoiceId });
  }
  return { resolved, unresolved };
}

interface KeyedSentence {
  sentence: SentenceRow;
  voiceId: string;
  providerVoiceId: string;
  key: { normalizedText: string; textHash: string; voiceId: string; generationVersion: string };
}

interface ExistingCacheRow {
  id: string;
  voice_id: string;
  text_hash: string;
  generation_version: string;
  status: "generating" | "ready" | "failed";
  attempts: number;
  audio_url: string | null;
}

/**
 * Loads a lesson's sentences, resolves each one's target voice, and
 * computes its cache key — the shared first half of both
 * generateStoryVoiceDraft (which goes on to claim/generate) and
 * getLessonVoiceStatus (which only reads). Exported so the admin dashboard
 * queries (src/lib/admin/voice-generation-queries.ts) can never drift from
 * what the real generator actually keys sentences by.
 */
async function loadLessonForVoiceWork(
  supabase: DbClient,
  lessonId: string,
): Promise<
  | { ok: false; error: string }
  | {
      ok: true;
      sentences: SentenceRow[];
      keyedSentences: KeyedSentence[];
      unresolved: Map<string, string>;
      existingByKey: Map<string, ExistingCacheRow>;
      settingsRow: ElevenLabsSettingsRow;
    }
> {
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id, mode, voice_id")
    .eq("id", lessonId)
    .maybeSingle();
  if (lessonError) return { ok: false, error: "Couldn't load the lesson." };
  if (!lesson) return { ok: false, error: "Lesson not found." };
  if (lesson.mode !== "stories" && lesson.mode !== "conversation") {
    return {
      ok: false,
      error: `"${lesson.mode}" lessons don't use the ElevenLabs voice pipeline — only Stories/Conversation do.`,
    };
  }

  const { data: sentenceRows, error: sentencesError } = await supabase
    .from("sentences")
    .select("id, en, speaker, order_index")
    .eq("lesson_id", lessonId)
    .order("order_index");
  if (sentencesError) return { ok: false, error: "Couldn't load the lesson's sentences." };
  const sentences = sentenceRows ?? [];

  const { data: settingsRow, error: settingsError } = await supabase
    .from("elevenlabs_settings")
    .select(
      "model, default_story_voice_id, stability, similarity_boost, style, speed, use_speaker_boost",
    )
    .eq("id", 1)
    .maybeSingle();
  if (settingsError || !settingsRow)
    return { ok: false, error: "Couldn't load ElevenLabs settings." };

  if (sentences.length === 0) {
    return {
      ok: true,
      sentences,
      keyedSentences: [],
      unresolved: new Map(),
      existingByKey: new Map(),
      settingsRow,
    };
  }

  const { resolved: voiceBySentence, unresolved } = await resolveTargetVoices(
    supabase,
    lesson,
    sentences,
    settingsRow,
  );

  const neighborEn = (index: number): { prev: string | null; next: string | null } => ({
    prev: index > 0 ? sentences[index - 1]!.en : null,
    next: index < sentences.length - 1 ? sentences[index + 1]!.en : null,
  });

  const keyedSentences: KeyedSentence[] = sentences
    .filter((s) => voiceBySentence.has(s.id))
    .map((s) => {
      const index = sentences.indexOf(s);
      const { prev, next } = neighborEn(index);
      const { voiceId, providerVoiceId } = voiceBySentence.get(s.id)!;
      const generationVersion = generationVersionFor(settingsRow.model, prev, s.en, next);
      return {
        sentence: s,
        voiceId,
        providerVoiceId,
        key: cacheKeyParts(s.en, voiceId, generationVersion),
      };
    });

  // Batch-load every existing cache row that could possibly match, by
  // (voice_id, text_hash) — generation_version is filtered precisely in
  // application code below since it varies per sentence's own context.
  const voiceIds = [...new Set(keyedSentences.map((k) => k.voiceId))];
  const textHashes = [...new Set(keyedSentences.map((k) => k.key.textHash))];
  const { data: existingRowsRaw } = voiceIds.length
    ? await supabase
        .from("voice_audio_cache")
        .select("id, voice_id, text_hash, generation_version, status, attempts, audio_url")
        .in("voice_id", voiceIds)
        .in("text_hash", textHashes)
    : { data: [] };
  const existingByKey = new Map<string, ExistingCacheRow>(
    (existingRowsRaw ?? []).map((row) => [
      `${row.voice_id}:${row.text_hash}:${row.generation_version}`,
      row as ExistingCacheRow,
    ]),
  );

  return { ok: true, sentences, keyedSentences, unresolved, existingByKey, settingsRow };
}

export interface SentenceVoiceStatus {
  sentenceId: string;
  status: "pending" | "generating" | "ready" | "failed" | "unresolved";
  audioUrl: string | null;
  error: string | null;
  attempts: number;
}

/**
 * Read-only per-sentence status for the admin dashboard
 * (src/lib/admin/voice-generation-queries.ts) — never claims or generates
 * anything, just reports what generateStoryVoiceDraft would see if run
 * right now. "pending" means no cache row exists yet for that sentence's
 * current identity (see the migration's own doc comment on why "pending"
 * is never a stored status value); "unresolved" means the sentence's
 * target voice couldn't be determined at all (see resolveTargetVoices).
 */
export async function getLessonVoiceStatus(
  supabase: DbClient,
  lessonId: string,
): Promise<{ statuses: SentenceVoiceStatus[]; error?: string }> {
  const loaded = await loadLessonForVoiceWork(supabase, lessonId);
  if (!loaded.ok) return { statuses: [], error: loaded.error };

  const statuses: SentenceVoiceStatus[] = [];
  for (const s of loaded.sentences) {
    const unresolvedReason = loaded.unresolved.get(s.id);
    if (unresolvedReason) {
      statuses.push({
        sentenceId: s.id,
        status: "unresolved",
        audioUrl: null,
        error: unresolvedReason,
        attempts: 0,
      });
      continue;
    }
    const item = loaded.keyedSentences.find((k) => k.sentence.id === s.id);
    if (!item) {
      statuses.push({
        sentenceId: s.id,
        status: "unresolved",
        audioUrl: null,
        error: "Couldn't resolve a voice.",
        attempts: 0,
      });
      continue;
    }
    const k = `${item.key.voiceId}:${item.key.textHash}:${item.key.generationVersion}`;
    const existing = loaded.existingByKey.get(k);
    if (!existing) {
      statuses.push({
        sentenceId: s.id,
        status: "pending",
        audioUrl: null,
        error: null,
        attempts: 0,
      });
    } else {
      statuses.push({
        sentenceId: s.id,
        status: existing.status,
        audioUrl: existing.audio_url,
        error:
          existing.status === "failed" ? "Generation failed — see server logs for details." : null,
        attempts: existing.attempts,
      });
    }
  }
  return { statuses };
}

/**
 * The per-story generation attempt — same outcome shape as
 * src/lib/translation/generate.ts's GenerationOutcome. Never called for
 * `mode === "normal"` (Kokoro's on-demand path handles those unchanged);
 * validates its own inputs rather than trusting the caller (see this
 * repo's own established convention on generateLessonTranslationDraft).
 */
export async function generateStoryVoiceDraft(
  supabase: DbClient,
  lessonId: string,
  forceSentenceIds?: ReadonlySet<string>,
): Promise<VoiceGenerationOutcome> {
  const loaded = await loadLessonForVoiceWork(supabase, lessonId);
  if (!loaded.ok) return { generated: 0, skipped: 0, failed: 0, error: loaded.error };
  if (loaded.sentences.length === 0) return { generated: 0, skipped: 0, failed: 0 };

  const { sentences, keyedSentences, unresolved, existingByKey, settingsRow } = loaded;

  let skipped = 0;
  const eligible: typeof keyedSentences = [];
  for (const item of keyedSentences) {
    const k = `${item.key.voiceId}:${item.key.textHash}:${item.key.generationVersion}`;
    const existing = existingByKey.get(k);
    const forced = forceSentenceIds?.has(item.sentence.id) ?? false;
    if (existing && existing.status === "ready" && !forced) {
      skipped += 1;
      continue;
    }
    if (existing && existing.status === "generating") {
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

  const unresolvedCount = unresolved.size;
  if (eligible.length === 0) {
    return {
      generated: 0,
      skipped,
      failed: unresolvedCount,
      error: unresolvedCount > 0 ? [...new Set(unresolved.values())].join(" ") : undefined,
    };
  }

  const director = getVoiceDirector();
  if (!director) {
    return {
      generated: 0,
      skipped,
      failed: eligible.length + unresolvedCount,
      error: "No Voice Director configured (ANTHROPIC_API_KEY is not set).",
    };
  }
  const provider = getTTSProvider();
  if (!provider) {
    return {
      generated: 0,
      skipped,
      failed: eligible.length + unresolvedCount,
      error: "No TTS provider configured (ELEVENLABS_API_KEY is not set).",
    };
  }

  let rawDirection: unknown;
  try {
    rawDirection = await director.directStory(
      sentences.map((s) => ({ id: s.id, en: s.en, speaker: s.speaker })),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      generated: 0,
      skipped,
      failed: eligible.length + unresolvedCount,
      error: `Voice direction failed: ${message}`,
    };
  }

  const validation = validateVoiceDirectionOutput(rawDirection, {
    sentenceIds: sentences.map((s) => s.id),
    textById: new Map(sentences.map((s) => [s.id, s.en])),
  });
  if (!validation.valid) {
    const message = `Malformed voice direction: ${validation.errors.join(" ")}`;
    return { generated: 0, skipped, failed: eligible.length + unresolvedCount, error: message };
  }
  const directionBySentenceId = new Map<string, SentenceDirection>(
    validation.value.map((d) => [d.sentenceId, d]),
  );

  let generated = 0;
  let failed = unresolvedCount;
  const notes: string[] = unresolvedCount > 0 ? [...new Set(unresolved.values())] : [];

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
      existingByKey,
    );
    if (!claimed) {
      skipped += 1; // lost the claim race to a concurrent attempt
      continue;
    }

    try {
      const { taggedText, voiceSettings } = toElevenLabsInput(
        direction,
        item.sentence.en,
        baseVoiceSettings(settingsRow),
      );
      const { audio, durationMs } = await provider.synthesize({
        text: taggedText,
        voiceId: item.providerVoiceId,
        model: settingsRow.model,
        voiceSettings,
      });
      const audioUrl = await uploadVoiceClip(generatedElevenLabsClipPath(item.voiceId), audio);

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

/**
 * Claims one cache row for exclusive generation — the concurrency-safety
 * mechanism (see the project plan's D3): a brand-new key is claimed via
 * INSERT (a 23505 unique-violation means a concurrent attempt already
 * exists, so this call loses); an existing 'failed' row is claimed via a
 * conditional UPDATE guarded on the exact status+attempts this attempt
 * observed (0 rows affected means a concurrent attempt already claimed it
 * first). Either way, only the caller that actually claims the row goes on
 * to call the TTS provider — Postgres's read-committed semantics make this
 * race-free without SELECT FOR UPDATE or a raw-SQL RPC.
 */
async function claimCacheRow(
  supabase: DbClient,
  key: { normalizedText: string; textHash: string; voiceId: string; generationVersion: string },
  model: string,
  direction: SentenceDirection,
  existingByKey: Map<string, { id: string; attempts: number; status: string }>,
): Promise<{ id: string } | null> {
  const k = `${key.voiceId}:${key.textHash}:${key.generationVersion}`;
  const existing = existingByKey.get(k);

  if (!existing) {
    const { data, error } = await supabase
      .from("voice_audio_cache")
      .insert({
        voice_id: key.voiceId,
        text_hash: key.textHash,
        normalized_text: key.normalizedText,
        generation_version: key.generationVersion,
        status: "generating",
        provider: "elevenlabs",
        model,
        voice_direction: direction,
        attempts: 1,
      })
      .select("id")
      .single();
    if (error || !data) return null; // 23505 (concurrent insert already won) or any other insert failure
    return { id: data.id };
  }

  const { data, error } = await supabase
    .from("voice_audio_cache")
    .update({
      status: "generating",
      attempts: existing.attempts + 1,
      model,
      voice_direction: direction,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id)
    .eq("status", "failed")
    .eq("attempts", existing.attempts)
    .select("id")
    .maybeSingle();
  if (error || !data) return null; // lost the race — another attempt already claimed/resolved this row
  return { id: data.id };
}
