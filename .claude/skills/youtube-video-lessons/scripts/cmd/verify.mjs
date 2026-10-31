/**
 * yvl verify --id <slug> [--spec <file>] [--capture <file>] [--rate 1] [--type-ms 500] [--replays 3] [--headful]
 * Step 8: plays the lesson in YouTube's OFFICIAL embedded player (IFrame API) the way the practice page does,
 * with the app's own stop rules (src/lib/video-dictation/segments.ts): one sentence at a time, a stop at every
 * end, a pause for typing, a resume without a seek, then replays of the first, middle and last sentence.
 * Reports where every stop really landed. With the recorded loudness it also says whether each stop sits in
 * silence (a stop inside a word cuts it; a next sound before the stop leaks the next sentence).
 * Reads src/data/videos/<slug>.ts when built, else the spec. Writes <slug>.verify.json. Exit 1 on failure.
 * Real time: about the clip length plus a minute.
 */
import fs from "node:fs";
import path from "node:path";

import {
  draftPath,
  fail,
  fmt,
  normalizeLesson,
  num,
  readJson,
  readLessonFile,
  requireId,
  resolveRepo,
  round2,
  writeJson,
} from "../lib/util.mjs";
import { PLAYER_ERRORS, startHarness } from "../lib/harness.mjs";
import { surroundings, voicedIntervals } from "../lib/envelope.mjs";

const TOL = { late: 0.15, early: -0.12, seek: 1.0 };

