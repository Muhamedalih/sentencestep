/**
 * Records the prepared sentences of the 150 rules (the sentences a rule is taught and asked with when the
 * learner's own texts do not show it, src/lib/daily-rule/prepared.ts), so their questions have sound: half of a
 * rule's sentences are read by the Stories narrator (ElevenLabs, "The Pharaoh 4 - Narration & Audio books") and half
 * by Emma (Edge-TTS, free), exactly as src/lib/daily-rule/prepared-voice.ts decides (the 1st, 3rd and 5th sentence by
 * the first, the 2nd, 4th and 6th by Emma). The clips go to the same public voice-audio bucket and the same
 * voice_audio_cache every other narration uses, keyed by (voice, text), which is where load.ts looks for them.
 *
 * It only ever ADDS: a (voice, text) pair that already has a ready clip (under any generation version) is left alone,
 * nothing is regenerated, deleted or overwritten, and it never touches a lesson's, book's or passage's audio. The
 * ElevenLabs voice uses the model and the sliders an admin tuned in Admin -> Voice (elevenlabs_settings, which it
 * only reads, like the Passages narration does); a sentence is sent as written, with no direction tags. Emma reads
 * at her normal pace (measured on the first clips, it is close to the ElevenLabs voice's pace). It is resumable: run it again and it
 * does only the sentences that have no clip yet.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/generate-rule-sentence-audio.ts --dry-run
 *   npx tsx --env-file=.env.local scripts/generate-rule-sentence-audio.ts --limit=5 --key-file=<file with the ElevenLabs key>
 * Options:
 *   --narrator=<premium|free|both>  which voice to record (default both)
 *   --only=<rule id>                just that rule (for example a1-05)
 *   --limit=<n>                     at most n new clips per voice (a quick listen-test); the links are printed
 *   --dry-run                       list what would be recorded and what the ElevenLabs part costs, record nothing
 *   --concurrency=<n>               parallel ElevenLabs requests (default 3); Emma goes one at a time
 * The ElevenLabs key is read from ELEVENLABS_API_KEY, or from the file given with --key-file (never printed).
 * An answer of 401 from ElevenLabs stops the ElevenLabs part (it also means "no credits left"); run it again once
 * the credits are back.
 */
import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

import { ALL_RULES } from "../src/lib/daily-rule/levels";
import { preparedItems } from "../src/lib/daily-rule/prepared";
import {
  preparedNarratorAt,
  preparedVoiceIdOf,
  type PreparedNarrator,
} from "../src/lib/daily-rule/prepared-voice";
import type { SentenceDirection } from "../src/lib/voice/director-types";
import type { TTSProvider, TTSVoiceSettings } from "../src/lib/voice/provider";
import { createProviderForSource } from "../src/lib/voice/provider-registry";
import { createElevenLabsProvider } from "../src/lib/voice/providers/elevenlabs";
import { cacheKeyParts } from "../src/lib/voice/resolution";
import { uploadVoiceClip } from "../src/lib/voice/storage";
import {
  buildProviderSynthesisInput,
  claimCacheRow,
  clipPathForProvider,
  isStaleGenerating,
  MAX_VOICE_RETRY_ATTEMPTS,
} from "../src/lib/voice/story-voice-generation";
import type { Database } from "../src/types/database";

const args = process.argv.slice(2);
const flag = (name: string): boolean => args.includes(`--${name}`);
const option = (name: string): string | undefined =>
  args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);

const dryRun = flag("dry-run");
const only = option("only");
const which = option("narrator") ?? "both";
const limit = option("limit") ? Number(option("limit")) : Number.POSITIVE_INFINITY;
const premiumConcurrency = option("concurrency") ? Number(option("concurrency")) : 3;
if (!["premium", "free", "both"].includes(which) || !(limit > 0) || !(premiumConcurrency >= 1)) {
  console.error("Bad options: --narrator=<premium|free|both> --limit=<n> --concurrency=<n>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (use --env-file=.env.local).",
  );
  process.exit(1);
}
const supabase = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** The sentence is sent exactly as written: no tag, no pause. */
const PLAIN: Omit<SentenceDirection, "sentenceId"> = {
  emotion: "neutral",
  energy: "medium",
  pace: "normal",
  emphasisWord: null,
  pauseBefore: "none",
};
const EMMA_SETTINGS: TTSVoiceSettings = {
  stability: 0.5,
  similarityBoost: 0.75,
  style: 0,
  speed: 1,
  useSpeakerBoost: true,
};

