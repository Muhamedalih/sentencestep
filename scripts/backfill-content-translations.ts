/**
 * Backfills missing content_translations rows for Levels, Word Groups, and
 * Vocabulary Words — the three content types that turned out to have real,
 * silent locale gaps when audited (see the "Looma technical audit" report):
 * Turkish had ZERO rows for all three types (levels/word_groups/
 * vocabulary_words), and Spanish itself was missing 9 of 18 word groups
 * entirely plus 285 of 465 vocabulary-word hints. None of these three
 * content types has an AI-generation pipeline of its own the way lessons do
 * (generate.ts) or an admin dashboard action to trigger one — they were
 * seeded once, by hand or by an earlier one-off pass, and never revisited
 * when Turkish was added. This script is the one-time (and, if a fourth
 * locale ever joins, reusable) fix.
 *
 * Translates FROM ARABIC (title_ar/description_ar/hint_ar), not English —
 * matching how the existing ar/es rows actually behave: resolveScalarField
 * (src/lib/i18n/content-translations.ts) always falls back to the legacy
 * `_ar` column for locale 'ar', meaning Arabic is this content's true
 * canonical source text; English is only the word actually being learned
 * (vocabulary_words.target_word), never translated.
 *
 * Usage:
 *   npx tsx scripts/backfill-content-translations.ts --locale=tr
 *   npx tsx scripts/backfill-content-translations.ts --locale=es
 *   npx tsx scripts/backfill-content-translations.ts --locale=tr --apply
 *
 * Dry-run by default (reports what it would do); pass --apply to actually
 * write. Requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and
 * ANTHROPIC_API_KEY in the environment.
 */
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

import type { Database } from "../src/types/database";
import { GLOSSARY } from "../src/lib/translation/glossary";
import { LOCALE_META, type SupportLocale } from "../src/lib/i18n/locales";

const args = process.argv.slice(2);
const localeArg = args.find((a) => a.startsWith("--locale="))?.split("=")[1];
const apply = args.includes("--apply");

if (localeArg !== "es" && localeArg !== "tr") {
  console.error(
    "Pass --locale=es or --locale=tr (Arabic never needs this — see this file's doc comment).",
  );
  process.exit(1);
}
const locale: SupportLocale = localeArg;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;
if (!url || !serviceRoleKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.");
  process.exit(1);
}
// Only required to --apply (translateChunk is never called during a dry
// run), so the read-only "what's missing" report works without it.
if (apply && !anthropicKey) {
  console.error(
    "Set ANTHROPIC_API_KEY first — this script calls Claude directly to translate the backlog.",
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anthropic = new Anthropic({ apiKey: anthropicKey ?? "" });
const MODEL = process.env.TRANSLATION_MODEL || "claude-sonnet-5";

interface Item {
  contentType: "level" | "word_group" | "vocabulary_word";
  contentId: string;
  field: string;
  arSource: string;
}

async function fetchAll<T>(
  query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const pageSize = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await query(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

async function findMissingItems(): Promise<Item[]> {
  const [levels, groups, words, existing] = await Promise.all([
    fetchAll((from, to) => supabase.from("levels").select("id, title_ar").range(from, to)),
    fetchAll((from, to) =>
      supabase.from("word_groups").select("id, title_ar, description_ar, status").range(from, to),
    ),
    fetchAll((from, to) => supabase.from("vocabulary_words").select("id, hint_ar").range(from, to)),
    fetchAll((from, to) =>
      supabase
        .from("content_translations")
        .select("content_type, content_id, field")
        .eq("locale", locale)
        .in("content_type", ["level", "word_group", "vocabulary_word"])
        .range(from, to),
    ),
  ]);

  const have = new Set(existing.map((r) => `${r.content_type}:${r.content_id}:${r.field}`));
  const items: Item[] = [];

  for (const level of levels) {
    if (!have.has(`level:${level.id}:title`) && level.title_ar) {
      items.push({
        contentType: "level",
        contentId: level.id,
        field: "title",
        arSource: level.title_ar,
      });
    }
  }

  for (const group of groups) {
    if (group.status !== "published") continue;
    if (!have.has(`word_group:${group.id}:title`) && group.title_ar) {
      items.push({
        contentType: "word_group",
        contentId: group.id,
        field: "title",
        arSource: group.title_ar,
      });
    }
    if (!have.has(`word_group:${group.id}:description`) && group.description_ar) {
      items.push({
        contentType: "word_group",
        contentId: group.id,
        field: "description",
        arSource: group.description_ar,
      });
    }
  }

  for (const word of words) {
    if (!have.has(`vocabulary_word:${word.id}:hint`) && word.hint_ar) {
      items.push({
        contentType: "vocabulary_word",
        contentId: word.id,
        field: "hint",
        arSource: word.hint_ar,
      });
    }
  }

  return items;
}

const TOOL_NAME = "submit_translations";
const CHUNK_SIZE = 50;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function formatGlossary(): string {
  return GLOSSARY.map((term) => {
    const rule =
      term.rule === "preserve"
        ? "never translate or transliterate — keep exactly as written"
        : "may be transliterated, but must be rendered the same way every time it appears";
    return `- "${term.term}": ${rule}${term.note ? ` (${term.note})` : ""}`;
  }).join("\n");
}

async function translateChunk(items: Item[]): Promise<Map<string, string>> {
  const localeMeta = LOCALE_META[locale];
  const system = [
    "You translate short Arabic learner-support text for SentenceStep, an app that teaches English to Arabic speakers (and other languages).",
    `Translate each numbered item from Arabic into ${localeMeta.label} (${localeMeta.nativeLabel}), locale code "${locale}".`,
    "Each item is either a short title, a one-sentence description, or a short definition/hint explaining an English vocabulary word to the learner.",
    "Preserve the exact meaning and tone; keep it natural and concise in the target language — do not add explanations, quotation marks, or commentary.",
    "Preserve proper names as proper names.",
    "Glossary (apply exactly):",
    formatGlossary(),
    "Call the submit_translations tool exactly once with one output entry per input item, in the same order, echoing each item's id exactly.",
  ].join("\n");

  const user = items
    .map((item, i) => `${i + 1}. [id: ${item.contentId}::${item.field}] ${item.arSource}`)
    .join("\n");

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system,
    messages: [{ role: "user", content: user }],
    tools: [
      {
        name: TOOL_NAME,
        description: "Submit the translated items.",
        input_schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    description: "Echoes the requested [id: ...] value exactly.",
                  },
                  text: { type: "string" },
                },
                required: ["id", "text"],
              },
            },
          },
          required: ["items"],
        },
      },
    ],
    tool_choice: { type: "tool", name: TOOL_NAME },
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) throw new Error(`No tool_use in response (stop_reason: ${response.stop_reason}).`);

  const parsed = toolUse.input as { items: { id: string; text: string }[] };
  return new Map(parsed.items.map((entry) => [entry.id, entry.text]));
}

