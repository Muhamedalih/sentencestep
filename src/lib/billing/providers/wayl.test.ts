// Run with `npm run test:billing`. No network and no real Wayl credentials:
// every request goes through a stubbed fetch, and webhook tests compute the
// same HMAC the adapter verifies.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

import {
  InvalidWebhookSignatureError,
  MalformedWebhookError,
  PaymentProviderError,
} from "@/lib/billing/payment-provider";

import { createWaylProvider, mapWaylStatus } from "./wayl";

const API_KEY = "test-api-key-do-not-leak";
const SECRET = "0123456789abcdef0123456789abcdef";

interface RecordedCall {
  url: string;
  init: RequestInit;
}

function stubFetch(respond: (call: RecordedCall) => Response | Promise<Response>) {
  const calls: RecordedCall[] = [];
  const fetchStub = (async (url: string | URL | Request, init?: RequestInit) => {
    const call = { url: String(url), init: init ?? {} };
    calls.push(call);
    return respond(call);
  }) as typeof fetch;
  return { calls, fetchStub };
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function link(overrides: Record<string, unknown> = {}) {
  return {
    id: "link_123",
    referenceId: "ss_abc",
    total: "3960",
    currency: "IQD",
    status: "Created",
    completedAt: null,
    url: "https://pay.example.com/link_123",
    ...overrides,
  };
}

function providerWith(fetchStub: typeof fetch, environment: "live" | "test" = "test") {
  return createWaylProvider({
    apiKey: API_KEY,
    webhookSecret: SECRET,
    environment,
    fetch: fetchStub,
  });
}

const createInput = {
  referenceId: "ss_abc",
  amount: 3960,
  currency: "IQD",
  description: "SentenceStep Premium (30 days)",
  webhookUrl: "https://sentencestep.example/api/billing/webhook/wayl",
  redirectUrl: "https://sentencestep.example/billing/return",
  expiresIn: "1h",
};

// --- createPayment ---

test("createPayment: posts the documented link body, in IQD, as a test-mode link", async () => {
  const { calls, fetchStub } = stubFetch(() => json(201, { data: link(), message: "ok" }));

  const result = await providerWith(fetchStub).createPayment(createInput);

  assert.equal(result.providerPaymentId, "link_123");
  assert.equal(result.checkoutUrl, "https://pay.example.com/link_123");
  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.url, "https://api.thewayl.com/api/v1/links");
  assert.equal(calls[0]!.init.method, "POST");
  const headers = calls[0]!.init.headers as Record<string, string>;
  assert.equal(headers["X-WAYL-AUTHENTICATION"], API_KEY);
  assert.deepEqual(JSON.parse(calls[0]!.init.body as string), {
    env: "test",
    referenceId: "ss_abc",
    total: 3960,
    currency: "IQD",
    lineItem: [{ label: "SentenceStep Premium (30 days)", amount: 3960, type: "increase" }],
    webhookUrl: createInput.webhookUrl,
    webhookSecret: SECRET,
    redirectionUrl: createInput.redirectUrl,
    linkExpiresIn: "1h",
  });
});

test("createPayment: live and test links use the same server and key, told apart only by env", async () => {
  const { calls, fetchStub } = stubFetch(() => json(201, { data: link() }));

  await providerWith(fetchStub, "live").createPayment(createInput);
  await providerWith(fetchStub, "test").createPayment(createInput);

  assert.equal(calls[0]!.url, "https://api.thewayl.com/api/v1/links");
  assert.equal(calls[1]!.url, "https://api.thewayl.com/api/v1/links");
  assert.equal(JSON.parse(calls[0]!.init.body as string).env, "live");
  assert.equal(JSON.parse(calls[1]!.init.body as string).env, "test");
});

test("createPayment: rejects a created link that does not match what was requested", async () => {
  const mismatches: Record<string, unknown>[] = [
    { total: "1000" },
    { referenceId: "someone-else" },
    { currency: "USD" },
    { id: "" },
    { url: "http://pay.example.com/insecure" },
    { url: "javascript:alert(1)" },
    { url: undefined },
  ];
  for (const override of mismatches) {
    const { fetchStub } = stubFetch(() => json(201, { data: link(override) }));
    await assert.rejects(
      providerWith(fetchStub).createPayment(createInput),
      (error: unknown) => error instanceof PaymentProviderError && error.retryable === false,
      JSON.stringify(override),
    );
  }
});

