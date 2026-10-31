/**
 * yvl check --id <slug> [--built] [--spec <file>] [--capture <file>] [--threshold dB] [--update] [--repo-tests]
 * Step 6: the gates a lesson must pass before it is built or published. Reads the spec (or, with --built, the
 * generated src/data/videos/<slug>.ts). Errors block; warnings need a decision. When the recorded loudness
 * exists it also checks the audio against the timings: a stop inside a word, a next word heard before the stop,
 * speech that no sentence contains (deleted words), and a text too long or too short for the speech it covers.
 * Exits 1 on any error. Writes <slug>.check.json.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  bareWord,
  draftPath,
  fail,
  hasArabic,
  listLessons,
  normalizeLesson,
  readJson,
  readLessonFile,
  requireId,
  resolveRepo,
  round2,
  splitWords,
  writeJson,
} from "../lib/util.mjs";
import { atPictureEnd, pictureEnd, surroundings, voicedIntervals, voicedWithin } from "../lib/envelope.mjs";
import { SPEECH_RATE, syllables, typingProblems } from "../lib/text.mjs";

const SOURCES = ["public-domain", "creative-commons", "permission", "own", "trial"];
const T = {
  overlapOk: 0.05,
  minSentence: 0.8,
  maxSentence: 14,
  wordsWarn: 12,
  wordsError: 24,
  spsErrLow: SPEECH_RATE.errLow,
  spsErrHigh: SPEECH_RATE.errHigh,
  spsWarnLow: SPEECH_RATE.warnLow,
  spsWarnHigh: SPEECH_RATE.warnHigh,
  afterSoundWarn: 0.04,
  beforeNextWarn: 0.08,
  beforeNextError: 0.03,
  uncoveredWarn: 0.2,
  uncoveredError: 0.45,
};

/** Word-level diff of two texts (LCS): the edits that turn `a` into `b`, as [{ from, to }] replacements/insertions/deletions. */
export function diffWords(a, b) {
  const x = a.map(bareWord);
  const y = b.map(bareWord);
  const dp = Array.from({ length: x.length + 1 }, () => new Array(y.length + 1).fill(0));
  for (let i = x.length - 1; i >= 0; i--)
    for (let j = y.length - 1; j >= 0; j--) dp[i][j] = x[i] === y[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const edits = [];
  let i = 0;
  let j = 0;
  let del = [];
  let ins = [];
  const flush = () => {
    if (del.length || ins.length) edits.push({ from: del.join(" "), to: ins.join(" ") });
    del = [];
    ins = [];
  };
  while (i < x.length || j < y.length) {
    if (i < x.length && j < y.length && x[i] === y[j]) {
      flush();
      i++;
      j++;
    } else if (j < y.length && (i >= x.length || dp[i][j + 1] >= dp[i + 1][j])) ins.push(a.length ? b[j++] : b[j++]);
    else del.push(a[i++]);
  }
  flush();
  return edits.filter((e) => e.from || e.to);
}

/** The pure part: a normalized lesson plus optional evidence in, { errors, warns, infos } out. */
export function checkLesson(L, ctx = {}) {
  const errors = [];
  const warns = [];
  const infos = [];
  const E = (where, msg) => errors.push(`${where}: ${msg}`);
  const W = (where, msg) => warns.push(`${where}: ${msg}`);

  if (!/^[a-z0-9-]+$/.test(L.id ?? "")) E("lesson", "id must be a lower-case slug");
  if (!/^[A-Za-z0-9_-]{11}$/.test(L.youtubeId ?? "")) E("lesson", "youtubeId must be 11 characters");
  if (!L.title || L.title.length < 3) E("lesson", "title is empty");
  if (!L.channel) E("lesson", "channel is empty (build.mjs would fill in VOA Learning English: always set it)");
  if (!/^https:\/\/(www\.)?youtube\.com\//.test(L.channelUrl ?? "")) E("lesson", "channelUrl must be a youtube.com link");
  if (!["A1", "A2", "B1", "B2"].includes(L.level)) E("lesson", "level must be A1, A2, B1 or B2");
  if (!(L.durationSeconds > 0)) E("lesson", "durationSeconds is missing: it is the video's length, the page's ad check compares the player with it");
  if (!SOURCES.includes(L.textSource)) E("lesson", `textSource must be one of ${SOURCES.join(", ")} (decide the rights basis first)`);
  const note = L.sourceNote ?? "";
  if (L.textSource === "trial") {
    infos.push("trial: Admins only, hidden from learners; it must be cleared or removed before the section opens.");
    if (!/trial/i.test(note)) W("lesson", "a trial lesson's sourceNote should say TRIAL ONLY and why");
  } else if (SOURCES.includes(L.textSource)) {
    if (note.length < 80) E("lesson", "sourceNote is too short: say who made it, the rights basis with a link, where the text and the stops come from");
    else if (!/(https?:\/\/|nasa|public domain|creative commons|cc by|cc0|permission|our own|own production)/i.test(note))
      W("lesson", "sourceNote names no rights basis (a link, 'public domain', 'CC BY', 'permission'...)");
  }

  // Timeline
  if (L.clipStart < 0) E("lesson", "the clip cannot start before 0");
  if (!(L.clipEnd > L.clipStart)) E("lesson", "the clip must end after it starts");
  if (L.clipEnd > L.durationSeconds + 0.5) E("lesson", `the clip ends at ${L.clipEnd} s, past the video (${L.durationSeconds} s)`);
  if (!L.sentences.length) E("lesson", "no sentences");
  let prevEnd = L.clipStart;
  const seen = new Map();
  L.sentences.forEach((s, i) => {
    const w = `s${s.n}`;
    if (!(s.end > s.start)) E(w, "must end after it starts");
    if (s.start < L.clipStart - 0.01) E(w, "starts before the clip");
    if (s.end > L.clipEnd + 0.01) E(w, "ends after the clip");
    if (s.start < prevEnd - T.overlapOk) E(w, `overlaps the sentence before by ${(prevEnd - s.start).toFixed(2)} s`);
    prevEnd = s.end;
    const dur = s.end - s.start;
    if (dur < T.minSentence) W(w, `only ${dur.toFixed(2)} s long`);
    if (dur > T.maxSentence) W(w, `${dur.toFixed(1)} s long (hard to hold in the head)`);
    const key = bareWord(s.en.replace(/\s+/g, " "));
    if (seen.has(s.en.toLowerCase())) W(w, `the same text as s${seen.get(s.en.toLowerCase())}`);
    seen.set(s.en.toLowerCase(), s.n);
    void key;

    // Text the learner types
    const words = splitWords(s.en);
    if (!words.length) E(w, "no English text");
    if (words.length > T.wordsError) E(w, `${words.length} words: far too long to type from one hearing`);
    else if (words.length > T.wordsWarn) W(w, `${words.length} words (over ${T.wordsWarn}): keep only if the speech has no pause to cut at`);
    if (words.length && !/[.!?]["')\]]*$/.test(s.en)) W(w, "does not end with . ! or ?");
    for (const p of typingProblems(s.en)) {
      if (/^letters a US keyboard/.test(p) || /^extra spaces|^non-breaking/.test(p)) E(w, p);
      else W(w, p);
    }

    // Arabic and meanings
    if (!s.ar.trim()) E(w, "no Arabic translation");
    else if (!hasArabic(s.ar)) E(w, "the Arabic translation has no Arabic letters");
    else {
      const ratio = splitWords(s.ar).length / Math.max(1, words.length);
      if (ratio < 0.4 || ratio > 2.2) W(w, `the Arabic has ${splitWords(s.ar).length} words for ${words.length} English words: check it`);
    }
    if (!s.pairs) E(w, "no word meanings");
    else if (s.pairs.length !== words.length) E(w, `${s.pairs.length} meanings for ${words.length} words`);
    else
      words.forEach((word, k) => {
        const pair = s.pairs[k];
        if (bareWord(pair.key) !== bareWord(word)) E(w, `meaning ${k + 1} is for "${pair.key}", the word is "${word}"`);
        else if (!pair.meaning || !pair.meaning.trim()) E(w, `no meaning for "${word}"`);
        else if (/^[?.\s-]+$/.test(pair.meaning)) E(w, `placeholder meaning for "${word}"`);
        else if (!hasArabic(pair.meaning) && !/^\d+$/.test(pair.meaning) && bareWord(pair.meaning) === bareWord(word))
          W(w, `the meaning of "${word}" is the English word itself`);
      });
    void i;
  });
  if (L.sentences.length && Math.floor(L.clipStart) < L.sentences[0].start - 1.5)
    W("lesson", `the video plays from ${Math.floor(L.clipStart)} s but the first sentence starts at ${L.sentences[0].start} s`);

  // Other lessons
  for (const other of ctx.others ?? []) {
    if (ctx.selfFile && path.resolve(other.file) === path.resolve(ctx.selfFile)) continue;
    const rebuilt = other.lesson.id === L.id;
    if (rebuilt && !ctx.update) E("lesson", `the id ${L.id} is already used by ${path.basename(other.file)} (building would overwrite it; --update to allow)`);
    // With --update the lesson of the same id is the one being rebuilt: its video is this video.
    if (other.lesson.youtubeId === L.youtubeId && !(rebuilt && ctx.update)) E("lesson", `the video ${L.youtubeId} is already lesson ${other.lesson.id}`);
  }

  // Text against the source text (deleted or added words)
  if (ctx.sourceWords) {
    const mine = L.sentences.flatMap((s) => splitWords(s.en));
    const edits = diffWords(ctx.sourceWords, mine);
    if (edits.length === 0) infos.push("text equals the source text word for word");
    else {
      const shown = edits.slice(0, 8).map((e) => (e.from && e.to ? `"${e.from}" -> "${e.to}"` : e.from ? `lost "${e.from}"` : `added "${e.to}"`));
      const lost = edits.filter((e) => e.from && !e.to).length;
      (lost ? warns : infos).push(`text differs from the source in ${edits.length} place(s): ${shown.join("; ")}${edits.length > 8 ? " ..." : ""}`);
    }
  }

  // Audio consistency
  if (ctx.intervals && L.sentences.length) {
    const V = ctx.intervals;
    const rates = [];
    L.sentences.forEach((s, i) => {
      const w = `s${s.n}`;
      const words = splitWords(s.en).length;
      const syl = splitWords(s.en).reduce((sum, word) => sum + syllables(word), 0);
      const voiced = voicedWithin(V, s.start, s.end);
      const wps = voiced > 0 ? syl / voiced : 0;
      rates.push(wps);
      if (voiced < SPEECH_RATE.minVoiced) E(w, `almost no speech inside ${s.start}-${s.end} s: the sentence is misplaced`);
      else if (wps < T.spsErrLow) E(w, `${voiced.toFixed(1)} s of speech for ${words} words (${wps.toFixed(1)} syllables/s): speech is missing from the text`);
      else if (wps > T.spsErrHigh) E(w, `${words} words for ${voiced.toFixed(1)} s of speech (${wps.toFixed(1)} syllables/s): the text is longer than the speech`);
      else if (wps < T.spsWarnLow || wps > T.spsWarnHigh) W(w, `${wps.toFixed(1)} syllables/s is unusual: read it against the audio`);

      const here = surroundings(V, s.end);
      const last = i === L.sentences.length - 1;
      // The last sentence can run to the last frame: the page takes the end of the video as its stop, so speech up to there is no cut.
      if (last && atPictureEnd(s.end, ctx.pictureEnd)) infos.push(`${w}: the stop is the end of the video (the picture ends at ${ctx.pictureEnd} s)`);
      else if (here.inside) E(w, `the stop at ${s.end} s is INSIDE speech (cuts a word)`);
      else {
        if (here.sinceSound < T.afterSoundWarn) W(w, `the stop is only ${here.sinceSound.toFixed(2)} s after the last sound (the end of the word may be cut)`);
        if (!last) {
          if (here.untilSound < T.beforeNextError) E(w, `the next sound starts ${here.untilSound.toFixed(2)} s after the stop: the learner will hear the next sentence begin`);
          else if (here.untilSound < T.beforeNextWarn) W(w, `the next sound starts ${here.untilSound.toFixed(2)} s after the stop (tight)`);
        }
      }
      if (!last) {
        const hole = voicedWithin(V, s.end + 0.02, L.sentences[i + 1].start - 0.02);
        if (hole > T.uncoveredError) E(w, `${hole.toFixed(2)} s of speech between this sentence and the next belongs to no sentence (deleted words?)`);
        else if (hole > T.uncoveredWarn) W(w, `${hole.toFixed(2)} s of speech between this sentence and the next belongs to no sentence`);
      }
    });
    const lead = voicedWithin(V, Math.floor(L.clipStart), L.sentences[0].start - 0.05);
    if (lead > 0.3) W("s1", `${lead.toFixed(2)} s of sound plays before the first sentence (from the clip start)`);
    const tail = voicedWithin(V, L.sentences[L.sentences.length - 1].end + 0.05, L.clipEnd);
    if (tail > 0.3) W(`s${L.sentences.length}`, `${tail.toFixed(2)} s of speech after the last stop and before the clip end: extend the last sentence or shorten the clip`);
    const live = rates.filter(Boolean).sort((a, b) => a - b);
    const median = live[live.length >> 1] || 0;
    if (median)
      rates.forEach((r, i) => {
        if (r && (r < median * 0.55 || r > median * 1.6)) W(`s${i + 1}`, `speaking rate ${r.toFixed(1)} syllables/s against a typical ${median.toFixed(1)}: a boundary may sit in the wrong pause`);
      });
    infos.push(`audio: ${V.length} voiced intervals, median ${median ? median.toFixed(1) : "?"} syllables/s`);
  } else infos.push("no recorded loudness: the stops are NOT checked against the audio (run capture)");

  return { errors, warns, infos };
}

export async function run(args) {
  const repo = resolveRepo(args);
  let raw;
  let kind;
  let selfFile = null;
  let id = typeof args.id === "string" ? args.id : null;
  if (args.spec) {
    raw = readJson(String(args.spec));
    kind = "spec";
    id = id ?? raw.id;
  } else {
    id = requireId(args);
    const specFile = draftPath(args, id, "spec");
    const dataFile = path.join(repo, "src", "data", "videos", `${id}.ts`);
    if (args.built || !fs.existsSync(specFile)) {
      if (!fs.existsSync(dataFile)) fail(`neither ${specFile} nor ${dataFile} exists`);
      raw = readLessonFile(dataFile);
      kind = "built";
      selfFile = dataFile;
    } else {
      raw = readJson(specFile);
      kind = "spec";
    }
  }
  const L = normalizeLesson(raw);

  const ctx = { others: listLessons(repo), selfFile, update: Boolean(args.update) };
  const capFile = args.capture ? String(args.capture) : draftPath(args, id, "capture");
  let separability = null;
  if (fs.existsSync(capFile) && L.sentences.length) {
    const cap = readJson(capFile);
    const v = voicedIntervals(cap.samples, {
      from: Math.max(0, L.clipStart - 2),
      to: L.clipEnd + 2,
      threshold: args.threshold === undefined ? null : Number(args.threshold),
    });
    ctx.intervals = v.intervals;
    ctx.pictureEnd = pictureEnd(cap);
    separability = v.separability;
  }
  const unitsFile = draftPath(args, id, "units");
  if (kind === "spec" && fs.existsSync(unitsFile) && !args["no-source"]) {
    const { units } = readJson(unitsFile);
    ctx.sourceWords = units.flatMap((u) => splitWords(u.en));
  }

  const { errors, warns, infos } = checkLesson(L, ctx);
  console.log(`CHECK ${id} (${kind}): ${L.sentences.length} sentences, clip ${L.clipStart}-${L.clipEnd} s of ${L.durationSeconds} s, textSource ${L.textSource || "(none)"}`);
  errors.forEach((m) => console.log(`ERROR ${m}`));
  warns.forEach((m) => console.log(`WARN  ${m}`));
  infos.forEach((m) => console.log(`INFO  ${m}`));
  if (separability != null && separability < 0.5) console.log(`WARN  lesson: voice and background are not clearly apart (separability ${separability.toFixed(2)}): listen to every stop`);

  if (args["repo-tests"]) {
    const r = spawnSync("npm", ["--prefix", repo, "run", "test:video"], { encoding: "utf8", shell: true });
    const tail = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim().split("\n").slice(-6).join("\n");
    console.log(`REPO  npm run test:video -> ${r.status === 0 ? "pass" : "FAIL"}\n${tail}`);
    if (r.status !== 0) errors.push("repo: npm run test:video failed");
  }

  const result = errors.length ? "FAIL" : "PASS";
  console.log(`RESULT ${result} (${errors.length} errors, ${warns.length} warnings)`);
  writeJson(draftPath(args, id, "check"), { id, kind, result, errors, warns, infos, checkedAt: new Date().toISOString(), clip: [L.clipStart, L.clipEnd], sentences: L.sentences.length, rounded: round2(0) });
  if (errors.length) process.exitCode = 1;
}
