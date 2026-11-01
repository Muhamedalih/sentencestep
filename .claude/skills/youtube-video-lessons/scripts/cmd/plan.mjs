/**
 * yvl plan --id <slug> [--clip-start N] [--clip-end N] [--threshold dB] [--min-pause 0.45] [--window a-b] [--anchors]
 * Step 4: where every sentence starts (the replay point) and ends (the stop). Measured, not guessed:
 *   1. the voice is found in the recorded loudness (threshold chosen from the data, Otsu);
 *   2. the ends of real sentences (. ! ?) go into pauses: increasing pauses, inside the caption cue window when the
 *      sentence starts at a cue, preferring the pause that stands out there, then a steady speaking rate;
 *   3. a long sentence is cut inside only where its own speech has a pause of --min-pause or more at about the place
 *      its words put it; a cut with no such pause is undone (the pieces join again), the weakest cut first;
 *   4. the stop goes 0.30 s after the last sound but never nearer than 0.10 s to the next one, and moves to the quietest
 *      moment of its pause when it would land on a breath, hiss or burst that the voice band cannot hear (moved-quiet).
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
import {
  assignBoundaries,
  cutSupport,
  gapsOf,
  lastStopLimit,
  pictureEnd,
  placeStops,
  quietStop,
  soundLevel,
  voicedIntervals,
  voicedWithin,
} from "../lib/envelope.mjs";
import { SPEECH_RATE, rateOff, syllables, unitWeight } from "../lib/text.mjs";
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
 * pause is long (--min-pause), every piece (the last too) lasts about as long as its words need, and no rival pause (one
 * of 0.12 s or more and at least half as long as this one) lies within 0.45 s of it: with two rivals the cut could be one
 * word to either side, and a stop one word off leaks or cuts a word, while a word gap under half the pause is no rival.
 * Otherwise the pieces join again and the sentence stays whole. When there are fewer pauses than cuts the
 * cut with the least pause near where its words put it goes first (one with none at all before any other), never just
 * the smallest pair: that dropped the two cuts the speech backed best and kept the one it did not.
 * Returns { pieces, res } and `refused`: the cuts undone only because a rival pause stood beside them, [{ gap, why }]: two
 * pauses a person may be able to tell apart by listening, so they go on the LISTEN list with the stop the cut would have had
 * (a cut undone for its speech rate has the evidence against it and is not listed).
 */
export function cutInside(pieces, intervals, minPause) {
  const all = gapsOf(intervals);
  const opts = { minGap: minPause, sigmaRel: 0.3, sigmaAbs: 0.3, pausePenalty: 1.5 };
  const refused = [];
  let ps = pieces.map((piece) => ({ ...piece }));
  while (ps.length > 1) {
    const weights = ps.map((piece) => unitWeight(piece.en));
    const res = assignBoundaries(weights, intervals, opts);
    let drop = -1;
    if (res.error) {
      const support = cutSupport(weights, intervals, opts);
      let weakest = null;
      for (let i = 0; i + 1 < ps.length; i++) {
        const pair = words(ps[i].en) + words(ps[i + 1].en) + (ps[i].cutAfter === "conj" ? -0.5 : 0);
        const lower = !weakest || support[i].support < weakest.support - 1e-9 || (Math.abs(support[i].support - weakest.support) <= 1e-9 && pair < weakest.pair);
        if (lower) weakest = { i, support: support[i].support, pair };
      }
      drop = weakest.i;
    } else {
      const rel = (i) => Math.abs(res.errs[i]) / Math.max(0.8, res.expected[i]);
      let worst = 0;
      for (let i = 1; i < res.errs.length; i++) if (rel(i) > rel(worst)) worst = i;
      if (rel(worst) > 0.4 && Math.abs(res.errs[worst]) > 0.6) drop = Math.min(worst, ps.length - 2);
      else {
        for (let i = 0; i < res.chosen.length && drop < 0; i++) {
          const g = res.chosen[i];
          const mid = (g.a + g.b) / 2;
          const rival = all.find((h) => h.k !== g.k && h.d >= Math.max(0.12, g.d / 2) && Math.abs((h.a + h.b) / 2 - mid) <= 0.45);
          if (rival) {
            drop = i;
            refused.push({ gap: g, why: `a ${rival.d.toFixed(2)} s pause at ${rival.a.toFixed(2)} s rivals it` });
          }
        }
        if (drop < 0) return { pieces: ps, res, refused };
      }
    }
    ps.splice(drop, 2, join(ps[drop], ps[drop + 1]));
  }
  return { pieces: ps, res: { chosen: [], margins: [], errs: [], anchorMisses: [] }, refused };
}

