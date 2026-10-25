import assert from "node:assert/strict";
import https from "node:https";
import test from "node:test";

import { addBrowserHeaders, createBrowserHeadersAgent } from "@/lib/voice/providers/edge-tts";

function fakeRequest(initial: Record<string, string> = {}) {
  const headers = new Map(
    Object.entries(initial).map(([name, value]) => [name.toLowerCase(), value]),
  );
  return {
    headers,
    hasHeader: (name: string) => headers.has(name.toLowerCase()),
    setHeader(name: string, value: string | number | readonly string[]) {
      headers.set(name.toLowerCase(), String(value));
      return this as never;
    },
  };
}

test("a request without them gets the browser's Accept-Language and Accept-Encoding", () => {
  const request = fakeRequest();
  addBrowserHeaders(request);
  assert.equal(request.headers.get("accept-language"), "en-US,en;q=0.9");
  assert.equal(request.headers.get("accept-encoding"), "gzip, deflate, br, zstd");
});

test("a header the request already carries is left as it is", () => {
  const request = fakeRequest({ "Accept-Language": "ar" });
  addBrowserHeaders(request);
  assert.equal(request.headers.get("accept-language"), "ar");
  assert.equal(request.headers.get("accept-encoding"), "gzip, deflate, br, zstd");
});

test("every request made through the agent carries them before it is sent", () => {
  // Nothing listens on port 9: the request is only built, its headers read, and then dropped.
  const request = https.request({
    agent: createBrowserHeadersAgent(),
    host: "127.0.0.1",
    port: 9,
    path: "/",
    headers: { Origin: "chrome-extension://example" },
  });
  request.on("error", () => {});
  try {
    assert.equal(request.getHeader("accept-language"), "en-US,en;q=0.9");
    assert.equal(request.getHeader("accept-encoding"), "gzip, deflate, br, zstd");
    assert.equal(request.getHeader("origin"), "chrome-extension://example");
  } finally {
    request.destroy();
  }
});
