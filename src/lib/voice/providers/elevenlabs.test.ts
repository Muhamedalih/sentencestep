// Exercises the ElevenLabs adapter's request shape and error handling
// against a stubbed global.fetch — no real network call, no real API key.
// Mirrors src/lib/email/providers/resend.test.ts's exact stubbing pattern.
// Run with `npm run test:voice`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { createElevenLabsProvider } from "./elevenlabs";

function stubFetch(handler: typeof fetch): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = handler;
  return () => {
    globalThis.fetch = original;
  };
}

const VOICE_SETTINGS = {
  stability: 0.5,
  similarityBoost: 0.75,
  style: 0.3,
  speed: 1.0,
  useSpeakerBoost: true,
};

test("synthesize: posts to the ElevenLabs API with the api key header and the exact request shape", async () => {
  let capturedUrl: string | undefined;
  let capturedInit: RequestInit | undefined;

  const restore = stubFetch(async (url, init) => {
    capturedUrl = String(url);
    capturedInit = init;
    return new Response(new Uint8Array([1, 2, 3]), { status: 200 });
  });

  try {
    const provider = createElevenLabsProvider("secret-key-123");
    const result = await provider.synthesize({
      text: "[excited] Hello there!",
      voiceId: "voice-abc",
      model: "eleven_v3",
      voiceSettings: VOICE_SETTINGS,
    });

    assert.ok(capturedUrl?.includes("/text-to-speech/voice-abc"));
    assert.equal(capturedInit?.method, "POST");
    const headers = capturedInit?.headers as Record<string, string>;
    assert.equal(headers["xi-api-key"], "secret-key-123");

    const body = JSON.parse(capturedInit?.body as string);
    assert.equal(body.text, "[excited] Hello there!");
    assert.equal(body.model_id, "eleven_v3");
    assert.deepEqual(body.voice_settings, {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.3,
      speed: 1.0,
      use_speaker_boost: true,
    });

    assert.ok(Buffer.isBuffer(result.audio));
    assert.deepEqual([...result.audio], [1, 2, 3]);
    assert.equal(result.durationMs, null);
  } finally {
    restore();
  }
});

test("synthesize: a 401 response throws a readable, key-free error", async () => {
  const restore = stubFetch(async () => new Response("unauthorized", { status: 401 }));

  try {
    const provider = createElevenLabsProvider("secret-key-123");
    await assert.rejects(
      () =>
        provider.synthesize({
          text: "Hi",
          voiceId: "voice-abc",
          model: "eleven_v3",
          voiceSettings: VOICE_SETTINGS,
        }),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.match(err.message, /401/);
        assert.doesNotMatch(err.message, /secret-key-123/);
        return true;
      },
    );
  } finally {
    restore();
  }
});

test("synthesize: a 429 response throws a rate-limit-specific message", async () => {
  const restore = stubFetch(async () => new Response("too many requests", { status: 429 }));

  try {
    const provider = createElevenLabsProvider("secret-key-123");
    await assert.rejects(
      () =>
        provider.synthesize({
          text: "Hi",
          voiceId: "voice-abc",
          model: "eleven_v3",
          voiceSettings: VOICE_SETTINGS,
        }),
      /rate limit|quota/i,
    );
  } finally {
    restore();
  }
});

test("synthesize: a 400 response echoes a truncated response body, never the key", async () => {
  const restore = stubFetch(async () => new Response("bad voice_settings value", { status: 400 }));

  try {
    const provider = createElevenLabsProvider("secret-key-123");
    await assert.rejects(
      () =>
        provider.synthesize({
          text: "Hi",
          voiceId: "voice-abc",
          model: "eleven_v3",
          voiceSettings: VOICE_SETTINGS,
        }),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.match(err.message, /bad voice_settings value/);
        assert.doesNotMatch(err.message, /secret-key-123/);
        return true;
      },
    );
  } finally {
    restore();
  }
});
