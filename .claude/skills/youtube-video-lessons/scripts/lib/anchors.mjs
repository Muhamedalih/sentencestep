/**
 * Caption-anchored planning, for a video whose pauses alone cannot place the sentences (roll-up captions, two voices
 * of different loudness, sound effects). Roll-up captions show one new word at a time, so every word has a time. Each
 * stretch of voice (a "run") belongs to the sentence whose caption words it overlaps; sentences that share a run have
 * no pause between them and are joined; a sentence whose speech rate `check` would refuse is joined to a neighbour;
 * the stops then go into the measured pauses, as `plan` puts them. Pure functions (no browser, no files) so they are
 * unit-tested on their own.
 */
import { bareWord, round2, splitWords } from "./util.mjs";
import { SPEECH_RATE, normalizeText, syllables } from "./text.mjs";
import { lastStopLimit, placeStops, voicedIntervals, voicedWithin } from "./envelope.mjs";

/** A sentence owns the runs that overlap [first word - lead, last word + tail] by `minOverlap` s (or half of a shorter run). */
export const OWNERSHIP = { lead: 0.2, tail: 0.5, minOverlap: 0.1 };
/** Share of the sentences' words that must be found in the captions before their times mean anything. */
const MIN_MATCH = 0.6;

const wordKey = (token) => bareWord(token) || token;
const syllablesOf = (text) => splitWords(text).reduce((sum, word) => sum + syllables(word), 0);
const wordCount = (text) => splitWords(text).length;

// ---------------------------------------------------------------- caption words and their times

/**
 * Word onsets from roll-up caption states [[time, text]]. A state grows by a word at a time and drops its oldest
 * words from the left, so the words that are new in a state are the ones after the longest tail of the state before
 * it that the state begins with. A blank state ends the line. Returns [{ w, t }] in order, `t` being the first state
 * that showed the word.
 */
export function wordOnsets(caps) {
  const onsets = [];
  let prev = [];
  for (const [t, text] of caps) {
    const tokens = splitWords(normalizeText(text));
    if (!tokens.length) {
      prev = [];
      continue;
    }
    const keys = tokens.map(wordKey);
    const before = prev.map(wordKey);
    let k = Math.min(before.length, keys.length);
    while (k > 0 && before.slice(before.length - k).join(" ") !== keys.slice(0, k).join(" ")) k--;
    for (const w of tokens.slice(k)) onsets.push({ w, t });
    prev = tokens;
  }
  return onsets;
}

/** Roll-up captions give each word its own moment; cues that appear whole give a line of words one moment. */
export function isWordByWord(onsets) {
  if (onsets.length < 5) return false;
  let together = 0;
  for (let i = 1; i < onsets.length; i++) if (onsets[i].t === onsets[i - 1].t) together++;
  return together / (onsets.length - 1) < 0.5;
}

/** For every word of `words`, the index of the caption word it is (longest common subsequence on bare words), or -1. */
export function alignWords(caption, words) {
  const a = caption.map(wordKey);
  const b = words.map(wordKey);
  const n = a.length;
  const m = b.length;
  const dp = new Uint16Array((n + 1) * (m + 1));
  const at = (i, j) => i * (m + 1) + j;
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--) dp[at(i, j)] = a[i] === b[j] ? dp[at(i + 1, j + 1)] + 1 : Math.max(dp[at(i + 1, j)], dp[at(i, j + 1)]);
  const hit = new Array(m).fill(-1);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) hit[j++] = i++;
    else if (dp[at(i + 1, j)] >= dp[at(i, j + 1)]) i++;
    else j++;
  }
  return hit;
}

/** Gives every word with no time one: spread between the known words around it, 0.3 s a word beyond the first or last known. */
function fillTimes(known, step = 0.3) {
  const before = [];
  let last = -1;
  known.forEach((t, j) => {
    if (t !== null) last = j;
    before[j] = last;
  });
  const after = [];
  let next = -1;
  for (let j = known.length - 1; j >= 0; j--) {
    if (known[j] !== null) next = j;
    after[j] = next;
  }
  return known.map((t, j) => {
    if (t !== null) return t;
    const p = before[j];
    const q = after[j];
    if (p >= 0 && q >= 0) return known[p] + ((known[q] - known[p]) * (j - p)) / (q - p);
    return p >= 0 ? known[p] + step * (j - p) : known[q] - step * (q - j);
  });
}

