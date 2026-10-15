/**
 * Narrates the passages: one clip per line, spoken by the narrator or by the
 * character who says it (see PassageSeed.cast and PassageVoiceAlias), saved to
 * the same public voice-audio bucket every other narration lives in, with the
 * URL written onto the line (passage_sentences.audio_url) — so a learner's
 * device just plays a file, nothing is generated while they read.
 *
 * Deliberately standalone from the Stories/Books narration pipeline: it reads
 * its settings (the ElevenLabs model and the voice sliders an admin tuned in
 * Admin -> Voice) but never writes them, never touches voice_audio_cache, and
 * never touches a lesson's or book's audio. It only ever adds new files and
 * fills in audio_url on passage lines that do not have a clip yet.
 *
 * Which voice speaks a character is decided in the passage's data (an alias
 * such as "zara" or "russ"); the aliases are resolved to registered ElevenLabs
 * voices in VOICE_IDS below. To change a character's voice, change its alias
 * there and re-run with --force --only=<slug>. One voice reads the story and every
 * character has one of their own — the script refuses a passage in which two of them
 * would end up with the same voice.
 *
 * Small pauses: a line that calls for a beat — a startled "Suddenly, …", a punchline, a
 * reaction — is sent with a pause written into it (ellipses for eleven_v3, a break tag for the
 * older models); see src/lib/passages/narration-pauses.ts. It exists only in the request to
 * the voice: the learner reads the line as written. A line's own `say` or `pause` in the data
 * overrides it, and --dry-run shows exactly what will be sent.
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

import { PASSAGE_SEEDS } from "../src/data/passages";
import type { PassageVoiceAlias } from "../src/data/passages";
import { sentenceIdFor } from "../src/lib/passages/ids";
import { narrationTextFor, spokenTextFor } from "../src/lib/passages/spoken-text";
import { createElevenLabsProvider } from "../src/lib/voice/providers/elevenlabs";
import { generatedElevenLabsClipPath, uploadVoiceClip } from "../src/lib/voice/storage";
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

/** The registered ElevenLabs voices (the `voices` table ids) behind each alias. "narrator" is not listed: it is the site's default Stories/Books narration voice, read from elevenlabs_settings. */
const VOICE_IDS: Record<Exclude<PassageVoiceAlias, "narrator">, string> = {
  russ: "elevenlabs-hkfob9iktha85ukxydrt", // Russ — deep, smooth, articulate (male)
  "calm-male": "elevenlabs-vu16bytywswv5jpi8rbc", // Ash — calm, soothing narrative (male)
  zara: "elevenlabs-jqcczkn6knx8bj5tbdyr", // Zara — warm, real-world conversationalist (female)
  ash: "elevenlabs-m3yahyfefktbcim5n7gf", // Ash — conversational, kind and bright (female)
  autumn: "elevenlabs-kovihoyldrqyd4pgalbs", // Autumn Veil — warm and reflective (female)
};

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

interface Job {
  sentenceId: string;
  slug: string;
  /** What is sent to the voice: the spoken text, with the small pause a person would take in it (if any). */
  text: string;
  /** The spoken text without that pause — what `text` is compared with to see which lines got one. */
  plain: string;
  alias: PassageVoiceAlias;
}

