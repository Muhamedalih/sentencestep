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
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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
  /** Set by a DESIGNED voice: its description, e.g. "female, middle-aged". */
  instruct?: string;
}

export async function listAppProfiles(): Promise<AppProfile[]> {
  const response = await fetch(`${API}/profiles`, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`VoiceStudio /profiles answered ${response.status}`);
  return (await response.json()) as AppProfile[];
}

// ---------------------------------------------------------------------------------------------
// Per-voice settings: how fast, how carefully, in what manner. Saved on this PC (never on the site) and
// recorded in each clip's voice_direction, so it is always known how a clip was made.
// ---------------------------------------------------------------------------------------------

export const TONES = [
  "",
  "low pitch",
  "very low pitch",
  "high pitch",
  "very high pitch",
  "whisper",
] as const;

export interface VoiceSettings {
  /** 0.6–1.4: how fast a SENTENCE is spoken. Applied after generation with ffmpeg's time-stretch (pitch unchanged), because VoiceStudio's own speed control barely moves OmniVoice. */
  sentenceSpeed: number;
  /** The same for a single WORD (a slightly slower word is easier to catch). */
  wordSpeed: number;
  /** Diffusion steps: null = the engine's default; more steps = cleaner but much slower (48 is ~3x). */
  steps: number | null;
  /** How strictly the voice follows the text/reference: null = engine default. */
  guidance: number | null;
  /** One of TONES ("" = none). Experimental on cloned voices: it can shift the voice. */
  tone: (typeof TONES)[number];
  /** Semitones, -6..+6: raises/lowers the voice WITHOUT changing speed (ffmpeg rubberband, after generation). 0 = untouched. */
  pitch: number;
  /** Decibels, -9..+9: louder/quieter clip (after generation). 0 = untouched. */
  volumeDb: number;
  /** Evens the loudness so every clip of the voice is about equally loud (EBU R128 loudnorm). */
  evenLevel: boolean;
  /** A light "presence" pass: removes low rumble and tames peaks so the voice is clearer (the site's "speaker boost"). */
  clarity: boolean;
  /** The engine's own noise-cleaning of the take (on by default); off keeps the raw take. */
  denoise: boolean;
}

export const DEFAULT_SETTINGS: VoiceSettings = {
  sentenceSpeed: 1,
  wordSpeed: 1,
  steps: null,
  guidance: null,
  tone: "",
  pitch: 0,
  volumeDb: 0,
  evenLevel: false,
  clarity: false,
  denoise: true,
};

const SETTINGS_FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "reports",
  "voice-studio-settings.json",
);

const clamp = (n: unknown, lo: number, hi: number, fallback: number) =>
  typeof n === "number" && Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;

/** Anything from the page or the file becomes a valid settings object (unknown keys dropped, numbers clamped). */
export function cleanSettings(raw: unknown): VoiceSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const steps =
    typeof r.steps === "number" && r.steps > 0 ? Math.round(clamp(r.steps, 4, 64, 16)) : null;
  const guidance =
    typeof r.guidance === "number" && r.guidance > 0 ? clamp(r.guidance, 0.5, 5, 2) : null;
  return {
    sentenceSpeed: clamp(r.sentenceSpeed, 0.6, 1.4, 1),
    wordSpeed: clamp(r.wordSpeed, 0.6, 1.4, 1),
    steps,
    guidance,
    tone: (TONES as readonly string[]).includes(r.tone as string)
      ? (r.tone as VoiceSettings["tone"])
      : "",
    pitch: clamp(r.pitch, -6, 6, 0),
    volumeDb: clamp(r.volumeDb, -9, 9, 0),
    evenLevel: r.evenLevel === true,
    clarity: r.clarity === true,
    denoise: r.denoise !== false,
  };
}

