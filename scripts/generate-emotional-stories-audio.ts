/**
 * Narrates the three emotional Stories (story-211..213) with ElevenLabs in the voice "Savvy - Warm,
 * Grounded & Natural", set a little slower than normal speech and softer, as if moved by the story.
 * Points each lesson's `voice_id` at Savvy, then files every clip in `voice_audio_cache` where the
 * Stories player looks it up (voice id + text hash + the live elevenlabs_settings model + neighbour
 * context, status ready). Only these three lessons' sentences are read and only new cache rows are
 * written; every existing lesson and clip is left alone.
 *
 *   npx tsx --env-file=.env.local scripts/generate-emotional-stories-audio.ts \
 *     --key-file="C:/Users/G5/.sentencestep/elevenlabs_api_key.txt" [--dry]
 *
 * Re-runnable: a sentence that already has a ready clip for Savvy is skipped.
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

import { cacheKeyParts, hashText, normalizeTextForVoice } from "../src/lib/voice/resolution";
import { createElevenLabsProvider } from "../src/lib/voice/providers/elevenlabs";
import type { Database } from "../src/types/database";

const LESSON_IDS = ["story-211", "story-212", "story-213"];
const SAVVY = "elevenlabs-ogwqbh5bbf03dsbnirnn";

// Synthesised with multilingual v2 (the model that honours `speed`): slower than normal, lower
// stability and a little style so the voice carries feeling. The clip is FILED under the live
// settings model (see main) so the player finds it.
const SYNTH_MODEL = "eleven_multilingual_v2";
const SETTINGS = {
  stability: 0.45,
  similarityBoost: 0.8,
  style: 0.3,
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
  const supabase = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const provider = createElevenLabsProvider(readFileSync(keyFile, "utf8").trim());

  const { data: settings } = await supabase
    .from("elevenlabs_settings")
    .select("model")
    .eq("id", 1)
    .maybeSingle();
  if (!settings) throw new Error("No elevenlabs_settings row.");
  const FILE_MODEL = settings.model;

  const { data: voice } = await supabase
    .from("voices")
    .select("id, source, provider_voice_id, name")
    .eq("id", SAVVY)
    .single();
  if (!voice || voice.source !== "elevenlabs") throw new Error("Savvy voice not found.");

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, status")
    .in("id", LESSON_IDS);
  if (!lessons || lessons.length !== LESSON_IDS.length) throw new Error("Stories not found.");

  if (!dry) {
    const { error } = await supabase
      .from("lessons")
      .update({ voice_id: voice.id, updated_at: new Date().toISOString() })
      .in("id", LESSON_IDS);
    if (error) throw new Error(`set voice: ${error.message}`);
  }

  let generated = 0;
  let skipped = 0;
  let characters = 0;
  for (const id of LESSON_IDS) {
    const { data: sentences } = await supabase
      .from("sentences")
      .select("id, en, order_index")
      .eq("lesson_id", id)
      .order("order_index");
    for (const [i, s] of (sentences ?? []).entries()) {
      const prev = i > 0 ? sentences![i - 1]!.en : null;
      const next = i < sentences!.length - 1 ? sentences![i + 1]!.en : null;
      const contextHash = hashText(
        [prev ?? "", s.en, next ?? ""].map(normalizeTextForVoice).join("|"),
      );
      const key = cacheKeyParts(s.en, voice.id, `${FILE_MODEL}:v1:${contextHash}`);
      const { data: existing } = await supabase
        .from("voice_audio_cache")
        .select("id")
        .eq("voice_id", voice.id)
        .eq("text_hash", key.textHash)
        .eq("generation_version", key.generationVersion)
        .eq("status", "ready")
        .limit(1);
      if (existing && existing.length > 0) {
        skipped += 1;
        continue;
      }
      characters += s.en.length;
      if (dry) {
        console.log(`would narrate ${s.id}: ${s.en}`);
        continue;
      }
      const { audio } = await provider.synthesize({
        text: s.en,
        voiceId: voice.provider_voice_id,
        model: SYNTH_MODEL,
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
        model: SYNTH_MODEL,
        voice_direction: {
          sentenceId: s.id,
          emotion: "tender",
          energy: "low",
          pace: "slow",
          emphasisWord: null,
          pauseBefore: "none",
        },
        attempts: 1,
        audio_url: audioUrl,
        duration_ms: null,
      });
      if (rowError) throw new Error(`cache row ${s.id}: ${rowError.message}`);
      generated += 1;
      console.log(`narrated ${s.id} (${audio.length} bytes)`);
    }
  }
  console.log(
    `\n${dry ? "Dry run: " : ""}file model "${FILE_MODEL}", generated ${generated}, skipped ${skipped}, characters ${characters}.`,
  );
}

main().catch((error) => {
  console.error("FAILED:", error instanceof Error ? error.message : error);
  process.exit(1);
});
