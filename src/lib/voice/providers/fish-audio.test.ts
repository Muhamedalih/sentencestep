// Exercises the Fish Audio adapter's request shape, error handling and
// library parsing against a stubbed global.fetch — no real network call, no
// real API key. Same stubbing pattern as elevenlabs.test.ts.
// Run with `npm run test:voice`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  createFishAudioProvider,
  fishVoiceAccent,
  fishVoiceGender,
  listFishAudioVoices,
} from "./fish-audio";

function stubFetch(handler: typeof fetch): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = handler;
  return () => {
    globalThis.fetch = original;
  };
}

const SETTINGS = {
  stability: 0.5,
  similarityBoost: 0.75,
  style: 0,
  speed: 1,
  useSpeakerBoost: true,
};

test("synthesize: posts to /v1/tts with the bearer key, the free model header and the approved mp3 settings", async () => {
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;
  const restore = stubFetch(async (url, init) => {
    capturedUrl = String(url);
    capturedInit = init;
    return new Response(new Uint8Array([1, 2, 3]), { status: 200 });
  });

  try {
    const result = await createFishAudioProvider("secret-key").synthesize({
      text: "apple",
      voiceId: "voice-abc12345",
      model: "s2.1-pro-free",
      voiceSettings: SETTINGS,
    });

    assert.equal(capturedUrl, "https://api.fish.audio/v1/tts");
    assert.equal(capturedInit?.method, "POST");
    const headers = capturedInit?.headers as Record<string, string>;
    assert.equal(headers.Authorization, "Bearer secret-key");
    assert.equal(headers.model, "s2.1-pro-free");
    assert.deepEqual(JSON.parse(String(capturedInit?.body)), {
      text: "apple",
      format: "mp3",
      mp3_bitrate: 128,
      reference_id: "voice-abc12345",
    });
    assert.deepEqual([...result.audio], [1, 2, 3]);
    assert.equal(result.durationMs, null);
  } finally {
    restore();
  }
});

test("synthesize: an empty voice id falls back to Fish's default voice (no reference_id sent)", async () => {
  let body: Record<string, unknown> = {};
  const restore = stubFetch(async (_url, init) => {
    body = JSON.parse(String(init?.body));
    return new Response(new Uint8Array([9]), { status: 200 });
  });
  try {
    await createFishAudioProvider("k").synthesize({
      text: "through",
      voiceId: "",
      model: "s2.1-pro-free",
      voiceSettings: SETTINGS,
    });
    assert.equal("reference_id" in body, false);
  } finally {
    restore();
  }
});

test("synthesize: maps 401, 402, 429 and 503 to clear errors that never include the key", async () => {
  for (const [status, expected] of [
    [401, /rejected the API key/],
    [402, /paid balance/],
    [429, /rate limit/],
    [503, /overloaded/],
  ] as const) {
    const restore = stubFetch(async () => new Response("nope", { status }));
    try {
      await assert.rejects(
        createFishAudioProvider("super-secret").synthesize({
          text: "x",
          voiceId: "v",
          model: "s2.1-pro-free",
          voiceSettings: SETTINGS,
        }),
        (err: Error) => expected.test(err.message) && !err.message.includes("super-secret"),
      );
    } finally {
      restore();
    }
  }
});

test("synthesize: an empty 200 body is an error, not a silent empty clip", async () => {
  const restore = stubFetch(async () => new Response(new Uint8Array([]), { status: 200 }));
  try {
    await assert.rejects(
      createFishAudioProvider("k").synthesize({
        text: "x",
        voiceId: "v",
        model: "s2.1-pro-free",
        voiceSettings: SETTINGS,
      }),
      /no audio data/,
    );
  } finally {
    restore();
  }
});

test("listFishAudioVoices: asks for English public voices in the requested order and keeps only usable ones", async () => {
  let capturedUrl = "";
  const restore = stubFetch(async (url) => {
    capturedUrl = String(url);
    return new Response(
      JSON.stringify({
        has_more: true,
        items: [
          {
            _id: "good1234",
            title: " Paula ",
            description: "Clear and friendly",
            tags: ["female", "educational", "Indian Accent"],
            state: "trained",
            visibility: "public",
            like_count: 5,
            task_count: 1200,
            author: { nickname: "someone" },
            samples: [{ audio: "https://platform.r2.fish.audio/task/x.mp3" }],
          },
          { _id: "private1", title: "Hidden", state: "trained", visibility: "private" },
          { _id: "untrained", title: "Draft", state: "created", visibility: "public" },
          {
            _id: "dmca1234",
            title: "Removed",
            state: "trained",
            visibility: "public",
            dmca_taken_down: true,
          },
        ],
      }),
      { status: 200 },
    );
  });

  try {
    const { voices, hasMore } = await listFishAudioVoices("k", {
      query: "paula",
      tags: ["female", "bad;tag"],
      sort: "task_count",
      page: 2,
    });
    const url = new URL(capturedUrl);
    assert.equal(url.origin + url.pathname, "https://api.fish.audio/model");
    assert.equal(url.searchParams.get("language"), "en");
    assert.equal(url.searchParams.get("sort_by"), "task_count");
    assert.equal(url.searchParams.get("page_number"), "2");
    assert.equal(url.searchParams.get("title"), "paula");
    assert.equal(url.searchParams.get("self"), "false");
    assert.deepEqual(url.searchParams.getAll("tag"), ["female"]); // the unsafe tag is dropped

    assert.equal(hasMore, true);
    assert.equal(voices.length, 1);
    assert.deepEqual(voices[0], {
      id: "good1234",
      name: "Paula",
      description: "Clear and friendly",
      tags: ["female", "educational", "Indian Accent"],
      sampleAudioUrl: "https://platform.r2.fish.audio/task/x.mp3",
      likeCount: 5,
      usageCount: 1200,
      author: "someone",
      gender: "female",
    });
  } finally {
    restore();
  }
});

test("fishVoiceGender / fishVoiceAccent read the library's tags", () => {
  assert.equal(fishVoiceGender(["Male", "narration"]), "male");
  assert.equal(fishVoiceGender(["female", "male"]), "female");
  assert.equal(fishVoiceGender(["narration"]), null);
  assert.equal(fishVoiceAccent(["female", "Indian Accent"]), "Indian");
  assert.equal(fishVoiceAccent(["british", "calm"]), "British");
  assert.equal(fishVoiceAccent(["female", "calm"]), "Neutral");
});
