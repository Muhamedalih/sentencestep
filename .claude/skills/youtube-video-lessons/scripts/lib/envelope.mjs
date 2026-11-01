/**
 * Loudness envelope tools: the numbers a capture records ([time, whole-sound level, voice-band level]
 * every ~20 ms) become voiced intervals, the pauses between them, and the places a sentence's stop and
 * replay start can go. Pure functions (no browser, no files) so they are unit-tested on their own.
 */

/** Level in dB (20 * log10 of an RMS); digital silence reads -120. */
export const dB = (rms) => 20 * Math.log10(Math.max(rms, 1e-6));

/** Drops time that runs backwards (a seek) and keeps the louder reading when one media time repeats. */
export function cleanSamples(samples) {
  const out = [];
  let last = -Infinity;
  for (const [t, all, voice] of samples) {
    if (!(t >= 0)) continue;
    if (t < last - 1e-6) continue;
    const prev = out[out.length - 1];
    if (prev && Math.abs(t - last) < 1e-6) {
      if (voice > prev[2]) {
        prev[1] = all;
        prev[2] = voice;
      }
      continue;
    }
    out.push([t, all, voice]);
    last = t;
  }
  return out;
}

/**
 * The first pass of a capture of a video that YouTube loops: the rows (samples [t, ...] or caps [t, text]) up to the first
 * moment the media time jumps back by more than `jump` seconds. A capture that never wrapped comes back whole, and jitter
 * under `jump` is not a wrap.
 */
export function firstPass(rows, jump = 1) {
  for (let i = 1; i < rows.length; i++) if (rows[i][0] < rows[i - 1][0] - jump) return rows.slice(0, i);
  return rows;
}

/**
 * Otsu's threshold on a list of dB values: the level that best splits "quiet" from "loud". `separability`
 * is the share of the variance the split explains (0..1): above ~0.6 the two groups are clearly apart
 * (speech over a quiet bed); below ~0.4 a music bed or noise covers the pauses and the stops are shaky.
 */
export function otsu(values, lo = -90, hi = -5, bins = 85) {
  const hist = new Array(bins).fill(0);
  let n = 0;
  for (const v of values) {
    if (v <= lo) continue;
    const b = Math.min(bins - 1, Math.max(0, Math.floor(((v - lo) / (hi - lo)) * bins)));
    hist[b]++;
    n++;
  }
  if (n < 50) return { threshold: null, separability: 0 };
  let sumAll = 0;
  for (let i = 0; i < bins; i++) sumAll += i * hist[i];
  const mean = sumAll / n;
  let varTotal = 0;
  for (let i = 0; i < bins; i++) varTotal += (hist[i] / n) * (i - mean) ** 2;
  let wB = 0;
  let sumB = 0;
  let best = -1;
  const scores = [];
  for (let t = 0; t < bins - 1; t++) {
    wB += hist[t];
    sumB += t * hist[t];
    const wF = n - wB;
    if (wB === 0 || wF === 0) {
      scores.push(-1);
      continue;
    }
    const mB = sumB / wB;
    const mF = (sumAll - sumB) / wF;
    const between = (wB / n) * (wF / n) * (mB - mF) ** 2;
    scores.push(between);
    if (between > best) best = between;
  }
  // Several levels can split the data equally well (an empty valley between two groups): take the middle of that plateau.
  const top = scores.map((s, t) => (s >= best * 0.999 ? t : -1)).filter((t) => t >= 0);
  const bestAt = (top[0] + top[top.length - 1]) / 2;
  return {
    threshold: lo + ((bestAt + 1) * (hi - lo)) / bins,
    separability: varTotal > 0 ? Math.min(1, best / varTotal) : 0,
  };
}

/**
 * Where the voice is: [{ s, e }] in media seconds. The level is the voice band (300-3400 Hz). A run starts above
 * the threshold and ends 3 dB below it (so it does not chatter), runs split by a dip shorter than `mergeDip`
 * become one, and a blip shorter than `minLen` is dropped. `dips` lists the dips that were merged away, [{ s, e, silent }]:
 * `silent` says the whole sound (all frequencies) is as quiet there as the voice band, so the dip is a real 0.05-0.12 s
 * gap between two words (or a consonant closing inside one); a dip whose whole-sound level holds is a hiss or a burst,
 * which is speech. `gapDip` (default `mergeDip`: none) keeps a silent dip of at least that length as a gap, so a 0.09 s
 * pause can take a cut while the 0.11 s hiss between «edge» and «so» still merges.
 */
