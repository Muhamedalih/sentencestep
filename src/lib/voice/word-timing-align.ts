import { tokenize } from "@/lib/typing";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { WordTiming } from "@/lib/voice/word-timing";

/**
 * Computes and stores word timing for one sentence — the write half of the
 * word-timing feature (see word-timing.ts for the read half and the
 * feature's own overview doc comment). Deliberately NOT a "use server" file
 * and NOT imported by any client component: unlike word-timing.ts's
 * lookupWordTimings (a cheap, safe cache read), this function does real
 * work on every call — fetches an existing audio clip, spends a real
 * OpenAI Whisper API call, and writes to the database. A "use server"
 * directive on a file makes every export in it a public, unauthenticated,
 * client-invokable endpoint; this file is kept separate specifically so
 * this function can never become one — it's only ever imported by
 * scripts/align-pilot-lessons.ts, a human-run Node script, never by
 * anything the browser can reach.
 *
 * Reads its EXISTING resolved audio clip (never generates one), sends it
 * plus the known transcript to OpenAI's Whisper transcription endpoint with
 * word-level timestamps requested, and validates the result against this
 * app's own tokenization (referenceWords) before trusting it: a mismatched
 * word count (confirmed live — a written-out number like "Two hundred
 * thousand" transcribes back as "200,000", 5 of our tokens vs. Whisper's 2)
 * is stored as `status: 'skipped'` rather than a wrong or partial mapping,
 * so a position-indexed word click can never play the wrong slice of audio.
 * `OPENAI_API_KEY` must be configured; throws if it's missing so a
 * misconfigured run fails loudly rather than silently skipping every
 * sentence.
 */

const MAX_TEXT_LENGTH = 300;

/** Same indexing TypingText's own onWordClick reports (position among non-space tokens) — see that component's word-index doc comment. Kept in sync deliberately: this is the ONLY place besides typing-text.tsx that needs to agree on what "word N" means for a given sentence. */
function referenceWords(text: string): string[] {
  return tokenize(text).filter((token) => token !== " ");
}

export async function computeWordTiming(input: {
  contentType: "sentence" | "book_sentence";
  contentId: string;
  voiceId: string;
  audioUrl: string;
  text: string;
}): Promise<{ status: "ready" | "skipped"; words?: WordTiming[]; reason?: string }> {
  const { contentType, contentId, voiceId, audioUrl, text } = input;
  if (!text || text.length > MAX_TEXT_LENGTH) {
    return { status: "skipped", reason: "text too long or empty" };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const audioRes = await fetch(audioUrl);
  if (!audioRes.ok) {
    return { status: "skipped", reason: `could not fetch existing clip (${audioRes.status})` };
  }
  const audioBuf = Buffer.from(await audioRes.arrayBuffer());

  const form = new FormData();
  form.append("file", new Blob([audioBuf], { type: "audio/mpeg" }), "sentence.mp3");
  form.append("model", "whisper-1");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    return {
      status: "skipped",
      reason: `Whisper request failed (${res.status}): ${bodyText.slice(0, 200)}`,
    };
  }
  const json = (await res.json()) as { words?: { word: string; start: number; end: number }[] };
  const whisperWords = json.words ?? [];

  const ours = referenceWords(text);
  if (whisperWords.length !== ours.length) {
    await storeResult(contentType, contentId, voiceId, "skipped", null);
    return {
      status: "skipped",
      reason: `word count mismatch: ours=${ours.length} whisper=${whisperWords.length}`,
    };
  }

  // Store OUR word text (never Whisper's own transcribed spelling, which can
  // differ — e.g. "nor" for "Noor", confirmed live) at each position, paired
  // with Whisper's timing for that same position — the count match just
  // verified above is what makes this positional pairing trustworthy.
  const words: WordTiming[] = [];
  for (let i = 0; i < ours.length; i++) {
    const whisperWord = whisperWords[i];
    const word = ours[i];
    if (!whisperWord || word === undefined) {
      return { status: "skipped", reason: "internal index mismatch" };
    }
    words.push({ word, start: whisperWord.start, end: whisperWord.end });
  }

  await storeResult(contentType, contentId, voiceId, "ready", words);
  return { status: "ready", words };
}

async function storeResult(
  contentType: "sentence" | "book_sentence",
  contentId: string,
  voiceId: string,
  status: "ready" | "skipped",
  words: WordTiming[] | null,
): Promise<void> {
  const supabase = createServiceRoleClient();
  await supabase.from("sentence_word_timings").upsert(
    {
      content_type: contentType,
      content_id: contentId,
      voice_id: voiceId,
      status,
      words: words ?? [],
    },
    { onConflict: "content_type,content_id,voice_id" },
  );
}
