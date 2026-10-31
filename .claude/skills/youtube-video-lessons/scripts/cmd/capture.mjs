/**
 * yvl capture --id <slug> [--yt <youtubeId>] [--from 0] [--to 75] [--no-captions] [--headful]
 * Step 2: plays the video ONCE, muted, in YouTube's official embedded player (a local test page) and records
 * numbers only: the loudness every ~20 ms and the caption words the player shows. Nothing of the video or its
 * sound is stored. Writes <slug>.capture.json (same shape as scripts/video-prep/yt-capture.mjs: samples, caps).
 * An ad plays first sometimes: it is waited out and never stored. About one clip-length of real time.
 */
import {
  draftPath,
  fail,
  loadJob,
  num,
  requireId,
  resolveRepo,
  round2,
  sleep,
  writeJson,
  youtubeIdFrom,
} from "../lib/util.mjs";
import { PLAYER_ERRORS, installProbe, startHarness } from "../lib/harness.mjs";
import { capsToCues, mergeContinuations, rollUpShare } from "../lib/text.mjs";
import { dB, voicedIntervals } from "../lib/envelope.mjs";

export async function run(args) {
  const repo = resolveRepo(args);
  const id = requireId(args);
  const job = loadJob(args, id);
  const videoId = (args.yt && youtubeIdFrom(args.yt)) || job?.youtubeId;
  if (!videoId) fail("no video: run `yvl inspect <link> --id <slug>` first, or pass --yt <youtubeId>");
  if (job && job.embeddable === false) fail("inspect says this video cannot be embedded: stop here");
  const from = num(args.from, 0);
  const to = num(args.to, 0);
  const maxSeconds = num(args["max-seconds"], 330);

  console.log(`capturing ${videoId}${to ? ` ${from}-${to} s` : ""} in the official embed (real time) ...`);
  const h = await startHarness({
    repo,
    config: { videoId, start: from, captions: args["no-captions"] !== true },
    headful: Boolean(args.headful),
  });
  try {
    const frameNow = () => h.frame() ?? fail("the player frame disappeared");
    console.log(await frameNow().evaluate(installProbe));
    await h.page.evaluate("yvl.player.playVideo()");

    const t0 = Date.now();
    let last = 0;
    let tracks = null;
    let tracksTried = false;
    for (;;) {
      await sleep(500);
      const st = await h.page.evaluate(
        "({ s: yvl.player.getPlayerState(), t: yvl.player.getCurrentTime(), d: yvl.player.getDuration(), e: yvl.error })",
      );
      const ad = await frameNow().evaluate(() => window.__yvl.adNow);
      if (st.e !== null) throw new Error(`player error ${st.e}: ${PLAYER_ERRORS[st.e] || ""}`);
      if (!tracksTried && st.s === 1 && !ad && st.t > from + 2) {
        tracksTried = true;
        tracks = await h.page.evaluate(`(() => {
          try { yvl.player.loadModule('captions'); } catch (e) {}
          try {
            const list = yvl.player.getOption('captions', 'tracklist');
            return Array.isArray(list) ? list.map((x) => ({ lang: x.languageCode, name: x.languageName || x.displayName, kind: x.kind || 'manual' })) : null;
          } catch (e) { return 'unavailable: ' + e.message; }
        })()`);
      }
      const elapsed = (Date.now() - t0) / 1000;
      if (elapsed - last >= 10) {
        last = elapsed;
        process.stdout.write(`\r  ${elapsed.toFixed(0)} s: video at ${st.t.toFixed(1)} of ${st.d.toFixed(1)}${ad ? " (ad)" : ""}   `);
      }
      if (st.s === 0) break;
      if (to && !ad && st.t >= to) break;
      if (elapsed > maxSeconds) {
        console.log("\nstopped at --max-seconds");
        break;
      }
    }
    console.log("");
    const data = await frameNow().evaluate(() => ({
      samples: window.__yvl.samples,
      caps: window.__yvl.caps,
      adTicks: window.__yvl.adTicks,
      audio: window.__yvl.audio,
    }));
    const details = await h.page.evaluate(
      "({ data: (yvl.player.getVideoData && yvl.player.getVideoData()) || {}, duration: yvl.player.getDuration() })",
    );
    await h.page.evaluate("yvl.player.pauseVideo()");

    const out = {
      v: 1,
      id,
      youtubeId: videoId,
      from,
      to: to || null,
      capturedAt: new Date().toISOString(),
      details: {
        title: details.data.title,
        author: details.data.author,
        duration: round2(details.duration),
        tracks,
      },
      adSeconds: round2(data.adTicks * 0.02),
      audio: data.audio,
      samples: data.samples,
      caps: data.caps,
    };
    writeJson(draftPath(args, id, "capture"), out);

    // A short readout so nobody has to open the file.
    const window_ = { from: from, to: to || Infinity };
    const v = voicedIntervals(data.samples, window_);
    const cues = mergeContinuations(capsToCues(data.caps));
    const spanT = data.samples.length ? data.samples[data.samples.length - 1][0] - data.samples[0][0] : 0;
    const rate = spanT > 0 ? data.samples.length / spanT : 0;
    const peak = Math.max(...data.samples.map((s) => dB(s[2])));
    console.log(
      `captured ${data.samples.length} samples over ${spanT.toFixed(1)} s (${rate.toFixed(0)}/s), video length ${out.details.duration} s, ads waited ${out.adSeconds} s`,
    );
    console.log(
      `voice: ${v.intervals.length} voiced intervals, threshold ${v.threshold == null ? "?" : v.threshold.toFixed(1)} dB, separability ${v.separability == null ? "?" : v.separability.toFixed(2)}, peak ${peak.toFixed(1)} dB`,
    );
    console.log(
      `captions: ${cues.length} cues (${Array.isArray(tracks) ? tracks.map((t) => `${t.lang}:${t.kind}`).join(",") : tracks || "track list unavailable"}), roll-up share ${rollUpShare(cues).toFixed(2)}`,
    );
    if (data.audio !== "running") console.log("WARN audio context is not running: the loudness may be zero");
    if (peak < -70) console.log("WARN no audio level at all: the player gave no sound to measure (muted, DRM or a blocked autoplay)");
    if (rate < 35) console.log("WARN the sampler ran slowly (" + rate.toFixed(0) + "/s): the page was throttled, stops will be coarse. Re-run with --headful.");
    if (v.separability != null && v.separability < 0.5)
      console.log("WARN the pauses are not clear (music or noise under the voice): expect shaky stops and plan a listen list.");
    if (!cues.length) console.log("NOTE no captions were shown: the text must come from a script, the description, or be typed.");
    if (rollUpShare(cues) > 0.25) console.log("WARN the captions look like automatic roll-up captions: the text needs a careful human check.");
    console.log(`saved ${draftPath(args, id, "capture")}`);
  } finally {
    await h.close();
  }
}