/**
 * Where each sentence is in the captions: { spans: [{ en, words, a, z, missing }], matched, total } with `a` and `z` the
 * times its first and last word appeared. Words the captions do not have (a corrected word, a spelled number) take a
 * time from the words around them and are counted in `missing`.
 */
export function sentenceSpans(onsets, texts) {
  const words = texts.flatMap(splitWords);
  if (!words.length || texts.some((text) => !wordCount(text))) throw new Error("a sentence has no words");
  const hit = alignWords(
    onsets.map((o) => o.w),
    words,
  );
  const matched = hit.filter((h) => h >= 0).length;
  if (matched / words.length < MIN_MATCH)
    throw new Error(
      `only ${matched} of the ${words.length} sentence words are in the captions' ${onsets.length} words: the sentences must be the captions' own words (for roll-up captions give \`split --source\` a hand-typed .srt of the final lines)`,
    );
  const times = fillTimes(hit.map((h) => (h >= 0 ? onsets[h].t : null)));
  let at = 0;
  const spans = texts.map((en) => {
    const n = wordCount(en);
    const span = { en, words: n, a: times[at], z: times[at + n - 1], missing: hit.slice(at, at + n).filter((h) => h < 0).length };
    at += n;
    return span;
  });
  return { spans, matched, total: words.length };
}

// ---------------------------------------------------------------- who owns which run

/** For every run, the indexes (ascending) of the sentences whose caption words overlap it. */
export function ownRuns(runs, spans, options = {}) {
  const { lead, tail, minOverlap } = { ...OWNERSHIP, ...options };
  return runs.map((r) => {
    const owners = [];
    spans.forEach((s, i) => {
      const overlap = Math.max(0, Math.min(r.e, s.z + tail) - Math.max(r.s, s.a - lead));
      if (overlap >= Math.min(minOverlap, 0.5 * (r.e - r.s))) owners.push(i);
    });
    return owners;
  });
}

function groupOf(members, en, runIdx, runs) {
  const firstIdx = Math.min(...runIdx);
  const lastIdx = Math.max(...runIdx);
  return { members, en, runIdx, firstIdx, lastIdx, s: runs[firstIdx].s, e: runs[lastIdx].e };
}

/** Two neighbouring groups as one: the sentence is both texts, the sound all their runs. */
export function mergeGroups(a, b, runs) {
  return groupOf([...a.members, ...b.members], `${a.en} ${b.en}`, [...a.runIdx, ...b.runIdx], runs);
}

/**
 * The sentences that stay apart: [{ members, en, runIdx, firstIdx, lastIdx, s, e }] in order, `s`/`e` being where the
 * sound of the group's first run starts and its last run ends. A run owned by several sentences (no pause between
 * them) joins every sentence from the first owner to the last, and groups whose runs interleave join too, so groups
 * always follow each other in time. A group with no run at all has no voice to place: that is an error.
 */
export function groupByRuns(spans, owners, runs) {
  const joinNext = new Array(Math.max(0, spans.length - 1)).fill(false);
  owners.forEach((o) => {
    for (let i = o[0]; i < o[o.length - 1]; i++) joinNext[i] = true;
  });
  for (;;) {
    const groups = [];
    let members = [];
    spans.forEach((_, i) => {
      members.push(i);
      if (i === spans.length - 1 || !joinNext[i]) {
        const runIdx = [];
        owners.forEach((o, k) => {
          if (o.some((s) => members.includes(s))) runIdx.push(k);
        });
        const en = members.map((s) => spans[s].en).join(" ");
        if (!runIdx.length) throw new Error(`no voice found for "${en}": lower --threshold, or the captions put this sentence elsewhere (--window?)`);
        groups.push(groupOf(members, en, runIdx, runs));
        members = [];
      }
    });
    const clash = groups.findIndex((g, i) => i > 0 && g.firstIdx <= groups[i - 1].lastIdx);
    if (clash < 0) return groups;
    joinNext[groups[clash - 1].members[groups[clash - 1].members.length - 1]] = true;
  }
}

// ---------------------------------------------------------------- stops

/**
 * Stop of one group and replay start of the next. Between their sound lie the gaps of the runs from the group's last
 * run to the next group's first (more than one when a run no sentence owns sits between them). The stop goes into the
 * first gap, as `plan` puts it, unless that has no room (a sound right behind the last word): then into the longest.
 * The start goes just before the next group's first sound. { end, start, tight, noRoom, gap } with `gap` the pause used.
 */
