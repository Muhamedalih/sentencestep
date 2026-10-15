import type { SupabaseClient } from "@supabase/supabase-js";

import { planNarration } from "@/lib/passages/narration-plan";
import type {
  NarrationJob,
  NarrationPlan,
  NarrationRequest,
  NarrationSentence,
  NarrationVoice,
  VoiceSetup,
} from "@/lib/passages/narration-plan";
import type { TTSProvider } from "@/lib/voice/provider";
import { generatedElevenLabsClipPath, uploadVoiceClip } from "@/lib/voice/storage";
import type { Database } from "@/types/database";

/**
 * Narrating a passage, from the database: the one implementation behind the
 * audio script (scripts/generate-passage-audio.ts) and the admin's Generate
 * button (Admin -> Passages), so they can never disagree about which voice
 * speaks a line or what it is sent. It reads the ElevenLabs model and voice
 * sliders an admin tuned in Admin -> Voice but never writes them, never touches
 * voice_audio_cache, and never touches a lesson's or book's audio: it only adds
 * new files and sets audio_url on passage lines.
 *
 * Server-side only (it uses the service-role Storage client and a TTS key).
 */

type Db = SupabaseClient<Database>;

export interface NarrationSettings {
  model: string;
  stability: number;
  similarityBoost: number;
  style: number;
  speed: number;
  useSpeakerBoost: boolean;
}

export interface PassageNarration {
  passageId: string;
  title: string;
  /** In reading order. */
  sentences: NarrationSentence[];
  setup: VoiceSetup;
  settings: NarrationSettings;
}

function check<T>(label: string, result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(`Couldn't read ${label}: ${result.error.message}`);
  return result.data;
}

/** A passage's lines in reading order (part by part, line by line), with what the narration needs of each. */
export async function loadPassageSentences(
  supabase: Db,
  passageId: string,
): Promise<NarrationSentence[]> {
  const sections =
    check(
      "the parts",
      await supabase
        .from("passage_sections")
        .select("id, order_index")
        .eq("passage_id", passageId)
        .order("order_index"),
    ) ?? [];
  if (sections.length === 0) return [];

  const sectionOrder = new Map(sections.map((section) => [section.id, section.order_index]));
  const rows =
    check(
      "the lines",
      await supabase
        .from("passage_sentences")
        .select("id, section_id, order_index, speaker, en, say, pause, audio_url")
        .in("section_id", [...sectionOrder.keys()]),
    ) ?? [];
  rows.sort(
    (a, b) =>
      (sectionOrder.get(a.section_id) ?? 0) - (sectionOrder.get(b.section_id) ?? 0) ||
      a.order_index - b.order_index,
  );
  return rows.map((row) => ({
    id: row.id,
    sectionId: row.section_id,
    speaker: row.speaker,
    en: row.en,
    say: row.say,
    pause: row.pause,
    audioUrl: row.audio_url,
  }));
}

/** A passage's lines, who speaks each, and the voice setup — or null when there is no such passage. Throws when the database can't be read. */
export async function loadPassageNarration(
  supabase: Db,
  passageId: string,
): Promise<PassageNarration | null> {
  const passage = check(
    "the passage",
    await supabase.from("passages").select("id, title").eq("id", passageId).maybeSingle(),
  );
  if (!passage) return null;

  const [sentences, assignedResult, voicesResult, settingsResult] = await Promise.all([
    loadPassageSentences(supabase, passageId),
    supabase.from("passage_speaker_voices").select("speaker, voice_id").eq("passage_id", passageId),
    supabase
      .from("voices")
      .select("id, name, gender, provider_voice_id, sample_audio_url")
      .eq("source", "elevenlabs"),
    supabase
      .from("elevenlabs_settings")
      .select(
        "model, default_story_voice_id, stability, similarity_boost, style, speed, use_speaker_boost",
      )
      .eq("id", 1)
      .maybeSingle(),
  ]);
  const assigned = check("the voices of the characters", assignedResult) ?? [];
  const voiceRows = check("the voices", voicesResult) ?? [];
  const settings = check("the ElevenLabs settings", settingsResult);
  if (!settings) throw new Error("The ElevenLabs settings are missing (Admin → Voice).");

  return {
    passageId,
    title: passage.title,
    sentences,
    setup: {
      assigned: new Map(assigned.map((row) => [row.speaker, row.voice_id])),
      defaultNarratorVoiceId: settings.default_story_voice_id,
      voices: new Map(
        voiceRows.map((row) => [
          row.id,
          {
            id: row.id,
            name: row.name,
            gender: row.gender,
            providerVoiceId: row.provider_voice_id,
            sampleAudioUrl: row.sample_audio_url,
          } satisfies NarrationVoice,
        ]),
      ),
    },
    settings: {
      model: settings.model,
      stability: settings.stability,
      similarityBoost: settings.similarity_boost,
      style: settings.style,
      speed: settings.speed,
      useSpeakerBoost: settings.use_speaker_boost,
    },
  };
}

