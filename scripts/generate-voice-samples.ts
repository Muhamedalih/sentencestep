/**
 * Makes a short sample of every registered ElevenLabs voice, so an admin can listen
 * before choosing: the ▶ next to a role's voice in Admin -> Passages plays it, and the
 * Admin -> Voice list can too. A sample is ONE short, lively line (a few dozen characters),
 * made with the model and the sliders the narration itself uses (Admin -> Voice), so what
 * is heard is what the passages will sound like.
 *
 * It saves each sample as `samples/<voice id>.mp3` in the public voice-audio bucket and
 * writes its URL to voices.sample_audio_url. Voices that already have a sample are left
 * alone unless --force. It never touches lesson, story, book or passage audio.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/generate-voice-samples.ts --dry-run
 *   npx tsx --env-file=.env.local scripts/generate-voice-samples.ts --key-file=<file with the ElevenLabs key>
 * Options:
 *   --only=<voices.id>  just that voice
 *   --force             make the sample again for voices that already have one
 *   --dry-run           list what would be made and what it costs, call nothing
 * The key is read from ELEVENLABS_API_KEY, or from the file given with --key-file
 * (its content is never printed).
 */
import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

import { createElevenLabsProvider } from "../src/lib/voice/providers/elevenlabs";
import { samplePath } from "../src/lib/voice/storage";
import type { Database } from "../src/types/database";

const SAMPLE_TEXT = "Hi there! Wait… you won't believe what just happened. Let me tell you.";
const BUCKET = "voice-audio";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (use --env-file=.env.local).",
  );
  process.exit(1);
}

const args = process.argv.slice(2);
function option(name: string): string | undefined {
  return args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
}
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");
const only = option("only");

const supabase = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function readApiKey(): string {
  const keyFile = option("key-file");
  const key = keyFile
    ? readFileSync(keyFile, "utf8").trim()
    : process.env.ELEVENLABS_API_KEY?.trim();
  if (!key) fail("No ElevenLabs key: set ELEVENLABS_API_KEY or pass --key-file=<path>.");
  return key;
}

async function main() {
  const { data: settings, error: settingsError } = await supabase
    .from("elevenlabs_settings")
    .select("model, stability, similarity_boost, style, speed, use_speaker_boost")
    .eq("id", 1)
    .maybeSingle();
  if (settingsError || !settings) fail("Couldn't read elevenlabs_settings.");

  let query = supabase
    .from("voices")
    .select("id, name, gender, provider_voice_id, sample_audio_url")
    .eq("source", "elevenlabs")
    .order("gender")
    .order("name");
  if (only) query = query.eq("id", only);
  const { data: voices, error: voicesError } = await query;
  if (voicesError) fail(`Couldn't read the voices: ${voicesError.message}`);

  const todo = (voices ?? []).filter((voice) => force || !voice.sample_audio_url);
  console.log(
    `${todo.length} of ${voices?.length ?? 0} voice(s) need a sample — ${todo.length * SAMPLE_TEXT.length} characters, model ${settings!.model}, speed ${settings!.speed}.`,
  );
  for (const voice of todo) console.log(`  ${voice.gender.padEnd(6)} ${voice.name}`);
  if (dryRun || todo.length === 0) {
    console.log(dryRun ? "\nDRY RUN — nothing was generated." : "Nothing to do.");
    return;
  }

  const provider = createElevenLabsProvider(readApiKey());
  let done = 0;
  for (const voice of todo) {
    try {
      const { audio } = await provider.synthesize({
        text: SAMPLE_TEXT,
        voiceId: voice.provider_voice_id,
        model: settings!.model,
        voiceSettings: {
          stability: settings!.stability,
          similarityBoost: settings!.similarity_boost,
          style: settings!.style,
          speed: settings!.speed,
          useSpeakerBoost: settings!.use_speaker_boost,
        },
      });
      const path = samplePath(voice.id);
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, audio, { contentType: "audio/mpeg", upsert: true, cacheControl: "31536000" });
      if (uploadError) throw new Error(`upload failed: ${uploadError.message}`);
      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const { error: updateError } = await supabase
        .from("voices")
        .update({ sample_audio_url: publicUrl })
        .eq("id", voice.id);
      if (updateError) throw new Error(`saving the URL failed: ${updateError.message}`);
      done += 1;
      console.log(`  ✓ ${voice.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  ✗ ${voice.name}: ${message}`);
      // A payment/permission problem will not fix itself by retrying the next voice.
      if (/401|402|429|payment|quota/i.test(message))
        fail("ElevenLabs refused the request — stopped.");
    }
  }
  console.log(`Made ${done} of ${todo.length} sample(s).`);
  if (done < todo.length) process.exit(1);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