function placeBetween(group, next, runs) {
  const gaps = [];
  for (let k = group.lastIdx; k < next.firstIdx; k++) gaps.push({ a: runs[k].e, b: runs[k + 1].s, d: runs[k + 1].s - runs[k].e });
  let gap = gaps[0];
  if (placeStops(gap).noRoom) gap = gaps.reduce((best, g) => (g.d > best.d + 1e-9 ? g : best), gap);
  const placed = placeStops(gap);
  const start = gap === gaps[gaps.length - 1] ? placed.start : Math.max(placed.end, gaps[gaps.length - 1].b - 0.1);
  return { ...placed, start, gap };
}

/**
 * Start (replay point) and end (stop) of every group, as `plan` places them: 0.30 s after the last sound but never
 * nearer than 0.10 s to the next one, the next start 0.10 s before its sound; the first start is 0.10 s before the
 * first sound, the last stop 0.30 s after the last sound (not nearer than 0.10 s to a sound after it).
 * Returns { placed: [{ end, start, tight, noRoom, gap }] per boundary, timed: [{ group, start, end }] }.
 */
export function layoutGroups(groups, runs, { duration = Infinity } = {}) {
  const placed = groups.slice(0, -1).map((g, i) => placeBetween(g, groups[i + 1], runs));
  const last = groups[groups.length - 1];
  const after = runs[last.lastIdx + 1];
  const lastStop = Math.min(Math.max(last.e, Math.min(last.e + 0.3, after ? after.s - 0.1 : Infinity)), duration);
  const timed = groups.map((group, i) => ({
    group,
    start: round2(i === 0 ? Math.max(0, group.s - 0.1) : placed[i - 1].start),
    end: round2(i === groups.length - 1 ? lastStop : placed[i].end),
  }));
  return { placed, timed };
}

// ---------------------------------------------------------------- speech rate

/** Syllables per second of voice inside [start, end], and the seconds of voice (rate 0 with none). */
export function speechRate(text, start, end, intervals) {
  const voiced = voicedWithin(intervals, start, end);
  return { rate: voiced > 0 ? syllablesOf(text) / voiced : 0, voiced };
}

/** Would `check` refuse this much speech for these words: almost none, or too slow or too fast for the syllables? */
export const refused = ({ rate, voiced }) => voiced < SPEECH_RATE.minVoiced || rate < SPEECH_RATE.errLow || rate > SPEECH_RATE.errHigh;

/**
 * Joins every sentence `check` would refuse for its speech rate to the neighbour that makes the shorter sentence, until
 * none is (or one is left). `layout(groups)` gives the stops of a set of groups, `measure(layout)` the { rate, voiced }
 * of each of its sentences (as `check` will measure it). Returns { groups, lay, joins: [{ first, second, rate, voiced,
 * pause }], stillRefused: indexes still refused }.
 */
export function joinByRate(groups, runs, { layout, measure }) {
  let current = groups;
  let lay = layout(current);
  const joins = [];
  for (;;) {
    const rates = measure(lay);
    const bad = rates.findIndex(refused);
    if (bad < 0 || current.length < 2) return { groups: current, lay, joins, stillRefused: rates.flatMap((r, i) => (refused(r) ? [i] : [])) };
    const withPrevious = bad > 0 ? wordCount(current[bad - 1].en) + wordCount(current[bad].en) : Infinity;
    const withNext = bad < current.length - 1 ? wordCount(current[bad].en) + wordCount(current[bad + 1].en) : Infinity;
    const at = withNext <= withPrevious ? bad : bad - 1;
    joins.push({ first: current[at].en, second: current[at + 1].en, rate: rates[bad].rate, voiced: rates[bad].voiced, pause: lay.placed[at].gap.d });
    current = [...current.slice(0, at), mergeGroups(current[at], current[at + 1], runs), ...current.slice(at + 2)];
    lay = layout(current);
  }
}

// ---------------------------------------------------------------- the whole plan

/** Where a moment falls among the timed sentences: { during: n } inside sentence n, { between: [n, n + 1] } in the pause from its stop to the next start. */
export function whereIn(timed, t) {
  const k = timed.findLastIndex((x) => x.start <= t + 1e-6);
  if (k < 0) return { during: 1 };
  return k < timed.length - 1 && t >= timed[k].end - 1e-6 ? { between: [k + 1, k + 2] } : { during: k + 1 };
}

/** `whereIn` in words, for a readout: "in #6" or "between #1 and #2". */
export const placeText = (w) => (w.during ? `in #${w.during}` : `between #${w.between[0]} and #${w.between[1]}`);