/**
 * What `plan` decides from a capture, without files or printing: the voice, the ends of the real sentences, the cuts inside
 * the long ones, and where every stop and replay start goes. `cap` is the capture ({ samples, from, details }), `window` an
 * optional [from, to] to look for voice in. Returns { error } (with `sentences` when the pauses could not place them) or the plan.
 */
export function planSentences(baseUnits, cap, { minPause = 0.45, threshold = null, window = null } = {}) {
  const firstApprox = baseUnits[0].approx[0];
  const lastApprox = baseUnits[baseUnits.length - 1].approx[1];
  const from = window ? window[0] : Math.max(cap.from ?? 0, firstApprox - 1.5);
  const to = window ? window[1] : lastApprox + 0.6;
  // A gap the voice detector has merged away cannot take a cut: --min-pause under 0.12 s keeps the silent ones of that length (a hiss still merges).
  const v = voicedIntervals(cap.samples, { from, to, threshold, gapDip: Math.min(0.12, minPause) });
  if (v.intervals.length < 2) return { error: "fewer than two voiced intervals found: check the capture (audio running? --window?)" };

  const sentences = groupSentences(baseUnits);
  const windows = sentences.slice(1).map((s) => (s.exact ? [s.approxStart - 0.9, s.approxStart + 1.8] : null));
  const top = assignBoundaries(
    sentences.map((s) => s.weight),
    v.intervals,
    { windows, pausePenalty: 3 },
  );
  if (top.error) return { error: top.error, sentences: sentences.length };

  const finalUnits = [];
  const bounds = [];
  const refused = [];
  sentences.forEach((s, si) => {
    const lo = si === 0 ? -Infinity : top.chosen[si - 1].b;
    const hi = si === sentences.length - 1 ? Infinity : top.chosen[si].a;
    const inside = v.intervals.filter((r) => r.s >= lo - 1e-6 && r.e <= hi + 1e-6);
    const inner = s.pieces.length > 1 ? cutInside(s.pieces, inside, minPause) : { pieces: s.pieces, res: { chosen: [], margins: [], errs: [], anchorMisses: [] }, refused: [] };
    refused.push(...inner.refused);
    inner.pieces.forEach((p, k) => {
      finalUnits.push(p);
      if (k < inner.pieces.length - 1) bounds.push({ kind: "cut", gap: inner.res.chosen[k], margin: inner.res.margins[k], err: inner.res.errs[k], miss: false });
      else if (si < sentences.length - 1)
        bounds.push({ kind: "end", gap: top.chosen[si], margin: top.margins[si], err: top.errs[si], miss: top.anchorMisses.includes(si) });
    });
  });

  // The stop goes where `placeStops` puts it unless a breath, hiss or burst (heard in the whole sound, not in the voice band) is there.
  const level = soundLevel(cap.samples);
  const placed = bounds.map((b) => {
    const p = placeStops(b.gap);
    const q = quietStop(level, b.gap, p.end, { audible: v.threshold - 8 });
    return q ? { ...p, end: q.t, start: Math.max(p.start, q.t), movedFrom: p.end } : p;
  });
  const firstSound = v.intervals[0].s;
  const lastSound = v.intervals[v.intervals.length - 1].e;
  // A stop after the last frame is never reached: no later than just before the picture's end when the capture saw it.
  const durationLimit = Math.min(cap.details?.duration ?? Infinity, lastStopLimit(pictureEnd(cap)));
  const timed = finalUnits.map((u, i) => ({
    u,
    start: round2(i === 0 ? Math.max(0, firstSound - 0.1) : placed[i - 1].start),
    end: round2(i === finalUnits.length - 1 ? Math.min(lastSound + 0.3, durationLimit) : placed[i].end),
  }));
  return { from, to, v, sentences, finalUnits, bounds, placed, timed, refused, firstSound, lastSound, durationLimit };
}

