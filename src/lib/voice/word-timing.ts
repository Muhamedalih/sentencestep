"use server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Word-level timing (forced alignment) for a sentence's own already-generated
 * narration clip — lets a word click play a SLICE of that SAME clip instead
 * of resolving/synthesizing a separate isolated-word clip (see
 * resolvePronunciationAudioAction in voice-audio.ts, the pre-existing path
 * this is layered alongside, never replaces outright). Confirmed live
 * (2026-09-11 prototype, 11/11 sentences of story-1 "A New Neighbor"): the
 * narrator's own voice for word clicks, at effectively zero marginal cost
 * once a sentence is aligned, versus the isolated-word path's either a free
 * but audibly different substitute voice or, for a never-before-clicked
 * word, several real seconds of on-demand synthesis.
 *
 * Deliberately its own table (sentence_word_timings) — never touches
 * voice_audio_cache, the sentence audio files themselves, or any existing
 * generation pipeline.
 *
 * This file is "use server" — every export here is a real, public,
 * client-invokable Server Action, exactly like resolvePronunciationAudioAction
 * in voice-audio.ts. It deliberately holds ONLY the cheap, safe, read-only
 * lookup below. The half that does real work (reads an existing clip, spends
 * a real OpenAI Whisper call, writes to the database) lives in the
 * DELIBERATELY separate word-timing-align.ts, which is NOT "use server" and
 * is never imported by any client component — see that file's own doc
 * comment for why keeping them apart matters.
 */

export interface WordTiming {
  word: string;
  /** Seconds into the sentence's own resolved audio clip. */
  start: number;
  end: number;
}

/**
 * Cache-only lookup — never computes. A `null` return (no row, or a row with
 * status 'skipped') means: no usable timing yet, fall back to the
 * pre-existing isolated-word-clip path. Never throws.
 */
export async function lookupWordTimings(
  contentType: "sentence" | "book_sentence",
  contentId: string,
  voiceId: string,
): Promise<WordTiming[] | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("sentence_word_timings")
    .select("words, status")
    .eq("content_type", contentType)
    .eq("content_id", contentId)
    .eq("voice_id", voiceId)
    .maybeSingle();

  if (!data || data.status !== "ready") return null;
  return data.words as WordTiming[];
}
