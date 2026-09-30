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
 * The on-demand path has always synthesized the RAW token ("Hello,", "Went"),
 * whereas scripts/backfill-word-audio.ts pre-generated the NORMALIZED word
 * ("hello", "went") — and voice_audio_cache is keyed on the exact text, so a
 * lookup by either spelling alone missed the other's clips: the capitalised
 * first word and the punctuated last word of a sentence never found their
 * backfilled clip and were synthesized from scratch, seconds after a click.
 * Looking up both finds whichever exists. The raw token stays first so a word
 * that already has a clip under it keeps sounding exactly as it does today; the
 * normalized form is the canonical spelling new clips are generated under.
 */
export function wordTextCandidates(raw: string, key: string): string[] {
  const candidates = [normalizeTextForVoice(raw), normalizeTextForVoice(key)].filter(
    (text) => text.length > 0,
  );
  return [...new Set(candidates)];
}

/**
 * The key a clip is stored under in the `clips` map pickWordClip reads —
 * `${voiceId}:${hash of the exact text}`, the two halves voice_audio_cache is
 * keyed on.
 */
export function clipKey(voiceId: string, text: string): string {
  return `${voiceId}:${hashText(text)}`;
}

/**
 * Chooses a word's clip from what the cache holds: the best-ranked SPELLING
 * wins (see wordTextCandidates), and within a spelling the earlier voice — the
 * narrator's own id ahead of the word voice, so a one-word sentence keeps
 * sounding like its narrator. undefined when no spelling has a clip under any
 * voice.
 */
export function pickWordClip(
  candidates: readonly string[],
  voiceIds: readonly string[],
  clips: ReadonlyMap<string, string>,
): string | undefined {
  for (const text of candidates) {
    for (const voiceId of voiceIds) {
      const url = clips.get(clipKey(voiceId, text));
      if (url) return url;
    }
  }
  return undefined;
}
