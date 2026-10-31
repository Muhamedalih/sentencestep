/**
 * yvl flow --id <slug> [--port 3047] [--type-delay 90] [--headful] [--max-sentences N]
 * Step 9: the REAL practice page, end to end. Starts the repo's dev server (no Supabase, FEATURES_DEV_ALL_ON, the
 * dev-admin cookie: the project's own local-testing switches) and compiles the two pages first with a plain request,
 * enters the section the way a learner does (the library page, then the lesson's link), presses YouTube's own play
 * button, and for every sentence waits for the page to stop the video and to give the keyboard to the sentence, types
 * it with real key presses (letters, digits and spaces: punctuation is skipped by the typing screen), and checks that
 * the video carries on by itself. Ends on the finish screen. Reports where each stop
 * landed in the page's own run, the time to resume, CSP violations, console errors and a "tap to continue" fallback.
 * The lesson must be built (src/data/videos/<slug>.ts). Writes <slug>.flow.json. Exit 1 on failure.
 */
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

import {
  draftPath,
  fail,
  fmt,
  keystrokes,
  normalizeLesson,
  num,
  readLessonFile,
  requireId,
  resolveRepo,
  round2,
  sleep,
  writeJson,
} from "../lib/util.mjs";
import { chromePath, loadPuppeteer } from "../lib/harness.mjs";

/** Is something listening on the port? Asking a page is no test: a dev server that has not compiled its home page yet takes longer than any short timeout to answer, and a second server on its port never starts. */
function isUp(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: "localhost" });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

/**
 * Asks the dev server for the pages the test opens, with the cookies the browser will send, so each is compiled before
 * the browser's first navigation: a first compile takes 30-90 s and a navigation that waits that long can time out.
 */
