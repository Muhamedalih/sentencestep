/**
 * Records the German alphabet clips (permission germanZero): for each of the 30 letters the letter's
 * name ("Beh") and its example word ("Buch"), in a German ElevenLabs voice, checked by reading each
 * clip back with Whisper, and saved to the public voice-audio bucket under german-letters/v1/.
 * Only ever adds new files in that folder; no lesson, story or passage clip is touched.
 *
 *   npx tsx --env-file=.env.local scripts/generate-german-letter-audio.ts --key-file=<file> [--voice=Leonie] [--only=ae,oe] [--force]
 */
import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

import { GERMAN_ALPHABET, germanLetterClipPath } from "../src/lib/german-alphabet";

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openai = process.env.OPENAI_API_KEY;
const keyFile = arg("key-file");
const apiKey = keyFile ? readFileSync(keyFile, "utf8").trim() : process.env.ELEVENLABS_API_KEY;
if (!url || !service || !apiKey) {
  console.error("Need Supabase env, and an ElevenLabs key (--key-file).");
  process.exit(1);
}
const voiceName = arg("voice") ?? "Leonie";
const only = arg("only")?.split(",");
const force = process.argv.includes("--force");
const supabase = createClient(url, service);

function normal(text: string): string {
  return text.toLowerCase().replace(/[.,!?;:"'„“”\-\s]/g, "");
}

async function whisper(audio: Buffer): Promise<string> {
  if (!openai) return "";
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(audio)], { type: "audio/mpeg" }), "clip.mp3");
  form.append("model", "whisper-1");
  form.append("language", "de");
  form.append(
    "prompt",
    "Das deutsche Alphabet: A, Be, Ze, De, E, Eff, Ge, Ha, I, Jott, Ka, Ell, Emm, Enn, O, Pe, Ku, Err, Ess, Te, U, Fau, We, Iks, Üpsilon, Zett, Ä, Ö, Ü, Eszett.",
  );
  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openai}` },
    body: form,
  });
  if (!response.ok) return "";
  return ((await response.json()) as { text?: string }).text ?? "";
}

async function speak(voiceId: string, text: string, seed: number): Promise<Buffer> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey!, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        language_code: "de",
        seed,
        voice_settings: { stability: 0.7, similarity_boost: 0.8, style: 0, speed: 0.85 },
      }),
    },
  );
  if (!response.ok) throw new Error(`ElevenLabs ${response.status}: ${await response.text()}`);
  return Buffer.from(await response.arrayBuffer());
}

/** Other spellings tried when Whisper does not hear the letter back (a bare vowel is hard for a voice to say alone). */
const ALT: Record<string, string[]> = {
  e: ["Eeh", "Ehh"],
  i: ["Iih", "Ih"],
  u: ["Uuh", "Uh"],
  r: ["Ärr", "Er"],
  ue: ["Üüh", "Ühh"],
  z: ["Tsett", "Zett"],
};

async function main() {
  const { data: voice, error } = await supabase
    .from("voices")
    .select("name,provider_voice_id")
    .eq("language", "de")
    .ilike("name", `${voiceName}%`)
    .limit(1)
    .single();
  if (error || !voice) throw new Error(`No German voice ${voiceName}`);
  console.log(`Voice: ${voice.name}`);
  let made = 0;
  const flagged: string[] = [];
  for (const entry of GERMAN_ALPHABET) {
    if (only && !only.includes(entry.key)) continue;
    for (const kind of ["name", "word"] as const) {
      const path = germanLetterClipPath(entry.key, kind);
      if (!force) {
        const head = await fetch(`${url}/storage/v1/object/public/voice-audio/${path}`, {
          method: "HEAD",
        });
        if (head.ok) continue;
      }
      const variants = kind === "name" ? [entry.name, ...(ALT[entry.key] ?? [])] : [entry.word];
      const accept = kind === "name" ? entry.heard.map(normal) : [normal(entry.word)];
      let best: Buffer | null = null;
      let heardText = "";
      for (let attempt = 0; attempt < 4; attempt++) {
        const audio = await speak(
          voice.provider_voice_id,
          `${variants[attempt % variants.length]}.`,
          1000 + attempt * 37,
        );
        const heard = await whisper(audio);
        const ok =
          !openai || accept.some((a) => normal(heard) === a || normal(heard).startsWith(a));
        if (!best || ok) best = audio;
        if (ok || !heardText) heardText = heard;
        if (ok) {
          heardText = "";
          break;
        }
      }
      if (!best) continue;
      const up = await supabase.storage
        .from("voice-audio")
        .upload(path, best, { contentType: "audio/mpeg", upsert: true });
      if (up.error) throw up.error;
      made += 1;
      if (heardText) flagged.push(`${entry.letter} ${kind}: heard "${heardText}"`);
      console.log(
        `ok ${entry.letter} ${kind}${heardText ? `  (check: heard "${heardText}")` : ""}`,
      );
    }
  }
  console.log(`Made ${made} clips.`);
  if (flagged.length) console.log("Not confirmed by Whisper:\n" + flagged.join("\n"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