/** The plan for a passage as it is set up in the database. */
export function planPassageNarration(
  narration: PassageNarration,
  request: NarrationRequest = {},
): NarrationPlan {
  return planNarration(narration.sentences, narration.setup, narration.settings.model, request);
}

export interface NarrationOutcome {
  done: number;
  /** Lines that failed every attempt. */
  failed: { id: string; error: string }[];
  /** A problem no retry can fix (the key, the payment, the quota): the run stopped there. */
  fatal: string | null;
  /** The lines this run dealt with, narrated or failed — what a run split into rounds leaves out of the next one. */
  handled: string[];
}

/** A payment/permission problem will not fix itself by retrying: the run stops there. */
const FATAL_FAILURE = /401|402|429|payment|quota/i;
const ATTEMPTS = 3;

/** Narrates the jobs — one clip per line, saved to the voice-audio bucket, its URL written onto the line — with a small pool of requests in flight and a few retries per line. Never throws for a failed line: it is reported in the outcome. */
export async function runNarration(args: {
  supabase: Db;
  provider: TTSProvider;
  settings: NarrationSettings;
  jobs: readonly NarrationJob[];
  voiceFor: ReadonlyMap<string, NarrationVoice>;
  concurrency?: number;
  /** Overrides the speed slider for this run only. */
  speed?: number;
  onProgress?: (handled: number, total: number) => void;
}): Promise<NarrationOutcome> {
  const { supabase, provider, settings, jobs, voiceFor } = args;
  const voiceSettings = {
    stability: settings.stability,
    similarityBoost: settings.similarityBoost,
    style: settings.style,
    speed: args.speed ?? settings.speed,
    useSpeakerBoost: settings.useSpeakerBoost,
  };

  const outcome: NarrationOutcome = { done: 0, failed: [], fatal: null, handled: [] };

  async function narrate(job: NarrationJob): Promise<void> {
    const voice = voiceFor.get(job.role);
    if (!voice) {
      outcome.failed.push({ id: job.sentenceId, error: `No voice for ${job.role}.` });
      outcome.handled.push(job.sentenceId);
      return;
    }
    let lastError = "";
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      try {
        const { audio } = await provider.synthesize({
          text: job.text,
          voiceId: voice.providerVoiceId,
          model: settings.model,
          voiceSettings,
        });
        const audioUrl = await uploadVoiceClip(generatedElevenLabsClipPath(voice.id), audio);
        const { error } = await supabase
          .from("passage_sentences")
          .update({ audio_url: audioUrl, updated_at: new Date().toISOString() })
          .eq("id", job.sentenceId);
        if (error) throw new Error(`saving the clip URL failed: ${error.message}`);
        outcome.done += 1;
        outcome.handled.push(job.sentenceId);
        args.onProgress?.(outcome.handled.length, jobs.length);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        if (FATAL_FAILURE.test(lastError)) {
          outcome.fatal = `ElevenLabs refused the request: ${lastError}`;
          return;
        }
        if (attempt < ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      }
    }
    outcome.failed.push({ id: job.sentenceId, error: lastError });
    outcome.handled.push(job.sentenceId);
    args.onProgress?.(outcome.handled.length, jobs.length);
  }

  let next = 0;
  const workers = Math.min(Math.max(args.concurrency ?? 3, 1), 5);
  await Promise.all(
    Array.from({ length: workers }, async () => {
      while (next < jobs.length && !outcome.fatal) {
        const job = jobs[next++]!;
        await narrate(job);
      }
    }),
  );
  return outcome;
}
