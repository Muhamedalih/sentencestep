// Run with `npm run test:security`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { readBodyCapped } from "./read-body";

function post(body: string | ReadableStream<Uint8Array>, headers: Record<string, string> = {}) {
  return new Request("https://example.test/x", {
    method: "POST",
    body,
    headers,
    // @ts-expect-error Node's fetch needs this to send a stream body
    duplex: "half",
  });
}

test("readBodyCapped: a body within the cap is returned whole", async () => {
  assert.equal(await readBodyCapped(post("hello"), 100), "hello");
});

test("readBodyCapped: an empty body is an empty string", async () => {
  assert.equal(
    await readBodyCapped(new Request("https://example.test/x", { method: "POST" }), 10),
    "",
  );
});

test("readBodyCapped: a body over the cap is refused", async () => {
  assert.equal(await readBodyCapped(post("x".repeat(101)), 100), null);
});

test("readBodyCapped: a chunked body with no length is still stopped at the cap", async () => {
  let sent = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      sent += 1;
      controller.enqueue(new TextEncoder().encode("y".repeat(40)));
      if (sent > 1000) controller.close();
    },
  });
  assert.equal(await readBodyCapped(post(stream), 100), null);
  // It stopped reading long before the stream's end.
  assert.ok(sent < 20, `read ${sent} chunks`);
});

test("readBodyCapped: a declared length over the cap is refused before reading", async () => {
  assert.equal(await readBodyCapped(post("tiny", { "content-length": "999999" }), 100), null);
});

test("readBodyCapped: multi-byte text survives the chunking", async () => {
  assert.equal(await readBodyCapped(post("مرحبا بالعالم"), 100), "مرحبا بالعالم");
});