export async function run(args) {
  const repo = resolveRepo(args);
  const id = requireId(args);
  const dataFile = path.join(repo, "src", "data", "videos", `${id}.ts`);
  const specFile = args.spec ? String(args.spec) : draftPath(args, id, "spec");
  let raw;
  let kind;
  if (!args.spec && fs.existsSync(dataFile)) {
    raw = readLessonFile(dataFile);
    kind = "built lesson";
  } else if (fs.existsSync(specFile)) {
    raw = readJson(specFile);
    kind = "spec";
  } else fail(`neither ${dataFile} nor ${specFile} exists`);
  const L = normalizeLesson(raw);
  if (!L.sentences.length) fail("the lesson has no sentences");
  const lesson = {
    youtubeId: L.youtubeId,
    durationSeconds: L.durationSeconds,
    clipStartSeconds: L.clipStart,
    sentences: L.sentences.map((s) => ({ id: s.id, startSeconds: s.start, endSeconds: s.end })),
  };

  const capFile = args.capture ? String(args.capture) : draftPath(args, id, "capture");
  let V = null;
  if (fs.existsSync(capFile)) {
    const cap = readJson(capFile);
    V = voicedIntervals(cap.samples, { from: Math.max(0, L.clipStart - 2), to: L.clipEnd + 2 }).intervals;
  }

  const opts = { typeMs: num(args["type-ms"], 500), replays: num(args.replays, 3), rate: num(args.rate, 1), adMaxSeconds: 120 };
  const expected = L.clipEnd - L.clipStart + L.sentences.length * (opts.typeMs / 1000) + 60;
  console.log(`verifying ${id} (${kind}, ${L.sentences.length} sentences, ${L.youtubeId}) in the official embed; about ${Math.round(expected / opts.rate)} s ...`);
  const h = await startHarness({
    repo,
    config: { videoId: L.youtubeId, start: Math.floor(L.clipStart), captions: false },
    headful: Boolean(args.headful),
  });
  let result;
  try {
    result = await h.page.evaluate((lessonArg, optsArg) => window.yvl.runLesson(lessonArg, optsArg), lesson, opts);
  } catch (error) {
    const code = await h.page.evaluate("window.yvl ? window.yvl.error : null").catch(() => null);
    const why = code !== null && PLAYER_ERRORS[code] ? ` (player error ${code}: ${PLAYER_ERRORS[code]})` : "";
    console.log(`RESULT FAIL: ${error.message}${why}`);
    writeJson(draftPath(args, id, "verify"), { id, result: "FAIL", error: error.message, at: new Date().toISOString() });
    process.exitCode = 1;
    return;
  } finally {
    await h.close();
  }

  const errors = [];
  const warns = [];
  if (result.problems?.length) result.problems.forEach((p) => warns.push(p));
  if (Math.abs(result.duration - L.durationSeconds) > 1.5)
    errors.push(`the player reports ${result.duration.toFixed(1)} s but durationSeconds is ${L.durationSeconds}: the page would treat the video as an ad`);
  if (result.adSeconds > 0.5) warns.push(`an ad played first (${result.adSeconds.toFixed(0)} s); the page waits it out`);

  console.log(" #   asked  stopped   over  next-sound  flags");
  const rows = result.sentences.map((r) => {
    const flags = [];
    if (r.overshoot > TOL.late) flags.push(`LATE ${r.overshoot.toFixed(2)}`);
    if (r.overshoot < TOL.early) flags.push(`EARLY ${r.overshoot.toFixed(2)}`);
    if (r.adSeen) flags.push("ad");
    if (r.resumeMs !== null && r.resumeMs > 3000) flags.push(`slow resume ${(r.resumeMs / 1000).toFixed(1)}s`);
    if (r.resumeAdvance !== null) {
      if (r.resumeAdvance < -0.05) flags.push(`jumped back ${r.resumeAdvance.toFixed(2)}`);
      else if (r.resumeAdvance > r.resumeElapsed + 0.4) flags.push(`jumped ahead ${(r.resumeAdvance - r.resumeElapsed).toFixed(2)}`);
    }
    let next = "   -";
    if (V) {
      const around = surroundings(V, r.stoppedAt);
      if (around.inside) {
        flags.push("CUT: stop inside speech");
        next = "inside";
      } else {
        next = around.untilSound === Infinity ? "  none" : around.untilSound.toFixed(2).padStart(6);
        if (r.n < result.sentences.length) {
          if (around.untilSound < 0.03) flags.push(`LEAK: next sound ${around.untilSound.toFixed(2)} s after the stop`);
          else if (around.untilSound < 0.06) flags.push(`tight: next sound ${around.untilSound.toFixed(2)} s after`);
        }
        if (around.sinceSound < 0.03) flags.push(`clipped: last sound ${around.sinceSound.toFixed(2)} s before the stop`);
      }
    }
    const hard = flags.filter((f) => /^(LATE|EARLY|CUT|LEAK|jumped)/.test(f));
    if (hard.length) errors.push(`s${r.n}: ${hard.join("; ")}`);
    else if (flags.length) warns.push(`s${r.n}: ${flags.join("; ")}`);
    console.log(`${String(r.n).padStart(2)} ${fmt(r.end, 7)} ${fmt(r.stoppedAt, 8)} ${fmt(r.overshoot, 6)}  ${next.padStart(8)}   ${flags.join("; ")}`);
    return { ...r, flags };
  });

  console.log("replays (seek to start - 0.2 s, play, stop at the end):");
  for (const r of result.replays) {
    const flags = [];
    if (Math.abs(r.seekError) > TOL.seek) flags.push(`SEEK landed ${r.seekError.toFixed(2)} s from the target`);
    if (r.overshoot > TOL.late) flags.push(`LATE ${r.overshoot.toFixed(2)}`);
    if (r.overshoot < TOL.early) flags.push(`EARLY ${r.overshoot.toFixed(2)}`);
    if (flags.length) errors.push(`replay of s${r.n}: ${flags.join("; ")}`);
    console.log(`  s${r.n}: target ${r.target.toFixed(2)} landed ${r.landedAt.toFixed(2)}, stopped ${r.stoppedAt.toFixed(2)} for end ${r.end.toFixed(2)} (over ${r.overshoot.toFixed(2)})${flags.length ? `  ${flags.join("; ")}` : ""}`);
  }

  const over = rows.map((r) => r.overshoot);
  const mean = over.reduce((a, b) => a + b, 0) / over.length;
  console.log(
    `stops: ${rows.length}, overshoot mean ${mean.toFixed(3)} s, min ${Math.min(...over).toFixed(3)}, max ${Math.max(...over).toFixed(3)}; first play at ${result.firstPlayAt.toFixed(2)} s (clip ${L.clipStart}); player length ${result.duration.toFixed(1)} s (lesson ${L.durationSeconds})`,
  );
  if (!V) warns.push("no recorded loudness: stops were not checked against the audio");
  warns.forEach((m) => console.log(`WARN  ${m}`));
  errors.forEach((m) => console.log(`ERROR ${m}`));
  const verdict = errors.length ? "FAIL" : "PASS";
  console.log(`RESULT ${verdict} (${errors.length} errors, ${warns.length} warnings)`);
  writeJson(draftPath(args, id, "verify"), {
    id,
    result: verdict,
    kind,
    at: new Date().toISOString(),
    overshoot: { mean: round2(mean), min: round2(Math.min(...over)), max: round2(Math.max(...over)) },
    adSeconds: round2(result.adSeconds),
    errors,
    warns,
    sentences: rows,
    replays: result.replays,
  });
  if (errors.length) process.exitCode = 1;
}
