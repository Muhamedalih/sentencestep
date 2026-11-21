/**
 * The core of the local VoiceStudio pipeline, shared by the control panel (panel.ts) and the command
 * line (fill.ts): make a clip with the owner's VoiceStudio app, CHECK it by transcribing it back with the
 * app's own Whisper (retrying with another seed when it does not say the right thing), file it in
 * voice_audio_cache under the voice's row and upload the mp3 to the voice-audio bucket — the same shape the
 * site's own pipelines write, so the lesson player finds it with no change.
 *
 * Additive by construction: a (voice, text, version) that already has a ready clip is never touched
 * unless the caller asks for a redo of exactly that clip; clips of other voices are never read or written.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { cacheKeyParts } from "../../src/lib/voice/resolution";
import { sentenceWordEntries } from "../../src/lib/voice/sentence-word-plan";
import { generatedVoiceStudioClipPath, uploadVoiceClip } from "../../src/lib/voice/storage";
import { claimCacheRow } from "../../src/lib/voice/story-voice-generation";
import { NEUTRAL_DIRECTION } from "../../src/lib/voice/word-list-voice-generation";
import type { Database } from "../../src/types/database";

export const SENTENCE_VERSION = "voice-studio:sentence:v1";
export const WORD_VERSION = "voice-studio:word:v1";
export const API = process.env.VOICESTUDIO_URL ?? "http://127.0.0.1:3900";
const MAX_ATTEMPTS = 4;

export type Db = SupabaseClient<Database>;
export type ClipKind = "sentence" | "word";

export function connect(): Db {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set (run with --env-file=.env.local).",
    );
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ---------------------------------------------------------------------------------------------
// Talking to VoiceStudio
// ---------------------------------------------------------------------------------------------

export async function voiceStudioHealth(): Promise<{ version: string; device: string } | null> {
  try {
    const response = await fetch(`${API}/health`, { signal: AbortSignal.timeout(4000) });
    return response.ok ? ((await response.json()) as { version: string; device: string }) : null;
  } catch {
    return null;
  }
}

export interface AppProfile {
  id: string;
  name: string;
  kind: string;
  language: string;
}

export async function listAppProfiles(): Promise<AppProfile[]> {
  const response = await fetch(`${API}/profiles`, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`VoiceStudio /profiles answered ${response.status}`);
  return (await response.json()) as AppProfile[];
}

async function speak(input: string, profileId: string, seed: number | null): Promise<Buffer> {
  const response = await fetch(`${API}/v1/audio/speech`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "tts-1",
      input,
      voice: profileId,
      response_format: "mp3",
      ...(seed === null ? {} : { seed }),
    }),
    signal: AbortSignal.timeout(300_000),
  });
  if (!response.ok)
    throw new Error(`VoiceStudio ${response.status}: ${(await response.text()).slice(0, 200)}`);
  const audio = Buffer.from(await response.arrayBuffer());
  if (audio.length < 500) throw new Error("VoiceStudio returned an empty clip.");
  return audio;
}

async function transcribe(audio: Buffer): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(audio)], { type: "audio/mpeg" }), "clip.mp3");
  form.append("model", "whisper-1");
  form.append("response_format", "json");
  form.append("language", "en");
  const response = await fetch(`${API}/v1/audio/transcriptions`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(300_000),
  });
  if (!response.ok) throw new Error(`VoiceStudio transcription ${response.status}`);
  return (((await response.json()) as { text?: string }).text ?? "").trim();
}

interface TimedWord {
  word: string;
  start: number;
  end: number;
}

/** What Whisper heard, word by word with times (seconds) — used to find a word inside a longer take. */
async function transcribeWithTimes(audio: Buffer): Promise<{ text: string; words: TimedWord[] }> {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(audio)], { type: "audio/mpeg" }), "clip.mp3");
  form.append("model", "whisper-1");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");
  form.append("language", "en");
  const response = await fetch(`${API}/v1/audio/transcriptions`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(300_000),
  });
  if (!response.ok) throw new Error(`VoiceStudio transcription ${response.status}`);
  const data = (await response.json()) as { text?: string; words?: TimedWord[] };
  return { text: (data.text ?? "").trim(), words: data.words ?? [] };
}

/** Runs ffmpeg with the audio on stdin and returns what it writes to stdout (an mp3), or null on any failure. */
async function ffmpegPipe(audio: Buffer, args: string[]): Promise<Buffer | null> {
  const { spawn } = await import("node:child_process");
  return new Promise<Buffer | null>((resolve) => {
    const child = spawn("ffmpeg", ["-v", "error", "-i", "pipe:0", ...args, "-f", "mp3", "pipe:1"], {
      stdio: ["pipe", "pipe", "ignore"],
    });
    const out: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => out.push(chunk));
    child.on("error", () => resolve(null));
    child.on("close", (code) => resolve(code === 0 && out.length > 0 ? Buffer.concat(out) : null));
    child.stdin.on("error", () => undefined);
    child.stdin.end(audio);
  });
}

