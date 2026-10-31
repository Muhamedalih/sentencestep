/**
 * yvl split --id <slug> [--source <file>] [--max-words 12] [--clip a-b]
 * Step 3: the text of the video becomes short sentences the learner can type from one hearing.
 * Source: the captions recorded by `capture` (default), or --source <file>: a pasted YouTube transcript
 * ("0:03" lines), a .srt/.vtt file, or plain text. Punctuation and capitals are kept exactly; sentences end at
 * . ! ? (numbers, Mr. and closing quotes stay whole); a sentence over --max-words is cut only at a comma,
 * semicolon, colon, dash or conjunction, and `plan` later keeps a cut only where the audio really pauses.
 * A cue that trails off with "..." keeps it and the next cue starts a new sentence (the writer marked a pause there);
 * --join-ellipsis joins them into one sentence instead. Also: numbers and % are spelled as they are said (--keep-digits to stop), a caption left without its final period
 * gets one (reported), and --fix <file> applies `old => new` corrections (one per line) for words the captions got wrong.
 * Writes <slug>.units.json.
 */
import fs from "node:fs";

import {
  draftPath,
  fail,
  importRepoTs,
  num,
  parseRange,
  readJson,
  requireId,
  resolveRepo,
  splitWords,
  writeJson,
} from "../lib/util.mjs";
import { spellNumbers } from "../lib/numbers.mjs";
import {
  capsToCues,
  mergeContinuations,
  repairCueEnds,
  rollUpShare,
  typingProblems,
  unitsFromCues,
} from "../lib/text.mjs";

export async function run(args) {
  const repo = resolveRepo(args);
  const id = requireId(args);
  const maxWords = num(args["max-words"], 12);
  const clip = args.clip ? parseRange(args.clip) : null;
  if (args.clip && !clip) fail("--clip must look like 3.5-57.9");
  const imp = await importRepoTs(repo, "src/lib/video-dictation/transcript-import.ts");

  let cues;
  let source;
  let captionKind = null;
  if (args.source) {
    const file = String(args.source);
    if (!fs.existsSync(file)) fail(`no such file: ${file}`);
    const raw = fs.readFileSync(file, "utf8");
    const parsed = imp.parseTranscript(raw);
    if (parsed.length >= 2 && parsed.some((c) => c.startSeconds > 0)) cues = parsed.map((c) => ({ ...c }));
    else cues = [{ startSeconds: 0, endSeconds: null, text: raw.replace(/\s+/g, " ").trim() }];
    source = { kind: parsed.length >= 2 ? "timed transcript" : "plain text", file };
  } else {
    const capFile = draftPath(args, id, "capture");
    if (!fs.existsSync(capFile)) fail(`no ${capFile}: run capture first, or pass --source <file>`);
    const cap = readJson(capFile);
    cues = capsToCues(cap.caps);
    if (args["join-ellipsis"] === true) cues = mergeContinuations(cues);
    const tracks = cap.details?.tracks;
    captionKind = Array.isArray(tracks) ? tracks.map((t) => `${t.lang}:${t.kind}`).join(",") : null;
    source = { kind: "captions shown by the player", file: capFile, tracks: captionKind, rollUp: rollUpShare(cues) };
    if (!cues.length) fail("the capture has no captions: give the text with --source <file>");
  }
  if (clip) cues = cues.filter((c) => c.startSeconds < clip[1] && (c.endSeconds ?? Infinity) > clip[0]);
  if (!cues.length) fail("no text inside the clip");

  const notes = [];
  // Corrections the person reading the audio wants (a wrong caption word): one `old => new` per line.
  if (args.fix) {
    const fixFile = String(args.fix);
    if (!fs.existsSync(fixFile)) fail(`no such file: ${fixFile}`);
    for (const line of fs.readFileSync(fixFile, "utf8").split(/\r?\n/)) {
      const m = /^(.+?)\s*=>\s*(.*)$/.exec(line.trim());
      if (!m) continue;
      let hits = 0;
      cues = cues.map((c) => {
        if (!c.text.includes(m[1])) return c;
        hits += c.text.split(m[1]).length - 1;
        return { ...c, text: c.text.split(m[1]).join(m[2]) };
      });
      notes.push(hits ? `fixed "${m[1]}" -> "${m[2]}" (${hits}x)` : `WARN fix "${m[1]}" matched nothing`);
    }
  }
  const repaired = repairCueEnds(cues);
  cues = repaired.cues;
  notes.push(...repaired.notes);
  if (args["keep-digits"] !== true) {
    let spelled = 0;
    cues = cues.map((c) => {
      const r = spellNumbers(c.text);
      r.changes.forEach((ch) => notes.push(`spelled ${ch.from} -> ${ch.to}${ch.year ? "  (a year: check how it is said)" : ""}`));
      spelled += r.changes.length;
      return { ...c, text: r.text };
    });
    void spelled;
  }

  const units = unitsFromCues(cues, imp.splitSentences, { maxWords }).map((u, i) => ({ n: i + 1, ...u }));
  writeJson(draftPath(args, id, "units"), { id, source, maxWords, notes, units });

  console.log(` #  words  approx time     text`);
  for (const u of units) {
    const words = splitWords(u.en).length;
    const flags = [u.long ? "LONG" : "", ...typingProblems(u.en)].filter(Boolean);
    console.log(
      `${String(u.n).padStart(2)}  ${String(words).padStart(3)}w  ${u.approx[0].toFixed(1).padStart(5)}-${u.approx[1].toFixed(1).padEnd(5)}${u.exact ? "*" : " "} ${u.cutAfter.padEnd(8)} ${u.en}${flags.length ? `   [${flags.join("; ")}]` : ""}`,
    );
  }
  const counts = units.map((u) => splitWords(u.en).length);
  console.log(
    `${units.length} sentences, ${Math.min(...counts)}-${Math.max(...counts)} words each. * = starts exactly at a caption cue. Third column: the kind of boundary AFTER the sentence.`,
  );
  notes.forEach((n) => console.log(`NOTE ${n}`));
  if (source.rollUp > 0.25) console.log("WARN the captions look like automatic roll-up captions: read every sentence against the audio.");
  console.log(`saved ${draftPath(args, id, "units")}`);
}
