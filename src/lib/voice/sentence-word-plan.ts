import { isTrackableWord, normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { tokenize } from "@/lib/typing";
import { hashText, normalizeTextForVoice } from "@/lib/voice/resolution";

/**
 * Pure helpers that describe WHICH isolated-word clips a sentence needs. Shared
 * by the server (the batch lookup route) and the client (the preloader and the
 * sentence-window driver), so both sides always agree on a word's contentId and
 * on which spellings of it may already be cached. No server or browser imports
 * on purpose — this file is imported from both.
 */

export interface SentenceWordEntry {
  /** `${sentenceId}::${normalized word}` — the exact content reference resolvePronunciationAudioAction and the shared resolved-audio cache already key a word on. */
  contentId: string;
  /** normalizeMistakeWord of the token: lower-cased, edge punctuation stripped. */
  key: string;
  /** The first token in the sentence that produced `key`, punctuation and capitalisation intact ("Hello,"). */
  raw: string;
}

/** The content id of one word of a sentence — one definition for every caller. */
export function wordContentId(sentenceId: string, key: string): string {
  return `${sentenceId}::${key}`;
}

/**
 * Every distinct trackable word of a sentence, in reading order (first
 * occurrence wins, matching lookupContentText's own `find`). This is the list a
 * sentence's words are preloaded in — the order the learner will meet them.
 */
export function sentenceWordEntries(sentenceId: string, text: string): SentenceWordEntry[] {
  const entries: SentenceWordEntry[] = [];
  const seen = new Set<string>();
  for (const token of tokenize(text)) {
    if (token.trim().length === 0 || !isTrackableWord(token)) continue;
    const key = normalizeMistakeWord(token);
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({ contentId: wordContentId(sentenceId, key), key, raw: token });
  }
  return entries;
}

/**
 * The spellings a word's clip may be cached under, best first.
 *
 * voice_audio_cache is keyed on the exact text, and the same word has been
 * stored three ways by three producers: the RAW token a click used to
 * synthesize ("Hello,", "Went"), the NORMALIZED word the backfill script wrote
 * ("hello"), and the Capitalized entry a Word Lists group holds ("Hello"). A
 * lookup by any one spelling missed the other two's clips, so a clip that
 * existed still read as "no audio for this word". Looking up all three finds
 * whichever exists. The raw token stays first so a word that already has a clip
 * under it keeps sounding exactly as it does today; the normalized form is the
 * canonical spelling new clips are generated under.
 */
export function wordTextCandidates(raw: string, key: string): string[] {
  const capitalized = key.charAt(0).toUpperCase() + key.slice(1);
  const candidates = [raw, key, capitalized]
    .map((text) => normalizeTextForVoice(text))
    .filter((text) => text.length > 0);
  return [...new Set(candidates)];
}

/** How long a tap waits for the word's real clip before the browser's own voice says it — never silence, and the real clip (once made) is cached for the next tap. */
export const WORD_FALLBACK_MS = 1500;

export interface WordVoiceInfo {
  id: string;
  gender: string;
  accent: string | null;
}

/**
 * Every voice a word's clip may live under, in order of preference — so the
 * search covers the whole single-word inventory instead of the one voice a
 * rule predicted (a wrong prediction made a complete inventory look empty):
 * the lesson's own word voice first, then voices of its gender with the Word
 * Lists pronunciation voice ahead of the rest, American before other accents,
 * then every other voice, and the paid narrator's own clips last (only a
 * one-word sentence ever lands there).
 */
export function rankWordVoices(input: {
  wordVoiceId: string;
  pronunciationVoiceId: string | null;
  narratorVoiceId: string;
  voices: readonly WordVoiceInfo[];
}): string[] {
  const { wordVoiceId, pronunciationVoiceId, narratorVoiceId, voices } = input;
  const gender = voices.find((voice) => voice.id === wordVoiceId)?.gender;
  const score = (voice: WordVoiceInfo): number[] => [
    voice.id === wordVoiceId ? 0 : 1,
    gender !== undefined && voice.gender === gender ? 0 : 1,
    voice.id === pronunciationVoiceId ? 0 : 1,
    voice.accent === "American" ? 0 : 1,
  ];
  const sorted = [...voices].sort((a, b) => {
    const left = score(a);
    const right = score(b);
    for (let i = 0; i < left.length; i++) {
      const difference = (left[i] ?? 0) - (right[i] ?? 0);
      if (difference !== 0) return difference;
    }
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  return [...new Set([wordVoiceId, ...sorted.map((voice) => voice.id), narratorVoiceId])];
}

/**
 * The key a clip is stored under in the `clips` map pickWordClip reads —
 * `${voiceId}:${hash of the exact text}`, the two halves voice_audio_cache is
 * keyed on.
 */
export function clipKey(voiceId: string, text: string): string {
  return `${voiceId}:${hashText(text)}`;
}

export interface WordClipQuery {
  contentId: string;
  /** Spellings to try, best first — see wordTextCandidates. */
  candidates: readonly string[];
}

export interface SentenceClipChoice {
  /** contentId -> clip URL for every word that has a clip under any voice. */
  urls: Record<string, string>;
  /** The voice that covers the most words of the sentence (ties: earliest in `voiceOrder`); null when no word has a clip anywhere. */
  primaryVoiceId: string | null;
  /** Words covered, per voice that covers at least one — for diagnostics. */
  coverage: Record<string, number>;
}

/**
 * Chooses each word's clip from what the cache holds. The sentence's words are
 * spoken by ONE voice wherever the inventory allows: the voice covering the
 * most of them is the primary, and only a word the primary lacks is filled in
 * from the next voice in `voiceOrder`. Within a voice, the best spelling wins.
 * That keeps a sentence sounding like one speaker whichever voice the existing
 * single-word clips happen to live under — and finds them wherever they are.
 */
export function pickSentenceClips(
  words: readonly WordClipQuery[],
  voiceOrder: readonly string[],
  clips: ReadonlyMap<string, string>,
): SentenceClipChoice {
  const clipFor = (voiceId: string, candidates: readonly string[]): string | undefined => {
    for (const text of candidates) {
      const url = clips.get(clipKey(voiceId, text));
      if (url) return url;
    }
    return undefined;
  };

  const coverage: Record<string, number> = {};
  let primaryVoiceId: string | null = null;
  let best = 0;
  for (const voiceId of voiceOrder) {
    const covered = words.filter((word) => clipFor(voiceId, word.candidates) !== undefined).length;
    if (covered === 0) continue;
    coverage[voiceId] = covered;
    if (covered > best) {
      best = covered;
      primaryVoiceId = voiceId;
    }
  }

  const ordered = primaryVoiceId
    ? [primaryVoiceId, ...voiceOrder.filter((voiceId) => voiceId !== primaryVoiceId)]
    : [...voiceOrder];
  const urls: Record<string, string> = {};
  for (const word of words) {
    for (const voiceId of ordered) {
      const url = clipFor(voiceId, word.candidates);
      if (url) {
        urls[word.contentId] = url;
        break;
      }
    }
  }
  return { urls, primaryVoiceId, coverage };
}
