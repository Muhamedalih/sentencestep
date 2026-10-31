/**
 * yvl plan --id <slug> --anchors [--threshold dB] [--window a-b] [--clip-start N] [--clip-end N]
 * Step 4 for a video the pauses alone cannot place: a Short with roll-up (automatic) captions, two voices of different
 * loudness, sound effects (plain `plan` fails with "no increasing choice of pauses"). The caption words' times say
 * which stretch of voice is which sentence:
 *   1. each word of the captions gets the moment the player first showed it (word by word, roll-up);
 *   2. the voice is found in the recorded loudness (--threshold dB, else chosen from the data);
 *   3. a stretch of voice belongs to the sentence whose words overlap it; sentences that share one have no pause
 *      between them and are joined, as is any sentence whose speech rate `check` would refuse (a held scream, a mumble);
 *   4. every stop goes into a measured pause, as in `plan`.
 * Reads <slug>.units.json (every unit is a sentence; cutAfter is ignored), the capture and the job; writes
 * <slug>.spec.json and <slug>.plan.json in the shapes `plan` writes. Joins and sounds no caption knows go on the
 * LISTEN list: the skill cannot hear, so a person listens once.
 */
import fs from "node:fs";

import { draftPath, fail, fmt, loadJob, num, parseRange, readJson, requireId, round2, splitWords, writeJson } from "../lib/util.mjs";
import { pictureEnd } from "../lib/envelope.mjs";
import { placeText, planAnchored } from "../lib/anchors.mjs";

export async function run(args) {
  const id = requireId(args);
  const unitsFile = draftPath(args, id, "units");
  const capFile = draftPath(args, id, "capture");
  if (!fs.existsSync(unitsFile)) fail(`no ${unitsFile}: run split first`);
  if (!fs.existsSync(capFile)) fail(`no ${capFile}: run capture first`);
  const { units, maxWords = 12 } = readJson(unitsFile);
  const cap = readJson(capFile);
  const job = loadJob(args, id) ?? {};
  const win = args.window ? parseRange(args.window) : null;
  if (args.window && !win) fail("--window must look like 2-70");

  const plan = planAnchored({
    caps: cap.caps ?? [],
    samples: cap.samples,
    texts: units.map((u) => u.en),
    duration: cap.details?.duration ?? Infinity,
    pictureEnd: pictureEnd(cap),
    threshold: args.threshold === undefined ? null : num(args.threshold, null),
    voiceWindow: win,
    captureFrom: cap.from ?? 0,
    clipStart: args["clip-start"] === undefined ? undefined : num(args["clip-start"], 0),
    clipEnd: args["clip-end"] === undefined ? undefined : num(args["clip-end"], 0),
    maxWords,
  });
  const { sentences, clip, runs } = plan;
  const duration = cap.details?.duration ? Math.round(cap.details.duration) : 0;

  writeJson(draftPath(args, id, "spec"), {
    id,
    youtubeId: cap.youtubeId ?? job.youtubeId ?? "",
    title: job.title ?? cap.details?.title ?? "",
    channel: job.channel ?? cap.details?.author ?? "",
    channelUrl: job.channelUrl ?? "",
    level: "",
    textSource: "",
    sourceNote: "",
    durationSeconds: duration,
    clipStart: clip.start,
    clipEnd: clip.end,
    sentences: sentences.map((s) => ({
      start: s.start,
      end: s.end,
      en: s.text,
      ar: "",
      g: splitWords(s.text)
        .map((w) => `${w.replace(/[|=]/g, "")}=`)
        .join("|"),
    })),
  });

  console.log(` #   start     end  pause  words syl/s  flags               text`);
  for (const s of sentences)
    console.log(
      `${String(s.n).padStart(2)} ${fmt(s.start, 7)} ${fmt(s.end, 7)} ${s.pause === null ? "    -" : fmt(s.pause, 5)}  ${String(s.words).padStart(3)}  ${s.rate ? s.rate.toFixed(1) : " - "}  ${s.flags.join(",").padEnd(19)} ${s.text.length > 50 ? `${s.text.slice(0, 49)}…` : s.text}`,
    );
  plan.notes.forEach((n) => console.log(`NOTE ${n}`));
  plan.warns.forEach((w) => console.log(`WARN ${w}`));
  console.log(
    `${sentences.length} sentences from ${units.length} caption sentences (${plan.matched} of ${plan.total} words found in the captions); voice threshold ${plan.threshold.toFixed(1)} dB, separability ${plan.separability == null ? "n/a" : plan.separability.toFixed(2)}; first sound ${plan.firstSound.toFixed(2)} s, last ${plan.lastSound.toFixed(2)} s; clip ${clip.start}-${clip.end} s of ${duration} s.`,
  );
  const where = (l) => (l.after ? `${l.at}s after #${l.after}` : `${l.at}s ${placeText(l)}`);
  console.log(
    plan.listen.length
      ? `LISTEN once (${plan.listen.length}): ${plan.listen.map((l) => `${where(l)} [${l.flags.join(",")}${l.pause == null ? "" : `; pause ${l.pause}`}]`).join("; ")}`
      : "LISTEN list is empty: every stop sits in a clear pause.",
  );

  writeJson(draftPath(args, id, "plan"), {
    id,
    method: "anchored: voiced runs from the recorded loudness; run ownership from the caption word times; stops in measured pauses",
    threshold: plan.threshold,
    separability: plan.separability,
    window: plan.window,
    intervals: runs.length,
    boundaries: plan.placed.map((p, i) => ({ after: i + 1, kind: "end", a: round2(p.gap.a), b: round2(p.gap.b), pause: round2(p.gap.d), end: round2(p.end), start: round2(p.start) })),
    joins: sentences.filter((s) => s.members.length > 1).map((s) => ({ sentence: s.n, captionSentences: s.members.map((m) => m + 1) })),
    unowned: plan.unowned.map((u) => [round2(u.s), round2(u.e)]),
    listen: plan.listen,
  });
  console.log(`saved ${draftPath(args, id, "spec")}  (next: yvl fill --id ${id} --list, write ${id}.ar.txt, yvl fill --id ${id})`);
}
