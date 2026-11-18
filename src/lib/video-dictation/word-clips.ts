import { after } from "next/server";

import { normalizeMistakeWord } from "@/lib/mistakes/normalize";
import type { VideoLesson } from "@/lib/video-dictation/types";
import {
  generateWordListVoiceAudio,
  lookupWordListVoiceAudio,
} from "@/lib/voice/word-list-word-audio";

/** Words made of letters (and an apostrophe): the only ones the training round asks from a sound. */
const TYPEABLE = /^[\p{L}']+$/u;

/** Every distinct word of a video's sentences that can be typed from a sound, lowercased. */
export function videoTrainingCandidates(lesson: VideoLesson): string[] {
  const words = new Set<string>();
  for (const sentence of lesson.sentences) {
    for (const entry of sentence.wordTranslations) {
      const word = normalizeMistakeWord(entry.en);
      if (word.length >= 3 && TYPEABLE.test(word)) words.add(word);
    }
  }
  return [...words];
}

/**
 * Some cached clips were recorded under a Supabase project the site has since left: their stored URL
 * names the old (dead) host, while the same file is served from the current project at the same path.
 * Point such a URL at the current host so the clip plays.
 */
export function currentHostClipUrl(
  url: string,
  current = process.env.NEXT_PUBLIC_SUPABASE_URL,
): string {
  if (!current) return url;
  try {
    const clip = new URL(url);
    const origin = new URL(current).origin;
    if (clip.origin === origin || !clip.pathname.startsWith("/storage/v1/object/public/"))
      return url;
    return origin + clip.pathname;
  } catch {
    return url;
  }
}

/**
 * The Word Lists voice (Emma, Edge-TTS) clips of a video's words, as word -> URL. One cache-only read
 * on the page's path (nothing is synthesized while the learner waits); a word that has no clip yet is
 * made after the response is sent, ready for the next visit. Never throws.
 */
export async function loadVideoWordClips(lesson: VideoLesson): Promise<Record<string, string>> {
  const words = videoTrainingCandidates(lesson);
  if (words.length === 0) return {};
  const found = await lookupWordListVoiceAudio(words);
  const missing = words.filter((word) => !found.has(word));
  if (missing.length > 0) {
    try {
      after(async () => {
        await generateWordListVoiceAudio(missing, { deadlineMs: 25_000, concurrency: 2 });
      });
    } catch {
      // Outside a request there is no after(): the clips are made by the next visit instead.
    }
  }
  return Object.fromEntries([...found].map(([word, url]) => [word, currentHostClipUrl(url)]));
}
