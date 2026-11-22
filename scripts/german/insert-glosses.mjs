// Spanish and Turkish word glosses for the German sentences (phase 3).
//
//   node --env-file=.env.local scripts/german/insert-glosses.mjs <content file> <gloss file>            (check only)
//   node --env-file=.env.local scripts/german/insert-glosses.mjs <content file> <gloss file> --apply    (writes)
//
// A gloss file exports `glosses = { "<sourceId>": [ [es, tr], ... one pair per sentence in order ] }`, where es and tr are
// strings of glosses joined by "|", exactly one per whitespace word of the German sentence (same rule as the Arabic ones).
// Turkish uses "-" for an article (Turkish has none). Rows go to content_translations (content_type sentence, field
// word_translations, locale es / tr, id "de-<sourceId>-sN"); running it again overwrites only those rows.
import path from "node:path";
import { pathToFileURL } from "node:url";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Run with --env-file=.env.local");
  process.exit(1);
}
const apply = process.argv.includes("--apply");
const load = async (f) => import(pathToFileURL(path.resolve(f)).href);
const { lessons } = await load(process.argv[2]);
const { glosses } = await load(process.argv[3]);

let problems = 0;
const rows = [];
for (const l of lessons) {
  const pairs = glosses[l.sourceId];
  if (!pairs) { console.log(`x ${l.sourceId}: no glosses`); problems++; continue; }
  if (pairs.length !== l.sentences.length) { console.log(`x ${l.sourceId}: ${pairs.length} pairs for ${l.sentences.length} sentences`); problems++; continue; }
  l.sentences.forEach((s, i) => {
    const words = s.de.trim().split(/\s+/);
    ["es", "tr"].forEach((locale, k) => {
      const parts = pairs[i][k].split("|");
      if (parts.length !== words.length) { console.log(`x ${l.sourceId} ${s.src} ${locale}: ${words.length} words but ${parts.length} glosses`); problems++; return; }
      if (parts.some((p) => !p.trim())) { console.log(`x ${l.sourceId} ${s.src} ${locale}: empty gloss`); problems++; return; }
      rows.push({
        content_type: "sentence", content_id: `de-${l.sourceId}-${s.src}`, field: "word_translations", locale,
        value: words.map((w, j) => ({ en: w, text: parts[j].trim() })),
        status: "approved", is_stale: false, source_snapshot: s.de, provider: "german-glosses",
      });
    });
  });
}
console.log(`${rows.length} gloss rows, ${problems} problem(s)`);
if (problems) process.exit(1);
if (apply) {
  for (let i = 0; i < rows.length; i += 100) {
    const r = await fetch(`${url}/rest/v1/content_translations?on_conflict=content_type,content_id,field,locale`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows.slice(i, i + 100)),
    });
    if (!r.ok) throw new Error(`POST: ${r.status} ${await r.text()}`);
  }
  console.log("WROTE");
}
