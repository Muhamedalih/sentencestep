/**
 * One-time import of the ratings gathered on the old Google Sheet into the
 * `app_ratings` table (see supabase/migrations/20250331000000_app_ratings.sql),
 * so Admin > Ratings shows the whole history and the best of it can be put on
 * the site. Not part of the running app, and not wired into `npm test` — it
 * writes to the real database with the service-role key.
 *
 * 1. In the sheet: File > Download > Comma-separated values (.csv).
 * 2. Apply the app_ratings migration to the Supabase project first.
 * 3. Try it without writing anything:
 *      npx tsx --env-file=.env.local scripts/import-app-ratings.ts ratings.csv --dry-run
 * 4. Then for real:
 *      npx tsx --env-file=.env.local scripts/import-app-ratings.ts ratings.csv
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
 * environment. Safe to run again: a rating already in the table (same browser
 * id and same moment) is left alone, so only new rows are added.
 *
 * Dates in the sheet are read as day/month/year in Iraq time (+03:00); pass
 * `--utc-offset=+00:00` (or whichever the sheet uses) if yours differs. The
 * sheet never kept an account id or an email, so imported ratings can be
 * listed, filtered and shown on the site but not answered.
 */
import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

import { parseCsv, rowsToRatings } from "../src/lib/feedback/sheet-import";
import type { Database } from "../src/types/database";

const CHUNK_SIZE = 200;
const PAGE_SIZE = 1000;

const args = process.argv.slice(2);
const file = args.find((arg) => !arg.startsWith("--"));
const dryRun = args.includes("--dry-run");
const utcOffset = args.find((arg) => arg.startsWith("--utc-offset="))?.split("=")[1] ?? "+03:00";

if (!file) {
  console.error(
    "Usage: npx tsx --env-file=.env.local scripts/import-app-ratings.ts <ratings.csv> [--dry-run] [--utc-offset=+03:00]",
  );
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** What identifies a rating that is already in the table: the browser id plus the exact moment. */
function keyOf(anonId: string | undefined, createdAt: string | undefined): string {
  return `${anonId ?? ""}|${new Date(createdAt ?? 0).toISOString()}`;
}

async function existingKeys(): Promise<Set<string>> {
  const keys = new Set<string>();
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("app_ratings")
      .select("anon_id, created_at")
      .order("created_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    for (const row of data ?? []) keys.add(keyOf(row.anon_id, row.created_at));
    if ((data ?? []).length < PAGE_SIZE) return keys;
  }
}

async function main() {
  const { records, skipped } = rowsToRatings(parseCsv(readFileSync(file!, "utf8")), utcOffset);
  for (const { line, reason } of skipped) console.warn(`Skipped line ${line}: ${reason}`);

  const known = await existingKeys();
  const fresh = records.filter((record) => {
    const key = keyOf(record.anon_id, record.created_at);
    if (known.has(key)) return false;
    known.add(key); // the same rating twice inside the file is still one rating
    return true;
  });

  console.log(
    `${records.length} ratings read, ${records.length - fresh.length} already in the table, ${fresh.length} to add, ${skipped.length} skipped.`,
  );
  if (dryRun || fresh.length === 0) {
    if (dryRun) console.log("Dry run: nothing was written.");
    return;
  }

  for (let i = 0; i < fresh.length; i += CHUNK_SIZE) {
    const { error } = await supabase.from("app_ratings").insert(fresh.slice(i, i + CHUNK_SIZE));
    if (error) throw error;
    console.log(`Added ${Math.min(i + CHUNK_SIZE, fresh.length)} / ${fresh.length}`);
  }
  console.log("Done.");
}

main().catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
