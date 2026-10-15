/**
 * Pushes the authored passages (src/data/passages) into the live Supabase
 * project: each passage with its parts, lines and questions, plus a DRAFT
 * Word Lists group made from its words — the lesson the learner is handed at
 * the end of the passage.
 *
 * Safe to re-run, and built to be: every row is keyed by a readable slug id
 * (src/lib/passages/ids.ts), so a second run updates instead of duplicating.
 * What a re-run never touches:
 *   - a passage's `status` and `is_free` (an admin who held one back, or made one
 *     Premium, keeps it so), nor the voices an admin chose for its characters (they are
 *     seeded from the cast only when missing — see passage_speaker_voices);
 *   - a word group's `status`, order and anything an admin edited in Word
 *     Lists (the group and its words are only INSERTED when missing) — a draft
 *     group stays draft until the Passages switch publishes it (see
 *     syncPassageWordGroups);
 *   - a line's narrated clip, as long as that line's English did not change
 *     (a changed line loses its clip, so the audio script regenerates exactly
 *     it and nothing stale is ever played).
 * Lines, parts and questions that exist in the database but no longer in the
 * authored data are removed.
 *
 * Run with:
 *   npx tsx --env-file=.env.local scripts/insert-passages.ts            (writes)
 *   npx tsx --env-file=.env.local scripts/insert-passages.ts --dry-run  (reports only)
 *   npx tsx --env-file=.env.local scripts/insert-passages.ts --only=my-cat-is-my-boss
 */
import { createClient } from "@supabase/supabase-js";

import { PASSAGE_SEEDS } from "../src/data/passages";
import { passageIdFor, wordGroupIdFor } from "../src/lib/passages/ids";
import {
  passageFieldsFor,
  sectionRowsFor,
  sentenceRowsFor,
  speakerVoiceRowsFor,
  wordGroupRowFor,
  wordRowsFor,
} from "../src/lib/passages/seed-rows";
import { validatePassageSet } from "../src/lib/passages/validate";
import { NARRATOR_ROLE } from "../src/lib/passages/voice-aliases";
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

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const only = args.find((arg) => arg.startsWith("--only="))?.slice("--only=".length);

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

type QueryResult<T> = PromiseLike<{
  data: T | null;
  error: { message: string; code?: string } | null;
}>;

/** Runs a query that must succeed and returns its rows (an empty list when there are none). */
async function must<T>(label: string, query: QueryResult<T[]>): Promise<T[]> {
  const { data, error } = await query;
  if (error) fail(`${label} failed: ${error.message}${error.code ? ` (${error.code})` : ""}`);
  return data ?? [];
}

/** Same, for a query that returns at most one row (maybeSingle). */
async function mustMaybe<T>(label: string, query: QueryResult<T>): Promise<T | null> {
  const { data, error } = await query;
  if (error) fail(`${label} failed: ${error.message}${error.code ? ` (${error.code})` : ""}`);
  return data;
}

