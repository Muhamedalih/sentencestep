// Exercises the Azure adapter's request shape and error handling against a
// stubbed global.fetch — no real network call, no real API key. Mirrors
// ./elevenlabs.test.ts's exact stubbing pattern. Run with `npm run test:voice`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { createAzureProvider } from "./azure";

function stubFetch(handler: typeof fetch): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = handler;
  return () => {
    globalThis.fetch = original;
  };
}

const SSML =
  '<speak version="1.0" xml:lang="en-US"><voice name="en-US-AriaNeural">Hi there.</voice></speak>';

test("synthesize: posts SSML to the region-specific Azure endpoint with the subscription key header", async () => {
  let capturedUrl: string | undefined;
  let capturedInit: RequestInit | undefined;

  const restore = stubFetch(async (url, init) => {
    capturedUrl = String(url);
    capturedInit = init;
    return new Response(new Uint8Array([1, 2, 3]), { status: 200 });
  });

  try {
    const provider = createAzureProvider("secret-key-123", "eastus");
    const result = await provider.synthesize({
      text: SSML,
      voiceId: "en-US-AriaNeural",
      model: "azure-neural",
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0.3,
        speed: 1.0,
        useSpeakerBoost: true,
      },
    });

    assert.equal(capturedUrl, "https://eastus.tts.speech.microsoft.com/cognitiveservices/v1");
    assert.equal(capturedInit?.method, "POST");
    const headers = capturedInit?.headers as Record<string, string>;
    assert.equal(headers["Ocp-Apim-Subscription-Key"], "secret-key-123");
    assert.equal(headers["Content-Type"], "application/ssml+xml");
    assert.equal(capturedInit?.body, SSML);

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
    const provider = createAzureProvider("secret-key-123", "eastus");
    await assert.rejects(
      () =>
        provider.synthesize({
          text: SSML,
          voiceId: "en-US-AriaNeural",
          model: "azure-neural",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.3,
            speed: 1.0,
            useSpeakerBoost: true,
          },
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
    const provider = createAzureProvider("secret-key-123", "eastus");
    await assert.rejects(
      () =>
        provider.synthesize({
          text: SSML,
          voiceId: "en-US-AriaNeural",
          model: "azure-neural",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.3,
            speed: 1.0,
            useSpeakerBoost: true,
          },
        }),
      /rate limit|quota/i,
    );
  } finally {
    restore();
  }
});
