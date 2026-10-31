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
 * become one, and a blip shorter than `minLen` is dropped.
 */
export function voicedIntervals(samples, options = {}) {
  const { from = -Infinity, to = Infinity, threshold = null, hysteresis = 3, mergeDip = 0.12, minLen = 0.06 } = options;
  const pts = cleanSamples(samples).filter(([t]) => t >= from && t <= to);
  if (pts.length < 20) return { intervals: [], threshold: null, separability: 0, hop: 0 };
  const level = pts.map(([, , voice]) => dB(voice));
  const split = threshold == null ? otsu(level) : { threshold, separability: null };
  if (split.threshold == null) return { intervals: [], threshold: null, separability: 0, hop: 0 };
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

  const merged = [];
  for (const run of raw) {
    const last = merged[merged.length - 1];
    if (last && run.s - last.e < mergeDip) last.e = run.e;
    else merged.push({ s: run.s, e: run.e });
  }
  return {
    intervals: merged.filter((r) => r.e - r.s >= minLen),
    threshold: on,
    separability: split.separability,
    hop,
  };
}

/**
 * Where the picture really ends, read from a capture that ran to the end of the video: the last moment the sampler
 * saw. YouTube can report up to a second more than the picture lasts (a Short whose last frame is at 42.54 s says 43),
 * and a stop after the last frame is never reached by the playhead. Infinity when the capture was cut short (--to) or
 * does not end within a second of the reported length: then nothing is known about the end.
 */
export function pictureEnd(capture) {
  const duration = capture?.details?.duration;
  const samples = capture?.samples;
  if (capture?.to || !(duration > 0) || !samples?.length) return Infinity;
  let last = 0;
  for (const [t] of samples) if (t > last) last = t;
  return last < duration && last >= duration - 1 ? Math.floor(last * 100) / 100 : Infinity;
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

/** What surrounds a moment: is it inside speech, and how far to the last sound before it and the next one after it. */
export function surroundings(intervals, t) {
  let before = null;
  let after = null;
  for (const r of intervals) {
    if (r.s <= t && t <= r.e) return { inside: true, before: r.e, after: r.s, sinceSound: 0, untilSound: 0 };
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
 * boundary how much worse the best alternative is (small = shaky), and `errs`: seconds of voice by which the sentence
 * before the boundary is longer (+) or shorter (-) than expected.
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
  const errs = picked.map((_, i) => vAt(i) - vAt(i - 1) - expDur[i]);
  return { chosen: picked.map((j) => cands[j]), margins, errs, expected: expDur, anchorMisses, cands };
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