export function voicedIntervals(samples, options = {}) {
  const { from = -Infinity, to = Infinity, threshold = null, hysteresis = 3, mergeDip = 0.12, gapDip = mergeDip, minLen = 0.06 } = options;
  const pts = cleanSamples(samples).filter(([t]) => t >= from && t <= to);
  if (pts.length < 20) return { intervals: [], dips: [], threshold: null, separability: 0, hop: 0 };
  const level = pts.map(([, , voice]) => dB(voice));
  const split = threshold == null ? otsu(level) : { threshold, separability: null };
  if (split.threshold == null) return { intervals: [], dips: [], threshold: null, separability: 0, hop: 0 };
  const on = split.threshold;
  const off = on - hysteresis;
  const hops = [];
  for (let i = 1; i < pts.length; i++) hops.push(pts[i][0] - pts[i - 1][0]);
  hops.sort((a, b) => a - b);
  const hop = hops[hops.length >> 1] || 0.02;

  const raw = [];
  let cur = null;
  let prevT = null;
  for (let i = 0; i < pts.length; i++) {
    const t = pts[i][0];
    if (cur && prevT !== null && t - prevT > 0.25) {
      raw.push(cur);
      cur = null;
    }
    if (cur) {
      if (level[i] >= off) cur.e = t + hop;
      else {
        raw.push(cur);
        cur = null;
      }
    } else if (level[i] >= on) cur = { s: t, e: t + hop };
    prevT = t;
  }
  if (cur) raw.push(cur);

  // A dip is silent when the middle of both its levels (whole sound and voice band) is below the point where a run ends.
  const middle = (values) => values.sort((a, b) => a - b)[values.length >> 1];
  const silent = (s, e) => {
    const inside = pts.filter(([t]) => t >= s - 1e-9 && t < e - 1e-9);
    return inside.length > 0 && middle(inside.map(([, all]) => dB(all))) <= off && middle(inside.map(([, , voice]) => dB(voice))) <= off;
  };
  const merged = [];
  const gone = [];
  for (const run of raw) {
    const last = merged[merged.length - 1];
    const dip = last ? run.s - last.e : Infinity;
    if (last && dip < mergeDip && !(dip >= gapDip && silent(last.e, run.s))) {
      gone.push({ s: last.e, e: run.s });
      last.e = run.e;
    } else merged.push({ s: run.s, e: run.e });
  }
  const intervals = merged.filter((r) => r.e - r.s >= minLen);
  const dips = gone.filter((d) => intervals.some((r) => r.s <= d.s && d.e <= r.e)).map((d) => ({ s: d.s, e: d.e, silent: silent(d.s, d.e) }));
  return { intervals, dips, threshold: on, separability: split.separability, hop };
}

/** The reported length is rounded to 0.01 s, the sampler's media time to 0.001 s, and the player's length can differ from the media's by a few ms: a last sample this far past the reported length still counts as the end. */
export const END_ROUNDING = 0.05;

/**
 * Where the picture really ends, read from a capture that ran to the end of the video: the last moment the sampler
 * saw. YouTube can report up to a second more than the picture lasts (a Short whose last frame is at 42.54 s says 43),
 * or exactly as much, where the sampler's last media time can read a few thousandths MORE than the reported length
 * (a Short that says 21.54 s and whose last sample is 21.541: see END_ROUNDING), and a stop after the last frame is never
 * reached by the playhead. Infinity when the capture was cut short (--to) or does not end within a second of the
 * reported length: then nothing is known about the end.
 */
export function pictureEnd(capture) {
  const duration = capture?.details?.duration;
  const samples = capture?.samples;
  if (capture?.to || !(duration > 0) || !samples?.length) return Infinity;
  let last = 0;
  for (const [t] of samples) if (t > last) last = t;
  return last <= duration + END_ROUNDING && last >= duration - 1 ? Math.min(Math.floor(last * 100) / 100, duration) : Infinity;
}