/**
 * A fast narrator leaves 0.15-0.3 s between phrases, under the default --min-pause: the plan then undoes every cut inside
 * its long sentences. When a lower --min-pause would keep some of them, says how many sentences it gives: { minPause, sentences }
 * (null when it would change nothing). `plan` is the plan already made, `opts` the options it was made with.
 */
export function lowerPauseHint(baseUnits, cap, plan, opts, lowest = 0.15) {
  if (!(opts.minPause > lowest) || plan.finalUnits.length >= baseUnits.length) return null;
  const probe = planSentences(baseUnits, cap, { ...opts, minPause: lowest });
  return !probe.error && probe.finalUnits.length > plan.finalUnits.length ? { minPause: lowest, sentences: probe.finalUnits.length } : null;
}

/**
 * The rows of the readout and the LISTEN list for a plan. A boundary goes on LISTEN when it is tight, has no room, moved to a
 * quieter moment, has a nearly as good rival pause (shaky), or a sentence next to it speaks at a rate far from the clip's
 * typical one (a boundary one word off leaves one sentence with too few words for its speech and the next with too many).
 * A cut that had a pause but was refused (`refused`, see cutInside) is listed too, `inside #n` with the stop it would have had.
 */
export function describePlan({ timed, bounds, placed, intervals, refused = [], maxWords = 12 }) {
  const rates = timed.map(({ u, start, end }) => {
    const voiced = voicedWithin(intervals, start, end);
    return voiced > 0 ? splitWords(u.en).reduce((sum, w) => sum + syllables(w), 0) / voiced : 0;
  });
  const live = rates.filter(Boolean).sort((a, b) => a - b);
  const median = live[live.length >> 1] || 0;
  const listen = [];
  const rows = timed.map(({ u, start, end }, i) => {
    const b = bounds[i];
    const wps = rates[i];
    const flags = [];
    if (b) {
      if (b.kind === "cut") flags.push("inner-cut");
      if (placed[i].noRoom) flags.push("NO-ROOM");
      else if (placed[i].tight) flags.push("tight");
      if (placed[i].movedFrom !== undefined) flags.push("moved-quiet");
      if (b.margin < 1.5) flags.push("shaky");
      if (Math.abs(b.err) > 1.2 || rateOff(rates[i], median) || rateOff(rates[i + 1], median)) flags.push("rate-off");
      if (b.miss) flags.push("no-cue-window");
      if (flags.length) listen.push({ after: i + 1, at: round2(end), pause: round2(b.gap.d), flags: [...flags] });
    }
    if (wps && (wps < SPEECH_RATE.warnLow || wps > SPEECH_RATE.warnHigh)) flags.push(`rate ${wps.toFixed(1)}`);
    if (words(u.en) > maxWords) flags.push(`${words(u.en)} words`);
    return { n: i + 1, start, end, pause: b ? b.gap.d : null, cut: b?.kind === "cut", words: words(u.en), wps, flags, text: u.en };
  });
  const listed = new Set();
  for (const { gap, why } of refused) {
    if (listed.has(gap.a)) continue;
    listed.add(gap.a);
    const inside = timed.findIndex(({ start, end }) => start - 1e-6 <= gap.a && gap.a <= end + 1e-6) + 1;
    listen.push({ inside: Math.max(1, inside), at: round2(placeStops(gap).end), pause: round2(gap.d), flags: [`cut-refused: ${why}`] });
  }
  listen.sort((x, y) => x.at - y.at);
  return { rows, listen, median };
}

