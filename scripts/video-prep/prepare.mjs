#!/usr/bin/env node
/**
 * Video dictation prep: from a video FILE to exact sentence times, with local models.
 *
 *   node scripts/video-prep/prepare.mjs <file-or-url> --id my-video [--clip 3.5-57.9]
 *        [--units-from src/data/videos/my-video.ts] [--apply] [--out <dir>] [--fresh]
 *
 * 1. ffmpeg turns the audio of the clip into 16 kHz mono samples (kept in memory).
 * 2. The text. For a video that already has its sentences (--units-from) those are used as they are. For a new
 *    video Whisper (onnx-community/whisper-small.en_timestamped, run locally through transformers.js) transcribes
 *    the clip and the words are cut into sentences (at . ? ! and at pauses, at most 12 words each); the
 *    transcription is saved in <id>.words.json, so a second run does not transcribe again.
 * 3. The times. A speech model that matches letters to sound (Xenova/wav2vec2-base-960h, 95 MB) lines the whole
 *    text up with the audio, letter by letter ("forced alignment", about 0.03 s exact). Whisper's own word
 *    times are not used: they were off by up to 0.7 s.
 * 4. A sentence starts just before its first word and stops just after its last, never inside the next
 *    sentence's first word. --apply writes the new times into the video's data file (texts and Arabic stay).
 *
 * Only for files we may use: public domain or Creative Commons media from the publisher itself (VOA publishes
 * direct mp4 links), the Internet Archive, Wikimedia Commons. Never pass a file taken from YouTube: its Terms
 * forbid downloading. Set up once with `npm install @huggingface/transformers` in the tools folder
 * (VIDEO_PREP_HOME, default C:/Looma-tools/video-prep); see README.md. VIDEO_PREP_DEVICE=dml runs Whisper on the GPU.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const TOOLS = process.env.VIDEO_PREP_HOME || "C:/Looma-tools/video-prep";
const MODEL = process.env.VIDEO_PREP_MODEL || "onnx-community/whisper-small.en_timestamped";
const ALIGN_MODEL = "Xenova/wav2vec2-base-960h";
const DEVICE = process.env.VIDEO_PREP_DEVICE || "cpu";
const MAX_WORDS = 12;

function parseArgs(argv) {
  const args = { _: [], apply: false, fresh: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--apply") args.apply = true;
    else if (a === "--fresh") args.fresh = true;
    else if (a.startsWith("--")) args[a.slice(2)] = argv[++i];
    else args._.push(a);
  }
  return args;
}

function loadTransformers() {
  const require = createRequire(path.join(TOOLS, "package.json"));
  const lib = require("@huggingface/transformers");
  lib.env.cacheDir = path.join(TOOLS, "models");
  return lib;
}

function findFfmpeg() {
  const candidates = [
    process.env.FFMPEG,
    "ffmpeg",
    "C:/Looma-video/node_modules/ffmpeg-static/ffmpeg.exe",
  ].filter(Boolean);
  for (const c of candidates) {
    const r = spawnSync(c, ["-version"], { encoding: "utf8" });
    if (r.status === 0) return c;
  }
  throw new Error("ffmpeg not found: set FFMPEG or install ffmpeg-static");
}

async function fetchToFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return dest;
}

function decode(ffmpeg, file, start, length) {
  const args = ["-v", "error"];
  if (start > 0) args.push("-ss", String(start));
  args.push("-i", file);
  if (length > 0) args.push("-t", String(length));
  args.push("-vn", "-ac", "1", "-ar", "16000", "-f", "f32le", "pipe:1");
  const r = spawnSync(ffmpeg, args, { maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${r.stderr}`);
  const bytes = r.stdout;
  const copy = new ArrayBuffer(bytes.length - (bytes.length % 4));
  new Uint8Array(copy).set(bytes.subarray(0, copy.byteLength));
  return new Float32Array(copy);
}

async function transcribe(samples) {
  const { pipeline } = loadTransformers();
  const asr = await pipeline("automatic-speech-recognition", MODEL, {
    dtype: "q8",
    device: DEVICE,
  });
  const out = await asr(samples, {
    return_timestamps: "word",
    chunk_length_s: 30,
    stride_length_s: 5,
  });
  return (out.chunks || [])
    .map((c) => ({
      w: String(c.text).trim(),
      s: c.timestamp[0],
      e: c.timestamp[1] ?? c.timestamp[0],
    }))
    .filter((c) => c.w.length > 0);
}

/** New sentences from Whisper's words: cut at . ? ! then keep each at most MAX_WORDS words, splitting at the longest pause. */
function groupWords(words) {
  const sentences = [];
  let cur = [];
  words.forEach((w, i) => {
    cur.push(i);
    if (/[.!?]["')\]]*$/.test(w.w)) {
      sentences.push(cur);
      cur = [];
    }
  });
  if (cur.length) sentences.push(cur);
  const units = [];
  let open = [];
  const flush = () => {
    if (open.length) units.push(open);
    open = [];
  };
  const pushLong = (idx) => {
    if (idx.length <= MAX_WORDS) {
      if (open.length + idx.length > MAX_WORDS) flush();
      open = open.concat(idx);
      return;
    }
    flush();
    let cut = 3;
    let widest = -1;
    for (let k = 3; k < idx.length - 2; k++) {
      const gap = words[idx[k]].s - words[idx[k - 1]].e;
      if (gap > widest) {
        widest = gap;
        cut = k;
      }
    }
    pushLong(idx.slice(0, cut));
    flush();
    pushLong(idx.slice(cut));
  };
  sentences.forEach((s) => pushLong(s));
  flush();
  return units.map((idx) => idx.map((i) => words[i].w).join(" "));
}

/** The letters of wav2vec2's vocabulary: from the cached vocab.json, or the standard one. */
function loadVocab() {
  const cached = path.join(TOOLS, "models", ...ALIGN_MODEL.split("/"), "vocab.json");
  if (fs.existsSync(cached)) return JSON.parse(fs.readFileSync(cached, "utf8"));
  return JSON.parse(
    '{"<pad>":0,"<s>":1,"</s>":2,"<unk>":3,"|":4,"E":5,"T":6,"A":7,"O":8,"N":9,"I":10,"H":11,"S":12,"R":13,"D":14,"L":15,"U":16,"M":17,"W":18,"C":19,"F":20,"G":21,"Y":22,"P":23,"B":24,"V":25,"K":26,"\'":27,"X":28,"J":29,"Q":30,"Z":31}',
  );
}

/**
 * Forced alignment: lines the known text up with the audio. The model gives, every 20 ms, how likely each
 * letter is being said; a Viterbi search finds the one path through those frames that spells exactly the text
 * (letters in order, a blank between). Returns, for each sentence, the time its first word starts and its last
 * word ends, plus every word's own times, in seconds of the clip.
 */
async function alignText(samples, unitTexts) {
  const { AutoModelForCTC, Tensor } = loadTransformers();
  const model = await AutoModelForCTC.from_pretrained(ALIGN_MODEL, { dtype: "q8" });
  const vocab = loadVocab();
  const BLANK = vocab["<pad>"];

  let mean = 0;
  for (const x of samples) mean += x;
  mean /= samples.length;
  let variance = 0;
  for (const x of samples) variance += (x - mean) ** 2;
  const sd = Math.sqrt(variance / samples.length + 1e-7);
  const input = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) input[i] = (samples[i] - mean) / sd;
  const out = await model({ input_values: new Tensor("float32", input, [1, input.length]) });
  const [, T, V] = out.logits.dims;
  const logits = out.logits.data;
  const lp = new Float32Array(T * V);
  for (let t = 0; t < T; t++) {
    let max = -Infinity;
    for (let v = 0; v < V; v++) max = Math.max(max, logits[t * V + v]);
    let sum = 0;
    for (let v = 0; v < V; v++) sum += Math.exp(logits[t * V + v] - max);
    const log = max + Math.log(sum);
    for (let v = 0; v < V; v++) lp[t * V + v] = logits[t * V + v] - log;
  }

  const tokens = [];
  const words = [];
  unitTexts.forEach((text, unit) =>
    text
      .split(/\s+/)
      .filter(Boolean)
      .forEach((raw) => {
        const letters = raw
          .toUpperCase()
          .replace(/[’]/g, "'")
          .replace(/[^A-Z']/g, "");
        if (!letters) return;
        if (tokens.length) tokens.push({ id: vocab["|"], word: -1 });
        words.push({ unit, text: raw, first: Infinity, last: -1 });
        for (const ch of letters) tokens.push({ id: vocab[ch], word: words.length - 1 });
      }),
  );

  const L = tokens.length;
  const S = 2 * L + 1;
  const ext = (s) => (s % 2 === 0 ? BLANK : tokens[(s - 1) / 2].id);
  const back = new Uint8Array(T * S);
  let prev = new Float32Array(S).fill(-1e30);
  let cur = new Float32Array(S);
  prev[0] = lp[BLANK];
  prev[1] = lp[ext(1)];
  for (let t = 1; t < T; t++) {
    for (let s = 0; s < S; s++) {
      let best = prev[s];
      let from = 0;
      if (s >= 1 && prev[s - 1] > best) {
        best = prev[s - 1];
        from = 1;
      }
      if (s >= 2 && s % 2 === 1 && ext(s) !== ext(s - 2) && prev[s - 2] > best) {
        best = prev[s - 2];
        from = 2;
      }
      cur[s] = best + lp[t * V + ext(s)];
      back[t * S + s] = from;
    }
    [prev, cur] = [cur, prev];
  }
  let s = prev[S - 1] > prev[S - 2] ? S - 1 : S - 2;
  const path = new Int32Array(T);
  for (let t = T - 1; t >= 0; t--) {
    path[t] = s;
    s -= back[t * S + s];
  }
  for (let t = 0; t < T; t++) {
    if (path[t] % 2 === 1) {
      const token = tokens[(path[t] - 1) / 2];
      if (token.word >= 0) {
        const w = words[token.word];
        w.first = Math.min(w.first, t);
        w.last = Math.max(w.last, t);
      }
    }
  }
  const frame = samples.length / 16000 / T;
  const timed = words.map((w) => ({
    w: w.text,
    unit: w.unit,
    s: w.first * frame,
    e: (w.last + 1) * frame,
  }));
  return unitTexts.map((text, unit) => {
    const own = timed.filter((w) => w.unit === unit);
    return { text, words: own, s: own[0].s, e: own[own.length - 1].e };
  });
}

/**
 * A sentence starts a little before its first word and stops a little after its last (a letter's frame ends
 * before the sound fades), a third to a half of a short gap, 0.12 s of a long one, and never later than 0.04 s
 * before the next sentence's first word.
 */
function timeUnits(aligned) {
  return aligned.map((u, i) => {
    const next = aligned[i + 1];
    const gap = next ? next.s - u.e : null;
    let end = u.e + (gap === null || gap >= 0.3 ? 0.12 : Math.max(0.02, gap * 0.4));
    if (next) end = Math.max(Math.min(end, next.s - 0.04), u.e);
    return { start: Math.max(0, u.s - 0.06), end, gapAfter: gap };
  });
}

function readDataFile(file) {
  const text = fs.readFileSync(file, "utf8");
  const open = text.indexOf("= {");
  const close = text.lastIndexOf("};");
  if (open < 0 || close < 0) throw new Error(`${file}: not a generated video data file`);
  return {
    head: text.slice(0, open + 2),
    lesson: JSON.parse(text.slice(open + 2, close + 1)),
    tail: text.slice(close + 1),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const input = args._[0];
  if (!input) {
    console.log(
      "usage: node scripts/video-prep/prepare.mjs <file-or-url> --id <id> [--clip a-b] [--units-from data.ts] [--apply] [--fresh]",
    );
    process.exit(1);
  }
  const id = args.id || path.basename(input).replace(/\.[^.]+$/, "");
  const outDir = args.out || path.join(TOOLS, "drafts");
  fs.mkdirSync(outDir, { recursive: true });
  const ffmpeg = findFfmpeg();
  let file = input;
  if (/^https?:\/\//.test(input))
    file = await fetchToFile(input, path.join(TOOLS, "media", `${id}.mp4`));
  const [clipStart, clipEnd] = (args.clip || "0-0").split("-").map(Number);
  const length = clipEnd > clipStart ? clipEnd - clipStart : 0;
  const samples = decode(ffmpeg, file, clipStart, length);
  console.log(
    `audio ${(samples.length / 16000).toFixed(1)} s from ${file}${length ? ` (${clipStart}-${clipEnd} s)` : ""}`,
  );

  let data = null;
  let unitTexts;
  if (args["units-from"]) {
    data = readDataFile(args["units-from"]);
    unitTexts = data.lesson.sentences.map((s) => s.en);
  } else {
    const cache = path.join(outDir, `${id}.words.json`);
    let words;
    if (!args.fresh && fs.existsSync(cache)) {
      words = JSON.parse(fs.readFileSync(cache, "utf8"));
      console.log(`${words.length} words from ${cache}`);
    } else {
      console.log(`transcribing with ${MODEL} (${DEVICE}) ...`);
      const t0 = Date.now();
      words = await transcribe(samples);
      fs.writeFileSync(cache, JSON.stringify(words));
      console.log(`${words.length} words in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    }
    unitTexts = groupWords(words);
  }

  console.log("aligning the text with the audio ...");
  const aligned = await alignText(samples, unitTexts);
  const timed = timeUnits(aligned).map((t, i) => ({
    ...aligned[i],
    start: +(t.start + clipStart).toFixed(2),
    end: +(t.end + clipStart).toFixed(2),
    gapAfter: t.gapAfter === null ? null : +t.gapAfter.toFixed(2),
    firstWord: +(aligned[i].s + clipStart).toFixed(2),
    lastWord: +(aligned[i].e + clipStart).toFixed(2),
  }));

  console.log(" #   start     end    gap  first-last word   words  text");
  timed.forEach((t, i) => {
    const gap = t.gapAfter === null ? "  -  " : t.gapAfter.toFixed(2).padStart(5);
    const old = data
      ? `  (was ${data.lesson.sentences[i].startSeconds}-${data.lesson.sentences[i].endSeconds})`
      : "";
    console.log(
      `${String(i + 1).padStart(2)}  ${t.start.toFixed(2).padStart(7)} ${t.end.toFixed(2).padStart(7)} ${gap}  ${t.firstWord.toFixed(2)}-${t.lastWord.toFixed(2)}  ${String(t.words.length).padStart(3)}  ${t.text.slice(0, 48)}${old}`,
    );
  });

  const draft = {
    id,
    source: input,
    clip: [clipStart, clipEnd],
    units: timed.map((t) => ({
      start: t.start,
      end: t.end,
      en: t.text,
      words: t.words.map((w) => ({
        w: w.w,
        s: +(w.s + clipStart).toFixed(2),
        e: +(w.e + clipStart).toFixed(2),
      })),
    })),
  };
  fs.writeFileSync(path.join(outDir, `${id}.draft.json`), JSON.stringify(draft, null, 2));
  console.log(`draft: ${path.join(outDir, `${id}.draft.json`)}`);

  if (!data) {
    // A new video: a spec to fill in (the Arabic and one meaning per word), then build.mjs writes the lesson file.
    const spec = {
      id,
      youtubeId: "",
      title: "",
      level: "A2",
      durationSeconds: 0,
      clipStart: clipStart,
      clipEnd: clipEnd,
      sourceNote: "",
      sentences: timed.map((t) => ({
        start: t.start,
        end: t.end,
        en: t.text,
        ar: "",
        g: t.text
          .split(/\s+/)
          .map((w) => `${w.replace(/[|=]/g, "")}=`)
          .join("|"),
      })),
    };
    fs.writeFileSync(path.join(outDir, `${id}.spec.json`), JSON.stringify(spec, null, 2));
    console.log(`spec to fill in: ${path.join(outDir, `${id}.spec.json`)}`);
  }

  if (args.apply) {
    if (!data) throw new Error("--apply needs --units-from <data file>");
    data.lesson.sentences.forEach((s, i) => {
      s.startSeconds = timed[i].start;
      s.endSeconds = timed[i].end;
    });
    fs.writeFileSync(
      args["units-from"],
      `${data.head}${JSON.stringify(data.lesson, null, 2)}${data.tail}`,
    );
    console.log(`times written into ${args["units-from"]}`);
  }
}

main().catch((error) => {
  console.error("FAILED:", error && error.message ? error.message : error);
  process.exit(1);
});
