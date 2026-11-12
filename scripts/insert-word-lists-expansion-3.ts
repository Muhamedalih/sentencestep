/**
 * Pushes the third Word Lists expansion (16 topics, 400 words: src/data/word-lists/expansion-3.ts)
 * into the live Supabase project, as DRAFTS.
 *
 * A draft is invisible to every learner (the library only lists published topics); an admin sees it
 * in the Word Lists library and on the Words page marked "Draft", and opens the admin preview from
 * it. Publishing is a separate, deliberate step (Admin > Word Lists, or the owner's word); this
 * script never publishes anything. It writes nothing else: no existing group, word, translation,
 * clip or setting is touched (every write is insert-if-absent), and it checks that first.
 *
 * What it writes (only when run with --apply; without it, it only reports):
 *   word_groups            16 rows, status 'draft', is_free false, order_index after the current max
 *   vocabulary_words       400 rows  (id = <group id>-<word>)
 *   content_translations   group title + description in es and tr, each word's hint in es and tr
 *                          (Arabic lives in the title_ar / description_ar / hint_ar columns)
 *
 * IMPORTANT, run it only once the code that reads word lists page by page is live (the commit that
 * added src/lib/supabase/read-all-pages.ts): the table goes from 892 to 1,292 rows, and the OLD
 * library read the whole table in one request, which PostgREST cuts silently at 1,000 rows.
 *
 * Run with: npx tsx --env-file=.env.local scripts/insert-word-lists-expansion-3.ts [--apply]
 */
import { createClient } from "@supabase/supabase-js";

import { EXPANSION_3_GROUPS } from "../src/data/word-lists/expansion-3";
import type { Database } from "../src/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this.");
  process.exit(1);
}
const apply = process.argv.includes("--apply");

const supabase = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PAGE = 1000;

async function readIds(table: "word_groups" | "vocabulary_words"): Promise<Set<string>> {
  const ids = new Set<string>();
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select("id")
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    for (const row of data ?? []) ids.add(row.id);
    if (!data || data.length < PAGE) return ids;
  }
}

async function main() {
  const [groupIds, wordIds] = await Promise.all([
    readIds("word_groups"),
    readIds("vocabulary_words"),
  ]);

  const { data: maxRow, error: maxError } = await supabase
    .from("word_groups")
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maxError) throw maxError;
  const startOrder = maxRow?.order_index ?? 0;

  const clashingGroups = EXPANSION_3_GROUPS.filter((group) => groupIds.has(group.id));
  const newGroups = EXPANSION_3_GROUPS.filter((group) => !groupIds.has(group.id));

  const groupRows = newGroups.map((group, index) => ({
    id: group.id,
    level: group.level,
    order_index: startOrder + index + 1,
    title: group.title,
    title_ar: group.titleAr,
    description: group.description,
    description_ar: group.descriptionAr,
    is_free: false,
    status: "draft" as const,
  }));

  const wordRows = newGroups.flatMap((group) =>
    group.words.map(([word, sentence, hintAr], index) => ({
      id: `${group.id}-${word}`,
      group_id: group.id,
      order_index: index + 1,
      target_word: word,
      sentence,
      hint_ar: hintAr,
    })),
  );
  const clashingWords = wordRows.filter((row) => wordIds.has(row.id));

  const translationRows = newGroups.flatMap((group) => [
    ...(["es", "tr"] as const).flatMap((locale) => [
      {
        content_type: "word_group" as const,
        content_id: group.id,
        field: "title",
        locale,
        value: locale === "es" ? group.titleEs : group.titleTr,
      },
      {
        content_type: "word_group" as const,
        content_id: group.id,
        field: "description",
        locale,
        value: locale === "es" ? group.descriptionEs : group.descriptionTr,
      },
    ]),
    ...group.words.flatMap(([word, , , hintEs, hintTr]) => [
      {
        content_type: "vocabulary_word" as const,
        content_id: `${group.id}-${word}`,
        field: "hint",
        locale: "es" as const,
        value: hintEs,
      },
      {
        content_type: "vocabulary_word" as const,
        content_id: `${group.id}-${word}`,
        field: "hint",
        locale: "tr" as const,
        value: hintTr,
      },
    ]),
  ]);

  console.log(
    `Live now: ${groupIds.size} word groups, ${wordIds.size} words, highest order ${startOrder}.`,
  );
  console.log(
    `To write: ${groupRows.length} draft groups (orders ${startOrder + 1}-${startOrder + groupRows.length}), ${wordRows.length} words, ${translationRows.length} translations.`,
  );
  for (const level of [1, 2, 3]) {
    const names = newGroups.filter((g) => g.level === level).map((g) => g.title);
    console.log(`  level ${level}: ${names.join(", ")}`);
  }
  if (clashingGroups.length > 0) {
    console.log(`Already there (left alone): ${clashingGroups.map((g) => g.id).join(", ")}`);
  }
  if (clashingWords.length > 0) {
    throw new Error(
      `Refusing to run: ${clashingWords.length} word ids already exist (e.g. ${clashingWords[0]?.id}).`,
    );
  }
  if (!apply) {
    console.log("Dry run: nothing written. Run again with --apply to write.");
    return;
  }
  if (groupRows.length === 0) {
    console.log("Nothing to write.");
    return;
  }

  // Groups first (words point at them), then the words, then the translations. Insert-if-absent
  // everywhere: a second run, or an admin's edit made in between, is never overwritten.
  const { error: groupError } = await supabase
    .from("word_groups")
    .upsert(groupRows, { onConflict: "id", ignoreDuplicates: true });
  if (groupError) throw groupError;

  for (let i = 0; i < wordRows.length; i += 200) {
    const { error } = await supabase
      .from("vocabulary_words")
      .upsert(wordRows.slice(i, i + 200), { onConflict: "id", ignoreDuplicates: true });
    if (error) throw error;
  }

  for (let i = 0; i < translationRows.length; i += 200) {
    const { error } = await supabase
      .from("content_translations")
      .upsert(translationRows.slice(i, i + 200), {
        onConflict: "content_type,content_id,field,locale",
        ignoreDuplicates: true,
      });
    if (error) throw error;
  }

  const [groupsAfter, wordsAfter] = await Promise.all([
    readIds("word_groups"),
    readIds("vocabulary_words"),
  ]);
  console.log(`Written. Now live: ${groupsAfter.size} word groups, ${wordsAfter.size} words.`);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
