import assert from "node:assert/strict";
import test from "node:test";

import {
  WordAudioPreloader,
  type SentenceWordsResponse,
  type WordAudioPreloaderDeps,
} from "@/lib/voice/word-audio-preloader";

const flush = async () => {
  for (let i = 0; i < 4; i++) await new Promise<void>((resolve) => setImmediate(resolve));
};

/** A promise the test settles by hand. */
function gate<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

/** The word clip URL the fake server hands out for a content id. */
const clipUrl = (contentId: string) => `https://clips.test/${contentId.replace("::", "/")}.mp3`;

interface Harness {
  preloader: WordAudioPreloader;
  /** Shared resolved-audio cache, as the provider's ref would hold it. */
  cache: Map<string, string>;
  lookups: string[];
  /** Every word the server was asked to make, in order. */
  generated: string[];
  clipRequests: string[];
  revoked: string[];
  peakGenerations: () => number;
  clock: { now: number };
}

interface HarnessOptions {
  /** Answers for the cache-only lookup; defaults to "these content ids have clips". */
  respond?: (request: {
    sentenceId: string;
    voiceId: string;
  }) => Promise<SentenceWordsResponse | null>;
  /** Makes one word; defaults to a clip for every word. */
  generate?: (request: {
    sentenceId: string;
    voiceId: string;
    key: string;
  }) => Promise<string | null>;
  /** Controls when each clip download finishes; defaults to immediately. */
  fetchClip?: (url: string) => Promise<Blob | null>;
  settleTimeoutMs?: number;
  /** Content ids the fake server already has a clip for, keyed by sentence. */
  clipsFor?: (sentenceId: string) => string[];
}

function makeHarness(options: HarnessOptions = {}): Harness {
  const cache = new Map<string, string>();
  const lookups: string[] = [];
  const generated: string[] = [];
  const clipRequests: string[] = [];
  const revoked: string[] = [];
  const clock = { now: 1_000_000 };
  let blobCounter = 0;
  let activeGenerations = 0;
  let peak = 0;

  const deps: WordAudioPreloaderDeps = {
    fetchSentenceWords: async (request) => {
      lookups.push(request.sentenceId);
      if (options.respond) return options.respond(request);
      const ids = options.clipsFor?.(request.sentenceId) ?? [];
      return { urls: Object.fromEntries(ids.map((id) => [id, clipUrl(id)])), missing: [] };
    },
    generateWord: async (request) => {
      generated.push(`${request.sentenceId}::${request.key}`);
      activeGenerations += 1;
      peak = Math.max(peak, activeGenerations);
      try {
        return options.generate
          ? await options.generate(request)
          : clipUrl(`${request.sentenceId}::${request.key}`);
      } finally {
        activeGenerations -= 1;
      }
    },
    fetchClip: async (url) => {
      clipRequests.push(url);
      return options.fetchClip ? options.fetchClip(url) : new Blob([url]);
    },
    createObjectUrl: () => `blob:test/${++blobCounter}`,
    revokeObjectUrl: (url) => {
      revoked.push(url);
    },
    onWordUrl: (contentId, url) => {
      cache.set(contentId, url);
    },
    getWordUrl: (contentId) => cache.get(contentId),
    settleTimeoutMs: options.settleTimeoutMs ?? 300,
  };
  return {
    preloader: new WordAudioPreloader(deps, () => clock.now),
    cache,
    lookups,
    generated,
    clipRequests,
    revoked,
    peakGenerations: () => peak,
    clock,
  };
}

/** The content ids of a sentence's words — same as sentenceWordEntries would derive. */
const idsFor = (sentenceId: string, words: string[]) => words.map((w) => `${sentenceId}::${w}`);

