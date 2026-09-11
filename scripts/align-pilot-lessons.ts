/**
 * Word-timing pilot (2026-09-11): computes and stores forced-alignment word
 * timing (see src/lib/voice/word-timing.ts) for exactly THREE pieces of
 * content — one Story, one Normal lesson, one Book section — at the user's
 * explicit request, to verify the feature live on a small, deliberately
 * bounded slice before deciding whether to run it against the rest of the
 * library. Reads each sentence's EXISTING, already-generated narration clip
 * (never generates or re-uploads any audio) and sends it to OpenAI's
 * Whisper API for alignment; a sentence whose word count doesn't match
 * Whisper's own count is recorded 'skipped', not guessed at.
 *
 * Deliberately NOT the cron sweep, NOT wired into any automatic path — a
 * one-off, human-run script, same convention as
 * scripts/generate-word-list-emma-voice.ts. Run with:
 *   npx tsx scripts/align-pilot-lessons.ts
 */
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../src/types/database";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (!match) continue;
    const [, key, value] = match;
    if (key && value !== undefined && !process.env[key]) process.env[key] = value;
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey || !process.env.OPENAI_API_KEY) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and OPENAI_API_KEY (e.g. from .env.local).",
  );
  process.exit(1);
}

const FNV64_OFFSET_BASIS = 0xcbf29ce484222325n;
const FNV64_PRIME = 0x100000001b3n;
const MASK_64 = 0xffffffffffffffffn;
function hashText(text: string): string {
  let hash = FNV64_OFFSET_BASIS;
  for (let i = 0; i < text.length; i++) {
    hash ^= BigInt(text.charCodeAt(i));
    hash = (hash * FNV64_PRIME) & MASK_64;
  }
  return hash.toString(16).padStart(16, "0");
}
function normalizeTextForVoice(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

async function main() {
  const { computeWordTiming } = await import("../src/lib/voice/word-timing");

  const supabase = createClient<Database>(url!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  async function resolveSentenceAudio(voiceId: string, text: string): Promise<string | null> {
    const textHash = hashText(normalizeTextForVoice(text));
    const { data } = await supabase
      .from("voice_audio_cache")
      .select("audio_url")
      .eq("voice_id", voiceId)
      .eq("text_hash", textHash)
      .eq("status", "ready")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.audio_url ?? null;
  }

  let ready = 0;
  let skipped = 0;
  let missingAudio = 0;

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  async function alignSentences(
    contentType: "sentence" | "book_sentence",
    voiceId: string,
    sentences: { id: string; en: string }[],
    label: string,
  ) {
    console.log(`\n=== ${label} (${sentences.length} sentences, voice=${voiceId}) ===`);
    for (const s of sentences) {
      // Skip content already aligned by an earlier run of this script (e.g.
      // a retry after hitting OpenAI's own requests-per-minute limit) —
      // never re-spends a Whisper call on something already 'ready'.
      const { data: existing } = await supabase
        .from("sentence_word_timings")
        .select("status")
        .eq("content_type", contentType)
        .eq("content_id", s.id)
        .eq("voice_id", voiceId)
        .maybeSingle();
      if (existing?.status === "ready") {
        console.log(`  [${s.id}] already ready, skipping`);
        ready++;
        continue;
      }

      const audioUrl = await resolveSentenceAudio(voiceId, s.en);
      if (!audioUrl) {
        console.log(`  [${s.id}] SKIP — no existing cached audio for this voice`);
        missingAudio++;
        continue;
      }
      const result = await computeWordTiming({
        contentType,
        contentId: s.id,
        voiceId,
        audioUrl,
        text: s.en,
      });
      if (result.status === "ready") {
        console.log(`  [${s.id}] ready — ${result.words?.length} words`);
        ready++;
      } else {
        console.log(`  [${s.id}] skipped — ${result.reason}`);
        skipped++;
      }
      // Whisper's own free-tier rate limit is 10 requests/minute — confirmed
      // live (429s partway through the first pilot run). 7s between calls
      // keeps this comfortably under that.
      await sleep(7000);
    }
  }

  // 1) Story — "A New Neighbor" (story-1), already prototyped 11/11 clean.
  const { data: story } = await supabase
    .from("lessons")
    .select("id, voice_id")
    .eq("id", "story-1")
    .single();
  const { data: storySentences } = await supabase
    .from("sentences")
    .select("id, en")
    .eq("lesson_id", "story-1")
    .order("order_index", { ascending: true });
  if (story?.voice_id && storySentences) {
    await alignSentences("sentence", story.voice_id, storySentences, "Story: A New Neighbor");
  }

  // 2) Normal lesson — "The Missed Bus" (normal-2).
  const { data: normal } = await supabase
    .from("lessons")
    .select("id, voice_id")
    .eq("id", "normal-2")
    .single();
  const { data: ttsSettings } = await supabase
    .from("tts_settings")
    .select("default_normal_lesson_voice_id")
    .single();
  const normalVoiceId = normal?.voice_id ?? ttsSettings?.default_normal_lesson_voice_id;
  const { data: normalSentences } = await supabase
    .from("sentences")
    .select("id, en")
    .eq("lesson_id", "normal-2")
    .order("order_index", { ascending: true });
  if (normalVoiceId && normalSentences) {
    await alignSentences("sentence", normalVoiceId, normalSentences, "Normal: The Missed Bus");
  }

  // 3) Book section — Sapiens, section 1.
  const { data: book } = await supabase
    .from("books")
    .select("id, voice_id")
    .eq("id", "book-sapiens")
    .single();
  const { data: bookSentences } = await supabase
    .from("book_sentences")
    .select("id, en")
    .eq("section_id", "book-sapiens-sec1")
    .order("order_index", { ascending: true });
  if (book?.voice_id && bookSentences) {
    await alignSentences("book_sentence", book.voice_id, bookSentences, "Book: Sapiens, section 1");
  }

  console.log(`\nDone. ready=${ready} skipped=${skipped} missingAudio=${missingAudio}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