/**
 * The last stop keeps this far from the last frame, so the page's 30 ms polling sees the playhead there before the video
 * ends: a stop asked for later is reached only if the player reports ENDED, and a Short that YouTube loops wraps round to
 * 0 without ever reporting it.
 */
export const END_MARGIN = 0.1;

/** The latest a stop may be asked for in a video whose picture ends at `end` (Infinity when that is not known). */
export const lastStopLimit = (end) => end - END_MARGIN;

/** A stop this near the end of the picture, or beyond it, is the end of the video itself, not a cut in the speech. */
export const atPictureEnd = (stopSeconds, end) => Number.isFinite(end) && stopSeconds >= lastStopLimit(end) - 1e-6;

/** The pauses between neighbouring voiced intervals, with the voiced time spent before each one. */
export function gapsOf(intervals) {
  const gaps = [];
  let cum = 0;
  for (let k = 0; k + 1 < intervals.length; k++) {
    cum += intervals[k].e - intervals[k].s;
    gaps.push({ k, a: intervals[k].e, b: intervals[k + 1].s, d: intervals[k + 1].s - intervals[k].e, cum });
  }
  return gaps;
}

/** Seconds of voice inside [a, b]. */
export function voicedWithin(intervals, a, b) {
  let sum = 0;
  for (const r of intervals) {
    const s = Math.max(r.s, a);
    const e = Math.min(r.e, b);
    if (e > s) sum += e - s;
  }
  return sum;
}

/**
 * What surrounds a moment: is it inside speech, and how far to the last sound before it and the next one after it.
 * A moment inside a run but also inside a silent dip of `dips` (see `voicedIntervals`) is not inside speech: it is in a
 * short gap, and the distances are those to the two sides of the dip (`dip: true`).
 */
export function surroundings(intervals, t, dips = []) {
  let before = null;
  let after = null;
  for (const r of intervals) {
    if (r.s <= t && t <= r.e) {
      const dip = dips.find((d) => d.silent && d.s <= t && t <= d.e);
      if (dip) return { inside: false, dip: true, before: dip.s, after: dip.e, sinceSound: t - dip.s, untilSound: dip.e - t, dipLength: dip.e - dip.s };
      return { inside: true, before: r.e, after: r.s, sinceSound: 0, untilSound: 0 };
    }
    if (r.e < t) before = r.e;
    if (r.s > t && after === null) after = r.s;
  }
  return {
    inside: false,
    before,
    after,
    sinceSound: before === null ? Infinity : t - before,
    untilSound: after === null ? Infinity : after - t,
  };
}

/**
 * Chooses which pause each sentence boundary sits in. `weights[i]` is the size of unit i (letters), `windows[i]` is
 * an optional [from, to] range the NEXT unit's first sound must start in (from an exact caption cue start), or null.
 * Boundaries are increasing pauses. Each sentence is judged on its own: the voice between its two boundaries should
 * last about as long as its words take at the speaking rate of the whole clip (so a slow stretch early on does not push
 * every later boundary), and a boundary prefers the pause that stands out in its window. Returns the chosen pauses, per
 * boundary how much worse the best alternative is (small = shaky), and `errs`: seconds of voice by which each sentence is
 * longer (+) or shorter (-) than expected (one more than there are boundaries: the last sentence is judged too, since
 * a boundary that falls late takes its voice from the sentence after it).
 */