test("setWindow: the current sentence's words become playable from memory, and the next sentence's too", async () => {
  const s1 = idsFor("s1", ["she", "went", "home"]);
  const s2 = idsFor("s2", ["he", "slept"]);
  const h = makeHarness({ clipsFor: (id) => (id === "s1" ? s1 : s2) });

  h.preloader.setWindow([
    { sentenceId: "s1", text: "She went home.", voiceId: "v", priority: "now" },
    { sentenceId: "s2", text: "He slept.", voiceId: "v", priority: "next" },
  ]);
  await flush();

  for (const id of [...s1, ...s2]) {
    assert.ok(h.cache.has(id), `${id} URL is known`);
    assert.match(
      h.preloader.getPlayableUrl(h.cache.get(id)!),
      /^blob:test\//,
      `${id} is in memory`,
    );
  }
  assert.deepEqual(h.generated, [], "nothing was made — every word already had a clip");
});

test("setWindow: when clips compete for the download slots, the current sentence's go ahead of the next sentence's waiting ones", async () => {
  const words1 = ["one", "two", "three", "four", "five", "six"];
  const words2 = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta"];
  const s1 = idsFor("s1", words1);
  const s2 = idsFor("s2", words2);
  const releases: Record<string, () => void> = {};
  // Both lookups answer only once both were asked, the NEXT sentence's first — so its clips
  // reach the queue before the current sentence's do, and only rank can put them behind.
  const bothAsked = gate();
  let asked = 0;
  const h = makeHarness({
    respond: async (request) => {
      asked += 1;
      if (asked === 2) bothAsked.resolve();
      await bothAsked.promise;
      const ids = request.sentenceId === "s1" ? s1 : s2;
      return { urls: Object.fromEntries(ids.map((id) => [id, clipUrl(id)])), missing: [] };
    },
    fetchClip: (url) => {
      const held = gate<Blob | null>();
      releases[url] = () => held.resolve(new Blob([url]));
      return held.promise;
    },
  });

  h.preloader.setWindow([
    { sentenceId: "s2", text: words2.join(" "), voiceId: "v", priority: "next" },
    { sentenceId: "s1", text: words1.join(" "), voiceId: "v", priority: "now" },
  ]);
  await flush();

  // Four slots: they went to whatever was ready first (the next sentence's clips)...
  assert.deepEqual(h.clipRequests, s2.slice(0, 4).map(clipUrl));

  // ...but as slots free up, the current sentence jumps the queue ahead of the next sentence's two waiting clips.
  for (const id of s2.slice(0, 4)) releases[clipUrl(id)]!();
  await flush();
  assert.deepEqual(h.clipRequests.slice(4), s1.slice(0, 4).map(clipUrl));
});

test("setWindow: moving to the next sentence promotes it and starts the one after; nothing is fetched twice", async () => {
  const ids = {
    s1: idsFor("s1", ["a1"]),
    s2: idsFor("s2", ["a2"]),
    s3: idsFor("s3", ["a3"]),
  };
  const h = makeHarness({ clipsFor: (id) => ids[id as keyof typeof ids] });

  h.preloader.setWindow([
    { sentenceId: "s1", text: "a1", voiceId: "v", priority: "now" },
    { sentenceId: "s2", text: "a2", voiceId: "v", priority: "next" },
  ]);
  await flush();
  assert.deepEqual(h.lookups, ["s1", "s2"]);

  // The learner reaches sentence 2: it was already loaded, sentence 3 starts.
  h.preloader.setWindow([
    { sentenceId: "s2", text: "a2", voiceId: "v", priority: "now" },
    { sentenceId: "s3", text: "a3", voiceId: "v", priority: "next" },
  ]);
  await flush();
  assert.deepEqual(h.lookups, ["s1", "s2", "s3"], "sentence 2 was not looked up a second time");
  assert.ok(h.cache.has("s3::a3"));
  assert.equal(h.clipRequests.length, 3, "each clip downloaded exactly once");
});

test("setWindow: URLs the page already resolved skip the lookup entirely and go straight to download", async () => {
  const h = makeHarness();
  h.preloader.setWindow([
    {
      sentenceId: "s1",
      text: "She went",
      voiceId: "v",
      priority: "now",
      knownUrls: {
        "s1::she": "https://clips.test/she.mp3",
        "s1::went": "https://clips.test/went.mp3",
      },
    },
  ]);
  await flush();

  assert.equal(h.lookups.length, 0, "no request for a sentence whose words are all known");
  assert.deepEqual(h.clipRequests.sort(), [
    "https://clips.test/she.mp3",
    "https://clips.test/went.mp3",
  ]);
});

