/**
 * Narrates the passages: one clip per line, spoken by the narrator or by the
 * character who says it, saved to the same public voice-audio bucket every other
 * narration lives in, with the URL written onto the line (passage_sentences.audio_url)
 * — so a learner's device just plays a file, nothing is generated while they read.
 *
 * It is the command-line twin of the Generate button in Admin -> Passages and shares
 * its code (src/lib/passages/narration.ts): both read the passage from the database,
 * so the voices are the ones chosen in Admin -> Passages (one for the narrator, one
 * per character — never two the same) and the lines are the ones stored, whether the
 * passage was authored in src/data/passages or added from the admin.
 *
 * Deliberately standalone from the Stories/Books narration pipeline: it reads
 * its settings (the ElevenLabs model and the voice sliders an admin tuned in
 * Admin -> Voice) but never writes them, never touches voice_audio_cache, and
 * never touches a lesson's or book's audio. It only ever adds new files and
 * sets audio_url on passage lines (the ones with no clip yet, unless --force).
 *
 * Small pauses: a line that calls for a beat — a startled "Suddenly, …", a punchline, a
 * reaction — is sent with a pause written into it (ellipses for eleven_v3, a break tag for the
 * older models); see src/lib/passages/narration-pauses.ts. It exists only in the request to
 * the voice: the learner reads the line as written. A line's own `say` or `pause` overrides
 * it, and --dry-run shows exactly what will be sent.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/generate-passage-audio.ts --dry-run
 *   npx tsx --env-file=.env.local scripts/generate-passage-audio.ts --key-file=<file with the ElevenLabs key>
 * Options:
 *   --only=<slug>      just that passage
 *   --force            regenerate lines that already have a clip
 *   --limit=<n>        stop after n lines (a quick listen-test)
 *   --speed=<0.7-1.2>  override the speed slider for this run (default: the admin's setting)
 *   --concurrency=<n>  parallel requests (default 3)
 *   --dry-run          list what would be generated and how many characters it costs, with the
 *                      lines that get a small pause shown as they will be sent (the dots are the pause)
 *   --no-pauses        send every line exactly as spoken, without the small pauses (see below)
 * The key is read from ELEVENLABS_API_KEY, or from the file given with --key-file
 * (its content is never printed).
 */
import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

import {
  loadPassageNarration,
  planPassageNarration,
  runNarration,
} from "../src/lib/passages/narration";
import { narrationCost } from "../src/lib/passages/narration-plan";
import type { NarrationJob, NarrationVoice } from "../src/lib/passages/narration-plan";
import { createElevenLabsProvider } from "../src/lib/voice/providers/elevenlabs";
import type { Database } from "../src/types/database";

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
const noPauses = args.includes("--no-pauses");
const force = args.includes("--force");
const only = option("only");
const limit = Number(option("limit") ?? "0") || Infinity;
const concurrency = Math.min(Math.max(Number(option("concurrency") ?? "3") || 3, 1), 5);
const speedOverride = option("speed") ? Number(option("speed")) : undefined;

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
  let passageIds: string[];
  if (only) {
    passageIds = [only];
  } else {
    const { data, error } = await supabase
      .from("passages")
      .select("id")
      .order("level")
      .order("order_index");
    if (error) fail(`Couldn't read the passages: ${error.message}`);
    passageIds = (data ?? []).map((row) => row.id);
  }
  if (passageIds.length === 0) fail("No passages.");

  interface Todo {
    narration: NonNullable<Awaited<ReturnType<typeof loadPassageNarration>>>;
    jobs: NarrationJob[];
    voiceFor: Map<string, NarrationVoice>;
  }
  const todos: Todo[] = [];
  let remaining = limit;
  for (const passageId of passageIds) {
    const narration = await loadPassageNarration(supabase, passageId);
    if (!narration) fail(`No passage "${passageId}".`);
    if (narration.sentences.length === 0) continue;
    const plan = planPassageNarration(narration, { force, pauses: !noPauses });
    // One voice reads the story and every character has one of their own: a passage set up
    // otherwise is refused, not narrated with a voice nobody chose.
    if (plan.problems.length > 0) fail(`${passageId}: ${plan.problems.join(" ")}`);
    const jobs = plan.jobs.slice(0, remaining);
    remaining -= jobs.length;
    if (jobs.length > 0) todos.push({ narration, jobs, voiceFor: plan.voiceFor });
    if (remaining <= 0) break;
  }

  const allJobs = todos.flatMap((todo) => todo.jobs);
  const settings = todos[0]?.narration.settings;
  const { lines, characters } = narrationCost(allJobs);
  const speed = speedOverride ?? settings?.speed;
  console.log(
    `${lines} line(s) to narrate (${characters} characters)${settings ? `, model ${settings.model}, speed ${speed}` : ""}${force ? ", forcing" : ""}.`,
  );
  const byVoice = new Map<string, number>();
  for (const todo of todos) {
    for (const job of todo.jobs) {
      const name = todo.voiceFor.get(job.role)?.name ?? job.role;
      byVoice.set(name, (byVoice.get(name) ?? 0) + 1);
    }
  }
  console.log("voices: " + [...byVoice].map(([name, count]) => `${name} x${count}`).join(", "));

  // The small pauses, as they will be sent — the dots (or break tags) are the pause. Only an admin
  // ever sees this: a learner reads the lines as written.
  const paused = allJobs.filter((job) => job.text !== job.plain);
  if (paused.length > 0) {
    console.log(`\n${paused.length} of ${lines} line(s) get a small pause:`);
    for (const job of paused) console.log(`  ~ ${job.sentenceId}: ${job.text}`);
  }

  if (dryRun || lines === 0) {
    console.log(dryRun ? "\nDRY RUN — nothing was generated." : "Nothing to do.");
    return;
  }

  const provider = createElevenLabsProvider(readApiKey());
  let done = 0;
  const failures: string[] = [];
  for (const todo of todos) {
    const outcome = await runNarration({
      supabase,
      provider,
      settings: todo.narration.settings,
      jobs: todo.jobs,
      voiceFor: todo.voiceFor,
      concurrency,
      speed: speedOverride,
      onProgress: (handled, total) => {
        if (handled % 10 === 0 || handled === total) {
          console.log(`  ${todo.narration.passageId}: ${handled}/${total}`);
        }
      },
    });
    done += outcome.done;
    for (const failure of outcome.failed) failures.push(`${failure.id}: ${failure.error}`);
    if (outcome.fatal) fail(`${outcome.fatal}\nNarrated ${done} of ${lines} line(s) before it.`);
  }

  console.log(`Narrated ${done} of ${lines} line(s).`);
  if (failures.length > 0) {
    console.error(`${failures.length} line(s) failed (re-run to retry just those):`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
