// Video dictation prep, step 1 for a video that exists only on YouTube: records what a viewer can SEE and HEAR
// (the loudness of the sound and of the voice band every 20 ms, and the caption words YouTube shows, with their
// times). Nothing of the video or its sound is kept. It runs inside a YouTube watch page of the built-in browser
// pane; see scripts/video-prep/README.md. Start it with this one line (after one key press on the page, which
// lets the page analyse sound), then read the result about the video's length later:
//
//   (async()=>{window.__capOpts={lang:'en'};return eval(await(await fetch('https://raw.githubusercontent.com/Muhamedalih/sentencestep/master/scripts/video-prep/yt-capture.snippet.js?'+Date.now())).text())})()
//   ... later:  window.__cap.state === 'done' ? JSON.stringify(window.__cap.out) : window.__cap.state
//
// The result is padded to more than 100,000 characters on purpose: the pane then saves it to a file and prints only
// the file's path, so the numbers never pass through the chat. yt-plan.mjs reads that file.
(() => {
  const opts = Object.assign({ lang: "en", warmupMax: 40, from: 0, to: 0 }, window.__capOpts || {});
  const cap = (window.__cap = { state: "starting", out: null, log: [] });
  const pl = document.getElementById("movie_player");
  const v = document.querySelector("video");
  if (!pl || !v) return "no player on this page";
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const p = window.ytInitialPlayerResponse || {};
  const d = p.videoDetails || {};
  const tracks = (((p.captions || {}).playerCaptionsTracklistRenderer || {}).captionTracks || []).map(
    (t) => t.languageCode + ":" + (t.kind || "manual"),
  );
  const details = {
    id: d.videoId,
    title: d.title,
    author: d.author,
    channelId: d.channelId,
    lengthSeconds: Number(d.lengthSeconds),
    status: p.playabilityStatus && p.playabilityStatus.status,
    embeddable: p.playabilityStatus && p.playabilityStatus.playableInEmbed,
    description: (d.shortDescription || "").slice(0, 400),
    tracks,
  };
  try {
    pl.loadModule("captions");
    pl.setOption("captions", "track", { languageCode: opts.lang });
    pl.toggleSubtitlesOn();
  } catch (e) {
    cap.log.push("captions " + e);
  }
  const ctx = new AudioContext();
  ctx.resume();
  const src = ctx.createMediaElementSource(v);
  const analyser = () => {
    const a = ctx.createAnalyser();
    a.fftSize = 1024;
    a.smoothingTimeConstant = 0;
    return a;
  };
  const all = analyser();
  const voice = analyser();
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 300;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 3400;
  const mute = ctx.createGain();
  mute.gain.value = 0;
  src.connect(all);
  src.connect(hp);
  hp.connect(lp);
  lp.connect(voice);
  all.connect(mute);
  voice.connect(mute);
  mute.connect(ctx.destination);
  const bufA = new Float32Array(all.fftSize);
  const bufV = new Float32Array(voice.fftSize);
  const rms = (a, b) => {
    a.getFloatTimeDomainData(b);
    let s = 0;
    for (let i = 0; i < b.length; i++) s += b[i] * b[i];
    return Math.sqrt(s / b.length);
  };
  try {
    pl.unMute();
    pl.setVolume(100);
  } catch (e) {
    cap.log.push("volume " + e);
  }
  const samples = [];
  const caps = [];
  let phase = "wait";
  let tPhase = 0;
  let lastCap = null;
  let adTicks = 0;
  // The settings hint YouTube shows when captions are switched on is not a caption.
  const readCaps = () =>
    [...document.querySelectorAll(".ytp-caption-segment")]
      .map((s) => s.textContent.trim())
      .filter((s) => s && !/^English \(|^Click\b.*settings/i.test(s))
      .join(" / ");
  const readTranscript = async () => {
    const expand = document.querySelector("#description-inline-expander #expand, ytd-text-inline-expander #expand");
    if (expand) expand.click();
    await sleep(900);
    const button = [...document.querySelectorAll("button")].find((b) =>
      /show transcript/i.test((b.textContent || "") + " " + (b.getAttribute("aria-label") || "")),
    );
    if (!button) return null;
    button.click();
    await sleep(3500);
    const seen = new Set();
    const rows = [];
    const toSeconds = (stamp) => stamp.split(":").reduce((total, part) => total * 60 + Number(part), 0);
    document.querySelectorAll("ytd-transcript-segment-renderer, transcript-segment-view-model").forEach((el) => {
      let stamp;
      let text;
      const a = el.querySelector(".segment-timestamp");
      const b = el.querySelector(".segment-text");
      if (a && b) {
        stamp = a.textContent.trim();
        text = b.textContent.trim();
      } else {
        // "0:02 2 seconds erns. Here are ..." in the narrow layout
        const m = el.innerText.trim().match(/^(\d+(?::\d{2})+)\s+(?:\d+\s+(?:hours?|minutes?|seconds?)(?:,\s*)?)+\s*([\s\S]*)$/);
        if (!m) return;
        stamp = m[1];
        text = m[2];
      }
      text = text.replace(/\s+/g, " ").trim();
      const key = stamp + "|" + text;
      if (seen.has(key)) return;
      seen.add(key);
      rows.push([toSeconds(stamp), text]);
    });
    return rows;
  };
  const finish = async () => {
    pl.pauseVideo();
    let transcript = null;
    try {
      transcript = tracks.length ? await readTranscript() : null;
    } catch (e) {
      cap.log.push("transcript " + e);
    }
    const pad = Array.from({ length: 110000 }, () => Math.floor(Math.random() * 10)).join("");
    cap.out = { details, duration: v.duration, adTicks, log: cap.log, samples, caps, transcript, pad };
    cap.state = "done";
  };
  const iv = setInterval(() => {
    const now = performance.now();
    const ad = pl.classList.contains("ad-showing");
    if (phase === "wait") {
      cap.state = "waiting for the video";
      if (ad) adTicks++;
      else if (v.duration > 0) {
        // The caption data of some videos reaches the player only after it has played for a while: play until a
        // caption shows (at most warmupMax seconds), then start again from the top.
        phase = tracks.length ? "warm" : "seek";
        tPhase = now;
        if (tracks.length) pl.playVideo();
        else {
          pl.pauseVideo();
          pl.seekTo(opts.from, true);
        }
      }
      return;
    }
    if (phase === "warm") {
      cap.state = "warming up the captions";
      if (readCaps() || now - tPhase > opts.warmupMax * 1000) {
        phase = "seek";
        tPhase = now;
        pl.pauseVideo();
        pl.seekTo(opts.from, true);
      }
      return;
    }
    if (phase === "seek") {
      if (now - tPhase > 1500) {
        samples.length = 0;
        caps.length = 0;
        lastCap = null;
        phase = "rec";
        pl.playVideo();
      }
      return;
    }
    if (phase === "rec") {
      cap.state = "recording " + v.currentTime.toFixed(0) + "s";
      const t = +v.currentTime.toFixed(3);
      samples.push([t, +rms(all, bufA).toFixed(5), +rms(voice, bufV).toFixed(5)]);
      const c = readCaps();
      if (c !== lastCap) {
        caps.push([t, c]);
        lastCap = c;
      }
      if (v.ended || t >= (opts.to || v.duration) - 0.1) {
        phase = "end";
        clearInterval(iv);
        cap.state = "reading the transcript";
        finish();
      }
    }
  }, 20);
  return "capture started (" + (details.title || "?") + ", " + details.lengthSeconds + " s, captions " + (tracks.join(",") || "none") + ")";
})();
