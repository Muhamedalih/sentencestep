import { SERIES_PASSAGE_IDS } from "@/lib/passages/series";
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
 * German passage's words come from the Voice Studio German voice, and a series episode's words are all
 * said by Emma, the man's lines included (the owner's choice). Server only.
 */
const MAIN_VOICE = "edge-tts-en-us-andrew";
const SECOND_VOICE = "edge-tts-en-us-aria";
const SERIES_VOICE = "edge-tts-en-us-emma";

/**
 * Many of Emma's older rows still carry the address of the Supabase project the site moved from, which
 * no longer answers; the same file is in the current project, so only the host is put right.
 */
function onCurrentStorage(url: string): string {
  const current = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return current ? url.replace(/^https:\/\/[a-z0-9]+\.supabase\.co(?=\/storage\/)/, current) : url;
}

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
  const ids = SERIES_PASSAGE_IDS.includes(passageId) ? [SERIES_VOICE] : [MAIN_VOICE, SECOND_VOICE];
  const voices = await Promise.all(
    ids.map(async (id) => {
      const voice = await lookupVoice(id);
      return voice ? { id, providerVoiceId: voice.providerVoiceId } : null;
    }),
  );
  return voices.filter((voice) => voice !== null);
}

/** Word -> clip URL for the words that already have one; the passage's own words use their own clips. */
export async function loadSceneWordClips(
  passageId: string,
  scene: Scene,
): Promise<Record<string, string>> {
  const clips: Record<string, string> = {};
  try {
    const entries = sceneWordEntries(scene);
    const voices = (await sceneVoices(passageId)).map((voice) => voice.id);
    const ready = await lookupReadyClips(
      entries.flatMap((entry) => entry.candidates),
      voices,
    );
    for (const entry of entries) {
      const url = pickWordClip(entry.candidates, voices, ready);
      if (url) clips[entry.key] = onCurrentStorage(url);
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
  if (!voice) return null;
  const url = await generateIsolatedWordAudio(key, voice.id, voice.providerVoiceId);
  return url && onCurrentStorage(url);
}