function readAllSettings(): Record<string, unknown> {
  try {
    return existsSync(SETTINGS_FILE)
      ? (JSON.parse(readFileSync(SETTINGS_FILE, "utf8")) as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function loadSettings(voiceId: string): VoiceSettings {
  return cleanSettings(readAllSettings()[voiceId]);
}

export function saveSettings(voiceId: string, settings: VoiceSettings): VoiceSettings {
  const clean = cleanSettings(settings);
  mkdirSync(dirname(SETTINGS_FILE), { recursive: true });
  writeFileSync(
    SETTINGS_FILE,
    JSON.stringify({ ...readAllSettings(), [voiceId]: clean }, null, 2),
    "utf8",
  );
  return clean;
}

async function speak(
  input: string,
  profileId: string,
  seed: number | null,
  settings: VoiceSettings = DEFAULT_SETTINGS,
): Promise<Buffer> {
  const response = await fetch(`${API}/v1/audio/speech`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "tts-1",
      input,
      voice: profileId,
      response_format: "mp3",
      ...(seed === null ? {} : { seed }),
      ...(settings.steps === null ? {} : { num_step: settings.steps }),
      ...(settings.guidance === null ? {} : { guidance_scale: settings.guidance }),
      ...(settings.tone ? { instruct: settings.tone } : {}),
      ...(settings.denoise ? {} : { denoise: false }),
    }),
    signal: AbortSignal.timeout(300_000),
  });
  if (!response.ok)
    throw new Error(`VoiceStudio ${response.status}: ${(await response.text()).slice(0, 200)}`);
  const audio = Buffer.from(await response.arrayBuffer());
  if (audio.length < 500) throw new Error("VoiceStudio returned an empty clip.");
  return audio;
}

export async function transcribe(audio: Buffer): Promise<string> {
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
  settings: VoiceSettings,
): Promise<MadeAudio | null> {
  const audio = await speak(`The word is: ${word}.`, profileId, seed, settings);
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
  settings: VoiceSettings = DEFAULT_SETTINGS,
  check: CheckMode = "fast",
): Promise<MadeAudio> {
  const made = await makeCheckedTake(kind, text, profileId, settings, check);
  // Speed is applied last, to the take that passed the check (a slower clip is the same words).
  const filters = finishFilters(kind, settings);
  if (filters.length === 0) return made;
  const finished = await ffmpegPipe(made.audio, [
    "-af",
    filters.join(","),
    "-ar",
    "24000",
    "-ac",
    "1",
  ]);
  return finished ? { ...made, audio: finished } : made;
}

/** The ffmpeg steps applied to a finished take, in this order: pitch, speed, clarity, even level, volume. Empty = leave the take untouched. */
export function finishFilters(kind: ClipKind, settings: VoiceSettings): string[] {
  const filters: string[] = [];
  if (Math.abs(settings.pitch) >= 0.05)
    filters.push(`rubberband=pitch=${(2 ** (settings.pitch / 12)).toFixed(5)}`);
  const speed = kind === "word" ? settings.wordSpeed : settings.sentenceSpeed;
  if (Math.abs(speed - 1) >= 0.01) filters.push(`atempo=${speed.toFixed(3)}`);
  if (settings.clarity)
    filters.push(
      "highpass=f=70",
      "acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=2",
    );
  if (settings.evenLevel) filters.push("loudnorm=I=-16:TP=-1.5:LRA=11");
  if (Math.abs(settings.volumeDb) >= 0.1) filters.push(`volume=${settings.volumeDb.toFixed(1)}dB`);
  return filters;
}

/**
 * "fast" (the default): a take passes when it is not silent and its length is plausible for the text — no
 * Whisper, because on this PC one Whisper check costs as much as making the clip (~15-20 s, it runs on the CPU).
 * Only a take that fails that test is retried / cut out with the Whisper check. "full": every clip is checked
 * by Whisper (slow, certain).
 */
export type CheckMode = "fast" | "full";

async function plausible(kind: ClipKind, text: string, audio: Buffer): Promise<boolean> {
  const peak = await peakDb(audio);
  if (peak === null || peak < -30) return false;
  const ms = await durationMs(audio);
  if (ms === null) return true;
  const seconds = ms / 1000;
  if (kind === "word") return seconds >= 0.3 && seconds <= 2.6;
  const chars = text.length;
  return seconds >= chars * 0.04 && seconds <= chars * 0.16 + 1;
}

