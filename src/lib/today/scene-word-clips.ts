import { seriesLineGender } from "@/lib/passages/series";
import {
  pickWordClip,
  sentenceWordEntries,
  wordTextCandidates,
} from "@/lib/voice/sentence-word-plan";
import {
  generateIsolatedWordAudio,
  germanStudioWordVoice,
  isGermanLessonId,
  lookupReadyClips,
  lookupVoice,
  type WordVoice,
} from "@/lib/voice/isolated-word-audio";
import type { Scene } from "@/lib/today/scene";

/**
 * The single-word clips of the day's scene: a wrong letter is answered by the word alone, never by
 * the whole line and never by the browser's voice. One neural voice says every word (Andrew, the one
 * with the most words already recorded); Aria's recording stands in when only she has the word. A
 * German passage's words come from the Voice Studio German voice. A series episode's words follow the
 * line they stand in: one Voice Studio woman for a woman's line, one Voice Studio man for any other
 * (made offline, scripts/voice-studio), the neural voice of the same gender standing in for a word
 * they have not recorded. Server only.
 */
const MAIN_VOICE = "edge-tts-en-us-andrew";
const SECOND_VOICE = "edge-tts-en-us-aria";
/** Voice Studio "The Teacher" and "The Champion". Only ever looked up: the site cannot synthesise them. */
const SERIES_VOICES = {
  female: ["voicestudio-aee032c3", SECOND_VOICE],
  male: ["voicestudio-ae41ea30", MAIN_VOICE],
} as const;

/** Every distinct word the learner types in the scene, with the spellings its clip may be filed under. */
export function sceneWordEntries(scene: Scene): { key: string; candidates: string[] }[] {
  const found = new Map<string, string[]>();
  for (const step of scene.steps) {
    for (const entry of sentenceWordEntries(step.line.id, step.typed)) {
      if (!found.has(entry.key)) found.set(entry.key, wordTextCandidates(entry.raw, entry.key));
    }
  }
  return [...found].map(([key, candidates]) => ({ key, candidates }));
}

async function sceneVoices(passageId: string): Promise<WordVoice[]> {
  if (isGermanLessonId(passageId)) {
    const german = await germanStudioWordVoice("female");
    return german ? [german, ...(german.fallbackIds ?? []).map((id) => ({ ...german, id }))] : [];
  }
  const voices = await Promise.all(
    [MAIN_VOICE, SECOND_VOICE].map(async (id) => {
      const voice = await lookupVoice(id);
      return voice ? { id, providerVoiceId: voice.providerVoiceId } : null;
    }),
  );
  return voices.filter((voice) => voice !== null);
}

/**
 * A series episode's clips, filed per line ("<line id>:<word>") because the same word is a woman's in
 * one line and a man's in another. The day's words are left to their own clips.
 */
async function seriesWordClips(passageId: string, scene: Scene): Promise<Record<string, string>> {
  const clips: Record<string, string> = {};
  const own = new Set(scene.words.map((word) => word.word.toLowerCase()));
  for (const gender of ["female", "male"] as const) {
    const lines = scene.steps.filter(
      (step) => seriesLineGender(passageId, step.line.speaker) === gender,
    );
    if (lines.length === 0) continue;
    const entries = lines.flatMap((step) =>
      sentenceWordEntries(step.line.id, step.typed).map((entry) => ({
        id: `${step.line.id}:${entry.key}`,
        key: entry.key,
        candidates: wordTextCandidates(entry.raw, entry.key),
      })),
    );
    const voices = SERIES_VOICES[gender];
    const ready = await lookupReadyClips(
      entries.flatMap((entry) => entry.candidates),
      voices,
    );
    for (const entry of entries) {
      const url = own.has(entry.key) ? null : pickWordClip(entry.candidates, voices, ready);
      if (url) clips[entry.id] = url;
    }
  }
  return clips;
}

/** Word -> clip URL for the words that already have one; the passage's own words use their own clips. */
export async function loadSceneWordClips(
  passageId: string,
  scene: Scene,
): Promise<Record<string, string>> {
  const clips: Record<string, string> = {};
  try {
    // A series episode is answered per line; a word with no clip is made when it is first asked for.
    const series = seriesLineGender(passageId, null) !== null;
    if (series) Object.assign(clips, await seriesWordClips(passageId, scene));
    const entries = series ? [] : sceneWordEntries(scene);
    const voices = (await sceneVoices(passageId)).map((voice) => voice.id);
    const ready = await lookupReadyClips(
      entries.flatMap((entry) => entry.candidates),
      voices,
    );
    for (const entry of entries) {
      const url = pickWordClip(entry.candidates, voices, ready);
      if (url) clips[entry.key] = url;
    }
  } catch (error) {
    console.error("[scene] loadSceneWordClips failed", error);
  }
  for (const word of scene.words) clips[word.word.toLowerCase()] = word.audioUrl;
  return clips;
}

/** Records one word of the scene that has no clip yet (never a German one: those are made offline). */
export async function makeSceneWordClip(
  passageId: string,
  scene: Scene,
  key: string,
): Promise<string | null> {
  if (!sceneWordEntries(scene).some((entry) => entry.key === key)) return null;
  const voice = (await sceneVoices(passageId))[0];
  return voice ? generateIsolatedWordAudio(key, voice.id, voice.providerVoiceId) : null;
}
