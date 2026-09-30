import assert from "node:assert/strict";
import test from "node:test";

import {
  WordAudioPreloader,
  type SentenceWordsResponse,
  type WordAudioPreloaderDeps,
} from "@/lib/voice/word-audio-preloader";

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

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
  lookups: { sentenceId: string; generate: boolean }[];
  clipRequests: string[];
  revoked: string[];
}

interface HarnessOptions {
  /** Answers for fetchSentenceWords; defaults to "every word has a clip". */
  respond?: (
    request: { sentenceId: string; voiceId: string },
    options: { generate: boolean },
  ) => Promise<SentenceWordsResponse | null>;
  /** Controls when each clip download finishes; defaults to immediately. */
  fetchClip?: (url: string) => Promise<Blob | null>;
  settleTimeoutMs?: number;
  /** Every content id the fake server knows a clip for, keyed by sentence. */
  clipsFor?: (sentenceId: string) => string[];
}

function makeHarness(options: HarnessOptions = {}): Harness {
  const cache = new Map<string, string>();
  const lookups: Harness["lookups"] = [];
  const clipRequests: string[] = [];
  const revoked: string[] = [];
  let blobCounter = 0;

  const deps: WordAudioPreloaderDeps = {
    fetchSentenceWords: async (request, { generate }) => {
      lookups.push({ sentenceId: request.sentenceId, generate });
      if (options.respond) return options.respond(request, { generate });
      const ids = options.clipsFor?.(request.sentenceId) ?? [];
      return { urls: Object.fromEntries(ids.map((id) => [id, clipUrl(id)])), missing: [] };
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
    settleTimeoutMs: options.settleTimeoutMs ?? 200,
  };
  return { preloader: new WordAudioPreloader(deps), cache, lookups, clipRequests, revoked };
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
  await flush();

  for (const id of [...s1, ...s2]) {
    assert.ok(h.cache.has(id), `${id} URL is known`);
    assert.match(
      h.preloader.getPlayableUrl(h.cache.get(id)!),
      /^blob:test\//,
      `${id} is in memory`,
    );
  }
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
  await flush();

  // Four slots: they went to whatever was ready first (the next sentence's clips)...
  assert.deepEqual(h.clipRequests, s2.slice(0, 4).map(clipUrl));

  // ...but as slots free up, the current sentence jumps the queue ahead of the next sentence's two waiting clips.
  for (const id of s2.slice(0, 4)) releases[clipUrl(id)]!();
  await flush();
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
  await flush();
  assert.deepEqual(
    h.lookups.map((lookup) => lookup.sentenceId),
    ["s1", "s2"],
  );

  // The learner reaches sentence 2: it was already loaded, sentence 3 starts.
  h.preloader.setWindow([
    { sentenceId: "s2", text: "a2", voiceId: "v", priority: "now" },
    { sentenceId: "s3", text: "a3", voiceId: "v", priority: "next" },
  ]);
  await flush();
  await flush();
  assert.deepEqual(
    h.lookups.map((lookup) => lookup.sentenceId),
    ["s1", "s2", "s3"],
    "sentence 2 was not looked up a second time",
  );
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
  await flush();

  assert.equal(h.lookups.length, 0, "no request for a sentence whose words are all known");
  assert.deepEqual(h.clipRequests.sort(), [
    "https://clips.test/she.mp3",
    "https://clips.test/went.mp3",
  ]);
});

test("setWindow: a word the lookup couldn't find is generated in one follow-up request and then downloaded", async () => {
  const h = makeHarness({
    respond: async (_request, { generate }): Promise<SentenceWordsResponse> =>
      generate
        ? { urls: { "s1::went": clipUrl("s1::went") }, missing: [] }
        : { urls: { "s1::she": clipUrl("s1::she") }, missing: ["s1::went"] },
  });
  h.preloader.setWindow([{ sentenceId: "s1", text: "She went", voiceId: "v", priority: "now" }]);
  await flush();
  await flush();
  await flush();

  assert.deepEqual(
    h.lookups.map((lookup) => lookup.generate),
    [false, true],
  );
  assert.ok(h.cache.has("s1::went"));
  assert.match(h.preloader.getPlayableUrl(clipUrl("s1::went")), /^blob:/);
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
  await flush();
  assert.deepEqual(h.clipRequests, [clipUrl("s2::b")]);
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
});

test("ensureWord: a click on a sentence nobody preloaded starts its own load and waits for it", async () => {
  const h = makeHarness({ clipsFor: () => ["s9::go"] });
  const status = await h.preloader.ensureWord(
    { sentenceId: "s9", text: "Go", voiceId: "v" },
    "s9::go",
  );
  assert.equal(status, "ready");
});

test("ensureWord: 'missing' when the server answered but has no clip; 'unreachable' when it never answered", async () => {
  const answered = makeHarness({ respond: async () => ({ urls: {}, missing: ["s1::go"] }) });
  assert.equal(
    await answered.preloader.ensureWord({ sentenceId: "s1", text: "Go", voiceId: "v" }, "s1::go"),
    "missing",
  );

  const failing = makeHarness({
    respond: async () => {
      throw new Error("network down");
    },
  });
  assert.equal(
    await failing.preloader.ensureWord({ sentenceId: "s1", text: "Go", voiceId: "v" }, "s1::go"),
    "unreachable",
  );

  const silent = makeHarness({ respond: () => new Promise(() => {}), settleTimeoutMs: 30 });
  assert.equal(
    await silent.preloader.ensureWord({ sentenceId: "s1", text: "Go", voiceId: "v" }, "s1::go"),
    "unreachable",
  );
});

test("a failed request forgets the sentence, so asking again retries instead of staying broken", async () => {
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
    respond: async (request) => ({
      urls: { [`${request.sentenceId}::the`]: shared },
      missing: [],
    }),
  });
  h.preloader.setWindow([
    { sentenceId: "s1", text: "The", voiceId: "v", priority: "now" },
    { sentenceId: "s2", text: "The", voiceId: "v", priority: "next" },
  ]);
  await flush();
  await flush();
  assert.deepEqual(h.clipRequests, [shared]);
});

test("dispose: every in-memory clip is released", async () => {
  const h = makeHarness({ clipsFor: () => ["s1::a", "s1::b"] });
  h.preloader.setWindow([{ sentenceId: "s1", text: "a b", voiceId: "v", priority: "now" }]);
  await flush();
  await flush();
  h.preloader.dispose();
  assert.equal(h.revoked.length, 2);
});
