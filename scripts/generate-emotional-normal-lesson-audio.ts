/**
 * Narrates the six new emotional Normal lessons (normal-37..normal-42) with ElevenLabs, in the voice
 * stored on each lesson (`lessons.voice_id`: Christopher for the man's lessons, Jessa for the woman's),
 * and files every clip in `voice_audio_cache` exactly where the lesson player looks it up
 * (voice id + text hash, status ready). Existing lessons and their clips are never touched: only
 * these six lessons' sentences are read, and only new cache rows are written.
 *
 *   npx tsx --env-file=.env.local scripts/generate-emotional-normal-lesson-audio.ts \
 *     --key-file="C:/Users/G5/.sentencestep/elevenlabs_api_key.txt" [--dry]
 *
 * Re-runnable: a sentence that already has a ready clip for its voice is skipped.
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

import { cacheKeyParts, hashText, normalizeTextForVoice } from "../src/lib/voice/resolution";
import { createElevenLabsProvider } from "../src/lib/voice/providers/elevenlabs";
import type { Database } from "../src/types/database";

const LESSON_IDS = ["normal-37", "normal-38", "normal-39", "normal-40", "normal-41", "normal-42"];

// Calm, steady, human: the multilingual v2 model, high stability, almost no added style, a little
// slower than normal speech so a learner can follow every word.
const MODEL = "eleven_multilingual_v2";
const SETTINGS = {
  stability: 0.7,
  similarityBoost: 0.8,
  style: 0.15,
  speed: 0.85,
  useSpeakerBoost: true,
};

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Set the Supabase env vars.");
  const keyFile = arg("--key-file");
  if (!keyFile) throw new Error("Pass --key-file=<path to the ElevenLabs key>.");
  const dry = process.argv.includes("--dry");
  const apiKey = readFileSync(keyFile, "utf8").trim();
  const supabase = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const provider = createElevenLabsProvider(apiKey);

  const { data: lessons, error } = await supabase
    .from("lessons")
    .select("id, voice_id")
    .in("id", LESSON_IDS);
  if (error || !lessons || lessons.length !== LESSON_IDS.length) {
    throw new Error(`Expected ${LESSON_IDS.length} lessons, found ${lessons?.length ?? 0}.`);
  }

  let generated = 0;
  let skipped = 0;
  let characters = 0;
  for (const lesson of lessons.sort((a, b) => a.id.localeCompare(b.id))) {
    if (!lesson.voice_id) throw new Error(`${lesson.id} has no voice.`);
    const { data: voice } = await supabase
      .from("voices")
      .select("id, source, provider_voice_id, name")
      .eq("id", lesson.voice_id)
      .single();
    if (!voice || voice.source !== "elevenlabs")
      throw new Error(`${lesson.id}: voice is not ElevenLabs.`);

    const { data: sentences } = await supabase
      .from("sentences")
      .select("id, en, order_index")
      .eq("lesson_id", lesson.id)
      .order("order_index");
    for (const [i, s] of (sentences ?? []).entries()) {
      const prev = i > 0 ? sentences![i - 1]!.en : null;
      const next = i < sentences!.length - 1 ? sentences![i + 1]!.en : null;
      const contextHash = hashText(
        [prev ?? "", s.en, next ?? ""].map(normalizeTextForVoice).join("|"),
      );
      const key = cacheKeyParts(s.en, voice.id, `${MODEL}:v1:${contextHash}`);

      const { data: existing } = await supabase
        .from("voice_audio_cache")
        .select("id")
        .eq("voice_id", voice.id)
        .eq("text_hash", key.textHash)
        .eq("status", "ready")
        .limit(1);
      if (existing && existing.length > 0) {
        skipped += 1;
        continue;
      }
      characters += s.en.length;
      if (dry) {
        console.log(`would narrate ${s.id} (${voice.name.split(" - ")[0]}): ${s.en}`);
        continue;
      }

      const { audio } = await provider.synthesize({
        text: s.en,
        voiceId: voice.provider_voice_id,
        model: MODEL,
        voiceSettings: SETTINGS,
      });
      const path = `generated/elevenlabs/${voice.id}/${randomUUID()}.mp3`;
      const { error: uploadError } = await supabase.storage
        .from("voice-audio")
        .upload(path, audio, {
          contentType: "audio/mpeg",
          upsert: false,
          cacheControl: "31536000",
        });
      if (uploadError) throw new Error(`upload ${s.id}: ${uploadError.message}`);
      const audioUrl = supabase.storage.from("voice-audio").getPublicUrl(path).data.publicUrl;

      const { error: rowError } = await supabase.from("voice_audio_cache").insert({
        voice_id: voice.id,
        text_hash: key.textHash,
        normalized_text: key.normalizedText,
        generation_version: key.generationVersion,
        status: "ready",
        provider: "elevenlabs",
        model: MODEL,
        voice_direction: {
          sentenceId: s.id,
          emotion: "neutral",
          energy: "medium",
          pace: "normal",
          emphasisWord: null,
          pauseBefore: "none",
        },
        attempts: 1,
        audio_url: audioUrl,
        duration_ms: null,
      });
      if (rowError) throw new Error(`cache row ${s.id}: ${rowError.message}`);
      generated += 1;
      console.log(`narrated ${s.id} (${voice.name.split(" - ")[0]}, ${audio.length} bytes)`);
    }
  }
  console.log(
    `\n${dry ? "Dry run: " : ""}generated ${generated}, skipped ${skipped}, characters ${characters}.`,
  );
}

main().catch((error) => {
  console.error("FAILED:", error instanceof Error ? error.message : error);
  process.exit(1);
});
