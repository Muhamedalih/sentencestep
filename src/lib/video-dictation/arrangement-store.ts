import { unstable_cache } from "next/cache";

import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/service-role";

import { sanitizeArrangement } from "./arrange";
import type { VideoArrangement } from "./arrange";
import { getVideoLessons } from "./content";

/** Revalidated by the save and reset actions, so a change shows at once instead of after the expiry below. */
export const VIDEO_ARRANGEMENT_CACHE_TAG = "video-arrangement";

/** The table is not there yet (migration 20250353000000 not applied): PostgREST says PGRST205, Postgres 42P01. */
export function isMissingTable(error: { code?: string } | null | undefined): boolean {
  return error?.code === "PGRST205" || error?.code === "42P01";
}

async function readSections(): Promise<unknown> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("video_arrangement")
    .select("sections")
    .eq("id", "library")
    .maybeSingle();
  // No table yet is the same as nothing saved: the default order (and the answer is cached like any other).
  if (error && isMissingTable(error)) return null;
  if (error) throw error;
  return data?.sections ?? null;
}

/**
 * The stored row, share-cached across requests: one small row the same for every visitor (the library
 * and every "next video" read it, and it changes only when an Admin saves). Throws on a read error so a
 * failure is never cached.
 */
const readSectionsCached = unstable_cache(readSections, ["video-arrangement"], {
  tags: [VIDEO_ARRANGEMENT_CACHE_TAG],
  revalidate: 60,
});

/**
 * The arrangement an Admin saved, or null when there is none (the library then uses its default order).
 * `fresh` skips the cache. Anything that goes wrong (no project linked, the table not created yet, a
 * database error, a row that is not an arrangement) reads as "none saved", never as an error: the page
 * always has an order to show.
 */
export async function getVideoArrangement(
  options: { fresh?: boolean } = {},
): Promise<VideoArrangement | null> {
  if (!isServiceRoleConfigured()) return null;
  try {
    const sections = options.fresh ? await readSections() : await readSectionsCached();
    if (sections === null || sections === undefined) return null;
    return sanitizeArrangement({ sections }, new Set(getVideoLessons().map((lesson) => lesson.id)));
  } catch (error) {
    console.error("[video] couldn't read the saved arrangement; the default order is used", error);
    return null;
  }
}