export function assignBoundaries(weights, intervals, options = {}) {
  const { minGap = 0.1, sigmaRel = 0.25, sigmaAbs = 0.35, pausePenalty = 3, windows = [] } = options;
  const need = weights.length - 1;
  if (need <= 0) return { chosen: [], margins: [], errs: [], expected: [], anchorMisses: [] };
  const cands = gapsOf(intervals).filter((g) => g.d >= minGap);
  if (cands.length < need)
    return { error: `${need} boundaries are needed but only ${cands.length} pauses of ${minGap}s or more exist`, cands };
  const total = intervals.reduce((sum, r) => sum + (r.e - r.s), 0);
  const sumW = weights.reduce((a, b) => a + b, 0);
  const rate = sumW / total;
  const expDur = weights.map((w) => w / rate);
  const sigma = expDur.map((e) => sigmaRel * e + sigmaAbs);
  const V = cands.map((g) => g.cum);

  const anchorMisses = [];
  const allowed = [];
  let acc = 0;
  const expectCum = weights.slice(0, need).map((w) => (acc += w) / rate);
  for (let i = 0; i < need; i++) {
    const win = windows[i];
    let ok = cands.map((g) => !win || (g.b >= win[0] && g.b <= win[1]));
    if (win && !ok.some(Boolean)) {
      anchorMisses.push(i);
      ok = cands.map(() => true);
    }
    allowed.push(ok);
  }
  // The longest pause a boundary could use (inside its caption window, else near where the speaking rate puts it).
  const longest = allowed.map((ok, i) => {
    let best = 0.3;
    cands.forEach((g, j) => {
      if (ok[j] && (windows[i] || Math.abs(g.cum - expectCum[i]) <= 2)) best = Math.max(best, g.d);
    });
    return best;
  });
  const pause = (i, j) => (allowed[i][j] ? pausePenalty * (1 - Math.min(1, cands[j].d / longest[i])) : Infinity);
  const seg = (i, vPrev, vCur) => {
    const e = (vCur - vPrev - expDur[i]) / sigma[i];
    return e * e;
  };

  const m = cands.length;
  const dp = Array.from({ length: need }, () => new Array(m).fill(Infinity));
  const from = Array.from({ length: need }, () => new Array(m).fill(-1));
  for (let j = 0; j < m; j++) dp[0][j] = seg(0, 0, V[j]) + pause(0, j);
  for (let i = 1; i < need; i++)
    for (let j = 0; j < m; j++) {
      const p = pause(i, j);
      if (!Number.isFinite(p)) continue;
      for (let k = 0; k < j; k++) {
        if (!Number.isFinite(dp[i - 1][k])) continue;
        const c = dp[i - 1][k] + seg(i, V[k], V[j]) + p;
        if (c < dp[i][j]) {
          dp[i][j] = c;
          from[i][j] = k;
        }
      }
    }
  let end = -1;
  let endV = Infinity;
  for (let j = 0; j < m; j++) {
    const c = dp[need - 1][j] + seg(need, V[j], total);
    if (c < endV) {
      endV = c;
      end = j;
    }
  }
  if (end < 0) return { error: "no increasing choice of pauses satisfies the caption windows", cands };
  const picked = new Array(need);
  for (let i = need - 1, j = end; i >= 0; i--) {
    picked[i] = j;
    j = from[i][j];
  }
  const vAt = (i) => (i < 0 ? 0 : i >= need ? total : V[picked[i]]);
  const margins = picked.map((jc, i) => {
    const lo = i > 0 ? picked[i - 1] + 1 : 0;
    const hi = i < need - 1 ? picked[i + 1] - 1 : m - 1;
    const here = (j) => seg(i, vAt(i - 1), V[j]) + seg(i + 1, V[j], vAt(i + 1)) + pause(i, j);
    let alt = Infinity;
    for (let j = lo; j <= hi; j++) if (j !== jc) alt = Math.min(alt, here(j));
    return alt - here(jc);
  });
  const errs = expDur.map((e, i) => vAt(i) - vAt(i - 1) - e);
  return { chosen: picked.map((j) => cands[j]), margins, errs, expected: expDur, anchorMisses, cands };
}

/**
 * For each of the `weights.length - 1` cuts of a sentence: `at`, the seconds of voice from its start at which the words
 * put the cut (the speaking rate of the whole stretch), and `support`, how well a pause of `minGap` or more backs it: the
 * longest such pause within reach of `at` (about half the shorter neighbouring piece plus 0.35 s), nearer counting more;
 * 0 when there is none. A cut with no pause near where its words put it cannot be kept, whatever the other cuts have.
 */
export function cutSupport(weights, intervals, { minGap = 0.1 } = {}) {
  const total = intervals.reduce((sum, r) => sum + (r.e - r.s), 0);
  const rate = weights.reduce((a, b) => a + b, 0) / total;
  const expDur = weights.map((w) => w / rate);
  const cands = gapsOf(intervals).filter((g) => g.d >= minGap);
  let acc = 0;
  return weights.slice(0, -1).map((w, i) => {
    const at = (acc += w) / rate;
    const reach = 0.5 * Math.min(expDur[i], expDur[i + 1]) + 0.35;
    let support = 0;
    for (const g of cands) {
      const near = Math.abs(g.cum - at);
      if (near <= reach) support = Math.max(support, g.d * (1 - near / reach));
    }
    return { at, support };
  });
}

