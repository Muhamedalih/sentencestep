/**
 * The test harness: YouTube's OFFICIAL embedded player (IFrame API, youtube-nocookie host, the same player
 * variables the practice page uses) in a tiny local page, driven from Chrome by puppeteer-core.
 *   capture: plays the clip once, muted, and records numbers only (loudness every ~20 ms and the caption words
 *            the player shows): no audio or video is stored anywhere.
 *   verify:  plays the lesson sentence by sentence with the app's OWN stop rules (src/lib/video-dictation/
 *            segments.ts, served to the page after stripping its types) and records where every stop lands.
 * The page controls playback only through the documented IFrame API calls. Reading the loudness happens in
 * the embed's frame through the browser's debugging connection, and only in an authoring session.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import { stripTypeScriptTypes } from "node:module";

import { TOOLS, fail } from "./util.mjs";

export const PLAYER_ERRORS = {
  2: "invalid parameter",
  5: "HTML5 player error",
  100: "video removed or private",
  101: "embedding disabled by the owner",
  150: "embedding disabled by the owner",
  153: "player configuration error (no referrer or origin)",
};

export function loadPuppeteer() {
  const homes = [process.env.PUPPETEER_HOME, TOOLS, "C:/Looma-video"].filter(Boolean);
  for (const home of homes) {
    try {
      return createRequire(path.join(home, "package.json"))("puppeteer-core");
    } catch {
      /* try the next folder */
    }
  }
  return fail(`puppeteer-core not found (looked in ${homes.join(", ")}): npm install puppeteer-core in C:/Looma-video`);
}

export function chromePath() {
  const options = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  ];
  for (const p of options) if (p && fs.existsSync(p)) return p;
  return fail("Chrome not found: set CHROME_PATH");
}