test("createPayment: a 4xx is a non-retryable error and never leaks the API key", async () => {
  const { fetchStub } = stubFetch(() => json(422, { message: "referenceId already exists" }));

  await assert.rejects(providerWith(fetchStub).createPayment(createInput), (error: unknown) => {
    assert.ok(error instanceof PaymentProviderError);
    assert.equal(error.retryable, false);
    assert.equal(error.status, 422);
    assert.ok(!error.message.includes(API_KEY));
    assert.ok(!error.message.includes(SECRET));
    return true;
  });
});

test("createPayment: secrets echoed back in an error body are redacted, even at the truncation boundary", async () => {
  const echoes = [
    `invalid webhookSecret ${SECRET}`,
    `${"x".repeat(280)}${SECRET}${API_KEY}`,
    `${"x".repeat(295)}${API_KEY}`,
  ];
  for (const body of echoes) {
    const { fetchStub } = stubFetch(() => new Response(body, { status: 422 }));

    await assert.rejects(providerWith(fetchStub).createPayment(createInput), (error: unknown) => {
      assert.ok(error instanceof PaymentProviderError);
      assert.ok(!error.message.includes(SECRET));
      assert.ok(!error.message.includes(API_KEY));
      assert.ok(!error.message.includes(SECRET.slice(0, 12)));
      assert.ok(!error.message.includes(API_KEY.slice(0, 12)));
      return true;
    });
  }
});

test("createPayment: a 5xx or a network failure is retryable", async () => {
  const serverError = stubFetch(() => json(503, { message: "down" }));
  await assert.rejects(
    providerWith(serverError.fetchStub).createPayment(createInput),
    (error: unknown) => error instanceof PaymentProviderError && error.retryable === true,
  );

  const networkFailure = stubFetch(() => {
    throw new Error("socket hang up");
  });
  await assert.rejects(
    providerWith(networkFailure.fetchStub).createPayment(createInput),
    (error: unknown) => error instanceof PaymentProviderError && error.retryable === true,
  );
});

// --- getPayment ---

test("getPayment: reads the link by reference id and maps a completed payment to paid", async () => {
  const { calls, fetchStub } = stubFetch(() =>
    json(200, { data: link({ status: "Complete", completedAt: "2026-10-04T10:00:00.000Z" }) }),
  );

  const payment = await providerWith(fetchStub).getPayment("ss_abc");

  assert.equal(calls[0]!.url, "https://api.thewayl.com/api/v1/links/ss_abc");
  assert.equal(calls[0]!.init.method, "GET");
  assert.deepEqual(payment, {
    referenceId: "ss_abc",
    providerPaymentId: "link_123",
    status: "paid",
    rawStatus: "Complete",
    amount: 3960,
    currency: "IQD",
    paidAt: "2026-10-04T10:00:00.000Z",
  });
});

test("getPayment: url-encodes the reference id", async () => {
  const { calls, fetchStub } = stubFetch(() => json(200, { data: link() }));

  await providerWith(fetchStub).getPayment("a/b?c");

  assert.ok(calls[0]!.url.endsWith("/api/v1/links/a%2Fb%3Fc"));
});

test("getPayment: a 404 means the provider has no such payment", async () => {
  const { fetchStub } = stubFetch(() => json(404, { message: "not found" }));
  assert.equal(await providerWith(fetchStub).getPayment("ss_missing"), null);
});

test("getPayment: other failures throw, retryable only for outages", async () => {
  const outage = stubFetch(() => json(502, {}));
  await assert.rejects(
    providerWith(outage.fetchStub).getPayment("ss_abc"),
    (error: unknown) => error instanceof PaymentProviderError && error.retryable,
  );
  const forbidden = stubFetch(() => json(403, {}));
  await assert.rejects(
    providerWith(forbidden.fetchStub).getPayment("ss_abc"),
    (error: unknown) => error instanceof PaymentProviderError && !error.retryable,
  );
});