async function main() {
  const seeds = PASSAGE_SEEDS.filter((seed) => !only || seed.slug === only);
  if (seeds.length === 0) fail(only ? `No passage with slug "${only}".` : "No passages.");

  const { data: settings, error: settingsError } = await supabase
    .from("elevenlabs_settings")
    .select(
      "model, default_story_voice_id, stability, similarity_boost, style, speed, use_speaker_boost",
    )
    .eq("id", 1)
    .maybeSingle();
  if (settingsError || !settings) fail("Couldn't read elevenlabs_settings.");

  const voiceIds = [
    ...new Set([settings.default_story_voice_id, ...Object.values(VOICE_IDS)]),
  ].filter((id): id is string => Boolean(id));
  const { data: voiceRows, error: voicesError } = await supabase
    .from("voices")
    .select("id, name, source, provider_voice_id")
    .in("id", voiceIds);
  if (voicesError) fail("Couldn't read the voices table.");
  const voiceById = new Map((voiceRows ?? []).map((row) => [row.id, row]));

  function voiceFor(alias: PassageVoiceAlias) {
    const id = alias === "narrator" ? settings!.default_story_voice_id : VOICE_IDS[alias];
    const row = id ? voiceById.get(id) : undefined;
    if (!row || row.source !== "elevenlabs") {
      fail(
        `The "${alias}" voice (${id ?? "none configured"}) is not a registered ElevenLabs voice.`,
      );
    }
    return row;
  }

  // What each passage line needs. Read in batches: every line's id goes into the request's address,
  // and all twenty-six passages at once (hundreds of ids) is longer than the server accepts.
  const sentenceIds = seeds.flatMap((seed) =>
    seed.sections.flatMap((section, sectionIndex) =>
      section.lines.map((_line, lineIndex) =>
        sentenceIdFor(seed.slug, sectionIndex + 1, lineIndex + 1),
      ),
    ),
  );
  const sentenceRows: { id: string; en: string; audio_url: string | null }[] = [];
  for (let from = 0; from < sentenceIds.length; from += 100) {
    const { data, error } = await supabase
      .from("passage_sentences")
      .select("id, en, audio_url")
      .in("id", sentenceIds.slice(from, from + 100));
    if (error) fail(`Couldn't read passage_sentences: ${error.message}`);
    sentenceRows.push(...(data ?? []));
  }
  const rowById = new Map(sentenceRows.map((row) => [row.id, row]));

  const jobs: Job[] = [];
  let missingRows = 0;
  for (const seed of seeds) {
    seed.sections.forEach((section, sectionIndex) => {
      section.lines.forEach((line, lineIndex) => {
        const sentenceId = sentenceIdFor(seed.slug, sectionIndex + 1, lineIndex + 1);
        const row = rowById.get(sentenceId);
        if (!row) {
          missingRows += 1;
          return;
        }
        if (row.audio_url && !force) return;
        jobs.push({
          sentenceId,
          slug: seed.slug,
          // The pauses are decided here, from the line and the one before it, and live only in this
          // request: the learner reads the line as written (see src/lib/passages/narration-pauses.ts).
          text: narrationTextFor(line, {
            model: settings!.model,
            previousEn: section.lines[lineIndex - 1]?.en,
            pauses: !noPauses,
          }),
          plain: spokenTextFor(line),
          alias: line.who ? (seed.cast[line.who] ?? "narrator") : "narrator",
        });
      });
    });
  }
  if (missingRows > 0) {
    fail(
      `${missingRows} line(s) are not in the database yet — run scripts/insert-passages.ts first.`,
    );
  }

  const todo = jobs.slice(0, limit);
  const characters = todo.reduce((sum, job) => sum + job.text.length, 0);
  const speed = speedOverride ?? settings.speed;
  console.log(
    `${todo.length} line(s) to narrate (${characters} characters), model ${settings.model}, speed ${speed}${force ? ", forcing" : ""}.`,
  );
  const byAlias = new Map<string, number>();
  for (const job of todo) byAlias.set(job.alias, (byAlias.get(job.alias) ?? 0) + 1);
  console.log(
    "voices: " +
      [...byAlias]
        .map(
          ([alias, count]) => `${alias} (${voiceFor(alias as PassageVoiceAlias).name}) x${count}`,
        )
        .join(", "),
  );

  // One voice reads the story and every character has one of their own: no two roles of a passage
  // may end up with the same ElevenLabs voice (the narrator's own default included).
  for (const seed of seeds) {
    const roles = new Map<string, string>();
    roles.set("the narrator", voiceFor("narrator").provider_voice_id);
    for (const [name, alias] of Object.entries(seed.cast)) {
      if (alias === "narrator") continue;
      roles.set(name, voiceFor(alias).provider_voice_id);
    }
    const owners = new Map<string, string>();
    for (const [role, voiceId] of roles) {
      const other = owners.get(voiceId);
      if (other) {
        fail(
          `${seed.slug}: ${role} and ${other} would speak with the same voice — give each their own.`,
        );
      }
      owners.set(voiceId, role);
    }
  }

  // The small pauses, as they will be sent — the dots (or break tags) are the pause. Only an admin
  // ever sees this: a learner reads the lines as written.
  const paused = todo.filter((job) => job.text !== job.plain);
  if (paused.length > 0) {
    console.log(`\n${paused.length} of ${todo.length} line(s) get a small pause:`);
    for (const job of paused) console.log(`  ~ ${job.sentenceId}: ${job.text}`);
  }

  if (dryRun || todo.length === 0) {
    console.log(dryRun ? "\nDRY RUN — nothing was generated." : "Nothing to do.");
    return;
  }

  const provider = createElevenLabsProvider(readApiKey());
  const voiceSettings = {
    stability: settings.stability,
    similarityBoost: settings.similarity_boost,
    style: settings.style,
    speed,
    useSpeakerBoost: settings.use_speaker_boost,
  };

  let done = 0;
  const failures: string[] = [];

  async function runJob(job: Job): Promise<void> {
    const voice = voiceFor(job.alias);
    let lastError = "";
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const { audio } = await provider.synthesize({
          text: job.text,
          voiceId: voice.provider_voice_id,
          model: settings!.model,
          voiceSettings,
        });
        const audioUrl = await uploadVoiceClip(generatedElevenLabsClipPath(voice.id), audio);
        const { error } = await supabase
          .from("passage_sentences")
          .update({ audio_url: audioUrl, updated_at: new Date().toISOString() })
          .eq("id", job.sentenceId);
        if (error) throw new Error(`saving the clip URL failed: ${error.message}`);
        done += 1;
        if (done % 10 === 0 || done === todo.length) console.log(`  ${done}/${todo.length}`);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        // A payment/permission problem will not fix itself by retrying: stop the whole run.
        if (/401|402|payment|quota/i.test(lastError))
          fail(`ElevenLabs refused the request: ${lastError}`);
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      }
    }
    failures.push(`${job.sentenceId}: ${lastError}`);
  }

  // A small worker pool: `concurrency` requests in flight at a time.
  let next = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (next < todo.length) {
        const job = todo[next++]!;
        await runJob(job);
      }
    }),
  );

  console.log(`Narrated ${done} of ${todo.length} line(s).`);
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
