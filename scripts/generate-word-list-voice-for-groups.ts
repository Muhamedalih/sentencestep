/**
 * Generates the pronunciation clips of the words of the GROUPS NAMED on the command line (published
 * or draft), with the site's Word Lists voice (the free Edge-TTS default, or the group's own voice),
 * exactly as the admin's "generate" button does for one group. Content-addressed by
 * (voice, text hash, generation version) in word-list-voice-generation.ts, so it only ever ADDS
 * clips for words that have none and skips every word that already has one; it never touches or
 * deletes an existing clip, a lesson's audio or a paid provider (Edge-TTS is free).
 *
 * Used for the third expansion's drafts, so an admin can hear them before they are published.
 *
 * Run with: npx tsx --env-file=.env.local scripts/generate-word-list-voice-for-groups.ts kitchen bathroom ...
 */
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../src/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this.");
  process.exit(1);
}

async function main() {
  const groupIds = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
  if (groupIds.length === 0) {
    console.error("Name at least one group id, e.g. kitchen bathroom.");
    process.exit(1);
  }
  const { generateWordGroupVoiceDraft } =
    await import("../src/lib/voice/word-list-voice-generation");
  const supabase = createClient<Database>(url!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let generated = 0;
  let skipped = 0;
  let failed = 0;
  for (const id of groupIds) {
    const outcome = await generateWordGroupVoiceDraft(supabase, id);
    generated += outcome.generated;
    skipped += outcome.skipped;
    failed += outcome.failed;
    console.log(
      `- ${id}: ${outcome.generated} generated, ${outcome.skipped} skipped, ${outcome.failed} failed${outcome.error ? ` (${outcome.error})` : ""}`,
    );
    // Gentle on the unofficial Edge-TTS endpoint, same pause as the one-off Emma backfill.
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  console.log(`\nGenerated ${generated}, skipped ${skipped}, failed ${failed}.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
