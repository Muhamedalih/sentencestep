/**
 * Things the panel needs besides making lesson clips:
 *  - other items that need a voice (reading texts = Passages, word lists), planned like a lesson;
 *  - making a NEW voice from inside the panel (an audio file, or the clips of a voice already on the site, such
 *    as an ElevenLabs one — several clips joined give a 10-15 s reference, far better than a 2-second one).
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { sentenceWordEntries } from "../../src/lib/voice/sentence-word-plan";

import { API, planLesson, transcribe, type AppProfile, type Db, type LessonPlan } from "./lib";

export type ItemSource = "lesson" | "passage" | "words";

export function parseItemKey(key: string): { source: ItemSource; id: string } {
  const m = /^(passage|words):(.+)$/.exec(key);
  return m ? { source: m[1] as ItemSource, id: m[2]! } : { source: "lesson", id: key };
}

/** The plan of ANY item the panel lists: a lesson, a reading text ("passage:<id>") or a word list ("words:<id>"). */
export async function planItem(db: Db, key: string): Promise<LessonPlan & { source: ItemSource }> {
  const { source, id } = parseItemKey(key);
  if (source === "lesson") return { ...(await planLesson(db, id)), source };
  if (source === "passage") {
    const { data: passage, error } = await db
      .from("passages")
      .select("id, title, status")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!passage) throw new Error(`No text "${id}".`);
    const { data: sections, error: sErr } = await db
      .from("passage_sections")
      .select("id, order_index")
      .eq("passage_id", id)
      .order("order_index");
    if (sErr) throw sErr;
    const order = new Map((sections ?? []).map((s) => [s.id, s.order_index]));
    const { data: lines, error: lErr } = await db
      .from("passage_sentences")
      .select("id, section_id, order_index, en, say")
      .in("section_id", [...order.keys()]);
    if (lErr) throw lErr;
    const rows = (lines ?? [])
      .sort(
        (a, b) =>
          (order.get(a.section_id) ?? 0) - (order.get(b.section_id) ?? 0) ||
          a.order_index - b.order_index,
      )
      .map((l) => ({ id: l.id, en: (l.say ?? l.en).trim() }))
      .filter((l) => l.en);
    const words = new Set<string>();
    for (const s of rows) for (const entry of sentenceWordEntries(s.id, s.en)) words.add(entry.key);
    return {
      source,
      lesson: { id, mode: "passage", title: passage.title, status: passage.status, voice_id: null },
      sentences: rows,
      words: [...words].sort(),
    };
  }
  const { data: group, error } = await db
    .from("word_groups")
    .select("id, title, status, voice_id")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!group) throw new Error(`No word list "${id}".`);
  const { data: vocab, error: vErr } = await db
    .from("vocabulary_words")
    .select("id, target_word, sentence, order_index")
    .eq("group_id", id)
    .order("order_index");
  if (vErr) throw vErr;
  const rows = (vocab ?? []).map((v) => ({
    id: v.id,
    en: v.sentence.replace(/_{2,}/g, v.target_word).trim(),
  }));
  const words = [...new Set((vocab ?? []).map((v) => v.target_word.trim().toLowerCase()))].sort();
  return {
    source,
    lesson: {
      id,
      mode: "words",
      title: group.title,
      status: group.status,
      voice_id: group.voice_id,
    },
    sentences: rows,
    words,
  };
}

/** Every item the panel can work on: lessons, reading texts, word lists. */
export async function listItems(db: Db) {
  const items: {
    id: string;
    mode: string;
    title: string;
    status: string;
    voice_id: string | null;
  }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from("lessons")
      .select("id, mode, title, status, voice_id, order_index")
      .order("mode")
      .order("order_index")
      .range(from, from + 999);
    if (error) throw error;
    items.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const passages = await db
    .from("passages")
    .select("id, title, status, order_index")
    .order("order_index");
  if (passages.error) throw passages.error;
  for (const p of passages.data ?? [])
    items.push({
      id: `passage:${p.id}`,
      mode: "passage",
      title: p.title,
      status: p.status,
      voice_id: null,
    });
  const groups = await db
    .from("word_groups")
    .select("id, title, status, voice_id, order_index")
    .order("order_index");
  if (groups.error) throw groups.error;
  for (const g of groups.data ?? [])
    items.push({
      id: `words:${g.id}`,
      mode: "words",
      title: g.title,
      status: g.status,
      voice_id: g.voice_id,
    });
  return items;
}