/**
 * Where the stop (end of sentence i) and the replay start (start of sentence i+1) go inside a pause [a, b]:
 * the stop 0.30 s after the last sound but never nearer than 0.10 s to the next one, the start 0.10 s before the
 * next sound. A pause shorter than 0.15 s has no room: both go to its middle and it is flagged.
 */
export function placeStops(gap, { after = 0.3, before = 0.1, floor = 0.05 } = {}) {
  const { a, b, d } = gap;
  if (d < floor + before) {
    const mid = a + d / 2;
    return { end: mid, start: mid, tight: true, noRoom: true };
  }
  const end = Math.min(a + after, b - before);
  return { end, start: Math.max(b - before, end), tight: d < 0.25, noRoom: false };
}

/**
 * The whole-sound level (all frequencies, dB) smoothed over three samples, as `worst(a, b)`: the loudest smoothed level
 * in [a, b]. The voice band (300-3400 Hz) does not see a breath, a hiss or the burst of a consonant; this does.
 */
export function soundLevel(samples) {
  const pts = cleanSamples(samples).map(([t, all]) => [t, dB(all)]);
  const smooth = pts.map(([t], i) => [t, (pts[Math.max(0, i - 1)][1] + pts[i][1] + pts[Math.min(pts.length - 1, i + 1)][1]) / 3]);
  return {
    worst(a, b) {
      let loudest = -Infinity;
      for (const [t, level] of smooth) {
        if (t > b) break;
        if (t >= a && level > loudest) loudest = level;
      }
      return loudest;
    },
  };
}

/**
 * Moves a stop off a sound the voice band cannot hear (the rule of yvl-extras/refine-stops.mjs, used on the Medieval
 * lesson, now part of the planner). `placeStops` puts the stop 0.30 s after the last voice sound but never nearer than
 * 0.10 s to the next one; a breath, a hiss or the burst of the next word begins 0.1-0.15 s before its voice and a stop
 * there lets the learner hear it. The stop lands within -0.03 s / +0.06 s of the time asked, so a time is judged by the
 * loudest whole-sound level in that window. A stop whose window is audible (above `audible` dB) moves to the nearest time
 * in [a + 0.10, b - 0.08] and within `reach` s of the planned one whose window is not audible; when every time there is
 * audible, to the nearest of those within `tie` dB of the quietest. It moves only if that is at least `gain` dB quieter than
 * the planned one and at least `minMove` s away (a long pause with sound all through it, music or effects, keeps its stop).
 * Returns { t, w, plannedW } or null (keep the planned stop). Only the stop moves: the next sentence's replay start
 * stays 0.10 s before its voice (a replay begins 0.2 s before it, so a breath is replayed whole).
 */
export function quietStop(level, gap, planned, { audible, gain = 5, tie = 1.5, minMove = 0.03, reach = 0.2, from = 0.1, until = 0.08, lead = 0.03, lag = 0.06 } = {}) {
  const lo = Math.max(gap.a + from, planned - reach);
  const hi = Math.min(gap.b - until, planned + reach);
  if (!(hi >= lo) || !Number.isFinite(audible)) return null;
  const plannedW = level.worst(planned - lead, planned + lag);
  if (!(plannedW > audible)) return null;
  const cands = [];
  for (let k = Math.ceil(lo * 100 - 1e-9); k <= Math.floor(hi * 100 + 1e-9); k++) cands.push({ t: k / 100, w: level.worst(k / 100 - lead, k / 100 + lag) });
  if (!cands.length) return null;
  const best = Math.min(...cands.map((c) => c.w));
  const quiet = cands.filter((c) => c.w <= audible);
  const pool = quiet.length ? quiet : cands.filter((c) => c.w <= best + tie);
  const near = pool.sort((x, y) => Math.abs(x.t - planned) - Math.abs(y.t - planned))[0];
  return plannedW - near.w >= gain && Math.abs(near.t - planned) >= minMove ? { t: near.t, w: near.w, plannedW } : null;
}
