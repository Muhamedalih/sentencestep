// Inserts German lessons (from a content file, see content/*.mjs) into the live database as HIDDEN DRAFTS.
//
//   node --env-file=.env.local scripts/german/insert-lessons.mjs scripts/german/content/normal-02-06.mjs          (dry run)
//   node --env-file=.env.local scripts/german/insert-lessons.mjs scripts/german/content/normal-02-06.mjs --apply  (writes)
//
// What it writes, per source lesson "normal-2": the lesson "de-normal-2" (draft, no unit, no voice,
// excluded from the narration sweep), its sentences "de-normal-2-s1"... (the German text in `en`, the Arabic
// meaning copied from the English sentence, the Arabic word glosses), and the Spanish / Turkish title,
// description and sentence meaning copied from the English lesson (status approved: they are the
// meaning of the same sentence). Spanish / Turkish WORD glosses come in phase 3.
//
// Safe to repeat: rows that already exist are left alone (ignore-duplicates), so nothing a person edited is overwritten.
// German ids start with "de-", which every English list query leaves out (see src/lib/supabase/queries).
import path from "node:path";
import { pathToFileURL } from "node:url";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Run with --env-file=.env.local");
  process.exit(1);
}
// lessons has a unique (mode, order_index): German lessons keep the English order, shifted by 1000.
const GERMAN_ORDER_OFFSET = 1000;
const apply = process.argv.includes("--apply");
const file = process.argv[2];
const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

async function get(p) {
  const r = await fetch(`${url}/rest/v1/${p}`, { headers: { ...headers, Range: "0-4999", "Range-Unit": "items" } });
  if (!r.ok) throw new Error(`GET ${p}: ${r.status} ${await r.text()}`);
  return r.json();
}
async function insert(table, rows) {
  if (rows.length === 0) return;
  const r = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!r.ok) throw new Error(`POST ${table}: ${r.status} ${await r.text()}`);
}

const mod = await import(pathToFileURL(path.resolve(file)).href);
const lessons = mod.lessons ?? [mod.lesson];

let nLessons = 0, nSentences = 0, nTranslations = 0;
for (const l of lessons) {
  const [src] = await get(`lessons?select=*&id=eq.${l.sourceId}`);
  if (!src) throw new Error(`no source lesson ${l.sourceId}`);
  const srcSentences = await get(`sentences?select=id,order_index,ar&lesson_id=eq.${l.sourceId}&order=order_index`);
  const byKey = new Map(srcSentences.map((s) => [s.id.slice(l.sourceId.length + 1), s]));
  const id = `de-${l.sourceId}`;

  const lessonRow = {
    id, mode: src.mode, level_id: src.level_id, order_index: GERMAN_ORDER_OFFSET + src.order_index,
    title: l.title, title_ar: src.title_ar, description: l.description, description_ar: src.description_ar,
    is_free: src.is_free, status: "draft", illustration_url: src.illustration_url, voice_id: null,
    unit_id: null, role: null, voice_generation_excluded: true,
  };
  const sentenceRows = [];
  const translationRows = [];
  const tr = (type, contentId, field, locale, value, snapshot) => ({
    content_type: type, content_id: contentId, field, locale, value, status: "approved",
    is_stale: false, source_snapshot: snapshot, provider: "german-copy",
  });

  const srcLessonTr = await get(`content_translations?select=field,locale,value&content_type=eq.lesson&content_id=eq.${l.sourceId}&locale=in.(es,tr)`);
  for (const t of srcLessonTr) {
    if (t.field === "title") translationRows.push(tr("lesson", id, "title", t.locale, t.value, l.title));
    if (t.field === "description") translationRows.push(tr("lesson", id, "description", t.locale, t.value, l.description));
  }
  for (const s of l.sentences) {
    const source = byKey.get(s.src);
    if (!source) throw new Error(`${l.sourceId}: no source sentence ${s.src}`);
    const words = s.de.trim().split(/\s+/);
    if (words.length !== s.gl.length) throw new Error(`${l.sourceId} ${s.src}: gloss count`);
    const sid = `${id}-${s.src}`;
    sentenceRows.push({
      id: sid, lesson_id: id, order_index: source.order_index, en: s.de, ar: source.ar,
      speaker: null, audio_url: null,
      word_translations: words.map((w, i) => ({ en: w, ar: s.gl[i] })),
    });
    const srcTr = await get(`content_translations?select=locale,value&content_type=eq.sentence&content_id=eq.${l.sourceId}-${s.src}&field=eq.text&locale=in.(es,tr)`);
    for (const t of srcTr) translationRows.push(tr("sentence", sid, "text", t.locale, t.value, s.de));
  }
  console.log(`${id}: ${sentenceRows.length} sentences, ${translationRows.length} translation rows`);
  nLessons++; nSentences += sentenceRows.length; nTranslations += translationRows.length;
  if (apply) {
    await insert("lessons", [lessonRow]);
    await insert("sentences", sentenceRows);
    await insert("content_translations", translationRows);
  }
}
console.log(`${apply ? "WROTE" : "dry run:"} ${nLessons} lessons, ${nSentences} sentences, ${nTranslations} translation rows`);
