/**
 * yvl plan --id <slug> [--clip-start N] [--clip-end N] [--threshold dB] [--min-pause 0.45] [--window a-b] [--anchors]
 * Step 4: where every sentence starts (the replay point) and ends (the stop). Measured, not guessed:
 *   1. the voice is found in the recorded loudness (threshold chosen from the data, Otsu);
 *   2. the ends of real sentences (. ! ?) go into pauses: increasing pauses, inside the caption cue window when the
 *      sentence starts at a cue, preferring the pause that stands out there, then a steady speaking rate;
 *   3. a long sentence is cut inside only where its own speech has a pause of --min-pause or more at about the place
 *      its words put it; a cut with no such pause is undone (the pieces join again);
 *   4. the stop goes 0.30 s after the last sound but never nearer than 0.10 s to the next one.
 * Writes <slug>.spec.json (Arabic and meanings still empty: `fill` adds them) and <slug>.plan.json (the evidence),
 * and lists the boundaries a person should listen to once.
 * --anchors places the sentences by the caption word times instead of by the pauses alone (roll-up captions, several
 * voices, noise): plan-anchors.mjs. A plan that fails for lack of clear pauses suggests it.
 */
import {
  draftPath,
  fail,
  fmt,
  loadJob,
  num,
  parseRange,
  readJson,
  requireId,
  round1,
  round2,
  splitWords,
  writeJson,
} from "../lib/util.mjs";
import { assignBoundaries, gapsOf, lastStopLimit, pictureEnd, placeStops, voicedIntervals, voicedWithin } from "../lib/envelope.mjs";
import { SPEECH_RATE, syllables, unitWeight } from "../lib/text.mjs";
import { anchorsHint } from "../lib/anchors.mjs";
import { run as runAnchored } from "./plan-anchors.mjs";

const words = (text) => splitWords(text).length;

function join(a, b) {
  return { ...a, en: `${a.en} ${b.en}`, approx: [a.approx[0], b.approx[1]], cutAfter: b.cutAfter, long: false };
}

function groupSentences(units) {
  const groups = [];
  let cur = [];
  for (const u of units) {
    cur.push(u);
    if (u.cutAfter === "sentence") {
      groups.push(cur);
      cur = [];
    }
  }
  if (cur.length) groups.push(cur);
  return groups.map((pieces) => ({
    pieces,
    weight: pieces.reduce((sum, p) => sum + unitWeight(p.en), 0),
    exact: Boolean(pieces[0].exact),
    approxStart: pieces[0].approx[0],
  }));
}

/**
 * Cuts inside one real sentence: only as many of its pieces as its own speech clearly supports. A cut is kept when the
 * pause is long (--min-pause), the pieces last about as long as their words need, and no other pause of 0.12 s or more
 * lies within 0.45 s of it (with two rival pauses the cut could be one word to either side, and a stop one word off
 * leaks or cuts a word). Otherwise the pieces join again and the sentence stays whole.
 */
function cutInside(pieces, intervals, minPause) {
  const all = gapsOf(intervals);
  let ps = pieces.map((piece) => ({ ...piece }));
  while (ps.length > 1) {
    const res = assignBoundaries(
      ps.map((piece) => unitWeight(piece.en)),
      intervals,
      { minGap: minPause, sigmaRel: 0.3, sigmaAbs: 0.3, pausePenalty: 1.5 },
    );
    let drop = -1;
    if (res.error) {
      let best = Infinity;
      for (let i = 0; i + 1 < ps.length; i++) {
        const score = words(ps[i].en) + words(ps[i + 1].en) + (ps[i].cutAfter === "conj" ? -0.5 : 0);
        if (score < best) {
          best = score;
          drop = i;
        }
      }
    } else {
      const rel = (i) => Math.abs(res.errs[i]) / Math.max(0.8, res.expected[i]);
      let worst = 0;
      for (let i = 1; i < res.errs.length; i++) if (rel(i) > rel(worst)) worst = i;
      if (rel(worst) > 0.4 && Math.abs(res.errs[worst]) > 0.6) drop = Math.min(worst, ps.length - 2);
      else {
        for (let i = 0; i < res.chosen.length && drop < 0; i++) {
          const g = res.chosen[i];
          const mid = (g.a + g.b) / 2;
          if (all.some((h) => h.k !== g.k && h.d >= 0.12 && Math.abs((h.a + h.b) / 2 - mid) <= 0.45)) drop = i;
        }
        if (drop < 0) return { pieces: ps, res };
      }
    }
    ps.splice(drop, 2, join(ps[drop], ps[drop + 1]));
  }
  return { pieces: ps, res: { chosen: [], margins: [], errs: [], anchorMisses: [] } };
}