async function main() {
  console.log(`Finding missing ${locale} translations for level/word_group/vocabulary_word...`);
  const items = await findMissingItems();
  console.log(`Found ${items.length} missing fields.`);
  const byType: Record<string, number> = {};
  for (const item of items) byType[item.contentType] = (byType[item.contentType] ?? 0) + 1;
  console.log(byType);

  if (items.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  if (!apply) {
    console.log("\nDry run — pass --apply to actually translate and write these rows.");
    console.log("First 5 items:", items.slice(0, 5));
    return;
  }

  const nowIso = new Date().toISOString();
  let written = 0;
  let failed = 0;

  for (const batch of chunk(items, CHUNK_SIZE)) {
    console.log(`Translating a batch of ${batch.length}...`);
    let translations: Map<string, string>;
    try {
      translations = await translateChunk(batch);
    } catch (error) {
      console.error("Batch translation failed, skipping this batch:", error);
      failed += batch.length;
      continue;
    }

    const rows = batch
      .map((item) => {
        const key = `${item.contentId}::${item.field}`;
        const text = translations.get(key);
        if (!text) {
          console.error(`No translation returned for ${key}`);
          failed += 1;
          return null;
        }
        return {
          content_type: item.contentType,
          content_id: item.contentId,
          field: item.field,
          locale,
          value: text,
          status: "approved" as const,
          source_snapshot: item.arSource,
          provider: "anthropic",
          generated_at: nowIso,
          reviewed_at: nowIso,
          updated_at: nowIso,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (rows.length === 0) continue;

    const { error } = await supabase
      .from("content_translations")
      .upsert(rows, { onConflict: "content_type,content_id,field,locale" });
    if (error) {
      console.error("Upsert failed for this batch:", error);
      failed += rows.length;
      continue;
    }
    written += rows.length;
    console.log(`  wrote ${rows.length} rows (${written}/${items.length} total)`);
  }

  console.log(`\nDone. Wrote ${written}, failed ${failed}, out of ${items.length}.`);
}

main().catch((error: unknown) => {
  console.error("backfill failed:", error);
  process.exit(1);
});