async function makeCheckedTake(
  kind: ClipKind,
  text: string,
  profileId: string,
  settings: VoiceSettings,
  check: CheckMode,
): Promise<MadeAudio> {
  const spoken = kind === "word" ? `${text}.` : text;
  let best: MadeAudio | null = null;
  let bestScore = -1;
  // A word gets two direct takes; when neither is heard right (or it is silent) it is cut out of a carrier phrase.
  const directAttempts = kind === "word" ? 2 : MAX_ATTEMPTS;
  for (let attempt = 1; attempt <= directAttempts; attempt++) {
    const audio = await speak(
      spoken,
      profileId,
      attempt === 1 ? null : 1000 + attempt * 37,
      settings,
    );
    if (check === "fast" && (await plausible(kind, text, audio)))
      return { audio, heard: "", attempts: attempt, verified: true };
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
      const cut = await wordFromCarrier(
        text,
        profileId,
        attempt === 1 ? 7 : 2000 + attempt * 41,
        settings,
      );
      if (cut) return { ...cut, attempts: directAttempts + attempt };
    }
  }
  return { ...best!, attempts: MAX_ATTEMPTS };
}

/** Length of a clip in ms. ffprobe cannot read an mp3's length from a pipe, so it goes through a temp file. */
export async function durationMs(audio: Buffer): Promise<number | null> {
  let dir: string | null = null;
  try {
    dir = mkdtempSync(join(tmpdir(), "vs-"));
    const file = join(dir, "clip.mp3");
    writeFileSync(file, audio);
    const { execFileSync } = await import("node:child_process");
    const out = execFileSync(
      "ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
      {
        encoding: "utf8",
        timeout: 15_000,
      },
    );
    const seconds = Number.parseFloat(out);
    return Number.isFinite(seconds) ? Math.round(seconds * 1000) : null;
  } catch {
    return null;
  } finally {
    if (dir) rmSync(dir, { recursive: true, force: true });
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
  opts: { redo?: boolean; settings?: VoiceSettings; check?: CheckMode } = {},
): Promise<MakeResult> {
  const settings = opts.settings ?? loadSettings(voice.id);
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
    const made = await makeCheckedAudio(
      kind,
      key.normalizedText,
      voice.provider_voice_id,
      settings,
      opts.check ?? "fast",
    );
    const url = await uploadVoiceClip(generatedVoiceStudioClipPath(voice.id), made.audio);
    await db
      .from("voice_audio_cache")
      .update({
        status: "ready",
        audio_url: url,
        duration_ms: await durationMs(made.audio),
        // How this clip was made (the site only reads the sentence-direction keys; this one is ours).
        voice_direction: {
          ...NEUTRAL_DIRECTION,
          sentenceId: `voice-studio:${voice.id}`,
          voiceStudio: settings,
        },
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

export interface Preview {
  /** The finished clip as base64 mp3 (not stored anywhere). */
  audioBase64: string;
  seconds: number | null;
  heard: string;
  verified: boolean;
  attempts: number;
}

/** Makes a clip exactly as makeClip would with these settings, but keeps it nowhere: for trying settings out. */
export async function previewClip(
  voice: SiteVoice,
  kind: ClipKind,
  text: string,
  settings: VoiceSettings,
): Promise<Preview> {
  const made = await makeCheckedAudio(
    kind,
    cacheKeyParts(text, voice.id, "x").normalizedText,
    voice.provider_voice_id,
    settings,
  );
  const ms = await durationMs(made.audio);
  return {
    audioBase64: made.audio.toString("base64"),
    seconds: ms === null ? null : Math.round(ms / 10) / 100,
    heard: made.heard,
    verified: made.verified,
    attempts: made.attempts,
  };
}

const SAMPLE_DIR = join(dirname(SETTINGS_FILE), "voice-studio-samples");
export const SAMPLE_TEXT = "Hello! This is how I sound. Nice to meet you.";

/**
 * A short listening sample of a VoiceStudio profile. A cloned voice has its own reference recording; a DESIGNED
 * voice (made from a description) has none, so its /audio address never answers — that is why "add a new
 * voice" showed a dead player. So a sample is made once with the voice itself and kept on this PC.
 */
export async function profileSample(profileId: string): Promise<Buffer> {
  if (!/^[A-Za-z0-9._-]{1,80}$/.test(profileId)) throw new Error("Bad profile id.");
  const file = join(SAMPLE_DIR, `${profileId}.mp3`);
  if (existsSync(file)) return readFileSync(file);
  const audio = await speak(SAMPLE_TEXT, profileId, 42);
  mkdirSync(SAMPLE_DIR, { recursive: true });
  writeFileSync(file, audio);
  return audio;
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