const PAGE_HTML = `<!doctype html><meta charset="utf-8"><title>yvl harness</title>
<body style="margin:0;background:#000"><div id="host" style="width:640px;height:360px"></div>
<script type="module">
import * as seg from "/seg.js";
const cfg = await (await fetch("/config.json")).json();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const y = (window.yvl = { seg, cfg, ready: false, error: null, states: [], player: null });
window.onYouTubeIframeAPIReady = () => {
  const vars = { playsinline: 1, rel: 0, disablekb: 1, iv_load_policy: 3, fs: 0, start: Math.floor(cfg.start || 0), origin: location.origin };
  if (cfg.captions) Object.assign(vars, { cc_load_policy: 1, cc_lang_pref: "en", hl: "en" });
  if (cfg.loop) Object.assign(vars, { loop: 1, playlist: cfg.videoId });
  y.player = new YT.Player("host", {
    host: "https://www.youtube-nocookie.com", width: "100%", height: "100%", videoId: cfg.videoId, playerVars: vars,
    events: {
      onReady: () => { y.ready = true; },
      onStateChange: (e) => y.states.push([Math.round(performance.now()), e.data]),
      onError: (e) => { y.error = e.data; },
    },
  });
};
const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);

async function waitFor(test, ms, label) {
  const t0 = performance.now();
  while (performance.now() - t0 < ms) {
    if (y.error !== null) throw new Error("player error " + y.error);
    if (test()) return performance.now() - t0;
    await sleep(15);
  }
  throw new Error("timeout waiting for " + label);
}

/** Plays the lesson the way the practice page does: one sentence at a time, stop rules from segments.ts, no seek between sentences. */
y.runLesson = async (lesson, opts) => {
  const p = y.player;
  const out = { sentences: [], replays: [], adSeconds: 0, problems: [], duration: null, firstPlayAt: null };
  const typeMs = opts.typeMs ?? 500;
  const waitContent = async (label) => {
    // An ad reports its own length: wait until the player reports this video again (what the page's isSameVideo does).
    const t0 = performance.now();
    let sawAd = false;
    while (performance.now() - t0 < (opts.adMaxSeconds ?? 120) * 1000) {
      if (y.error !== null) throw new Error("player error " + y.error);
      const same = seg.isSameVideo(p.getDuration(), lesson.durationSeconds);
      if (!same && p.getPlayerState() === 1) sawAd = true;
      if (same && p.getPlayerState() === 1) { if (sawAd) out.adSeconds += (performance.now() - t0) / 1000; return; }
      await sleep(40);
    }
    throw new Error("the video never started (" + label + ")");
  };
  await waitFor(() => y.ready, 45000, "player ready");
  p.playVideo();
  await waitContent("first play");
  out.duration = p.getDuration(); // read once the video itself plays: before that the player may still report 0 (or an ad's length)
  if (opts.rate && opts.rate !== 1) p.setPlaybackRate(opts.rate);
  out.firstPlayAt = p.getCurrentTime();
  if (Math.abs(out.firstPlayAt - Math.floor(lesson.clipStartSeconds)) > 2)
    out.problems.push("the video started at " + out.firstPlayAt.toFixed(2) + " s, the clip starts at " + lesson.clipStartSeconds);

  let lead = seg.START_LEAD_SECONDS;
  const stopAt = (endSeconds, timeoutMs) => new Promise((resolve, reject) => {
    let sawBefore = false;
    let adSeen = false;
    let top = 0;
    const t0 = performance.now();
    const iv = setInterval(() => {
      if (y.error !== null) { clearInterval(iv); reject(new Error("player error " + y.error)); return; }
      if (!seg.isSameVideo(p.getDuration(), lesson.durationSeconds)) { adSeen = true; return; }
      // A Short that YouTube loops wraps round to 0 at its end without ever reporting ENDED: a stop after the last frame is never reached.
      const now = p.getCurrentTime();
      if (now < top - 1) { clearInterval(iv); reject(new Error("the video wrapped round to " + now.toFixed(1) + " s after " + top.toFixed(1) + " s without ending (YouTube loops this Short): the stop asked for at " + endSeconds + " s lies after its last frame and is never reached")); return; }
      if (now > top) top = now;
      // The video itself ended while the sentence played (the last sentence can run to the last frame): like the page, take its end as the stop.
      if (p.getPlayerState() === 0) {
        clearInterval(iv);
        resolve({ polledAt: p.getCurrentTime(), adSeen, ms: performance.now() - t0, ended: true });
        return;
      }
      const tick = seg.segmentTick(sawBefore, p.getCurrentTime(), endSeconds - lead);
      sawBefore = tick.sawBefore;
      if (tick.stop) {
        clearInterval(iv);
        const polledAt = p.getCurrentTime();
        p.pauseVideo();
        resolve({ polledAt, adSeen, ms: performance.now() - t0 });
      } else if (performance.now() - t0 > timeoutMs) {
        clearInterval(iv);
        reject(new Error("sentence did not reach its end in " + (timeoutMs / 1000) + " s"));
      }
    }, seg.POLL_MS);
  });

  for (let i = 0; i < lesson.sentences.length; i++) {
    const s = lesson.sentences[i];
    const budgetMs = ((s.endSeconds - Math.min(s.startSeconds, p.getCurrentTime())) / (opts.rate || 1) + 25) * 1000;
    const leadUsed = lead;
    const stop = await stopAt(s.endSeconds, Math.max(30000, budgetMs));
    if (!stop.ended) await waitFor(() => p.getPlayerState() === 2, 5000, "PAUSED after the stop of sentence " + (i + 1));
    const stoppedAt = p.getCurrentTime();
    if (!stop.ended) lead = seg.nextLead(lead, stoppedAt, s.endSeconds);
    const row = { n: i + 1, end: s.endSeconds, polledAt: stop.polledAt, stoppedAt, overshoot: stoppedAt - s.endSeconds, leadUsed, adSeen: stop.adSeen, ended: Boolean(stop.ended), resumeMs: null, resumeAdvance: null, resumeElapsed: null };
    if (stop.ended && i + 1 < lesson.sentences.length) {
      out.sentences.push(row);
      out.problems.push("the video ended during sentence " + (i + 1) + " of " + lesson.sentences.length + ": the later sentences lie past its end");
      return out;
    }
    if (i + 1 < lesson.sentences.length) {
      await sleep(typeMs);
      const before = p.getCurrentTime();
      const t0 = performance.now();
      p.playVideo();
      row.resumeMs = await waitFor(() => p.getPlayerState() === 1, 8000, "resume after sentence " + (i + 1));
      await sleep(250);
      row.resumeAdvance = p.getCurrentTime() - before;
      row.resumeElapsed = (performance.now() - t0) / 1000;
    }
    out.sentences.push(row);
  }

  const picks = [...new Set([0, Math.floor(lesson.sentences.length / 2), lesson.sentences.length - 1])].slice(0, opts.replays ?? 3);
  for (const i of picks) {
    const s = lesson.sentences[i];
    const target = seg.replayPosition(s.startSeconds);
    p.seekTo(target, true);
    p.playVideo();
    const t0 = performance.now();
    await waitFor(() => p.getPlayerState() === 1, 12000, "replay of sentence " + (i + 1));
    const landedAt = p.getCurrentTime();
    const stop = await stopAt(s.endSeconds, 40000);
    if (!stop.ended) await waitFor(() => p.getPlayerState() === 2, 5000, "PAUSED after the replay of sentence " + (i + 1));
    const stoppedAt = p.getCurrentTime();
    out.replays.push({ n: i + 1, target, landedAt, seekError: landedAt - target, end: s.endSeconds, stoppedAt, overshoot: stoppedAt - s.endSeconds, ms: stop.ms, ended: Boolean(stop.ended) });
  }
  return out;
};
</script>`;

/**
 * Starts the local page and Chrome. Returns { page, frame(), config, logs, close }.
 * `config` = { videoId, start, captions, loop } (loop: the player starts the video again at its end, as YouTube does in some sessions).
 */
