/**
 * Finds the files in the voice-audio Storage bucket that no database row points
 * at, and — only when asked — deletes them. Built for the ~112k orphaned
 * Edge-TTS clips found in October 2026 (90% of that folder): every generated
 * clip goes up under a fresh random-UUID path and is never removed when its
 * cache row is replaced, deleted or never written, so unreferenced files pile
 * up (see src/lib/voice/orphan-clips.ts for what counts as an orphan).
 *
 * SAFE BY DEFAULT: with no flags this only READS (database rows + a Storage
 * listing) and writes a report under scripts/scratch/ (git-ignored). Nothing is
 * deleted unless you pass --delete, and even then:
 *   - only files older than --min-age-hours (default 24) are eligible, so a
 *     clip uploaded a moment ago, before its row learned the path, is never hit;
 *   - at most --limit files go per run (default 500; 0 = no cap), oldest first,
 *     so the first real run is a small, checkable test;
 *   - the script aborts before deleting anything if any reference query failed
 *     or returned no references at all.
 * Deletion goes through the Storage API in small batches with a pause between
 * them (the project's disk IO budget was already tight), which also removes the
 * storage.objects rows — Supabase blocks deleting those with plain SQL.
 *
 * A file counts as referenced if it is the audio_url of voice_audio_cache,
 * sentences or book_sentences, or the sample_audio_url of voices — the only
 * four columns in the schema that hold a voice-audio URL.
 *
 * Run (reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY):
 *   npx tsx --env-file=.env.local scripts/cleanup-orphan-voice-clips.ts
 *   npx tsx --env-file=.env.local scripts/cleanup-orphan-voice-clips.ts --delete --limit 500
 *   npx tsx --env-file=.env.local scripts/cleanup-orphan-voice-clips.ts --delete --limit 0
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  VOICE_AUDIO_BUCKET,
  bucketPathFromPublicUrl,
  findOrphans,
  groupKey,
  type StoredObject,
} from "@/lib/voice/orphan-clips";

const PAGE_SIZE = 1000;
const DELETE_BATCH_SIZE = 100;
const PAUSE_BETWEEN_PAGES_MS = 150;
const PAUSE_BETWEEN_DELETES_MS = 400;
const HOUR_MS = 60 * 60 * 1000;

const args = process.argv.slice(2);

function optionValue(name: string, fallback: string): string {
  const index = args.indexOf(name);
  return (index !== -1 ? args[index + 1] : undefined) ?? fallback;
}

const shouldDelete = args.includes("--delete");
const minAgeHours = Number(optionValue("--min-age-hours", "24"));
const deleteLimit = Number(optionValue("--limit", "500"));

if (!Number.isFinite(minAgeHours) || minAgeHours < 1) {
  throw new Error("--min-age-hours must be a number of at least 1.");
}
if (!Number.isInteger(deleteLimit) || deleteLimit < 0) {
  throw new Error("--limit must be a whole number (0 means no cap).");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (e.g. --env-file=.env.local).",
  );
}
const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Every voice-audio path any database row points at; throws on any failed read so a partial set never reaches the delete step. */
async function collectReferencedPaths(client: SupabaseClient): Promise<Set<string>> {
  const sources = [
    { table: "voice_audio_cache", column: "audio_url" },
    { table: "sentences", column: "audio_url" },
    { table: "book_sentences", column: "audio_url" },
    { table: "voices", column: "sample_audio_url" },
  ];

  const referenced = new Set<string>();
  for (const { table, column } of sources) {
    let rowsRead = 0;
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await client
        .from(table)
        .select(`id, ${column}`)
        .order("id")
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw new Error(`Reading ${table}.${column} failed: ${error.message}`);

      const rows = (data ?? []) as unknown as Array<Record<string, string | null>>;
      for (const row of rows) {
        const value = row[column];
        const path = value ? bucketPathFromPublicUrl(value) : null;
        if (path) referenced.add(path);
      }
      rowsRead += rows.length;
      if (rows.length < PAGE_SIZE) break;
    }
    console.log(`  ${table}.${column}: ${rowsRead} rows read`);
  }
  return referenced;
}