test("getPayment: a link in an unexpected shape is an error, never a guess", async () => {
  for (const data of [{}, link({ total: null }), link({ total: "abc" }), link({ status: 5 })]) {
    const { fetchStub } = stubFetch(() => json(200, { data }));
    await assert.rejects(
      providerWith(fetchStub).getPayment("ss_abc"),
      (error: unknown) => error instanceof PaymentProviderError && !error.retryable,
    );
  }
});

test("getPayment: a paid status with no usable completion time still reports paidAt as null", async () => {
  const { fetchStub } = stubFetch(() =>
    json(200, { data: link({ status: "Complete", completedAt: "not a date" }) }),
  );
  const payment = await providerWith(fetchStub).getPayment("ss_abc");
  assert.equal(payment?.status, "paid");
  assert.equal(payment?.paidAt, null);
});

test("mapWaylStatus: maps every documented status and treats anything else as unknown", () => {
  assert.equal(mapWaylStatus("Created"), "created");
  assert.equal(mapWaylStatus("Pending"), "pending");
  assert.equal(mapWaylStatus("Processing"), "processing");
  assert.equal(mapWaylStatus("Complete"), "paid");
  assert.equal(mapWaylStatus("Delivered"), "paid");
  assert.equal(mapWaylStatus("Cancelled"), "cancelled");
  assert.equal(mapWaylStatus("Rejected"), "failed");
  assert.equal(mapWaylStatus("Returned"), "refunded");
  assert.equal(mapWaylStatus("complete"), "paid");
  assert.equal(mapWaylStatus("SomethingNew"), "unknown");
  assert.equal(mapWaylStatus(""), "unknown");
});

// --- getPayments (batch) ---

test("getPayments: looks up many references in one batch call", async () => {
  const { calls, fetchStub } = stubFetch(() =>
    json(200, { data: [link({ referenceId: "ss_1" }), link({ referenceId: "ss_2" })] }),
  );

  const payments = await providerWith(fetchStub).getPayments(["ss_1", "ss_2", "ss_3"]);

  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.url, "https://api.thewayl.com/api/v1/links/batch");
  assert.deepEqual(JSON.parse(calls[0]!.init.body as string), {
    referenceIds: ["ss_1", "ss_2", "ss_3"],
  });
  assert.deepEqual(
    payments.map((payment) => payment.referenceId),
    ["ss_1", "ss_2"],
  );
});

test("getPayments: splits more than 100 references across calls", async () => {
  const { calls, fetchStub } = stubFetch(() => json(200, { data: [] }));
  const references = Array.from({ length: 101 }, (_, index) => `ss_${index}`);

  await providerWith(fetchStub).getPayments(references);

  assert.equal(calls.length, 2);
  assert.equal(JSON.parse(calls[0]!.init.body as string).referenceIds.length, 100);
  assert.equal(JSON.parse(calls[1]!.init.body as string).referenceIds.length, 1);
});

test("getPayments: an empty list makes no request", async () => {
  const { calls, fetchStub } = stubFetch(() => json(200, { data: [] }));
  assert.deepEqual(await providerWith(fetchStub).getPayments([]), []);
  assert.equal(calls.length, 0);
});

test("getPayments: a response without a list is an error", async () => {
  const { fetchStub } = stubFetch(() => json(200, { data: { not: "a list" } }));
  await assert.rejects(providerWith(fetchStub).getPayments(["ss_1"]), PaymentProviderError);
});

// --- verifyWebhook ---

function signHex(body: Uint8Array | string, secret = SECRET): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

function headersOf(entries: Record<string, string>) {
  return {
    get(name: string): string | null {
      return entries[name.toLowerCase()] ?? null;
    },
  };
}

const webhookBody = JSON.stringify({ id: "evt_1", referenceId: "ss_abc", status: "Complete" });

function verify(body: string | Uint8Array, signature: string | null) {
  const provider = providerWith(stubFetch(() => json(200, {})).fetchStub);
  const bytes = typeof body === "string" ? Buffer.from(body) : body;
  return provider.verifyWebhook(
    bytes,
    headersOf(signature === null ? {} : { "x-wayl-signature-256": signature }),
  );
}

test("verifyWebhook: a correctly signed body is accepted and parsed", () => {
  const verified = verify(webhookBody, signHex(webhookBody));

  assert.equal(verified.referenceId, "ss_abc");
  assert.equal(verified.eventType, "Complete");
  assert.equal(verified.eventId, "evt_1:Complete");
});

