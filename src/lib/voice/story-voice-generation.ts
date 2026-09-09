import type { SupabaseClient } from "@supabase/supabase-js";

import { getVoiceDirector } from "@/lib/voice/director-registry";
import { validateVoiceDirectionOutput } from "@/lib/voice/director-validate";
import type { SentenceDirection } from "@/lib/voice/director-types";
import { toElevenLabsInput } from "@/lib/voice/direction-to-tags";
import { toProsodyInput } from "@/lib/voice/direction-to-prosody";
import { getDefaultNormalLessonVoiceId } from "@/lib/admin/voices-queries";
import {
  NORMAL_LESSON_PROVIDER,
  STORIES_AND_BOOKS_PROVIDER,
} from "@/lib/voice/content-provider-map";
import { createProviderForSource } from "@/lib/voice/provider-registry";
import type { TTSProvider, TTSVoiceSettings } from "@/lib/voice/provider";
import { cacheKeyParts, hashText, normalizeTextForVoice } from "@/lib/voice/resolution";
import {
  generatedCartesiaClipPath,
  generatedEdgeTtsClipPath,
  generatedElevenLabsClipPath,
  generatedHumeClipPath,
  uploadVoiceClip,
} from "@/lib/voice/storage";
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

/**
 * Normal lessons (Daily Lessons) always use Hume AI specifically — never
 * elevenlabs_settings.default_story_voice_id. This is a deliberate,
 * permanent split from Stories/Conversation/Books: those keep using
 * ElevenLabs and their own default_story_voice_id exactly as before,
 * completely unaffected by anything here. The actual fallback voice (when a
 * lesson has no `voice_id` override) is
 * tts_settings.default_normal_lesson_voice_id — see
 * getDefaultNormalLessonVoiceId, admin-configurable independently of
 * Stories/Books and of Word Lists. Changing one specific lesson's voice is
 * done the same way as any lesson — its own `voice_id` (see the "Normal
 * Lessons" admin dashboard). See content-provider-map.ts for why this
 * assignment is fixed rather than auto-detected.
 */

/**
 * A 'generating' row older than this is treated as abandoned rather than
 * "another worker already has this" — a serverless invocation that crashed
 * or timed out mid-call otherwise leaves that row permanently unreclaimable
 * (every future sweep skips it forever, since nothing ever moves it out of
 * 'generating'). 10 minutes comfortably exceeds any real TTS provider call
 * plus upload. Shared with book-voice-generation.ts so both content types
 * use the same reclaim window.
 */
export const STALE_GENERATING_MS = 10 * 60 * 1000;

export function isStaleGenerating(updatedAt: string): boolean {
  return Date.now() - new Date(updatedAt).getTime() > STALE_GENERATING_MS;
}

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

/**
 * Provider identity is deliberately NOT folded in here (unlike the old
 * version of this function) — see content-provider-map.ts's doc comment.
 * Each content type has one fixed provider, and a voice's own id already
 * differs across providers (see resolution.ts's cacheKeyParts), so a
 * provider reassignment invalidates only the reassigned content type's own
 * cache rows, never the whole library at once.
 */
function generationVersionFor(
  model: string,
  prevEn: string | null,
  en: string,
  nextEn: string | null,
): string {
  return `${model}:v1:${contextHash(prevEn, en, nextEn)}`;
}

/** The elevenlabs_settings singleton row — kept under this name for historical/schema reasons (see that table's migration), but in practice now the shared model/default-voice settings for whichever narration provider (Azure or ElevenLabs) is actually active; see baseVoiceSettings' doc comment. */
export interface ElevenLabsSettingsRow {
  model: string;
  default_story_voice_id: string | null;
  stability: number;
  similarity_boost: number;
  style: number;
  speed: number;
  use_speaker_boost: boolean;
}

