"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import { filterNewRatings, parseCsv, ratingKey, rowsToRatings } from "@/lib/feedback/sheet-import";
import { RATINGS_PROOF_TAG } from "@/lib/stats/public-ratings";
import { createClient } from "@/lib/supabase/server";

/** A sheet of a few thousand ratings is well under this; it keeps one request small. */
const MAX_CSV_LENGTH = 900_000;
const CHUNK_SIZE = 200;
const PAGE_SIZE = 1000;

export interface RatingsImportResult {
  error?: string;
  /** Ratings found in the file. */
  read?: number;
  /** Of those, already in the table. */
  alreadyThere?: number;
  /** Of those, new. */
  toAdd?: number;
  /** Set only by a real import: how many were added. */
  added?: number;
  /** Rows that couldn't be read (the first few), with their line number in the file. */
  skipped?: { line: number; reason: string }[];
  skippedCount?: number;
}

/**
 * Brings the ratings from the old Google Sheet (as a downloaded CSV) into
 * app_ratings. `dryRun` only reports what would happen. Safe to repeat: a
 * rating already in the table (same browser id, same moment) is never added
 * twice. Rows are inserted with the admin's own session — the table's admin
 * policy allows exactly this — so no service-role key is involved.
 */
export async function importRatingsCsv(
  csv: string,
  utcOffset: string,
  dryRun: boolean,
): Promise<RatingsImportResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  if (!csv.trim()) return { error: "That file is empty." };
  if (csv.length > MAX_CSV_LENGTH) return { error: "That file is too large to import in one go." };
  if (!/^[+-]\d{2}:\d{2}$/.test(utcOffset.trim())) {
    return { error: "Enter the time zone like +03:00 (Iraq) or +00:00." };
  }

  const { records, skipped } = rowsToRatings(parseCsv(csv), utcOffset.trim());
  if (records.length === 0) {
    return {
      error:
        skipped.length > 0
          ? `No readable ratings. First problem — line ${skipped[0]!.line}: ${skipped[0]!.reason}.`
          : "No ratings found in that file.",
    };
  }

  const supabase = await createClient();

  const existing = new Set<string>();
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("app_ratings")
      .select("anon_id, created_at")
      .order("created_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) return { error: "Couldn't read the existing ratings. Is the migration applied?" };
    for (const row of data ?? []) existing.add(ratingKey(row.anon_id, row.created_at));
    if ((data ?? []).length < PAGE_SIZE) break;
  }

  const fresh = filterNewRatings(records, existing);
  const summary: RatingsImportResult = {
    read: records.length,
    alreadyThere: records.length - fresh.length,
    toAdd: fresh.length,
    skipped: skipped.slice(0, 10),
    skippedCount: skipped.length,
  };
  if (dryRun || fresh.length === 0) return summary;

  let added = 0;
  for (let i = 0; i < fresh.length; i += CHUNK_SIZE) {
    const { error } = await supabase.from("app_ratings").insert(fresh.slice(i, i + CHUNK_SIZE));
    if (error) {
      return {
        ...summary,
        added,
        error: `Stopped after adding ${added} of ${fresh.length}. Run the import again to add the rest.`,
      };
    }
    added += Math.min(CHUNK_SIZE, fresh.length - i);
  }

  void logAdminAction("ratings.imported", "app_rating", null, {
    added,
    alreadyThere: summary.alreadyThere,
    skipped: skipped.length,
  });
  revalidatePath("/admin/ratings");
  revalidatePath("/upgrade");
  revalidateTag(RATINGS_PROOF_TAG);
  return { ...summary, added };
}