export async function run(args) {
  if (args.anchors) return runAnchored(args);
  const id = requireId(args);
  const { units: baseUnits, maxWords = 12 } = readJson(draftPath(args, id, "units"));
  const cap = readJson(draftPath(args, id, "capture"));
  const job = loadJob(args, id) ?? {};
  const minPause = num(args["min-pause"], 0.45);
  const win = args.window ? parseRange(args.window) : null;
  if (args.window && !win) fail("--window must look like 2-70");

  const opts = { minPause, threshold: args.threshold === undefined ? null : num(args.threshold, null), window: win };
  const plan = planSentences(baseUnits, cap, opts);
  if (plan.error) {
    if (plan.sentences === undefined) fail(plan.error);
    fail(`${plan.error}. Sentences: ${plan.sentences}. Try --threshold, --window, or check the captions.${anchorsHint(cap.caps, id)}`);
  }
  const { from, to, v, sentences, finalUnits, bounds, placed, timed, refused, firstSound, lastSound, durationLimit } = plan;

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

  const { rows, listen } = describePlan({ timed, bounds, placed, intervals: v.intervals, refused, maxWords });
  console.log(` #   start     end  pause  words syl/s  flags               text`);
  rows.forEach((r) => {
    console.log(
      `${String(r.n).padStart(2)} ${fmt(r.start, 7)} ${fmt(r.end, 7)} ${r.pause === null ? "    -" : fmt(r.pause, 5)}${r.pause === null ? " " : r.cut ? "c" : " "} ${String(r.words).padStart(3)}  ${r.wps ? r.wps.toFixed(1) : " - "}  ${r.flags.join(",").padEnd(19)} ${r.text.length > 50 ? `${r.text.slice(0, 49)}…` : r.text}`,
    );
  });
  const undone = baseUnits.length - finalUnits.length;
  console.log(
    `${finalUnits.length} sentences (${sentences.length} real sentences${undone ? `, ${undone} cut(s) undone: no real pause there` : ""}); voice threshold ${v.threshold.toFixed(1)} dB, separability ${v.separability == null ? "n/a" : v.separability.toFixed(2)}; first sound ${firstSound.toFixed(2)} s, last ${lastSound.toFixed(2)} s; clip ${clipStart}-${clipEnd} s of ${duration} s. "c" = a cut inside a real sentence.`,
  );
  const hint = lowerPauseHint(baseUnits, cap, plan, opts);
  if (hint)
    console.log(`NOTE --min-pause ${hint.minPause} would keep ${hint.sentences - finalUnits.length} more cut(s) (${hint.sentences} sentences): a fast narrator leaves 0.15-0.3 s between phrases. Every extra cut goes on LISTEN.`);
  if (v.separability != null && v.separability < 0.5) console.log("WARN voice and background are not clearly apart: every stop below needs a human listen.");
  const lead = v.intervals.filter((r) => r.e > clipStart && r.s < timed[0].start - 0.05);
  if (lead.length) console.log(`WARN sound between the clip start (${clipStart} s) and the first sentence (${timed[0].start} s): adjust --clip-start or accept the lead-in.`);
  console.log(
    listen.length
      ? `LISTEN once (${listen.length}): ${listen.map((l) => `${l.at}s ${l.inside ? `inside #${l.inside}` : `after #${l.after}`} [${l.flags.join(",")}; pause ${l.pause}]`).join("; ")}`
      : "LISTEN list is empty: every stop sits in a clear pause.",
  );
  writeJson(draftPath(args, id, "plan"), {
    id,
    threshold: v.threshold,
    separability: v.separability,
    window: [from, to],
    intervals: v.intervals.length,
    boundaries: bounds.map((b, i) => ({
      after: i + 1,
      kind: b.kind,
      a: round2(b.gap.a),
      b: round2(b.gap.b),
      pause: round2(b.gap.d),
      end: round2(placed[i].end),
      start: round2(placed[i].start),
      ...(placed[i].movedFrom !== undefined ? { movedFrom: round2(placed[i].movedFrom) } : {}),
      margin: round1(b.margin),
      rateErr: round1(b.err),
    })),
    listen,
  });
  console.log(`saved ${draftPath(args, id, "spec")}  (next: yvl fill --id ${id} --list, write ${id}.ar.txt, yvl fill --id ${id})`);
}