test("missing words are made ONE AT A TIME, in reading order — never a burst", async () => {
  const h = makeHarness({
    respond: async () => ({ urls: { "s1::she": clipUrl("s1::she") }, missing: [] }),
    generate: async (request) => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return clipUrl(`${request.sentenceId}::${request.key}`);
    },
  });
  h.preloader.setWindow([
    { sentenceId: "s1", text: "She went home again", voiceId: "v", priority: "now" },
  ]);
  await new Promise((resolve) => setTimeout(resolve, 60));

  assert.deepEqual(h.generated, ["s1::went", "s1::home", "s1::again"]);
  assert.equal(h.peakGenerations(), 1, "one synthesis in flight at a time");
  assert.ok(h.cache.has("s1::again"));
  assert.match(h.preloader.getPlayableUrl(clipUrl("s1::went")), /^blob:/);
});

test("missing words of the current sentence are made before the next sentence's", async () => {
  const firstHeld = gate<string | null>();
  const h = makeHarness({
    respond: async () => ({ urls: {}, missing: [] }),
    // The NEXT sentence's first word is already being made when the current sentence's words arrive.
    generate: (request) =>
      request.key === "b1"
        ? firstHeld.promise
        : Promise.resolve(clipUrl(`${request.sentenceId}::${request.key}`)),
  });
  h.preloader.setWindow([{ sentenceId: "s2", text: "b1 b2", voiceId: "v", priority: "next" }]);
  await flush();
  h.preloader.setWindow([
    { sentenceId: "s1", text: "a1 a2", voiceId: "v", priority: "now" },
    { sentenceId: "s2", text: "b1 b2", voiceId: "v", priority: "next" },
  ]);
  await flush();
  firstHeld.resolve(clipUrl("s2::b1"));
  await flush();

  assert.deepEqual(h.generated, ["s2::b1", "s1::a1", "s1::a2", "s2::b2"]);
});

test("a tap on a missing word jumps ahead of the background queue and joins its own generation", async () => {
  const held = gate<string | null>();
  const h = makeHarness({
    respond: async () => ({ urls: {}, missing: [] }),
    generate: (request) =>
      request.key === "first" ? held.promise : Promise.resolve(clipUrl(`s1::${request.key}`)),
    settleTimeoutMs: 2_000,
  });
  h.preloader.setWindow([
    { sentenceId: "s1", text: "first second third", voiceId: "v", priority: "now" },
  ]);
  await flush();
  assert.deepEqual(h.generated, ["s1::first"], "the background is busy with the first word");

  const tap = h.preloader.ensureWord(
    { sentenceId: "s1", text: "first second third", voiceId: "v" },
    "s1::third",
  );
  held.resolve(clipUrl("s1::first"));
  assert.equal(await tap, "ready");
  assert.deepEqual(
    h.generated.slice(0, 2),
    ["s1::first", "s1::third"],
    "the tapped word was made next, not last",
  );
});

test("a failed word is not a dead end: the next tap tries again, and only background work pauses", async () => {
  let attempts = 0;
  const h = makeHarness({
    respond: async () => ({ urls: {}, missing: [] }),
    generate: async () => {
      attempts += 1;
      return attempts <= 2 ? null : clipUrl("s1::go");
    },
  });
  const request = { sentenceId: "s1", text: "Go", voiceId: "v" };
  h.preloader.setWindow([{ ...request, priority: "now" }]);
  await flush();
  assert.equal(attempts, 1, "the background tried once");

  assert.equal(
    await h.preloader.ensureWord(request, "s1::go"),
    "missing",
    "the server has none yet",
  );
  assert.equal(
    await h.preloader.ensureWord(request, "s1::go"),
    "ready",
    "asked again, it was made",
  );
});