/** Only meaningful for ElevenLabs — Azure's provider ignores voiceSettings entirely (see providers/azure.ts's doc comment), so this is computed unconditionally but ends up inert whenever the active provider is Azure. */
export function baseVoiceSettings(settings: ElevenLabsSettingsRow): TTSVoiceSettings {
  return {
    stability: settings.stability,
    similarityBoost: settings.similarity_boost,
    style: settings.style,
    speed: settings.speed,
    useSpeakerBoost: settings.use_speaker_boost,
  };
}

/**
 * Lets a caller that already needs status for *many* lessons in one request
 * (listVoiceGenerationDashboardRows — the Story audio status dashboard)
 * fetch elevenlabs_settings, the Normal-lesson default pronunciation voice,
 * and every referenced `voices` row exactly once up front, instead of
 * loadLessonForVoiceWork re-querying all three per lesson. Measured root
 * cause of that dashboard timing out (15s+ per load, crashing with the
 * generic error page) once the library grew past ~100 published
 * Stories/Normal lessons: bounded concurrency (VOICE_STATUS_CONCURRENCY)
 * already keeps the *number of lessons in flight* bounded, but every single
 * lesson — even ones running concurrently — was still doing its own
 * `elevenlabs_settings` read (a singleton row, identical every time) and up
 * to two more `voices` reads for its own voice_id, so total query count
 * still scaled linearly with library size. Optional and defaulted to
 * undefined everywhere else (generateStoryVoiceDraft's single-lesson
 * callers: the cron sweep, auto-trigger, and the admin "Generate" actions)
 * so their behavior — and their single lesson's own fresh queries — is
 * completely unchanged.
 */
export interface PreloadedVoiceWorkContext {
  settingsRow: ElevenLabsSettingsRow;
  defaultNormalLessonVoiceId: string;
  voicesById: Map<string, { id: string; source: string; provider_voice_id: string }>;
  /**
   * The dashboard's own initial `lessons`/`books` query already carries
   * every item's `mode`/`voice_id` — without this, loadLessonForVoiceWork/
   * loadBookForVoiceWork re-fetched that exact same single row again per
   * item, on top of the settings/voices reads this context already exists
   * to dedupe. Optional (falls back to loadLessonForVoiceWork's own
   * `lessons` query) so a caller that only has settings/voices preloaded —
   * none exist today, but nothing requires every field — still works.
   */
  lessonsById?: Map<string, { mode: string; voice_id: string | null }>;
  booksById?: Map<string, { voice_id: string | null }>;
}