export async function startHarness({ repo, config, headful = false }) {
  const segFile = path.join(repo, "src", "lib", "video-dictation", "segments.ts");
  const segJs = stripTypeScriptTypes(fs.readFileSync(segFile, "utf8"));
  const server = http.createServer((req, res) => {
    const url = (req.url || "/").split("?")[0];
    if (url === "/") {
      res.setHeader("content-type", "text/html; charset=utf-8");
      res.end(PAGE_HTML);
    } else if (url === "/seg.js") {
      res.setHeader("content-type", "text/javascript; charset=utf-8");
      res.end(segJs);
    } else if (url === "/config.json") {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(config));
    } else {
      res.statusCode = 404;
      res.end("not found");
    }
  });
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const puppeteer = loadPuppeteer();
  const browser = await puppeteer.launch({
    executablePath: chromePath(),
    headless: !headful,
    protocolTimeout: 1_800_000,
    args: [
      "--autoplay-policy=no-user-gesture-required",
      "--mute-audio",
      "--no-sandbox",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--disable-backgrounding-occluded-windows",
      "--lang=en-US",
    ],
    defaultViewport: { width: 640, height: 360 },
  });
  const close = async () => {
    try {
      await browser.close();
    } finally {
      server.close();
    }
  };
  try {
    const page = await browser.newPage();
    const logs = [];
    page.on("console", (m) => logs.push(m.text()));
    page.on("pageerror", (e) => logs.push(`pageerror: ${e.message}`));
    await page.goto(`http://localhost:${port}/`, { waitUntil: "domcontentloaded" });
    await page
      .waitForFunction("window.yvl && (window.yvl.ready || window.yvl.error !== null)", { timeout: 60000 })
      .catch(() => {});
    const state = await page.evaluate("({ ready: !!(window.yvl && window.yvl.ready), error: window.yvl ? window.yvl.error : 'no page' })");
    if (!state.ready) {
      const why = PLAYER_ERRORS[state.error] ? `${state.error}: ${PLAYER_ERRORS[state.error]}` : String(state.error);
      throw new Error(`the player did not start (${why})`);
    }
    const frame = () => page.frames().find((f) => /youtube(-nocookie)?\.com\/embed\//.test(f.url()));
    return { page, frame, config, logs, close, port };
  } catch (error) {
    await close();
    throw error;
  }
}

/**
 * Runs inside the embed's frame (called through frame.evaluate): taps the player's audio silently
 * (gain 0) and samples [media time, whole-sound level, voice-band level] every ~20 ms plus the caption
 * text on screen. While an ad shows nothing is stored. Returns once the sampler runs.
 */
export async function installProbe() {
  const video = await new Promise((resolve) => {
    let tries = 0;
    const timer = setInterval(() => {
      const el = document.querySelector("video");
      if (el || ++tries > 200) {
        clearInterval(timer);
        resolve(el);
      }
    }, 100);
  });
  if (!video) return "no video element in the player frame";
  const ctx = new AudioContext();
  await ctx.resume().catch(() => {});
  const source = ctx.createMediaElementSource(video);
  const analyser = () => {
    const node = ctx.createAnalyser();
    node.fftSize = 1024;
    node.smoothingTimeConstant = 0;
    return node;
  };
  const whole = analyser();
  const voice = analyser();
  const high = ctx.createBiquadFilter();
  high.type = "highpass";
  high.frequency.value = 300;
  const low = ctx.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.value = 3400;
  const mute = ctx.createGain();
  mute.gain.value = 0;
  source.connect(whole);
  source.connect(high);
  high.connect(low);
  low.connect(voice);
  whole.connect(mute);
  voice.connect(mute);
  mute.connect(ctx.destination);
  const bufA = new Float32Array(whole.fftSize);
  const bufV = new Float32Array(voice.fftSize);
  const rms = (node, buf) => {
    node.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    return Math.sqrt(sum / buf.length);
  };
  const st = (window.__yvl = { samples: [], caps: [], last: null, adTicks: 0, adNow: false, audio: ctx.state });
  setInterval(() => {
    const ad = Boolean(document.querySelector(".ad-showing"));
    st.adNow = ad;
    if (ad) {
      st.adTicks++;
      return;
    }
    const t = Math.round(video.currentTime * 1000) / 1000;
    st.samples.push([t, Math.round(rms(whole, bufA) * 1e5) / 1e5, Math.round(rms(voice, bufV) * 1e5) / 1e5]);
    const cap = [...document.querySelectorAll(".ytp-caption-segment")]
      .map((s) => s.textContent.trim())
      .filter(Boolean)
      .join(" ");
    if (cap !== st.last) {
      st.caps.push([t, cap]);
      st.last = cap;
    }
  }, 20);
  return `sampler running (audio ${ctx.state})`;
}