/** Loudest sample of a clip in dB (a clip near -50 dB is silence to a listener), or null when it cannot be measured. */
async function peakDb(audio: Buffer): Promise<number | null> {
  const { spawn } = await import("node:child_process");
  return new Promise<number | null>((resolve) => {
    const child = spawn("ffmpeg", ["-i", "pipe:0", "-af", "volumedetect", "-f", "null", "-"], {
      stdio: ["pipe", "ignore", "pipe"],
    });
    let log = "";
    child.stderr.on("data", (chunk: Buffer) => (log += chunk.toString()));
    child.on("error", () => resolve(null));
    child.on("close", () => {
      const match = /max_volume: (-?[\d.]+) dB/.exec(log);
      resolve(match ? Number.parseFloat(match[1]!) : null);
    });
    child.stdin.on("error", () => undefined);
    child.stdin.end(audio);
  });
}

/**
 * The fallback for a word VoiceStudio will not say on its own (the little ones — "to", "of", "I", "my" —
 * come out silent or cut off): say it inside "The word is: <word>.", find the word's own start and end with
 * Whisper's word times, and keep just that piece (a hair of margin each side). The carrier words are checked
 * too, so a take where the sentence itself went wrong is refused.
 */
async function wordFromCarrier(
  word: string,
  profileId: string,
  seed: number,
): Promise<MadeAudio | null> {
  const audio = await speak(`The word is: ${word}.`, profileId, seed);
  const { text, words } = await transcribeWithTimes(audio);
  const heard = tokens(text);
  if (heard.slice(0, 3).join(" ") !== "the word is" || heard[heard.length - 1] !== tokens(word)[0])
    return null;
  const timed = [...words].reverse().find((w) => tokens(w.word)[0] === tokens(word)[0]);
  if (!timed) return null;
  const start = Math.max(0, timed.start - 0.06);
  const end = timed.end + 0.14;
  if (end - start < 0.12) return null;
  const cut = await ffmpegPipe(audio, [
    "-af",
    `atrim=start=${start.toFixed(3)}:end=${end.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st=${Math.max(0, end - start - 0.05).toFixed(3)}:d=0.05`,
    "-ar",
    "24000",
    "-ac",
    "1",
  ]);
  if (!cut) return null;
  const peak = await peakDb(cut);
  if (peak === null || peak < -30) return null;
  return { audio: cut, heard: text, attempts: 1, verified: true };
}

const tokens = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9' ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

/** How much of `reference` was said, in order (longest common subsequence of words / words wanted): 1 = all of it. */
export function spokenShare(reference: string, heard: string): number {
  const a = tokens(reference);
  const b = tokens(heard);
  if (a.length === 0) return 1;
  const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      table[i]![j] =
        a[i - 1] === b[j - 1]
          ? table[i - 1]![j - 1]! + 1
          : Math.max(table[i - 1]![j]!, table[i]![j - 1]!);
    }
  }
  return table[a.length]![b.length]! / a.length;
}

/** A single word counts as right only when the transcript is exactly that word (Whisper adds a capital and a full stop, which tokens() drops). */
function wordIsRight(word: string, heard: string): boolean {
  const spoken = tokens(heard);
  return spoken.length === 1 && spoken[0] === tokens(word)[0];
}

export interface MadeAudio {
  audio: Buffer;
  /** What Whisper heard in the clip that was kept. */
  heard: string;
  attempts: number;
  /** false when no attempt passed the check — the best take is still returned so the caller can decide. */
  verified: boolean;
}

/**
 * One checked clip. Words are spoken with a full stop after them ("ordered."): on its own a bare word is
 * what VoiceStudio garbles, with the stop it is read as a short statement. Up to MAX_ATTEMPTS takes with a
 * different seed each, the first that Whisper hears correctly wins.
 */