/**
 * Resolves each sentence's target ElevenLabs voice id, or a human-readable
 * reason it can't be resolved (never a silent default). Batches every
 * `voices` lookup this lesson could possibly need into one query.
 *
 * Stories and Normal lessons: `lesson.voice_id` is reused as the per-lesson
 * override exactly like the existing Kokoro resolveVoiceId() convention —
 * but only when that voice actually belongs to the active provider.
 * `lessons.voice_id` also serves the unrelated Kokoro per-sentence
 * pronunciation path (see voice-audio.ts's resolvePronunciationAudioAction,
 * which already branches on the resolved voice's own `source` and simply
 * does a cache-only read for a non-Kokoro one), so a Kokoro voice sitting in
 * that column must never be mistaken for this lesson's narrator — it's
 * simply ignored here, falling through to the global elevenlabs_settings
 * default instead. A Normal lesson whose voice_id an admin has pointed at a
 * narration-provider voice gets its sentences narrated exactly like a
 * Story; one left on a Kokoro voice (or unset) keeps behaving exactly as
 * before this pipeline supported "normal" at all — voice-audio.ts's
 * on-demand Kokoro path only ever fires for a Kokoro-sourced voice.
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
  defaultVoiceId: string | null,
  providerName: string,
  voicesById?: Map<string, { id: string; source: string; provider_voice_id: string }>,
): Promise<{ resolved: Map<string, ResolvedVoice>; unresolved: Map<string, string> }> {
  const resolved = new Map<string, ResolvedVoice>();
  const unresolved = new Map<string, string>();

  if (lesson.mode === "stories" || lesson.mode === "normal") {
    let voiceId = defaultVoiceId;
    if (lesson.voice_id) {
      const overrideVoice = voicesById
        ? (voicesById.get(lesson.voice_id) ?? null)
        : (
            await supabase
              .from("voices")
              .select("id, source, provider_voice_id")
              .eq("id", lesson.voice_id)
              .maybeSingle()
          ).data;
      if (overrideVoice?.source === providerName) voiceId = overrideVoice.id;
    }
    if (!voiceId) {
      const reason = `No ${providerName} voice configured — set a default narration voice in Admin > Voice.`;
      for (const s of sentences) unresolved.set(s.id, reason);
      return { resolved, unresolved };
    }

    const voiceRow = voicesById
      ? (voicesById.get(voiceId) ?? null)
      : (
          await supabase
            .from("voices")
            .select("id, provider_voice_id, source")
            .eq("id", voiceId)
            .maybeSingle()
        ).data;
    if (!voiceRow || voiceRow.source !== providerName) {
      const reason = `The configured story voice is missing or isn't a ${providerName} voice.`;
      for (const s of sentences) unresolved.set(s.id, reason);
      return { resolved, unresolved };
    }

    for (const s of sentences) {
      resolved.set(s.id, { voiceId: voiceRow.id, providerVoiceId: voiceRow.provider_voice_id });
    }
    return { resolved, unresolved };
  }

  // Conversation: an explicit lesson_speaker_voices mapping always wins
  // when one exists (still assignable in the lesson editor's Speaker
  // Voices section, for an admin who wants precise control over exactly
  // which voice a given character uses). When a speaker has no explicit
  // mapping, fall back to a deterministic voice picked from every
  // registered voice for the active provider, hashed from the speaker's
  // own name — the same speaker name always lands on the same voice, run
  // after run (byte-identical hashing, see hashText), and two different
  // speaker names spread across the pool essentially never collide unless
  // the pool itself is that small. This is what makes Conversation audio
  // usable out of the box across a whole content library (tens or
  // hundreds of lessons) without hand-configuring every speaker in every
  // lesson first — the exact scenario a "no default, no fallback" policy
  // makes impractical at that scale, while an accidental same-voice
  // collision (the risk that policy was originally guarding against) stays
  // rare by construction rather than common.
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
  const [{ data: explicitVoiceRows }, { data: fallbackVoiceRows }] = await Promise.all([
    distinctVoiceIds.length
      ? supabase.from("voices").select("id, provider_voice_id").in("id", distinctVoiceIds)
      : Promise.resolve({ data: [] }),
    supabase.from("voices").select("id, provider_voice_id").eq("source", providerName).order("id"),
  ]);
  const providerVoiceIdByVoiceId = new Map(
    (explicitVoiceRows ?? []).map((v) => [v.id, v.provider_voice_id]),
  );
  const fallbackPool = fallbackVoiceRows ?? [];

  function fallbackVoiceForSpeaker(speaker: string): ResolvedVoice | null {
    if (fallbackPool.length === 0) return null;
    const index = parseInt(hashText(speaker).slice(0, 8), 16) % fallbackPool.length;
    const row = fallbackPool[index]!;
    return { voiceId: row.id, providerVoiceId: row.provider_voice_id };
  }

  for (const s of sentences) {
    if (!s.speaker) {
      unresolved.set(s.id, "This sentence has no speaker set.");
      continue;
    }
    const explicitVoiceId = voiceIdBySpeaker.get(s.speaker);
    const explicitProviderVoiceId = explicitVoiceId
      ? providerVoiceIdByVoiceId.get(explicitVoiceId)
      : undefined;
    if (explicitVoiceId && explicitProviderVoiceId) {
      resolved.set(s.id, { voiceId: explicitVoiceId, providerVoiceId: explicitProviderVoiceId });
      continue;
    }

    const fallback = fallbackVoiceForSpeaker(s.speaker);
    if (!fallback) {
      const reason = explicitVoiceId
        ? `Speaker "${s.speaker}"'s assigned voice no longer exists, and no ${providerName} voices are registered to auto-assign a replacement — add one in Admin > Voice.`
        : `No ${providerName} voices are registered to auto-assign a voice for speaker "${s.speaker}" — add one in Admin > Voice, or assign one explicitly in the lesson editor's Speaker Voices section.`;
      unresolved.set(s.id, reason);
      continue;
    }
    resolved.set(s.id, fallback);
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
  updated_at: string;
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
  preloaded?: PreloadedVoiceWorkContext,
): Promise<
  | { ok: false; error: string }
  | {
      ok: true;
      mode: string;
      provider: TTSProvider;
      sentences: SentenceRow[];
      keyedSentences: KeyedSentence[];
      unresolved: Map<string, string>;
      existingByKey: Map<string, ExistingCacheRow>;
      settingsRow: ElevenLabsSettingsRow;
    }
> {
  const preloadedLesson = preloaded?.lessonsById?.get(lessonId);
  let lesson: { id: string; mode: string; voice_id: string | null } | null;
  if (preloadedLesson) {
    lesson = { id: lessonId, mode: preloadedLesson.mode, voice_id: preloadedLesson.voice_id };
  } else {
    const { data, error: lessonError } = await supabase
      .from("lessons")
      .select("id, mode, voice_id")
      .eq("id", lessonId)
      .maybeSingle();
    if (lessonError) return { ok: false, error: "Couldn't load the lesson." };
    lesson = data;
  }
  if (!lesson) return { ok: false, error: "Lesson not found." };
  if (lesson.mode !== "stories" && lesson.mode !== "conversation" && lesson.mode !== "normal") {
    return {
      ok: false,
      error: `"${lesson.mode}" lessons don't use the narration voice pipeline.`,
    };
  }

  // Normal lessons always use Hume AI — Stories/Conversation always use
  // ElevenLabs. Both are fixed assignments (see content-provider-map.ts),
  // never auto-detected. createProviderForSource throws when its API key
  // is missing (fail loudly rather than silently substitute a different
  // provider) — caught here and surfaced as a normal "couldn't load" error
  // like every other failure mode in this function.
  const providerName =
    lesson.mode === "normal" ? NORMAL_LESSON_PROVIDER : STORIES_AND_BOOKS_PROVIDER;
  let provider: TTSProvider;
  try {
    provider = createProviderForSource(providerName);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }

  const { data: sentenceRows, error: sentencesError } = await supabase
    .from("sentences")
    .select("id, en, speaker, order_index")
    .eq("lesson_id", lessonId)
    .order("order_index");
  if (sentencesError) return { ok: false, error: "Couldn't load the lesson's sentences." };
  const sentences = sentenceRows ?? [];

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
    if (settingsError || !data) return { ok: false, error: "Couldn't load ElevenLabs settings." };
    settingsRow = data;
  }

  if (sentences.length === 0) {
    return {
      ok: true,
      mode: lesson.mode,
      provider,
      sentences,
      keyedSentences: [],
      unresolved: new Map(),
      existingByKey: new Map(),
      settingsRow,
    };
  }

  // Normal lessons never fall back to Stories' default_story_voice_id —
  // Stories/Conversation keep using it exactly as before.
  const defaultVoiceId =
    lesson.mode === "normal"
      ? (preloaded?.defaultNormalLessonVoiceId ?? (await getDefaultNormalLessonVoiceId()))
      : settingsRow.default_story_voice_id;
  const { resolved: voiceBySentence, unresolved } = await resolveTargetVoices(
    supabase,
    lesson,
    sentences,
    defaultVoiceId,
    providerName,
    preloaded?.voicesById,
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
        .select(
          "id, voice_id, text_hash, generation_version, status, attempts, audio_url, updated_at",
        )
        .in("voice_id", voiceIds)
        .in("text_hash", textHashes)
    : { data: [] };
  const existingByKey = new Map<string, ExistingCacheRow>(
    (existingRowsRaw ?? []).map((row) => [
      `${row.voice_id}:${row.text_hash}:${row.generation_version}`,
      row as ExistingCacheRow,
    ]),
  );

  return {
    ok: true,
    mode: lesson.mode,
    provider,
    sentences,
    keyedSentences,
    unresolved,
    existingByKey,
    settingsRow,
  };
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
  preloaded?: PreloadedVoiceWorkContext,
): Promise<{ statuses: SentenceVoiceStatus[]; error?: string }> {
  const loaded = await loadLessonForVoiceWork(supabase, lessonId, preloaded);
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
 * The per-lesson generation attempt — same outcome shape as
 * src/lib/translation/generate.ts's GenerationOutcome. Works for any of
 * Stories/Conversation/Normal (see loadLessonForVoiceWork's own mode gate);
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

  const { mode, provider, sentences, keyedSentences, unresolved, existingByKey, settingsRow } =
    loaded;

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

  const unresolvedCount = unresolved.size;
  if (eligible.length === 0) {
    return {
      generated: 0,
      skipped,
      failed: unresolvedCount,
      error: unresolvedCount > 0 ? [...new Set(unresolved.values())].join(" ") : undefined,
    };
  }

  // Normal lessons are plain typing-practice sentences, not expressive
  // narration — there's no "character" or story arc for the Voice Director
  // to interpret, so every sentence just gets a flat, neutral delivery
  // instead of paying for (and waiting on) an LLM call that would have
  // nothing meaningful to decide. This is also what keeps Normal-lesson
  // pronunciation working with no ANTHROPIC_API_KEY configured at all —
  // Stories/Conversation still go through the real Director below.
  let directionBySentenceId: Map<string, SentenceDirection>;
  if (mode === "normal") {
    directionBySentenceId = new Map(
      sentences.map((s) => [
        s.id,
        {
          sentenceId: s.id,
          emotion: "neutral",
          energy: "medium",
          pace: "normal",
          emphasisWord: null,
          pauseBefore: "none",
        },
      ]),
    );
  } else {
    const director = getVoiceDirector();
    if (!director) {
      return {
        generated: 0,
        skipped,
        failed: eligible.length + unresolvedCount,
        error: "No Voice Director configured (ANTHROPIC_API_KEY is not set).",
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
      // A validation failure (not a thrown/transient error) means the
      // Director's structured output was actually rejected for this
      // lesson's specific content — every retry burns a real Anthropic call
      // and, with nothing written to voice_audio_cache on this path (a
      // whole-lesson failure, not a per-sentence one), findLessonIdsNeedingVoiceGeneration
      // has no "attempts" counter to bound it by and re-offers this exact
      // lesson on every future sweep/bulk-generate run forever. Auto-excluding
      // here reuses voice_generation_excluded exactly as it's already
      // designed (an admin opt-out, visible and reversible from the "Story
      // audio status" dashboard's own Exclude checkbox) as a one-strike
      // circuit breaker — confirmed real after a 2026-09-09 incident where
      // this looped indefinitely on the same broken lessons. Deliberately
      // NOT applied to the thrown-error branch above (rate limits, network
      // blips) or the "no ANTHROPIC_API_KEY" branch, both of which are
      // transient/global rather than a signal this lesson's content itself
      // is the problem.
      // Best-effort: this is a secondary safety write, not the actual
      // failure being reported — a network hiccup here (the same class this
      // whole app has already hit repeatedly on Netlify) must never crash
      // the caller in place of a clean error return.
      try {
        await supabase
          .from("lessons")
          .update({ voice_generation_excluded: true })
          .eq("id", lessonId);
      } catch {
        // Ignored — worst case this lesson keeps being offered next sweep.
      }
      return { generated: 0, skipped, failed: eligible.length + unresolvedCount, error: message };
    }
    directionBySentenceId = new Map(validation.value.map((d) => [d.sentenceId, d]));
  }

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
        item.providerVoiceId,
        baseVoiceSettings(settingsRow),
      );
      const { audio, durationMs } = await provider.synthesize({
        text,
        voiceId: item.providerVoiceId,
        model: settingsRow.model,
        voiceSettings,
      });
      const audioUrl = await uploadVoiceClip(
        clipPathForProvider(provider.name, item.voiceId),
        audio,
      );

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
 * Builds the actual synthesize() request text for whichever narration
 * provider is active — the one place that decides "ElevenLabs bracketed
 * tags vs. Edge-TTS prosody-only SSML vs. Cartesia/Hume plain text," shared
 * by story-voice-generation.ts and book-voice-generation.ts so both content
 * types stay in lockstep with whatever provider is configured.
 * `voiceSettings` is only meaningful for ElevenLabs (see baseVoiceSettings'
 * doc comment) — still returned unconditionally since
 * TTSProvider.synthesize's input shape requires it, but Edge-TTS's,
 * Cartesia's, and Hume's synthesize() all ignore it entirely.
 */
