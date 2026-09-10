/**
 * One-off backfill: generate every published Word List's pronunciation
 * audio under the new Edge-TTS "Emma" default (WORD_LIST_PROVIDER moved
 * from Cartesia to edge-tts in content-provider-map.ts, 2026-09-10).
 * Content-addressed by (voice_id, text_hash, generation_version) — see
 * word-list-voice-generation.ts — so this only ever adds new
 * edge-tts-en-us-emma cache rows; it never touches or deletes any
 * previously-generated (Cartesia-voiced) word audio.
 *
 * Bypasses the cron sweep's small per-run batch size and the shared daily
 * generation cap (isDailyVoiceGenerationCapReached) on purpose: both exist
 * to guard PAID-provider spend after the September 2026 incident, and
 * Edge-TTS is free and keyless, so there's no spend risk here — just real
 * wall-clock time for ~465 words. Runs sequentially with a tiny delay
 * between groups to stay gentle on the unofficial Edge-TTS endpoint.
 *
 * Run with: npx tsx scripts/generate-word-list-emma-voice.ts
 */
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../src/types/database";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
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
  const { generateWordGroupVoiceDraft } =
    await import("../src/lib/voice/word-list-voice-generation");

  const supabase = createClient<Database>(url!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: groups, error } = await supabase
    .from("word_groups")
    .select("id, title")
    .eq("status", "published")
    .order("updated_at", { ascending: true });
  if (error) {
    console.error("Failed to load word groups:", error.message);
    process.exit(1);
  }

  console.log(`Found ${groups?.length ?? 0} published word groups.`);

  let totalGenerated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  const failures: string[] = [];

  for (const group of groups ?? []) {
    const outcome = await generateWordGroupVoiceDraft(supabase, group.id);
    totalGenerated += outcome.generated;
    totalSkipped += outcome.skipped;
    totalFailed += outcome.failed;
    console.log(
      `- ${group.title ?? group.id}: ${outcome.generated} generated, ${outcome.skipped} skipped, ${outcome.failed} failed${outcome.error ? ` (${outcome.error})` : ""}`,
    );
    if (outcome.error) failures.push(`${group.id}: ${outcome.error}`);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  console.log("\n=== Summary ===");
  console.log(`Generated: ${totalGenerated}`);
  console.log(`Skipped (already ready): ${totalSkipped}`);
  console.log(`Failed: ${totalFailed}`);
  if (failures.length > 0) {
    console.log("\nErrors:");
    for (const f of failures) console.log(`  ${f}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
