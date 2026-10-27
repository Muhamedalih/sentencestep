import { unstable_cache } from "next/cache";

import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/service-role";

/**
 * The catalog's sentences, for the review form that asks a word in ANOTHER sentence: every sentence of
 * a published lesson or story and every line of a published passage, as plain English strings. It is
 * small (about 2,800 sentences) and read with the service role (the lines of a passage are readable
 * by admins only through RLS), so it is kept for an hour like the other site-wide counts instead of
 * being searched per learner; a round then picks from it in memory.
 *
 * Only the English text leaves this module, never a translation or an id, and nothing here says
 * where a sentence came from.
 */

const PAGE = 1000;
/** Far beyond the catalog; the cap only keeps a bug from looping. */
const MAX_PAGES = 20;

async function readCatalogSentences(): Promise<string[]> {
  if (!isServiceRoleConfigured()) return [];
  const supabase = createServiceRoleClient();
  const [lessons, passages, sections] = await Promise.all([
    supabase.from("lessons").select("id").eq("status", "published"),
    supabase.from("passages").select("id").eq("status", "published"),
    supabase.from("passage_sections").select("id, passage_id"),
  ]);
  if (lessons.error) throw lessons.error;
  if (passages.error) throw passages.error;
  if (sections.error) throw sections.error;

  const lessonIds = new Set(lessons.data.map((row) => row.id));
  const passageIds = new Set(passages.data.map((row) => row.id));
  const sectionIds = new Set(
    sections.data.filter((row) => passageIds.has(row.passage_id)).map((row) => row.id),
  );

  const found = new Set<string>();
  // A plain select stops silently at 1000 rows, so both tables are read page by page.
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await supabase
      .from("sentences")
      .select("lesson_id, en")
      .order("id", { ascending: true })
      .range(page * PAGE, page * PAGE + PAGE - 1);
    if (error) throw error;
    for (const row of data) if (lessonIds.has(row.lesson_id)) found.add(row.en);
    if (data.length < PAGE) break;
  }
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await supabase
      .from("passage_sentences")
      .select("section_id, en")
      .order("id", { ascending: true })
      .range(page * PAGE, page * PAGE + PAGE - 1);
    if (error) throw error;
    for (const row of data) if (sectionIds.has(row.section_id)) found.add(row.en);
    if (data.length < PAGE) break;
  }
  return [...found];
}

/** A failed read throws, and unstable_cache does not keep a throw: the next round simply tries again. */
const cachedCatalogSentences = unstable_cache(readCatalogSentences, ["word-bank-sentences-v1"], {
  revalidate: 3600,
});

/** Every catalog sentence, or none when they cannot be read (the review then asks by meaning and by sound, never failing). */
export async function loadCatalogSentences(): Promise<string[]> {
  try {
    return await cachedCatalogSentences();
  } catch (error) {
    console.error("[word-bank] reading the catalog's sentences failed", error);
    return [];
  }
}