test("ensureWord: 'unreachable' when the server never answered, 'missing' when it answered without a clip", async () => {
  const failingLookup = makeHarness({
    respond: async () => {
      throw new Error("network down");
    },
  });
  assert.equal(
    await failingLookup.preloader.ensureWord(
      { sentenceId: "s1", text: "Go", voiceId: "v" },
      "s1::go",
    ),
    "unreachable",
  );

  const failingGenerate = makeHarness({
    respond: async () => ({ urls: {}, missing: [] }),
    generate: async () => {
      throw new Error("502");
    },
  });
  assert.equal(
    await failingGenerate.preloader.ensureWord(
      { sentenceId: "s1", text: "Go", voiceId: "v" },
      "s1::go",
    ),
    "unreachable",
  );

  const noClip = makeHarness({
    respond: async () => ({ urls: {}, missing: [] }),
    generate: async () => null,
  });
  assert.equal(
    await noClip.preloader.ensureWord({ sentenceId: "s1", text: "Go", voiceId: "v" }, "s1::go"),
    "missing",
  );
});

test("ensureWord: a tap that runs out of time gives up as 'missing' (the caller's own fallback speaks) without a second synthesis", async () => {
  const h = makeHarness({
    respond: async () => ({ urls: {}, missing: [] }),
    generate: () => new Promise(() => {}),
    settleTimeoutMs: 30,
  });
  assert.equal(
    await h.preloader.ensureWord({ sentenceId: "s1", text: "Go", voiceId: "v" }, "s1::go"),
    "missing",
  );
});

test("background generation pauses after repeated failures (the server can't synthesize right now) and resumes later", async () => {
  const h = makeHarness({
    respond: async () => ({ urls: {}, missing: [] }),
    generate: async () => null,
  });
  h.preloader.setWindow([
    { sentenceId: "s1", text: "one two three four", voiceId: "v", priority: "now" },
  ]);
  await flush();
  assert.equal(h.generated.length, 2, "gave up on the background after two failures in a row");

  // A new sentence while still paused makes nothing in the background…
  h.preloader.setWindow([{ sentenceId: "s2", text: "five", voiceId: "v", priority: "now" }]);
  await flush();
  assert.equal(h.generated.length, 2);

  // …but a tap always tries…
  await h.preloader.ensureWord({ sentenceId: "s2", text: "five", voiceId: "v" }, "s2::five");
  assert.equal(h.generated.length, 3);

  // …and once the pause is over, the background works again.
  h.clock.now += 61_000;
  h.preloader.setWindow([{ sentenceId: "s3", text: "six", voiceId: "v", priority: "now" }]);
  await flush();
  assert.equal(h.generated.length, 4);
});

test("setWindow: work for a sentence the learner has already left is dropped, not run", async () => {
  const hold = gate<SentenceWordsResponse | null>();
  const h = makeHarness({
    respond: (request) =>
      request.sentenceId === "s1"
        ? hold.promise
        : Promise.resolve({ urls: { "s2::b": clipUrl("s2::b") }, missing: [] }),
  });

  // Resuming mid-lesson: the page asks for sentence 1, then the learner's real position arrives.
  h.preloader.setWindow([{ sentenceId: "s1", text: "a", voiceId: "v", priority: "now" }]);
  await flush();
  h.preloader.setWindow([{ sentenceId: "s2", text: "b", voiceId: "v", priority: "now" }]);
  await flush();

  // Sentence 1's lookup is still in flight, but no clip of it is ever downloaded once it lands.
  hold.resolve({ urls: { "s1::a": clipUrl("s1::a") }, missing: [] });
  await flush();
  assert.deepEqual(h.clipRequests, [clipUrl("s2::b")]);
  assert.deepEqual(h.generated, [], "and nothing was made for the abandoned sentence");
});

test("setWindow: going back to a sentence that went stale resumes its downloads", async () => {
  const hold = gate<SentenceWordsResponse | null>();
  const h = makeHarness({
    respond: (request) =>
      request.sentenceId === "s1"
        ? hold.promise
        : Promise.resolve({ urls: { "s2::b": clipUrl("s2::b") }, missing: [] }),
  });
  const s1 = { sentenceId: "s1", text: "a", voiceId: "v" };
  h.preloader.setWindow([{ ...s1, priority: "now" }]);
  await flush();
  h.preloader.setWindow([{ sentenceId: "s2", text: "b", voiceId: "v", priority: "now" }]);
  await flush();
  hold.resolve({ urls: { "s1::a": clipUrl("s1::a") }, missing: [] });
  await flush();
  assert.ok(!h.clipRequests.includes(clipUrl("s1::a")), "dropped while it was stale");

  h.preloader.setWindow([{ ...s1, priority: "now" }]); // the learner steps back
  await flush();
  assert.ok(h.clipRequests.includes(clipUrl("s1::a")), "resumed once it mattered again");
});

