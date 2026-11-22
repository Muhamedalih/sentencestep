// Inserts German Word Lists (scripts/german/wordlists/*.mjs) as HIDDEN DRAFTS.
//   node --env-file=.env.local scripts/german/insert-wordlists.mjs <file>            (check)
//   node --env-file=.env.local scripts/german/insert-wordlists.mjs <file> --apply    (writes)
// Per source group "family": the group "de-family" (draft, order_index 1000 + the English one, unique), its words
// "de-family-aunt"... (German word, German sentence with one "___", the Arabic hint copied from the English word, no IPA,
// accepted answers = the extra ones listed, plus the "ss" spelling for every "ß"), and the Arabic/Spanish/Turkish hint and
// group title/description copied from the English rows. Existing rows are left alone (ignore-duplicates).
import path from "node:path";
import { pathToFileURL } from "node:url";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Run with --env-file=.env.local"); process.exit(1); }
const apply = process.argv.includes("--apply");
const OFFSET = 1000;
const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const get = async (p) => { const r = await fetch(`${url}/rest/v1/${p}`, { headers: { ...headers, Range: "0-4999", "Range-Unit": "items" } }); if (!r.ok) throw new Error(`GET ${p}: ${r.status} ${await r.text()}`); return r.json(); };
const insert = async (table, rows) => { if (!rows.length) return; const r = await fetch(`${url}/rest/v1/${table}`, { method: "POST", headers: { ...headers, Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify(rows) }); if (!r.ok) throw new Error(`POST ${table}: ${r.status} ${await r.text()}`); };

const { groups } = await import(pathToFileURL(path.resolve(process.argv[2])).href);
let problems = 0, nWords = 0;
for (const g of groups) {
  const [src] = await get(`word_groups?select=*&id=eq.${g.sourceId}`);
  if (!src) throw new Error(`no source group ${g.sourceId}`);
  const srcWords = await get(`vocabulary_words?select=id,order_index,hint_ar&group_id=eq.${g.sourceId}&order=order_index`);
  const byKey = new Map(srcWords.map((w) => [w.id.slice(g.sourceId.length + 1), w]));
  const gid = `de-${g.sourceId}`;
  const wordRows = [], trRows = [];
  const tr = (type, id, field, locale, value) => ({ content_type: type, content_id: id, field, locale, value, status: "approved", is_stale: false, provider: "german-copy" });
  for (const [k, de, sentence, alts = []] of g.words) {
    const s = byKey.get(k);
    if (!s) { console.log(`x ${g.sourceId}: no source word ${k}`); problems++; continue; }
    if ((sentence.match(/___/g) ?? []).length !== 1) { console.log(`x ${g.sourceId} ${k}: the sentence needs exactly one ___`); problems++; }
    const accepted = [...new Set([...alts, ...(de.includes("ß") ? [de.replaceAll("ß", "ss")] : []), ...(alts.some((a) => a.includes("ß")) ? alts.map((a) => a.replaceAll("ß", "ss")) : [])])].map((a) => a.toLowerCase());
    const wid = `${gid}-${k}`;
    wordRows.push({ id: wid, group_id: gid, order_index: s.order_index, target_word: de, sentence, hint_ar: s.hint_ar, accepted_answers: accepted });
    nWords++;
    const hints = await get(`content_translations?select=locale,value&content_type=eq.vocabulary_word&content_id=eq.${g.sourceId}-${k}&field=eq.hint&locale=in.(es,tr)`);
    for (const h of hints) trRows.push(tr("vocabulary_word", wid, "hint", h.locale, h.value));
  }
  const gt = await get(`content_translations?select=field,locale,value&content_type=eq.word_group&content_id=eq.${g.sourceId}&locale=in.(es,tr)`);
  for (const t of gt) trRows.push(tr("word_group", gid, t.field, t.locale, t.value));
  console.log(`${gid}: ${wordRows.length} words, ${trRows.length} translation rows`);
  if (apply && !problems) {
    await insert("word_groups", [{ id: gid, level: src.level, order_index: OFFSET + src.order_index, title: g.title, title_ar: src.title_ar, description: g.description, description_ar: src.description_ar, is_free: src.is_free, status: "draft", voice_id: null }]);
    await insert("vocabulary_words", wordRows);
    await insert("content_translations", trRows);
  }
}
console.log(`${apply && !problems ? "WROTE" : "checked"}: ${nWords} words, ${problems} problem(s)`);
process.exit(problems ? 1 : 0);