test("verifyWebhook: accepts a base64 digest, a sha256= prefix, and uppercase hex", () => {
  const digest = createHmac("sha256", SECRET).update(webhookBody).digest();
  assert.equal(verify(webhookBody, digest.toString("base64")).referenceId, "ss_abc");
  assert.equal(verify(webhookBody, `sha256=${digest.toString("hex")}`).referenceId, "ss_abc");
  assert.equal(verify(webhookBody, digest.toString("hex").toUpperCase()).referenceId, "ss_abc");
});

test("verifyWebhook: a missing signature header is rejected", () => {
  assert.throws(() => verify(webhookBody, null), InvalidWebhookSignatureError);
});

test("verifyWebhook: a body changed after signing is rejected, even by one byte of whitespace", () => {
  const signature = signHex(webhookBody);
  assert.throws(
    () => verify(webhookBody.replace("Complete", "Created"), signature),
    InvalidWebhookSignatureError,
  );
  assert.throws(() => verify(`${webhookBody}\n`, signature), InvalidWebhookSignatureError);
  assert.throws(
    () => verify(JSON.stringify(JSON.parse(webhookBody), null, 2), signature),
    InvalidWebhookSignatureError,
  );
});

test("verifyWebhook: a signature made with a different secret is rejected", () => {
  assert.throws(
    () => verify(webhookBody, signHex(webhookBody, "another-secret-another-secret")),
    InvalidWebhookSignatureError,
  );
});

test("verifyWebhook: signatures of the wrong length are rejected without crashing", () => {
  for (const signature of ["", "abc", "0".repeat(63), "0".repeat(65), "x".repeat(500)]) {
    assert.throws(() => verify(webhookBody, signature), InvalidWebhookSignatureError, signature);
  }
});

test("verifyWebhook: the signature covers the exact raw bytes, even when they are not valid UTF-8", () => {
  const bytes = Buffer.concat([
    Buffer.from('{"referenceId":"ss_abc","note":"'),
    Buffer.from([0xff, 0xfe]),
    Buffer.from('"}'),
  ]);

  assert.equal(verify(bytes, signHex(bytes)).referenceId, "ss_abc");
  assert.throws(
    () => verify(Buffer.from(bytes.toString("utf8")), signHex(bytes)),
    InvalidWebhookSignatureError,
  );
});

test("verifyWebhook: a validly signed body that is not JSON is malformed, not accepted", () => {
  const body = "this is not json";
  assert.throws(() => verify(body, signHex(body)), MalformedWebhookError);
});

test("verifyWebhook: a validly signed payload without a referenceId is malformed", () => {
  for (const body of [JSON.stringify({ id: "evt" }), JSON.stringify({ referenceId: "" }), "null"]) {
    assert.throws(() => verify(body, signHex(body)), MalformedWebhookError, body);
  }
});

test("verifyWebhook: a payload without an id still verifies, with no audit key", () => {
  const body = JSON.stringify({ referenceId: "ss_abc" });
  const verified = verify(body, signHex(body));
  assert.equal(verified.eventId, null);
  assert.equal(verified.eventType, "unknown");
});

test("verifyWebhook: reads the payload shape Wayl documents in its dashboard (event name, no id)", () => {
  const body = JSON.stringify({
    verb: "POST",
    event: "order.created",
    referenceId: "ss_abc",
    paymentMethod: "...",
    paymentStatus: "...",
    paymentProcessor: "...",
    total: 1000,
    commission: 0,
    code: "I94F590I",
    customer: {
      id: "cmBkktqmz0000g00btwuo4ill",
      name: "...",
      country: "IQ",
      city: "iraq_al_basrah",
    },
  });

  const verified = verify(body, signHex(body));

  assert.equal(verified.referenceId, "ss_abc");
  assert.equal(verified.eventType, "order.created");
  assert.equal(verified.eventId, null);
});

test("verifyWebhook: when the payload carries an id, the audit key combines it with the event name", () => {
  const body = JSON.stringify({ id: "evt_7", event: "order.paid", referenceId: "ss_abc" });
  const verified = verify(body, signHex(body));
  assert.equal(verified.eventType, "order.paid");
  assert.equal(verified.eventId, "evt_7:order.paid");
});
