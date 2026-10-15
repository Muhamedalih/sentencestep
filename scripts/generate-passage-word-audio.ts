/**
 * Pronunciation clips for the words of every passage's word lesson, made with
 * exactly the pipeline Word Lists already uses (generateWordGroupVoiceDraft —
 * the site's default word voice, content-addressed, never regenerating a word
 * that already has a clip). The groups are still DRAFT until the Passages
 * switch publishes them, and the background sweep only visits published
 * groups, so without this their words would have no recorded clip on the day
 * they are published; run it once after scripts/insert-passages.ts.
 *
 * Run with: npx tsx --env-file=.env.local scripts/generate-passage-word-audio.ts
 */
import { createClient } from "@supabase/supabase-js";

import { PASSAGE_SEEDS } from "../src/data/passages";
import { wordGroupIdFor } from "../src/lib/passages/ids";
import { generateWordGroupVoiceDraft } from "../src/lib/voice/word-list-voice-generation";
import type { Database } from "../src/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (use --env-file=.env.local).",
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  let generated = 0;
  let skipped = 0;
  let failed = 0;
  for (const seed of PASSAGE_SEEDS) {
    const groupId = wordGroupIdFor(seed.slug);
    const outcome = await generateWordGroupVoiceDraft(supabase, groupId);
    generated += outcome.generated;
    skipped += outcome.skipped;
    failed += outcome.failed;
    console.log(
      `${groupId}: generated ${outcome.generated}, already had ${outcome.skipped}, failed ${outcome.failed}${
        outcome.error ? ` — ${outcome.error}` : ""
      }`,
    );
  }
  console.log(`Done. generated ${generated}, skipped ${skipped}, failed ${failed}.`);
  if (failed > 0) process.exit(1);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