export function buildProviderSynthesisInput(
  providerName: string,
  direction: SentenceDirection,
  text: string,
  providerVoiceId: string,
  base: TTSVoiceSettings,
): { text: string; voiceSettings: TTSVoiceSettings } {
  if (providerName === "edge-tts") {
    return { text: toProsodyInput(direction, text, providerVoiceId).ssml, voiceSettings: base };
  }
  if (providerName === "cartesia" || providerName === "hume") {
    // Neither has a verified inline direction syntax (no ElevenLabs-style
    // bracketed tags, no SSML) — sending either would risk the tags being
    // read aloud as literal words. Same "no fake control" honesty as
    // direction-to-prosody.ts: only the pause is simulated, via the same
    // leading-ellipsis technique, since that's plain text every TTS voice
    // reads as a natural pause.
    const pausePrefix =
      direction.pauseBefore === "long"
        ? "... ... "
        : direction.pauseBefore === "short"
          ? "... "
          : "";
    return { text: `${pausePrefix}${text}`, voiceSettings: base };
  }
  const { taggedText, voiceSettings } = toElevenLabsInput(direction, text, base);
  return { text: taggedText, voiceSettings };
}

/** The per-provider Storage path prefix a generated clip is uploaded under — shared by story-voice-generation.ts and book-voice-generation.ts so both content types file clips under the same convention. */
export function clipPathForProvider(providerName: string, voiceId: string): string {
  if (providerName === "edge-tts") return generatedEdgeTtsClipPath(voiceId);
  if (providerName === "cartesia") return generatedCartesiaClipPath(voiceId);
  if (providerName === "hume") return generatedHumeClipPath(voiceId);
  return generatedElevenLabsClipPath(voiceId);
}