export async function makeCheckedAudio(
  kind: ClipKind,
  text: string,
  profileId: string,
): Promise<MadeAudio> {
  const spoken = kind === "word" ? `${text}.` : text;
  let best: MadeAudio | null = null;
  let bestScore = -1;
  // A word gets two direct takes; when neither is heard right (or it is silent) it is cut out of a carrier phrase.
  const directAttempts = kind === "word" ? 2 : MAX_ATTEMPTS;
  for (let attempt = 1; attempt <= directAttempts; attempt++) {
    const audio = await speak(spoken, profileId, attempt === 1 ? null : 1000 + attempt * 37);
    const heard = await transcribe(audio);
    const right =
      kind === "word"
        ? wordIsRight(text, heard) && ((await peakDb(audio)) ?? 0) > -30
        : spokenShare(text, heard) >= 0.9;
    const score =
      kind === "word" ? (right ? 1 : spokenShare(text, heard) * 0.5) : spokenShare(text, heard);
    if (score > bestScore) {
      bestScore = score;
      best = { audio, heard, attempts: attempt, verified: right };
    }
    if (right) return { audio, heard, attempts: attempt, verified: true };
  }
  if (kind === "word") {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const cut = await wordFromCarrier(text, profileId, attempt === 1 ? 7 : 2000 + attempt * 41);
      if (cut) return { ...cut, attempts: directAttempts + attempt };
    }
  }
  return { ...best!, attempts: MAX_ATTEMPTS };
}