async function main() {
  const seeds = PASSAGE_SEEDS.filter((seed) => !only || seed.slug === only);
  if (seeds.length === 0) fail(only ? `No passage with slug "${only}".` : "No passages to insert.");

  // Every rule in src/lib/passages/validate.ts, on the WHOLE set — an authoring
  // mistake stops here, before anything is written.
  const problems = validatePassageSet(PASSAGE_SEEDS);
  if (problems.length > 0) {
    console.error(`The authored passages have ${problems.length} problem(s):`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }

  // A word that is already taught by another Word Lists group is a duplicate
  // lesson for the learner — reported, and stops the run unless told otherwise.
  const ownGroupIds = new Set(PASSAGE_SEEDS.map((seed) => wordGroupIdFor(seed.slug)));
  const existingWords = await must(
    "reading existing words",
    supabase.from("vocabulary_words").select("group_id, target_word"),
  );
  const takenBy = new Map<string, string>();
  for (const row of existingWords) {
    if (!ownGroupIds.has(row.group_id)) takenBy.set(row.target_word.toLowerCase(), row.group_id);
  }
  const clashes = seeds.flatMap((seed) =>
    seed.words
      .filter((word) => takenBy.has(word.word))
      .map(
        (word) =>
          `${seed.slug}: "${word.word}" is already in Word Lists group "${takenBy.get(word.word)}"`,
      ),
  );
  if (clashes.length > 0 && !args.includes("--allow-duplicate-words")) {
    console.error("These words already exist in other Word Lists groups:");
    for (const clash of clashes) console.error(`  - ${clash}`);
    console.error("Change the word in the passage's data, or re-run with --allow-duplicate-words.");
    process.exit(1);
  }

  // Which of this run's rows already exist (so a re-run updates and keeps what it must).
  const passageIds = seeds.map((seed) => passageIdFor(seed.slug));
  const existingPassages = await must(
    "reading existing passages",
    supabase.from("passages").select("id, status").in("id", passageIds),
  );
  const existingPassageIds = new Set(existingPassages.map((row) => row.id));

  const groupIds = seeds.map((seed) => wordGroupIdFor(seed.slug));
  const existingGroups = await must(
    "reading existing word groups",
    supabase.from("word_groups").select("id").in("id", groupIds),
  );
  const existingGroupIds = new Set(existingGroups.map((row) => row.id));

  const existingSections = await must(
    "reading existing parts",
    supabase.from("passage_sections").select("id, passage_id").in("passage_id", passageIds),
  );
  const sectionIdsInDb = existingSections.map((row) => row.id);
  const existingSentences =
    sectionIdsInDb.length === 0
      ? []
      : await must(
          "reading existing lines",
          supabase
            .from("passage_sentences")
            .select("id, section_id, en, audio_url")
            .in("section_id", sectionIdsInDb),
        );
  const existingSentenceById = new Map(existingSentences.map((row) => [row.id, row]));
  const existingVoices = await must(
    "reading existing character voices",
    supabase
      .from("passage_speaker_voices")
      .select("passage_id, speaker")
      .in("passage_id", passageIds),
  );

  // word_groups.order_index is globally unique: new groups go after the current maximum.
  const maxRow = await mustMaybe<{ order_index: number }>(
    "reading the highest word group order",
    supabase
      .from("word_groups")
      .select("order_index")
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
  let nextGroupOrder = (maxRow?.order_index ?? 0) + 1;

  let newPassages = 0;
  let updatedPassages = 0;
  let newGroups = 0;
  let sectionCount = 0;
  let lineCount = 0;
  let linesWithClip = 0;
  let linesLosingClip = 0;
  let removedSections = 0;
  let removedLines = 0;
  let newVoices = 0;
  let removedVoices = 0;

  for (const seed of seeds) {
    const passageId = passageIdFor(seed.slug);
    const groupId = wordGroupIdFor(seed.slug);

    // 1. The word lesson (a draft group + its words), only when missing.
    if (!existingGroupIds.has(groupId)) {
      newGroups += 1;
      if (!dryRun) {
        await must(
          `inserting word group ${groupId}`,
          // A draft: hidden from learners until the Passages switch publishes it.
          supabase
            .from("word_groups")
            .insert(wordGroupRowFor(seed, nextGroupOrder, true))
            .select("id"),
        );
      }
      nextGroupOrder += 1;
    }
    if (!dryRun) {
      await must(
        `inserting words of ${groupId}`,
        supabase
          .from("vocabulary_words")
          .upsert(wordRowsFor(seed), { onConflict: "id", ignoreDuplicates: true })
          .select("id"),
      );
    }

    // 2. The passage itself. `status` and `is_free` are only set on a brand-new row: after that
    // they are the admin's (Admin -> Passages).
    const passageFields = { ...passageFieldsFor(seed), updated_at: new Date().toISOString() };
    if (existingPassageIds.has(passageId)) {
      updatedPassages += 1;
      if (!dryRun) {
        await must(
          `updating passage ${passageId}`,
          supabase.from("passages").update(passageFields).eq("id", passageId).select("id"),
        );
      }
    } else {
      newPassages += 1;
      if (!dryRun) {
        await must(
          `inserting passage ${passageId}`,
          supabase
            .from("passages")
            .insert({ id: passageId, status: "published", is_free: true, ...passageFields })
            .select("id"),
        );
      }
    }

    // 3. Parts and their questions.
    const sectionRows = sectionRowsFor(seed).map((row) => ({
      ...row,
      updated_at: new Date().toISOString(),
    }));
    sectionCount += sectionRows.length;

    // 4. Lines. A line keeps its clip only while its English is unchanged.
    const sentenceRows = sentenceRowsFor(seed).map((row) => {
      const previous = existingSentenceById.get(row.id);
      const keepClip = Boolean(previous && previous.en === row.en && previous.audio_url);
      if (keepClip) linesWithClip += 1;
      else if (previous?.audio_url) linesLosingClip += 1;
      return {
        ...row,
        audio_url: keepClip ? (previous?.audio_url ?? null) : null,
        updated_at: new Date().toISOString(),
      };
    });
    lineCount += sentenceRows.length;

    const keepSectionIds = new Set(sectionRows.map((row) => row.id));
    const keepSentenceIds = new Set(sentenceRows.map((row) => row.id));
    const orphanSections = existingSections.filter(
      (row) => row.passage_id === passageId && !keepSectionIds.has(row.id),
    );
    const orphanSentences = existingSentences.filter(
      (row) =>
        existingSections.some(
          (section) => section.id === row.section_id && section.passage_id === passageId,
        ) && !keepSentenceIds.has(row.id),
    );
    removedSections += orphanSections.length;
    removedLines += orphanSentences.length;

    // 5. Who speaks: one voice per character, from the cast. Only inserted when missing — the
    // admin may have chosen others — and a character no longer in the cast loses theirs (the
    // narrator's own row, if the admin set one, stays).
    const voiceRows = speakerVoiceRowsFor(seed);
    const haveVoices = new Set(
      existingVoices.filter((row) => row.passage_id === passageId).map((row) => row.speaker),
    );
    const castNames = new Set([...Object.keys(seed.cast), NARRATOR_ROLE]);
    const orphanVoices = [...haveVoices].filter((speaker) => !castNames.has(speaker));
    newVoices += voiceRows.filter((row) => !haveVoices.has(row.speaker)).length;
    removedVoices += orphanVoices.length;

    if (!dryRun) {
      await must(
        `saving parts of ${passageId}`,
        supabase.from("passage_sections").upsert(sectionRows, { onConflict: "id" }).select("id"),
      );
      await must(
        `saving lines of ${passageId}`,
        supabase.from("passage_sentences").upsert(sentenceRows, { onConflict: "id" }).select("id"),
      );
      if (orphanSentences.length > 0) {
        await must(
          `removing old lines of ${passageId}`,
          supabase
            .from("passage_sentences")
            .delete()
            .in(
              "id",
              orphanSentences.map((row) => row.id),
            )
            .select("id"),
        );
      }
      if (orphanSections.length > 0) {
        await must(
          `removing old parts of ${passageId}`,
          supabase
            .from("passage_sections")
            .delete()
            .in(
              "id",
              orphanSections.map((row) => row.id),
            )
            .select("id"),
        );
      }
      if (voiceRows.length > 0) {
        await must(
          `saving the voices of ${passageId}`,
          supabase
            .from("passage_speaker_voices")
            .upsert(voiceRows, { onConflict: "passage_id,speaker", ignoreDuplicates: true })
            .select("passage_id"),
        );
      }
      if (orphanVoices.length > 0) {
        await must(
          `removing old voices of ${passageId}`,
          supabase
            .from("passage_speaker_voices")
            .delete()
            .eq("passage_id", passageId)
            .in("speaker", orphanVoices)
            .select("passage_id"),
        );
      }
    }
  }

  console.log(dryRun ? "DRY RUN — nothing was written." : "Done.");
  console.log(
    [
      `passages: ${newPassages} new, ${updatedPassages} updated`,
      `word groups (draft): ${newGroups} new`,
      `parts: ${sectionCount}, lines: ${lineCount}`,
      `lines keeping their clip: ${linesWithClip}, losing it (text changed): ${linesLosingClip}`,
      `removed: ${removedSections} parts, ${removedLines} lines`,
      `character voices: ${newVoices} new, ${removedVoices} removed (existing ones are kept)`,
    ].join("\n"),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