/** The generation version of Emma's clips (v1 was recorded 15% slower, as a test of the first ten clips). */
const EMMA_VERSION = "rule-sentence:edge-tts:v2";

interface Job {
  narrator: PreparedNarrator;
  voiceId: string;
  ruleId: string;
  index: number;
  text: string;
  textHash: string;
}

interface Recorder {
  narrator: PreparedNarrator;
  voiceId: string;
  providerVoiceId: string;
  provider: TTSProvider;
  model: string;
  generationVersion: string;
  direction: Omit<SentenceDirection, "sentenceId">;
  settings: TTSVoiceSettings;
  concurrency: number;
}

interface ExistingRow {
  id: string;
  text_hash: string;
  status: "generating" | "ready" | "failed";
  attempts: number;
  updated_at: string;
  generation_version: string;
  audio_url: string | null;
}

async function main(): Promise<void> {
  // ---- the two voices and the ElevenLabs sliders
  const voiceIds = [preparedVoiceIdOf("premium"), preparedVoiceIdOf("free")];
  const { data: voiceRows, error: voiceError } = await supabase
    .from("voices")
    .select("id, provider_voice_id, source")
    .in("id", voiceIds);
  if (voiceError) throw voiceError;
  const voiceOf = (id: string) => (voiceRows ?? []).find((row) => row.id === id);
  const premiumVoice = voiceOf(voiceIds[0]!);
  const freeVoice = voiceOf(voiceIds[1]!);
  if (!premiumVoice || premiumVoice.source !== "elevenlabs")
    throw new Error(`The ElevenLabs voice ${voiceIds[0]} is not registered.`);
  if (!freeVoice || freeVoice.source !== "edge-tts")
    throw new Error(`The Edge-TTS voice ${voiceIds[1]} is not registered.`);

  const { data: settingsRow, error: settingsError } = await supabase
    .from("elevenlabs_settings")
    .select("model, stability, similarity_boost, style, speed, use_speaker_boost")
    .eq("id", 1)
    .single();
  if (settingsError || !settingsRow)
    throw settingsError ?? new Error("No ElevenLabs settings row.");
  const premiumSettings: TTSVoiceSettings = {
    stability: settingsRow.stability,
    similarityBoost: settingsRow.similarity_boost,
    style: settingsRow.style,
    speed: settingsRow.speed,
    useSpeakerBoost: settingsRow.use_speaker_boost,
  };

  // ---- the sentences, each with the voice that reads it
  const jobs = new Map<string, Job>();
  let total = 0;
  for (const rule of ALL_RULES) {
    if (only && rule.id !== only) continue;
    preparedItems(rule).forEach((item, index) => {
      total += 1;
      const narrator = preparedNarratorAt(index);
      if (which !== "both" && which !== narrator) return;
      const voiceId = preparedVoiceIdOf(narrator);
      const { textHash } = cacheKeyParts(item.text, voiceId, "");
      const id = `${voiceId}|${textHash}`;
      if (!jobs.has(id))
        jobs.set(id, { narrator, voiceId, ruleId: rule.id, index, text: item.text, textHash });
    });
  }
  if (jobs.size === 0) {
    console.log("No sentences selected.");
    return;
  }

  // ---- which of them already have a clip
  const existing = new Map<string, ExistingRow[]>();
  for (const voiceId of voiceIds) {
    const hashes = [...jobs.values()].filter((j) => j.voiceId === voiceId).map((j) => j.textHash);
    for (let at = 0; at < hashes.length; at += 80) {
      const { data, error } = await supabase
        .from("voice_audio_cache")
        .select("id, text_hash, status, attempts, updated_at, generation_version, audio_url")
        .eq("voice_id", voiceId)
        .in("text_hash", hashes.slice(at, at + 80));
      if (error) throw error;
      for (const row of (data ?? []) as ExistingRow[]) {
        const key = `${voiceId}|${row.text_hash}`;
        existing.set(key, [...(existing.get(key) ?? []), row]);
      }
    }
  }
  // A clip made by another pipeline counts, and so does one of this script's current version; a clip of an older
  // version of it does not (the new one is looked up first, the newest wins).
  const premiumVersion = `rule-sentence:${settingsRow.model}:v1`;
  const hasClip = (job: Job): boolean =>
    (existing.get(`${job.voiceId}|${job.textHash}`) ?? []).some(
      (row) =>
        row.status === "ready" &&
        row.audio_url &&
        (!row.generation_version.startsWith("rule-sentence:") ||
          row.generation_version === (job.narrator === "premium" ? premiumVersion : EMMA_VERSION)),
    );
  const todo = [...jobs.values()].filter((job) => !hasClip(job));

  const count = (narrator: PreparedNarrator, list: Job[]) =>
    list.filter((job) => job.narrator === narrator);
  const chars = (list: Job[]) => list.reduce((sum, job) => sum + job.text.length, 0);
  const premiumTodo = count("premium", todo);
  const freeTodo = count("free", todo);
  console.log(
    `${total} prepared sentences in ${only ?? "the 150 rules"}; ${jobs.size} (voice, text) pairs selected, ${jobs.size - todo.length} already recorded.`,
  );
  console.log(
    `To record: ${premiumTodo.length} by the ElevenLabs voice (${chars(premiumTodo)} characters, about ${Math.round(chars(premiumTodo) * 0.45)} credits at 0.45 per character, up to ${chars(premiumTodo)} at 1), ${freeTodo.length} by Emma (free).`,
  );
  if (dryRun) {
    console.log("--dry-run: nothing recorded.");
    return;
  }

  // ---- the recorders
  const recorders: Recorder[] = [];
  if (premiumTodo.length > 0) {
    const keyFile = option("key-file");
    const apiKey = (
      keyFile ? readFileSync(keyFile, "utf8") : (process.env.ELEVENLABS_API_KEY ?? "")
    ).trim();
    if (!apiKey) throw new Error("Give the ElevenLabs key with --key-file or ELEVENLABS_API_KEY.");
    recorders.push({
      narrator: "premium",
      voiceId: premiumVoice.id,
      providerVoiceId: premiumVoice.provider_voice_id,
      provider: createElevenLabsProvider(apiKey),
      model: settingsRow.model,
      generationVersion: premiumVersion,
      direction: PLAIN,
      settings: premiumSettings,
      concurrency: premiumConcurrency,
    });
  }
  if (freeTodo.length > 0) {
    recorders.push({
      narrator: "free",
      voiceId: freeVoice.id,
      providerVoiceId: freeVoice.provider_voice_id,
      provider: createProviderForSource("edge-tts"),
      model: "edge-tts",
      generationVersion: EMMA_VERSION,
      direction: PLAIN,
      settings: EMMA_SETTINGS,
      concurrency: 1,
    });
  }

  const links: string[] = [];
  const results = await Promise.all(
    recorders.map((recorder) => record(recorder, count(recorder.narrator, todo), existing, links)),
  );
  console.log("\n=== Summary ===");
  for (const result of results)
    console.log(
      `${result.narrator}: ${result.generated} recorded, ${result.failed} failed${result.stopped ? ` (stopped: ${result.stopped})` : ""}`,
    );
  if (Number.isFinite(limit) && links.length > 0) {
    console.log("\nThe new clips (open them to listen):");
    for (const line of links) console.log(`  ${line}`);
  }
  if (results.some((result) => result.failed > 0 || result.stopped)) process.exitCode = 2;
}