// ---------------------------------------------------------------------------------------------
// New voices
// ---------------------------------------------------------------------------------------------

async function ffmpegFiles(
  inputs: Buffer[],
  build: (files: string[]) => string[],
): Promise<Buffer> {
  const dir = mkdtempSync(join(tmpdir(), "vs-ref-"));
  try {
    const { execFileSync } = await import("node:child_process");
    const files = inputs.map((b, i) => {
      const f = join(dir, `in${i}.bin`);
      writeFileSync(f, b);
      return f;
    });
    const out = join(dir, "out.mp3");
    execFileSync("ffmpeg", ["-v", "error", "-y", ...build(files), out], { timeout: 120_000 });
    return readFileSync(out);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Creates a clone profile inside VoiceStudio. The reference text is read from the audio by Whisper unless given. */
export async function createProfile(
  name: string,
  audio: Buffer,
  refText?: string,
): Promise<AppProfile> {
  // 24 kHz mono, loudness evened, at most 20 s: what a clean reference should look like.
  const clean = await ffmpegFiles([audio], (f) => [
    "-i",
    f[0]!,
    "-t",
    "20",
    "-af",
    "loudnorm=I=-18:TP=-2:LRA=9",
    "-ar",
    "24000",
    "-ac",
    "1",
    "-b:a",
    "192k",
  ]);
  const text = (refText ?? "").trim() || (await transcribe(clean));
  if (!text) throw new Error("Could not read any words in the reference audio.");
  const form = new FormData();
  form.append("name", name);
  form.append("kind", "clone");
  form.append("language", "English");
  form.append("ref_text", text);
  form.append(
    "ref_audio",
    new Blob([new Uint8Array(clean)], { type: "audio/mpeg" }),
    "reference.mp3",
  );
  const response = await fetch(`${API}/profiles`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok)
    throw new Error(
      `VoiceStudio /profiles ${response.status}: ${(await response.text()).slice(0, 200)}`,
    );
  return (await response.json()) as AppProfile;
}

/** The site's own voices (ElevenLabs, Cartesia, …) that can be copied. */
export async function referenceCandidates(db: Db) {
  const { data, error } = await db
    .from("voices")
    .select("id, name, source, gender")
    .neq("source", "voice-studio")
    .order("name");
  if (error) throw error;
  return (data ?? []) as { id: string; name: string; source: string; gender: string }[];
}

/** Joins ~12 s of a site voice's own ready sentence clips into one reference and makes a profile from it. */
export async function createProfileFromSiteVoice(
  db: Db,
  siteVoiceId: string,
  name: string,
): Promise<AppProfile> {
  const { data, error } = await db
    .from("voice_audio_cache")
    .select("audio_url, duration_ms, normalized_text")
    .eq("voice_id", siteVoiceId)
    .eq("status", "ready")
    .not("audio_url", "is", null)
    .gte("duration_ms", 2500)
    .lte("duration_ms", 7000)
    .not("audio_url", "like", "%zogigmxbfianyevsdvgl%")
    .limit(60);
  if (error) throw error;
  const rows = (data ?? []).filter((r) => (r.normalized_text ?? "").split(/\s+/).length >= 5);
  const picked: { buf: Buffer; text: string }[] = [];
  let total = 0;
  for (const r of rows) {
    if (total >= 12_000 || picked.length >= 5) break;
    try {
      const res = await fetch(r.audio_url!, { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) continue;
      picked.push({ buf: Buffer.from(await res.arrayBuffer()), text: r.normalized_text });
      total += r.duration_ms ?? 0;
    } catch {
      /* skip an unreachable clip */
    }
  }
  if (total < 6000) throw new Error("This voice has too few usable clips on the site to copy it.");
  const joined = await ffmpegFiles(
    picked.map((p) => p.buf),
    (files) => [
      ...files.flatMap((f) => ["-i", f]),
      "-filter_complex",
      `${files.map((_, i) => `[${i}:a]aresample=24000,aformat=channel_layouts=mono[a${i}]`).join(";")};${files.map((_, i) => `[a${i}]`).join("")}concat=n=${files.length}:v=0:a=1[out]`,
      "-map",
      "[out]",
    ],
  );
  return createProfile(name, joined, picked.map((p) => p.text).join(" "));
}