test("ensureWord: resolves 'ready' the moment the in-flight lookup delivers that word", async () => {
  const hold = gate<SentenceWordsResponse | null>();
  const h = makeHarness({ respond: () => hold.promise });
  h.preloader.setWindow([{ sentenceId: "s1", text: "She went", voiceId: "v", priority: "next" }]);
  await flush();

  const pending = h.preloader.ensureWord(
    { sentenceId: "s1", text: "She went", voiceId: "v" },
    "s1::went",
  );
  hold.resolve({
    urls: { "s1::she": clipUrl("s1::she"), "s1::went": clipUrl("s1::went") },
    missing: [],
  });
  assert.equal(await pending, "ready");
  assert.equal(h.lookups.length, 1, "joined the request already in flight");
  assert.deepEqual(h.generated, []);
});

test("ensureWord: a tap on a sentence nobody preloaded starts its own load and waits for it", async () => {
  const h = makeHarness({ clipsFor: () => ["s9::go"] });
  const status = await h.preloader.ensureWord(
    { sentenceId: "s9", text: "Go", voiceId: "v" },
    "s9::go",
  );
  assert.equal(status, "ready");
});

test("a failed lookup forgets the sentence, so asking again retries instead of staying broken", async () => {
  let calls = 0;
  const h = makeHarness({
    respond: async () => {
      calls += 1;
      if (calls === 1) throw new Error("blip");
      return { urls: { "s1::go": clipUrl("s1::go") }, missing: [] };
    },
  });
  const request = { sentenceId: "s1", text: "Go", voiceId: "v" };
  assert.equal(await h.preloader.ensureWord(request, "s1::go"), "unreachable");
  assert.equal(await h.preloader.ensureWord(request, "s1::go"), "ready");
});

test("getPlayableUrl: the network URL until the clip is downloaded, and always the network URL if the download failed", async () => {
  const go = gate<Blob | null>();
  const h = makeHarness({
    clipsFor: () => ["s1::go", "s1::stop"],
    fetchClip: (url) => (url.endsWith("go.mp3") ? go.promise : Promise.resolve(null)),
  });
  h.preloader.setWindow([{ sentenceId: "s1", text: "Go stop", voiceId: "v", priority: "now" }]);
  await flush();

  assert.equal(
    h.preloader.getPlayableUrl(clipUrl("s1::go")),
    clipUrl("s1::go"),
    "still downloading",
  );
  assert.equal(
    h.preloader.getPlayableUrl(clipUrl("s1::stop")),
    clipUrl("s1::stop"),
    "download failed",
  );

  go.resolve(new Blob(["go"]));
  await flush();
  assert.match(h.preloader.getPlayableUrl(clipUrl("s1::go")), /^blob:test\//);
});

test("the same clip shared by two sentences is downloaded once", async () => {
  const shared = "https://clips.test/the.mp3";
  const h = makeHarness({
    respond: async (request) => ({ urls: { [`${request.sentenceId}::the`]: shared }, missing: [] }),
  });
  h.preloader.setWindow([
    { sentenceId: "s1", text: "The", voiceId: "v", priority: "now" },
    { sentenceId: "s2", text: "The", voiceId: "v", priority: "next" },
  ]);
  await flush();
  assert.deepEqual(h.clipRequests, [shared]);
});

test("dispose: every in-memory clip is released", async () => {
  const h = makeHarness({ clipsFor: () => ["s1::a", "s1::b"] });
  h.preloader.setWindow([{ sentenceId: "s1", text: "a b", voiceId: "v", priority: "now" }]);
  await flush();
  h.preloader.dispose();
  assert.equal(h.revoked.length, 2);
});