/** The final sentences with the numbers and flags the readout shows (the flags of `plan`, plus joinedN and caption-offset). */
function describeSentences(lay, rates, spans, maxWords) {
  return lay.timed.map(({ group, start, end }, i) => {
    const placed = lay.placed[i] ?? null;
    const { rate } = rates[i];
    const words = wordCount(group.en);
    const flags = [];
    if (placed?.noRoom) flags.push("NO-ROOM");
    else if (placed?.tight) flags.push("tight");
    if (group.members.length > 1) flags.push(`joined${group.members.length}`);
    if (rate && (rate < SPEECH_RATE.warnLow || rate > SPEECH_RATE.warnHigh)) flags.push(`rate ${rate.toFixed(1)}`);
    if (words > maxWords) flags.push(`${words} words`);
    const offset = Math.abs(group.s - (spans[group.members[0]].a - 0.1));
    if (offset > 0.5) flags.push(`caption-offset ${offset.toFixed(1)}`);
    return { n: i + 1, start, end, pause: placed ? round2(placed.gap.d) : null, words, rate, flags, text: group.en, members: group.members };
  });
}

/** What only a pair of ears can judge: joined sentences, tight pauses, odd speech rates, a sound far from where its caption was shown. */
function listenList(sentences) {
  const listen = [];
  for (const s of sentences) {
    const hot = s.flags.filter((f) => /NO-ROOM|tight|joined|rate|offset/.test(f));
    if (hot.length) listen.push({ after: s.n, at: s.end, pause: s.pause, flags: hot });
  }
  return listen;
}

/**
 * The whole anchored plan. In: the capture's `caps` and `samples`, the caption sentences `texts` (the units, one
 * each), the video length `duration` and where its picture really ends (`pictureEnd`, see envelope.mjs: no stop and
 * no clip end go beyond the smaller), the voice `threshold` in dB (null = automatic), a `voiceWindow` [from, to] to look for voice in
 * (null = around the caption words), `clipStart` / `clipEnd` overrides. Out: the sentences with their stops
 * and flags, the clip, the LISTEN list, the voiced runs no sentence owns, and the NOTE / WARN lines.
 */
