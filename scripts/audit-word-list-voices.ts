/**
 * Read-only audit: is every Word List spoken by the Edge-TTS "Emma" voice?
 * Writes nothing. Exits 1 if anything isn't Emma, so it doubles as a check.
 *
 * Checks, in the order a learner's word click actually depends on them:
 *   1. tts_settings.default_pronunciation_voice_id is Emma, and Emma's
 *      `voices` row exists and is a real Edge-TTS voice.
 *   2. No word_groups.voice_id override points at a different voice.
 *   3. Every word of every published group has a ready Emma clip in
 *      voice_audio_cache (a word without one falls back to the browser's own
 *      speech synthesis — not Emma, not Edge-TTS).
 *
 * Fix what it reports with supabase/migrations/20250322000000_word_lists_emma_voice.sql
 * (1 + 2) and `npx tsx scripts/generate-word-list-emma-voice.ts` (3).
 *
 * Run with: npx tsx scripts/audit-word-list-voices.ts
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
if (!url || !serviceRoleKey) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. from .env.local).",
  );
  process.exit(1);
}

async function main() {
  const { WORD_LIST_PROVIDER, WORD_LIST_VOICE_ID } =
    await import("../src/lib/voice/content-provider-map");
  const { WORD_LIST_GENERATION_VERSION } =
    await import("../src/lib/voice/word-list-voice-generation");
  const { cacheKeyParts } = await import("../src/lib/voice/resolution");

  const supabase = createClient<Database>(url!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const problems: string[] = [];

  // 1. Site-wide default + Emma's own voice row.
  const { data: settings } = await supabase
    .from("tts_settings")
    .select("default_pronunciation_voice_id")
    .eq("id", 1)
    .maybeSingle();
  const defaultVoiceId = settings?.default_pronunciation_voice_id ?? null;
  console.log(`Default Word Lists voice: ${defaultVoiceId ?? "(unset — code falls back to Emma)"}`);
  if (defaultVoiceId && defaultVoiceId !== WORD_LIST_VOICE_ID) {
    problems.push(`Default voice is ${defaultVoiceId}, not ${WORD_LIST_VOICE_ID}.`);
  }

  const { data: emma } = await supabase
    .from("voices")
    .select("id, source, provider_voice_id")
    .eq("id", WORD_LIST_VOICE_ID)
    .maybeSingle();
  if (!emma) {
    problems.push(`Voice row ${WORD_LIST_VOICE_ID} does not exist.`);
  } else if (emma.source !== WORD_LIST_PROVIDER) {
    problems.push(
      `Voice ${emma.id} has source "${emma.source}", expected "${WORD_LIST_PROVIDER}".`,
    );
  } else {
    console.log(`Emma voice row OK: ${emma.id} -> ${emma.provider_voice_id} (${emma.source})`);
  }

  // 2. Per-group overrides (any status — an archived group can be restored).
  const { data: groups, error } = await supabase
    .from("word_groups")
    .select("id, title, status, voice_id")
    .order("title", { ascending: true });
  if (error) {
    console.error("Failed to load word groups:", error.message);
    process.exit(1);
  }
  const overrides = (groups ?? []).filter((g) => g.voice_id && g.voice_id !== WORD_LIST_VOICE_ID);
  console.log(
    `\nWord groups: ${groups?.length ?? 0} (${overrides.length} with a non-Emma override)`,
  );
  for (const g of overrides) {
    problems.push(
      `Group "${g.title ?? g.id}" (${g.status}) overrides the voice with ${g.voice_id}.`,
    );
  }

  // 3. Emma clip coverage for every word of every published group.
  let totalWords = 0;
  let totalMissing = 0;
  for (const group of (groups ?? []).filter((g) => g.status === "published")) {
    const { data: words } = await supabase
      .from("vocabulary_words")
      .select("id, target_word")
      .eq("group_id", group.id);
    const hashByWord = new Map(
      (words ?? []).map((w) => [
        w.target_word,
        cacheKeyParts(w.target_word, WORD_LIST_VOICE_ID, WORD_LIST_GENERATION_VERSION).textHash,
      ]),
    );
    const { data: rows } = await supabase
      .from("voice_audio_cache")
      .select("text_hash")
      .eq("voice_id", WORD_LIST_VOICE_ID)
      .eq("generation_version", WORD_LIST_GENERATION_VERSION)
      .eq("status", "ready")
      .not("audio_url", "is", null)
      .in("text_hash", [...new Set(hashByWord.values())]);
    const ready = new Set((rows ?? []).map((r) => r.text_hash));
    const missing = [...hashByWord].filter(([, hash]) => !ready.has(hash)).map(([word]) => word);

    totalWords += hashByWord.size;
    totalMissing += missing.length;
    if (missing.length > 0) {
      const sample = missing.slice(0, 5).join(", ");
      console.log(
        `- ${group.title ?? group.id}: ${missing.length}/${hashByWord.size} words have no Emma clip (${sample}${missing.length > 5 ? ", …" : ""})`,
      );
    }
  }
  console.log(
    `\nEmma clip coverage: ${totalWords - totalMissing}/${totalWords} words in published groups.`,
  );
  if (totalMissing > 0) {
    problems.push(
      `${totalMissing} word(s) have no ready Emma clip — run scripts/generate-word-list-emma-voice.ts.`,
    );
  }

  console.log("\n=== Result ===");
  if (problems.length === 0) {
    console.log("All Word Lists are spoken by Emma (Edge-TTS).");
    return;
  }
  for (const p of problems) console.log(`✗ ${p}`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