interface Result {
  narrator: PreparedNarrator;
  generated: number;
  failed: number;
  stopped: string | null;
}

/** Records one voice's sentences with its own pool of workers; stops on a refused key and after a run of failures. */
async function record(
  recorder: Recorder,
  list: Job[],
  existing: Map<string, ExistingRow[]>,
  links: string[],
): Promise<Result> {
  const queue = list.slice(0, Number.isFinite(limit) ? limit : list.length);
  const result: Result = { narrator: recorder.narrator, generated: 0, failed: 0, stopped: null };
  let cursor = 0;
  let inARow = 0;

  async function one(job: Job): Promise<void> {
    const key = cacheKeyParts(job.text, recorder.voiceId, recorder.generationVersion);
    const rows = existing.get(`${job.voiceId}|${job.textHash}`) ?? [];
    const mine = rows.find((row) => row.generation_version === recorder.generationVersion);
    if (mine?.status === "generating" && !isStaleGenerating(mine.updated_at)) return;
    if (mine?.status === "failed" && mine.attempts >= MAX_VOICE_RETRY_ATTEMPTS) {
      result.failed += 1;
      return;
    }
    const direction: SentenceDirection = {
      sentenceId: `prep:${job.ruleId}:${job.index}`,
      ...recorder.direction,
    };
    const claimed = await claimCacheRow(
      supabase,
      key,
      recorder.model,
      direction,
      mine
        ? new Map([[`${job.voiceId}:${job.textHash}:${recorder.generationVersion}`, mine]])
        : new Map(),
      recorder.provider.name,
    );
    if (!claimed) return;
    const label = `${job.ruleId} #${job.index} (${job.text.length} characters)`;
    try {
      const { text, voiceSettings } = buildProviderSynthesisInput(
        recorder.provider.name,
        direction,
        job.text,
        recorder.providerVoiceId,
        recorder.settings,
      );
      const { audio, durationMs } = await synthesizeWithRetry(recorder, {
        text,
        voiceId: recorder.providerVoiceId,
        model: recorder.model,
        voiceSettings,
      });
      const audioUrl = await uploadVoiceClip(
        clipPathForProvider(recorder.provider.name, job.voiceId),
        audio,
      );
      const { error } = await supabase
        .from("voice_audio_cache")
        .update({
          status: "ready",
          audio_url: audioUrl,
          duration_ms: durationMs,
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", claimed.id);
      if (error) throw error;
      result.generated += 1;
      inARow = 0;
      links.push(`${label} ${recorder.narrator}: ${audioUrl}`);
      if (result.generated % 20 === 0 || result.generated === queue.length)
        console.log(`[${recorder.narrator}] ${result.generated}/${queue.length} recorded`);
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
      result.failed += 1;
      inARow += 1;
      console.error(`[${recorder.narrator}] ${label}: ${message}`);
      if (message.includes("(401"))
        result.stopped = "ElevenLabs refused the key (401: also what no credits left looks like)";
      else if (inARow >= 8) result.stopped = "8 failures in a row";
    }
  }

  const worker = async (): Promise<void> => {
    while (cursor < queue.length && !result.stopped) {
      const job = queue[cursor++];
      if (job) await one(job);
    }
  };
  await Promise.all(Array.from({ length: recorder.concurrency }, () => worker()));
  return result;
}

/** One synthesis, tried again after a pause when ElevenLabs says it is busy (429) or a server error. */
async function synthesizeWithRetry(
  recorder: Recorder,
  input: Parameters<TTSProvider["synthesize"]>[0],
): Promise<Awaited<ReturnType<TTSProvider["synthesize"]>>> {
  const pauses = [5_000, 15_000, 30_000];
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await recorder.provider.synthesize(input);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const busy = message.includes("(429") || /\((5\d\d)\)/.test(message);
      const pause = pauses[attempt];
      if (!busy || pause === undefined) throw error;
      await new Promise((resolve) => setTimeout(resolve, pause));
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