/** Every file in the bucket, walking folders breadth-first (Storage lists one level at a time). */
async function listBucket(client: SupabaseClient): Promise<StoredObject[]> {
  const bucket = client.storage.from(VOICE_AUDIO_BUCKET);
  const objects: StoredObject[] = [];
  const folders = [""];

  while (folders.length > 0) {
    const prefix = folders.shift()!;
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await bucket.list(prefix, {
        limit: PAGE_SIZE,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) throw new Error(`Listing "${prefix || "/"}" failed: ${error.message}`);

      const entries = data ?? [];
      for (const entry of entries) {
        if (entry.name === ".emptyFolderPlaceholder") continue;
        const path = prefix ? `${prefix}/${entry.name}` : entry.name;
        // Storage reports a folder as an entry with no id.
        if (entry.id === null) {
          folders.push(path);
        } else {
          const size = Number(entry.metadata?.size);
          objects.push({
            path,
            createdAt: entry.created_at ?? null,
            size: Number.isFinite(size) ? size : null,
          });
        }
      }
      console.log(`  listed ${objects.length} files so far (in "${prefix || "/"}")`);
      if (entries.length < PAGE_SIZE) break;
      await sleep(PAUSE_BETWEEN_PAGES_MS);
    }
  }
  return objects;
}

const megabytes = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

async function main() {
  console.log("1/3 Reading every row that can point at a voice clip...");
  const referenced = await collectReferencedPaths(supabase);
  if (referenced.size === 0) {
    throw new Error(
      "No references found at all — refusing to continue (nothing would be safe to delete).",
    );
  }
  console.log(`  ${referenced.size} distinct referenced paths`);

  console.log("2/3 Listing the voice-audio bucket...");
  const objects = await listBucket(supabase);
  if (objects.length === 0) {
    console.log("The bucket is empty — nothing to do.");
    return;
  }

  const stored = new Set(objects.map((object) => object.path));
  const missingFiles = [...referenced].filter((path) => !stored.has(path)).length;

  const {
    orphans,
    tooNew,
    referenced: keptCount,
  } = findOrphans(objects, referenced, {
    now: Date.now(),
    minAgeMs: minAgeHours * HOUR_MS,
  });

  console.log("3/3 Result");
  console.log(`  files in bucket:                    ${objects.length}`);
  console.log(`  referenced (kept):                  ${keptCount}`);
  console.log(`  unreferenced but < ${minAgeHours}h old (kept): ${tooNew}`);
  console.log(`  ORPHANS eligible for deletion:      ${orphans.length}`);
  console.log(`  rows pointing at a missing file:    ${missingFiles} (informational, not touched)`);

  const byGroup = new Map<string, { files: number; bytes: number }>();
  for (const orphan of orphans) {
    const group = byGroup.get(groupKey(orphan.path)) ?? { files: 0, bytes: 0 };
    group.files += 1;
    group.bytes += orphan.size ?? 0;
    byGroup.set(groupKey(orphan.path), group);
  }
  for (const [group, { files, bytes }] of [...byGroup].sort((a, b) => b[1].files - a[1].files)) {
    console.log(`    ${group}: ${files} files, ${megabytes(bytes)}`);
  }

  mkdirSync("scripts/scratch", { recursive: true });
  const reportPath = `scripts/scratch/orphan-voice-clips-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
  writeFileSync(
    reportPath,
    orphans.map((orphan) => `${orphan.createdAt}\t${orphan.size ?? ""}\t${orphan.path}`).join("\n"),
  );
  console.log(`  full list (oldest first): ${reportPath}`);

  if (!shouldDelete) {
    console.log("\nDry run — nothing was deleted. Re-run with --delete to remove files.");
    return;
  }

  const targets = deleteLimit > 0 ? orphans.slice(0, deleteLimit) : orphans;
  console.log(`\nDeleting ${targets.length} of ${orphans.length} orphans, oldest first...`);
  const bucket = supabase.storage.from(VOICE_AUDIO_BUCKET);
  let removed = 0;
  for (let i = 0; i < targets.length; i += DELETE_BATCH_SIZE) {
    const batch = targets.slice(i, i + DELETE_BATCH_SIZE).map((orphan) => orphan.path);
    const { error } = await bucket.remove(batch);
    if (error) {
      console.error(
        `Stopping: removing a batch failed after ${removed} deletions: ${error.message}`,
      );
      process.exitCode = 1;
      return;
    }
    removed += batch.length;
    if (removed % 1000 < DELETE_BATCH_SIZE) console.log(`  removed ${removed}/${targets.length}`);
    await sleep(PAUSE_BETWEEN_DELETES_MS);
  }
  console.log(`Done: removed ${removed} files. ${orphans.length - removed} orphans remain.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