/**
 * Claims one cache row for exclusive generation — the concurrency-safety
 * mechanism (see the project plan's D3): a brand-new key is claimed via
 * INSERT (a 23505 unique-violation means a concurrent attempt already
 * exists, so this call loses); an existing 'failed' row (or a 'generating'
 * row stale enough that the caller has already decided, via
 * isStaleGenerating, to treat it as abandoned) is claimed via a conditional
 * UPDATE guarded on the exact status+attempts this attempt observed (0 rows
 * affected means a concurrent attempt already claimed/resolved it first —
 * including the normal case where a legitimately in-progress 'generating'
 * row finished between this call's read and its update). Either way, only
 * the caller that actually claims the row goes on to call the TTS provider —
 * Postgres's read-committed semantics make this race-free without SELECT FOR
 * UPDATE or a raw-SQL RPC. Exported so book-voice-generation.ts shares the
 * exact same claim semantics rather than a second, potentially-drifting copy.
 */
export async function claimCacheRow(
  supabase: DbClient,
  key: { normalizedText: string; textHash: string; voiceId: string; generationVersion: string },
  model: string,
  direction: SentenceDirection,
  existingByKey: Map<
    string,
    { id: string; attempts: number; status: "generating" | "ready" | "failed" }
  >,
  providerName: string,
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
        provider: providerName,
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
    .eq("status", existing.status)
    .eq("attempts", existing.attempts)
    .select("id")
    .maybeSingle();
  if (error || !data) return null; // lost the race — another attempt already claimed/resolved this row
  return { id: data.id };
}