export function planAnchored({ caps, samples, texts, duration = Infinity, pictureEnd = Infinity, threshold = null, voiceWindow = null, captureFrom = 0, clipStart, clipEnd, maxWords = 12 }) {
  const limit = Math.min(duration, lastStopLimit(pictureEnd)); // no stop and no clip end after the last frame
  const onsets = wordOnsets(caps);
  if (!onsets.length) throw new Error("the capture has no caption words: --anchors needs the player's captions, each word with its time");
  const { spans, matched, total } = sentenceSpans(onsets, texts);
  const from = voiceWindow ? voiceWindow[0] : Math.max(captureFrom, spans[0].a - 1.5);
  const to = voiceWindow ? voiceWindow[1] : spans[spans.length - 1].z + 3;
  const voice = voicedIntervals(samples, { from, to, threshold });
  const runs = voice.intervals;
  if (runs.length < 2) throw new Error("fewer than two voiced intervals found: check the capture (audio running? --window? --threshold?)");

  const owners = ownRuns(runs, spans);
  const shared = groupByRuns(spans, owners, runs);
  const notes = [];
  const warns = [];
  if (!isWordByWord(onsets))
    warns.push("the captions do not show one word at a time (cues appear whole): all words of a cue get the cue's time, so a long sentence's later words fall outside its window; read every join and stop against the audio, or use plain plan");
  shared
    .filter((g) => g.members.length > 1)
    .forEach((g) => notes.push(`joined ${g.members.length} caption sentences with no pause between them (one stretch of sound): ${g.members.map((i) => `"${spans[i].en}"`).join(" + ")}`));
  spans.forEach((s, i) => {
    if (s.missing) notes.push(`caption sentence ${i + 1} has ${s.missing} of ${s.words} words that are not in the captions (their times are estimated): "${s.en}"`);
  });

  // The speech rate is judged the way `check` will judge it: its voice threshold over the clip +- 2 s.
  const clipOf = (timed) => ({
    start: clipStart ?? Math.max(0, Math.floor(timed[0].start - 0.15)),
    end: clipEnd ?? Math.min(Math.ceil(timed[timed.length - 1].end * 10) / 10, limit),
  });
  const gateOf = (lay) => {
    const clip = clipOf(lay.timed);
    const gate = voicedIntervals(samples, { from: Math.max(0, clip.start - 2), to: clip.end + 2, threshold });
    return { ...gate, from: Math.max(0, clip.start - 2), to: clip.end + 2 };
  };
  const measure = (lay) => {
    const gate = gateOf(lay);
    return lay.timed.map((t) => speechRate(t.group.en, t.start, t.end, gate.intervals));
  };
  const joined = joinByRate(shared, runs, { layout: (gs) => layoutGroups(gs, runs, { duration: limit }), measure });
  const { lay } = joined;
  const rates = measure(lay);
  const gate = gateOf(lay);
  joined.joins.forEach((j) =>
    notes.push(
      `joined "${j.first}" + "${j.second}" (${j.voiced < SPEECH_RATE.minVoiced ? `only ${j.voiced.toFixed(2)} s of speech` : `speech rate ${j.rate.toFixed(1)} syl/s was outside ${SPEECH_RATE.errLow}-${SPEECH_RATE.errHigh}`}; pause between them ${j.pause.toFixed(2)} s)`,
    ),
  );
  joined.stillRefused.forEach((i) => warns.push(`sentence ${i + 1} still has a speech rate (${rates[i].rate.toFixed(1)} syl/s over ${rates[i].voiced.toFixed(2)} s) that check will refuse: nothing is left to join it to`));
  notes.push(
    threshold == null
      ? `speech rates are judged the way check judges them (automatic voice level ${gate.threshold.toFixed(1)} dB over ${gate.from.toFixed(1)}-${gate.to.toFixed(1)} s)`
      : `speech rates are judged at ${threshold} dB: run check with --threshold ${threshold} too`,
  );

  const clip = clipOf(lay.timed);
  const lastEnd = lay.timed[lay.timed.length - 1].end;
  const sentences = describeSentences(lay, rates, spans, maxWords);
  const listen = listenList(sentences);
  const unowned = runs
    .filter((r, k) => !owners[k].length && r.e > clip.start && r.s < lastEnd)
    .map((r) => ({ s: r.s, e: r.e, ...whereIn(lay.timed, r.s) }));
  unowned.forEach(({ s, e, ...place }) => listen.push({ ...place, at: round2(s), flags: [`uncaptioned sound ${s.toFixed(2)}-${e.toFixed(2)}`] }));
  listen.sort((x, y) => x.at - y.at);
  if (unowned.length)
    notes.push(`voiced runs no sentence owns (a sound the captions do not know: laughter, a noise, an uncaptioned word): ${unowned.map((u) => `${u.s.toFixed(2)}-${u.e.toFixed(2)} (${placeText(u)})`).join(" ")}`);
  // The voice is searched only up to 3 s after the last caption word: a closing chant that goes on would be cut short without a word.
  const sampleEnd = samples.length ? samples[samples.length - 1][0] : 0;
  if (lay.timed[lay.timed.length - 1].group.e >= to - 0.05 && sampleEnd > to + 0.1)
    warns.push(`the voice is still going where the search for it stops (${to.toFixed(1)} s) and the capture runs to ${sampleEnd.toFixed(1)} s: the last sentence may be cut short, pass --window ${Math.floor(from)}-${Math.ceil(sampleEnd)}`);
  if (unowned.some((u) => u.s < lay.timed[0].start - 0.05))
    warns.push(`sound between the clip start (${clip.start} s) and the first sentence (${lay.timed[0].start} s): adjust --clip-start or accept the lead-in`);
  if (voice.separability != null && voice.separability < 0.5) warns.push("voice and background are not clearly apart: every stop below needs a human listen");

  return {
    threshold: voice.threshold,
    separability: voice.separability,
    window: [from, to],
    runs,
    spans,
    matched,
    total,
    sentences,
    placed: lay.placed,
    firstSound: lay.timed[0].group.s,
    lastSound: lay.timed[lay.timed.length - 1].group.e,
    clip,
    gate,
    listen,
    unowned,
    joins: joined.joins,
    notes,
    warns,
  };
}

/** What a failing `plan` can add to its message: the anchored mode, when the capture's captions give every word a time. */
export function anchorsHint(caps, id) {
  const onsets = wordOnsets(caps ?? []);
  return isWordByWord(onsets)
    ? ` The captions show one word at a time (roll-up), so \`yvl plan --id ${id} --anchors [--threshold dB]\` can place the sentences by those word times instead of by the pauses alone.`
    : "";
}