async function warmUp(base, paths) {
  for (const p of paths) {
    const t0 = Date.now();
    try {
      const res = await fetch(`${base}${p}`, { headers: { cookie: "sentencestep-dev-admin=true; ss_locale=ar" }, signal: AbortSignal.timeout(300000) });
      await res.arrayBuffer();
      console.log(`warmed ${p}: ${res.status} in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    } catch (error) {
      console.log(`WARN warming ${p} failed (${error.message}): the first navigation may be slow`);
    }
  }
}

export async function run(args) {
  const repo = resolveRepo(args);
  const id = requireId(args);
  const dataFile = path.join(repo, "src", "data", "videos", `${id}.ts`);
  if (!fs.existsSync(dataFile)) fail(`${dataFile} does not exist: build the lesson first`);
  const L = normalizeLesson(readLessonFile(dataFile));
  const sentences = L.sentences.slice(0, num(args["max-sentences"], L.sentences.length));
  const port = num(args.port, 3047);
  // Dev-mode React needs about 50 ms per key; a faster burst piles up key events and starves the page's 30 ms stop timer.
  const typeDelay = num(args["type-delay"], 90);
  const base = `http://localhost:${port}`;

  let server = null;
  const stopServer = () => {
    if (server?.pid) spawnSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], { shell: true });
  };
  if (!(await isUp(port))) {
    console.log(`starting next dev on ${port} (first page compiles in 30-90 s) ...`);
    server = spawn("npx", ["next", "dev", "-p", String(port)], {
      cwd: repo,
      shell: true,
      env: { ...process.env, FEATURES_DEV_ALL_ON: "true", NEXT_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let ready = false;
    server.stdout.on("data", (d) => {
      if (/Ready|ready in|Local:/.test(String(d))) ready = true;
    });
    server.stderr.on("data", () => {}); // an unread pipe fills up (64 KB) and stalls the server
    for (let i = 0; i < 240 && !ready; i++) await sleep(500);
    if (!ready) {
      stopServer();
      fail("the dev server did not report ready in 120 s");
    }
  } else console.log(`using the server already on ${port}`);
  await warmUp(base, ["/learn/video", `/learn/video/${id}`]);

  const puppeteer = loadPuppeteer();
  const browser = await puppeteer.launch({
    executablePath: chromePath(),
    headless: !args.headful,
    protocolTimeout: 1_800_000,
    args: [
      "--autoplay-policy=no-user-gesture-required",
      "--mute-audio",
      "--no-sandbox",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--disable-backgrounding-occluded-windows",
      "--lang=en-US",
      // The site's analytics beacons (Clarity) only add load and CSP noise to a test.
      "--host-resolver-rules=MAP *.clarity.ms ~NOTFOUND,MAP *.bing.com ~NOTFOUND",
    ],
    defaultViewport: { width: 1280, height: 800 },
  });
  const problems = [];
  const rows = [];
  let finished = false;
  let captionsSeen = "";
  let lags = [];
  let page = null;
  try {
    page = await browser.newPage();
    page.on("console", (m) => {
      const text = m.text();
      // Two artifacts of this test, not of the lesson: the analytics hosts it blocks, and the hydration notice that
      // the emulated reduced-motion setting causes (the page does not show it without that setting).
      if (m.type() === "error" && !/ERR_NAME_NOT_RESOLVED|hydrated but some attributes/.test(text)) problems.push(`console: ${text.slice(0, 160)}`);
    });
    page.on("pageerror", (e) => problems.push(`pageerror: ${e.message.slice(0, 160)}`));
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await page.evaluateOnNewDocument(() => {
      window.__csp = [];
      document.addEventListener("securitypolicyviolation", (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
      // How long the page's own timers were held up: the page stops a sentence from a 30 ms timer, so a stall of
      // a second or more makes a stop late or (when the playhead is already near the end) skips it.
      window.__lag = [];
      let last = performance.now();
      setInterval(() => {
        const now = performance.now();
        if (now - last - 30 > 400) window.__lag.push(Math.round(now - last - 30));
        last = now;
      }, 30);
    });
    // The dev-admin switch (non-production only) and a chosen language: without ss_locale a new visitor gets the
    // intro screen over every page and clicks never reach the library.
    await page.setCookie(
      { name: "sentencestep-dev-admin", value: "true", url: base },
      { name: "ss_locale", value: "ar", url: base },
    );

    // The real entry path: the library, then the lesson's own link.
    await page.goto(`${base}/learn/video`, { waitUntil: "domcontentloaded", timeout: 240000 });
    const link = `a[href="/learn/video/${id}"]`;
    await page.waitForSelector(link, { timeout: 120000 }).catch(() => {
      throw new Error(`the library does not list ${id} (is the section on? the page is ${page.url()})`);
    });
    await page.click(link);
    await page.waitForSelector('iframe[src*="youtube"]', { timeout: 240000 });
    const frame = () => page.frames().find((f) => /youtube(-nocookie)?\.com\/embed\//.test(f.url()));
    for (let i = 0; i < 100 && !frame(); i++) await sleep(300);
    if (!frame()) throw new Error("the YouTube player frame never appeared");
    const probe = () =>
      frame()
        ?.evaluate(() => {
          const v = document.querySelector("video");
          return v ? { t: v.currentTime, paused: v.paused, ended: v.ended, ad: Boolean(document.querySelector(".ad-showing")) } : null;
        })
        .catch(() => null);
    for (let i = 0; i < 100; i++) {
      const st = await probe();
      if (st) break;
      await sleep(300);
    }

    // YouTube's own play button (the learner's first press).
    const box = await (await page.$('iframe[src*="youtube"]')).boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    let started = false;
    for (let i = 0; i < 120 && !started; i++) {
      const st = await probe();
      started = Boolean(st && !st.paused && !st.ad);
      if (!started) await sleep(500);
    }
    if (!started) throw new Error("the video did not start after the click on YouTube's play button (an ad? autoplay?)");
    console.log(`playing; typing ${sentences.length} sentences ...`);

    for (let i = 0; i < sentences.length; i++) {
      const s = sentences[i];
      const t0 = Date.now();
      let stop = null;
      let top = 0;
      while (Date.now() - t0 < (s.end + 40) * 1000) {
        const st = await probe();
        if (st && !st.ad && st.paused && st.t >= s.end - 0.6) {
          stop = st;
          break;
        }
        // A Short that YouTube loops wraps round to 0 at its end without a word (no ENDED): the page then waits for a stop that is never reached.
        if (st && !st.ad && st.t < top - 1)
          throw new Error(`sentence ${i + 1}: the video wrapped round to ${st.t.toFixed(1)} s after ${top.toFixed(1)} s and played on (YouTube loops this Short) but the page did not stop it: its stop (${s.end} s) lies after the last frame`);
        if (st && !st.ad && st.t > top) top = st.t;
        await sleep(100);
      }
      if (!stop) throw new Error(`sentence ${i + 1}: the page never stopped the video near ${s.end} s`);
      if (!captionsSeen) {
        captionsSeen = await frame()
          ?.evaluate(() =>
            [...document.querySelectorAll(".ytp-caption-segment")]
              .map((e) => e.textContent.trim())
              .filter(Boolean)
              .join(" "),
          )
          .catch(() => "") ?? "";
      }
      // A last sentence that runs to the last frame ends with the video (state ENDED): the page takes that as the stop.
      const row = { n: i + 1, end: s.end, stoppedAt: stop.t, overshoot: stop.t - s.end, ended: Boolean(stop.ended), resumeMs: null, tap: false, flags: [] };
      // The page gives the keyboard to the sentence a moment after the stop (dev mode: sometimes a few hundred ms). A key typed
      // before that goes to the player's frame and is lost, and the typing engine then takes whatever letters happen to match:
      // the first "D" lost left the input at "dad, " for ever and the video never resumed. Wait for the page's own focus.
      await page
        .waitForFunction(() => document.activeElement?.tagName === "INPUT", { timeout: 15000 })
        .catch(() => {
          throw new Error(`sentence ${i + 1}: the page did not give the keyboard to the sentence within 15 s of the stop`);
        });
      await page.keyboard.type(keystrokes(s.en), { delay: typeDelay });
      if (i + 1 < sentences.length) {
        const t1 = Date.now();
        let resumed = false;
        let budget = 9000;
        let last = Date.now();
        let adMs = 0;
        while (budget > 0 && !resumed) {
          const st = await probe();
          const now = Date.now();
          if (st?.ad) adMs += now - last;
          else budget -= now - last;
          last = now;
          if (adMs > 120000) break;
          resumed = Boolean(st && !st.ad && !st.paused && st.t > stop.t + 0.03);
          if (st?.ad) {
            await sleep(200);
            continue;
          }
          if (!resumed) {
            const tap = await page.$$eval("button", (bs) => bs.find((b) => /كمّل الآن/.test(b.textContent || ""))?.textContent ?? null);
            if (tap && Date.now() - t1 > 2500) {
              row.tap = true;
              await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /كمّل الآن/.test(b.textContent || ""))?.click());
            }
            await sleep(80);
          }
        }
        if (!resumed) throw new Error(`sentence ${i + 1}: typed in full but the video did not carry on (the inputs below show what the page kept; if it is only the first words, keys were lost: raise --type-delay from ${typeDelay} ms)`);
        row.resumeMs = Date.now() - t1 - adMs;
        if (adMs > 0) row.flags.push(`an ad played for ${(adMs / 1000).toFixed(0)} s (waited out)`);
      } else {
        for (let k = 0; k < 40 && !finished; k++) {
          finished = (await page.evaluate(() => document.body.innerText)).includes("أنهيت الفيديو");
          if (!finished) await sleep(250);
        }
      }
      if (!row.ended && row.overshoot > 0.2) row.flags.push(`late ${row.overshoot.toFixed(2)}`);
      if (!row.ended && row.overshoot < -0.15) row.flags.push(`early ${row.overshoot.toFixed(2)}`);
      if (row.tap) row.flags.push("needed the tap-to-continue button");
      rows.push(row);
      const progress = await page.evaluate(() => (document.body.innerText.match(/(\d+)\s*\/\s*(\d+)/) || [])[0] || "");
      console.log(`${String(row.n).padStart(2)} asked ${fmt(row.end, 6)} stopped ${fmt(row.stoppedAt, 6)} over ${fmt(row.overshoot, 5)}  resume ${row.resumeMs === null ? "   -" : `${row.resumeMs}ms`}  ${progress}  ${row.flags.join("; ")}`);
    }
    const csp = await page.evaluate(() => window.__csp ?? []);
    // A blocked YouTube source is a real defect of the section; other blocked beacons (analytics) are noise.
    for (const v of csp) problems.push(/youtube|ytimg|googlevideo|google\.com/i.test(v) ? `CSP violation: ${v}` : `other CSP notice (not the video section): ${v}`);
  } catch (error) {
    problems.push(`FLOW STOPPED: ${error.message}`);
    if (page) {
      try {
        const seen = await page.evaluate(() => ({
          url: location.href,
          text: document.body.innerText.slice(0, 260).replace(/\n+/g, " | "),
          inputs: [...document.querySelectorAll("input")].map((i) => ({ value: i.value, focused: document.activeElement === i })),
        }));
        const st = await page.frames().find((fr) => /youtube(-nocookie)?\.com\/embed\//.test(fr.url()))?.evaluate(() => {
          const v = document.querySelector("video");
          return v ? { t: v.currentTime, paused: v.paused, ad: Boolean(document.querySelector(".ad-showing")) } : null;
        });
        problems.push(`page at the stop: ${JSON.stringify(seen)} player: ${JSON.stringify(st)}`);
        const shot = draftPath(args, id, "flow").replace(/\.json$/, ".png");
        await page.screenshot({ path: shot });
        problems.push(`screenshot: ${shot}`);
      } catch {
        /* the page is gone */
      }
    }
  } finally {
    if (page) lags = await page.evaluate(() => window.__lag ?? []).catch(() => []);
    await browser.close().catch(() => {});
    stopServer();
  }

  const worstLag = lags.length ? Math.max(...lags) : 0;
  if (worstLag >= 400)
    problems.push(`the page's own timers were held up ${lags.length} time(s), up to ${worstLag} ms: a stop asked during such a stall is late or skipped (load on this machine, or a slow device)`);
  const errors = problems.filter((p) => /^(CSP|FLOW|pageerror)/.test(p));
  const warns = [...problems.filter((p) => !/^(CSP|FLOW|pageerror)/.test(p)), ...rows.flatMap((r) => r.flags.map((f) => `s${r.n}: ${f}`))];
  if (captionsSeen)
    warns.push(`the player shows captions while the learner types, so the answer is on screen ("${captionsSeen.slice(0, 50)}..."): the page does not hide them; prefer a video whose captions are off by default, or accept it`);
  if (!finished) errors.push("the finish screen (أنهيت الفيديو) was not reached");
  warns.forEach((w) => console.log(`WARN  ${w}`));
  errors.forEach((e) => console.log(`ERROR ${e}`));
  const endedRows = rows.filter((r) => r.ended);
  endedRows.forEach((r) => console.log(`INFO  s${r.n}: ends with the video (the page took ENDED as the stop)`));
  const over = rows.filter((r) => !r.ended).map((r) => r.overshoot);
  if (over.length)
    console.log(`page stops: ${rows.length}${endedRows.length ? ` (${endedRows.length} ends with the video)` : ""}, overshoot mean ${round2(over.reduce((a, b) => a + b, 0) / over.length)} s, min ${round2(Math.min(...over))}, max ${round2(Math.max(...over))}`);
  // A run in which the page itself was starved for 1.5 s or more proves nothing about the lesson: say so, do not blame it.
  const stalled = worstLag >= 1500;
  const verdict = errors.length ? (stalled ? "INCONCLUSIVE" : "FAIL") : "PASS";
  if (verdict === "INCONCLUSIVE") console.log("The page stalled for up to " + worstLag + " ms during this run (load on the machine): re-run when it is quiet (close other Chrome and node jobs) before blaming the lesson.");
  console.log(`RESULT ${verdict} (${errors.length} errors, ${warns.length} warnings)`);
  writeJson(draftPath(args, id, "flow"), { id, result: verdict, at: new Date().toISOString(), errors, warns, rows, finished, lags });
  if (errors.length) process.exitCode = 1;
}