export async function run(args) {
  if (args.anchors) return runAnchored(args);
  const id = requireId(args);
  const { units: baseUnits, maxWords = 12 } = readJson(draftPath(args, id, "units"));
  const cap = readJson(draftPath(args, id, "capture"));
  const job = loadJob(args, id) ?? {};
  const minPause = num(args["min-pause"], 0.45);

  const firstApprox = baseUnits[0].approx[0];
  const lastApprox = baseUnits[baseUnits.length - 1].approx[1];
  const win = args.window ? parseRange(args.window) : null;
  if (args.window && !win) fail("--window must look like 2-70");
  const from = win ? win[0] : Math.max(cap.from ?? 0, firstApprox - 1.5);
  const to = win ? win[1] : lastApprox + 0.6;
  const v = voicedIntervals(cap.samples, { from, to, threshold: args.threshold === undefined ? null : num(args.threshold, null) });
  if (v.intervals.length < 2) fail("fewer than two voiced intervals found: check the capture (audio running? --window?)");

  const sentences = groupSentences(baseUnits);
  const windows = sentences.slice(1).map((s) => (s.exact ? [s.approxStart - 0.9, s.approxStart + 1.8] : null));
  const top = assignBoundaries(
    sentences.map((s) => s.weight),
    v.intervals,
    { windows, pausePenalty: 3 },
  );
  if (top.error) fail(`${top.error}. Sentences: ${sentences.length}. Try --threshold, --window, or check the captions.${anchorsHint(cap.caps, id)}`);

  const finalUnits = [];
  const bounds = [];
  sentences.forEach((s, si) => {
    const lo = si === 0 ? -Infinity : top.chosen[si - 1].b;
    const hi = si === sentences.length - 1 ? Infinity : top.chosen[si].a;
    const inside = v.intervals.filter((r) => r.s >= lo - 1e-6 && r.e <= hi + 1e-6);
    const inner = s.pieces.length > 1 ? cutInside(s.pieces, inside, minPause) : { pieces: s.pieces, res: { chosen: [], margins: [], errs: [], anchorMisses: [] } };
    inner.pieces.forEach((p, k) => {
      finalUnits.push(p);
      if (k < inner.pieces.length - 1) bounds.push({ kind: "cut", gap: inner.res.chosen[k], margin: inner.res.margins[k], err: inner.res.errs[k], miss: false });
      else if (si < sentences.length - 1)
        bounds.push({ kind: "end", gap: top.chosen[si], margin: top.margins[si], err: top.errs[si], miss: top.anchorMisses.includes(si) });
    });
  });

  const placed = bounds.map((b) => placeStops(b.gap));
  const firstSound = v.intervals[0].s;
  const lastSound = v.intervals[v.intervals.length - 1].e;
  // A stop after the last frame is never reached: no later than just before the picture's end when the capture saw it.
  const durationLimit = Math.min(cap.details?.duration ?? Infinity, lastStopLimit(pictureEnd(cap)));
  const timed = finalUnits.map((u, i) => ({
    u,
    start: round2(i === 0 ? Math.max(0, firstSound - 0.1) : placed[i - 1].start),
    end: round2(i === finalUnits.length - 1 ? Math.min(lastSound + 0.3, durationLimit) : placed[i].end),
  }));

  const clipStart = args["clip-start"] !== undefined ? num(args["clip-start"], 0) : Math.max(0, Math.floor(timed[0].start - 0.15));
  const clipEnd =
    args["clip-end"] !== undefined ? num(args["clip-end"], 0) : Math.min(Math.ceil(timed[timed.length - 1].end * 10) / 10, durationLimit);
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
    clipStart,
    clipEnd,
    sentences: timed.map(({ u, start, end }) => ({
      start,
      end,
      en: u.en,
      ar: "",
      g: splitWords(u.en)
        .map((w) => `${w.replace(/[|=]/g, "")}=`)
        .join("|"),
    })),
  });

  const listen = [];
  console.log(` #   start     end  pause  words syl/s  flags               text`);
  timed.forEach(({ u, start, end }, i) => {
    const b = bounds[i];
    const voiced = voicedWithin(v.intervals, start, end);
    const syl = splitWords(u.en).reduce((sum, w) => sum + syllables(w), 0);
    const wps = voiced > 0 ? syl / voiced : 0;
    const flags = [];
    if (b) {
      if (b.kind === "cut") flags.push("inner-cut");
      if (placed[i].noRoom) flags.push("NO-ROOM");
      else if (placed[i].tight) flags.push("tight");
      if (b.margin < 1.5) flags.push("shaky");
      if (Math.abs(b.err) > 1.2) flags.push("rate-off");
      if (b.miss) flags.push("no-cue-window");
      if (flags.length) listen.push({ after: i + 1, at: round2(end), pause: round2(b.gap.d), flags: [...flags] });
    }
    if (wps && (wps < SPEECH_RATE.warnLow || wps > SPEECH_RATE.warnHigh)) flags.push(`rate ${wps.toFixed(1)}`);
    if (words(u.en) > maxWords) flags.push(`${words(u.en)} words`);
    console.log(
      `${String(i + 1).padStart(2)} ${fmt(start, 7)} ${fmt(end, 7)} ${b ? fmt(b.gap.d, 5) : "    -"}${b ? (b.kind === "cut" ? "c" : " ") : " "} ${String(words(u.en)).padStart(3)}  ${wps ? wps.toFixed(1) : " - "}  ${flags.join(",").padEnd(19)} ${u.en.length > 50 ? `${u.en.slice(0, 49)}…` : u.en}`,
    );
  });
  const undone = baseUnits.length - finalUnits.length;
  console.log(
    `${finalUnits.length} sentences (${sentences.length} real sentences${undone ? `, ${undone} cut(s) undone: no real pause there` : ""}); voice threshold ${v.threshold.toFixed(1)} dB, separability ${v.separability == null ? "n/a" : v.separability.toFixed(2)}; first sound ${firstSound.toFixed(2)} s, last ${lastSound.toFixed(2)} s; clip ${clipStart}-${clipEnd} s of ${duration} s. "c" = a cut inside a real sentence.`,
  );
  if (v.separability != null && v.separability < 0.5) console.log("WARN voice and background are not clearly apart: every stop below needs a human listen.");
  const lead = v.intervals.filter((r) => r.e > clipStart && r.s < timed[0].start - 0.05);
  if (lead.length) console.log(`WARN sound between the clip start (${clipStart} s) and the first sentence (${timed[0].start} s): adjust --clip-start or accept the lead-in.`);
  console.log(
    listen.length
      ? `LISTEN once (${listen.length}): ${listen.map((l) => `${l.at}s after #${l.after} [${l.flags.join(",")}; pause ${l.pause}]`).join("; ")}`
      : "LISTEN list is empty: every stop sits in a clear pause.",
  );
  writeJson(draftPath(args, id, "plan"), {
    id,
    threshold: v.threshold,
    separability: v.separability,
    window: [from, to],
    intervals: v.intervals.length,
    boundaries: bounds.map((b, i) => ({ after: i + 1, kind: b.kind, a: round2(b.gap.a), b: round2(b.gap.b), pause: round2(b.gap.d), end: round2(placed[i].end), start: round2(placed[i].start), margin: round1(b.margin), rateErr: round1(b.err) })),
    listen,
  });
  console.log(`saved ${draftPath(args, id, "spec")}  (next: yvl fill --id ${id} --list, write ${id}.ar.txt, yvl fill --id ${id})`);
}
