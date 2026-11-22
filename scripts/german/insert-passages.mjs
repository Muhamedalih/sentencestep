// Inserts German Passages (scripts/german/passages/*.mjs) as HIDDEN DRAFTS.
//   node --env-file=.env.local scripts/german/insert-passages.mjs <file>            (check)
//   node --env-file=.env.local scripts/german/insert-passages.mjs <file> --apply    (writes)
// A passage file exports `passages = [{ sourceId, title, summary, speakers?: {"Mr. Whitfield": "Herr Whitfield"},
//   sections: [{ title, lines: [German text per English line], questions: [{ prompt, options: [German] }] }] }]`.
// The number of sections, lines, questions and options must match the English passage exactly: the Arabic meaning,
// the speaker, the right answer and the "look back" line are copied from the English rows by position.
// Written: passage "de-<id>", sections "de-<id>-pN", lines "de-<id>-pN-lM" (draft; no narration, no key-words list).
import path from "node:path";
import { pathToFileURL } from "node:url";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Run with --env-file=.env.local"); process.exit(1); }
const apply = process.argv.includes("--apply");
const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const get = async (p) => { const r = await fetch(`${url}/rest/v1/${p}`, { headers: { ...headers, Range: "0-4999", "Range-Unit": "items" } }); if (!r.ok) throw new Error(`GET ${p}: ${r.status} ${await r.text()}`); return r.json(); };
const insert = async (table, rows) => { if (!rows.length) return; const r = await fetch(`${url}/rest/v1/${table}`, { method: "POST", headers: { ...headers, Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify(rows) }); if (!r.ok) throw new Error(`POST ${table}: ${r.status} ${await r.text()}`); };

const { passages } = await import(pathToFileURL(path.resolve(process.argv[2])).href);
let problems = 0, nLines = 0;
for (const p of passages) {
  const [src] = await get(`passages?select=*&id=eq.${p.sourceId}`);
  if (!src) throw new Error(`no source passage ${p.sourceId}`);
  const srcSections = await get(`passage_sections?select=*&passage_id=eq.${p.sourceId}&order=order_index`);
  const bad = (m) => { console.log(`x ${p.sourceId}: ${m}`); problems++; };
  if (srcSections.length !== p.sections.length) { bad(`${srcSections.length} sections but ${p.sections.length}`); continue; }
  const sectionRows = [], lineRows = [];
  for (let i = 0; i < srcSections.length; i++) {
    const ss = srcSections[i], ds = p.sections[i];
    const srcLines = await get(`passage_sentences?select=id,order_index,speaker,ar&section_id=eq.${ss.id}&order=order_index`);
    if (srcLines.length !== ds.lines.length) { bad(`section ${i + 1}: ${srcLines.length} lines but ${ds.lines.length}`); continue; }
    const srcQs = ss.questions ?? [];
    const dQs = ds.questions ?? [];
    if (srcQs.length !== dQs.length) { bad(`section ${i + 1}: ${srcQs.length} questions but ${dQs.length}`); continue; }
    const questions = srcQs.map((q, k) => {
      if (q.options.length !== dQs[k].options.length) { bad(`section ${i + 1} question ${k + 1}: option count`); return q; }
      return { id: `de-${q.id}`, answer: q.answer, evidence: q.evidence, prompt: dQs[k].prompt, prompt_ar: q.prompt_ar, options: q.options.map((o, j) => ({ en: dQs[k].options[j], ar: o.ar })) };
    });
    const sid = `de-${ss.id}`;
    sectionRows.push({ id: sid, passage_id: `de-${p.sourceId}`, order_index: ss.order_index, title: ds.title, title_ar: ss.title_ar, questions });
    srcLines.forEach((l, k) => {
      const speaker = l.speaker ? (p.speakers?.[l.speaker] ?? l.speaker) : null;
      lineRows.push({ id: `de-${l.id}`, section_id: sid, order_index: l.order_index, speaker, en: ds.lines[k], ar: l.ar, audio_url: null, say: null, pause: null });
      nLines++;
    });
  }
  console.log(`de-${p.sourceId}: ${sectionRows.length} sections, ${lineRows.length} lines`);
  if (apply && !problems) {
    await insert("passages", [{ id: `de-${p.sourceId}`, order_index: src.order_index, level: src.level, tone: src.tone, icon: src.icon, title: p.title, title_ar: src.title_ar, summary: p.summary, summary_ar: src.summary_ar, status: "draft", is_free: src.is_free, word_group_id: null, poster_url: src.poster_url, background_url: src.background_url }]);
    await insert("passage_sections", sectionRows);
    await insert("passage_sentences", lineRows);
  }
}
console.log(`${apply && !problems ? "WROTE" : "checked"}: ${nLines} lines, ${problems} problem(s)`);
process.exit(problems ? 1 : 0);