async function durationMs(audio: Buffer): Promise<number | null> {
  try {
    const { spawn } = await import("node:child_process");
    return await new Promise<number | null>((resolve) => {
      const child = spawn(
        "ffprobe",
        ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", "-i", "pipe:0"],
        { stdio: ["pipe", "pipe", "ignore"] },
      );
      let out = "";
      child.stdout.on("data", (chunk: Buffer) => (out += chunk.toString()));
      child.on("error", () => resolve(null));
      child.on("close", () => {
        const seconds = Number.parseFloat(out);
        resolve(Number.isFinite(seconds) ? Math.round(seconds * 1000) : null);
      });
      child.stdin.on("error", () => undefined);
      child.stdin.end(audio);
    });
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------------------------
// Voices (rows of the site's `voices` table that point at a VoiceStudio profile)
// ---------------------------------------------------------------------------------------------

export interface SiteVoice {
  id: string;
  name: string;
  provider_voice_id: string;
  gender: "female" | "male";
}

export async function siteVoices(db: Db): Promise<SiteVoice[]> {
  const { data, error } = await db
    .from("voices")
    .select("id, name, provider_voice_id, gender")
    .eq("source", "voice-studio")
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as SiteVoice[];
}

/** Puts a VoiceStudio profile on the site as a voice. The caller says the gender: it is never guessed. */
export async function registerVoice(
  db: Db,
  profile: AppProfile,
  gender: "female" | "male",
  name?: string,
): Promise<SiteVoice> {
  const id = `voicestudio-${profile.id}`;
  const existing = (await siteVoices(db)).find((v) => v.id === id);
  if (existing) return existing;
  const row = {
    id,
    name: name?.trim() || `VoiceStudio — ${profile.name}`,
    source: "voice-studio",
    provider_voice_id: profile.id,
    gender,
    accent: "American",
    language: "en",
    description: `Made offline with the local VoiceStudio app (profile ${profile.id}).`,
    collection: "voice-studio",
  };
  const { error } = await db.from("voices").insert(row);
  if (error) throw error;
  return { id, name: row.name, provider_voice_id: profile.id, gender };
}

// ---------------------------------------------------------------------------------------------
// Lessons -> the clips they need, and which of those a voice already has
// ---------------------------------------------------------------------------------------------

export interface LessonPlan {
  lesson: { id: string; mode: string; title: string; status: string; voice_id: string | null };
  sentences: { id: string; en: string }[];
  words: string[];
}

export async function planLesson(db: Db, lessonId: string): Promise<LessonPlan> {
  const { data: lesson, error } = await db
    .from("lessons")
    .select("id, mode, title, status, voice_id")
    .eq("id", lessonId)
    .maybeSingle();
  if (error) throw error;
  if (!lesson) throw new Error(`No lesson "${lessonId}".`);
  const { data: sentences, error: sError } = await db
    .from("sentences")
    .select("id, en, order_index")
    .eq("lesson_id", lessonId)
    .order("order_index");
  if (sError) throw sError;
  const rows = (sentences ?? []).map((s) => ({ id: s.id, en: s.en }));
  const words = new Set<string>();
  for (const s of rows) for (const entry of sentenceWordEntries(s.id, s.en)) words.add(entry.key);
  return { lesson: lesson as LessonPlan["lesson"], sentences: rows, words: [...words].sort() };
}

export interface ClipState {
  text: string;
  kind: ClipKind;
  status: "ready" | "missing" | "failed";
  url: string | null;
  note?: string | null;
}

/** For one voice: the state of every clip a lesson needs (sentences, then words). */
export async function clipStates(db: Db, plan: LessonPlan, voiceId: string): Promise<ClipState[]> {
  const wanted: { text: string; kind: ClipKind; version: string }[] = [
    ...plan.sentences.map((s) => ({
      text: s.en,
      kind: "sentence" as const,
      version: SENTENCE_VERSION,
    })),
    ...plan.words.map((w) => ({ text: w, kind: "word" as const, version: WORD_VERSION })),
  ];
  const byHash = new Map<
    string,
    { status: string; audio_url: string | null; last_error: string | null; version: string }
  >();
  const hashes = [
    ...new Set(wanted.map((w) => cacheKeyParts(w.text, voiceId, w.version).textHash)),
  ];
  for (let i = 0; i < hashes.length; i += 40) {
    const { data, error } = await db
      .from("voice_audio_cache")
      .select("text_hash, status, audio_url, last_error, generation_version")
      .eq("voice_id", voiceId)
      .in("text_hash", hashes.slice(i, i + 40));
    if (error) throw error;
    for (const row of data ?? [])
      byHash.set(`${row.text_hash}:${row.generation_version}`, {
        status: row.status,
        audio_url: row.audio_url,
        last_error: row.last_error,
        version: row.generation_version,
      });
  }
  return wanted.map((w) => {
    const row = byHash.get(`${cacheKeyParts(w.text, voiceId, w.version).textHash}:${w.version}`);
    if (row?.status === "ready" && row.audio_url)
      return { text: w.text, kind: w.kind, status: "ready", url: row.audio_url };
    if (row?.status === "failed")
      return { text: w.text, kind: w.kind, status: "failed", url: null, note: row.last_error };
    return { text: w.text, kind: w.kind, status: "missing", url: null };
  });
}

// ---------------------------------------------------------------------------------------------
// Making and filing one clip
// ---------------------------------------------------------------------------------------------

export type MakeOutcome = "generated" | "skipped" | "failed";

export interface MakeResult {
  outcome: MakeOutcome;
  verified?: boolean;
  heard?: string;
  attempts?: number;
  error?: string;
}

/** Makes (or, with redo, replaces) one clip. Without redo a ready clip is left exactly as it is. */
export async function makeClip(
  db: Db,
  voice: SiteVoice,
  kind: ClipKind,
  text: string,
  opts: { redo?: boolean } = {},
): Promise<MakeResult> {
  const version = kind === "word" ? WORD_VERSION : SENTENCE_VERSION;
  const key = cacheKeyParts(text, voice.id, version);
  const { data: existing } = await db
    .from("voice_audio_cache")
    .select("id, status")
    .eq("voice_id", voice.id)
    .eq("text_hash", key.textHash)
    .eq("generation_version", version)
    .maybeSingle();
  if (existing?.status === "ready" && !opts.redo) return { outcome: "skipped" };

  let rowId = existing?.id;
  if (!rowId) {
    const claimed = await claimCacheRow(
      db,
      key,
      "voicestudio",
      { ...NEUTRAL_DIRECTION, sentenceId: `voice-studio:${voice.id}` },
      new Map(),
      "voice-studio",
    );
    if (!claimed) return { outcome: "skipped" };
    rowId = claimed.id;
  }
  try {
    const made = await makeCheckedAudio(kind, key.normalizedText, voice.provider_voice_id);
    const url = await uploadVoiceClip(generatedVoiceStudioClipPath(voice.id), made.audio);
    await db
      .from("voice_audio_cache")
      .update({
        status: "ready",
        audio_url: url,
        duration_ms: await durationMs(made.audio),
        last_error: made.verified
          ? null
          : `unverified: Whisper heard "${made.heard.slice(0, 120)}"`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rowId);
    return {
      outcome: "generated",
      verified: made.verified,
      heard: made.heard,
      attempts: made.attempts,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db
      .from("voice_audio_cache")
      .update({
        status: "failed",
        last_error: message.slice(0, 500),
        updated_at: new Date().toISOString(),
      })
      .eq("id", rowId);
    return { outcome: "failed", error: message };
  }
}

/** Lesson-level safety check before a lesson is pointed at a voice: every sentence and every word must already be ready. */
export function coverage(states: ClipState[]): {
  ready: number;
  total: number;
  sentencesReady: number;
  sentencesTotal: number;
  missing: ClipState[];
} {
  const sentences = states.filter((s) => s.kind === "sentence");
  return {
    ready: states.filter((s) => s.status === "ready").length,
    total: states.length,
    sentencesReady: sentences.filter((s) => s.status === "ready").length,
    sentencesTotal: sentences.length,
    missing: states.filter((s) => s.status !== "ready"),
  };
}
