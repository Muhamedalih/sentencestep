import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseAgentInput, parseAgentUpdate, parseBatchInput } from "./input";

const AGENT = "0b0c9c3e-7d3f-4a39-8a40-3a6f3b0a1f11";

const form = (patch: Record<string, unknown> = {}) => ({
  agentId: AGENT,
  items: [{ planId: "3m", quantity: 5, wholesaleCentsEach: 300 }],
  receivedCents: 1500,
  validDays: 120,
  paymentMethod: "Binance Pay",
  paymentReference: "tx-123",
  note: "",
  ...patch,
});

describe("parseBatchInput", () => {
  it("accepts a well-formed form and trims the text", () => {
    const parsed = parseBatchInput(form({ paymentMethod: "  Binance Pay  ", note: " first " }));
    assert.ok(parsed.ok);
    if (parsed.ok) {
      assert.equal(parsed.value.paymentMethod, "Binance Pay");
      assert.equal(parsed.value.note, "first");
      assert.deepEqual(parsed.value.items, [
        { planId: "3m", quantity: 5, wholesaleCentsEach: 300 },
      ]);
      assert.equal(parsed.value.validDays, 120);
    }
  });

  it("uses the default validity when none is sent", () => {
    const parsed = parseBatchInput(form({ validDays: undefined }));
    assert.ok(parsed.ok);
    if (parsed.ok) assert.equal(parsed.value.validDays, 120);
  });

  it("refuses anything that is not a form", () => {
    for (const value of [null, undefined, 5, "x", [], [form()]]) {
      assert.equal(parseBatchInput(value).ok, false, JSON.stringify(value));
    }
  });

  it("refuses a missing or malformed agent", () => {
    for (const agentId of [undefined, "", "nope", 7, AGENT.slice(1), `${AGENT}0`]) {
      assert.equal(parseBatchInput(form({ agentId })).ok, false, String(agentId));
    }
  });

  it("refuses no plan, too many plans, unknown plans and non-numbers", () => {
    assert.equal(parseBatchInput(form({ items: [] })).ok, false);
    assert.equal(parseBatchInput(form({ items: "3m" })).ok, false);
    const line = { planId: "1m", quantity: 1, wholesaleCentsEach: 150 };
    assert.equal(parseBatchInput(form({ items: [line, line, line, line] })).ok, false);
    assert.equal(parseBatchInput(form({ items: [{ ...line, planId: "9m" }] })).ok, false);
    assert.equal(parseBatchInput(form({ items: [{ ...line, quantity: "5" }] })).ok, false);
    assert.equal(
      parseBatchInput(form({ items: [{ ...line, wholesaleCentsEach: null }] })).ok,
      false,
    );
    assert.equal(parseBatchInput(form({ items: [null] })).ok, false);
  });

  it("refuses amounts and validity that are not numbers", () => {
    assert.equal(parseBatchInput(form({ receivedCents: "1500" })).ok, false);
    assert.equal(parseBatchInput(form({ receivedCents: undefined })).ok, false);
    assert.equal(parseBatchInput(form({ validDays: "120" })).ok, false);
  });

  it("bounds free text instead of trusting it", () => {
    const parsed = parseBatchInput(
      form({ paymentReference: "x".repeat(500), note: "y".repeat(5000) }),
    );
    assert.ok(parsed.ok);
    if (parsed.ok) {
      assert.equal(parsed.value.paymentReference.length, 200);
      assert.equal(parsed.value.note.length, 2000);
    }
    const odd = parseBatchInput(form({ paymentMethod: 42 }));
    assert.ok(odd.ok);
    if (odd.ok) assert.equal(odd.value.paymentMethod, "");
  });
});

describe("parseAgentInput", () => {
  it("needs a name and keeps the rest optional", () => {
    assert.equal(parseAgentInput({}).ok, false);
    assert.equal(parseAgentInput({ name: "   " }).ok, false);
    const parsed = parseAgentInput({ name: " Mona ", country: "EG", contact: " @mona ", note: "" });
    assert.ok(parsed.ok);
    if (parsed.ok) {
      assert.deepEqual(parsed.value, { name: "Mona", contact: "@mona", country: "eg", note: "" });
    }
    const bare = parseAgentInput({ name: "Ali" });
    assert.ok(bare.ok);
    if (bare.ok) assert.equal(bare.value.country, null);
  });

  it("accepts only a two-letter country and bounds the text", () => {
    for (const country of ["egypt", "e", "1a", 5, {}]) {
      assert.equal(parseAgentInput({ name: "A", country }).ok, false, String(country));
    }
    assert.equal(parseAgentInput(null).ok, false);
    const long = parseAgentInput({
      name: "n".repeat(300),
      contact: "c".repeat(500),
      note: "x".repeat(5000),
    });
    assert.ok(long.ok);
    if (long.ok) {
      assert.equal(long.value.name.length, 80);
      assert.equal(long.value.contact.length, 200);
      assert.equal(long.value.note.length, 2000);
    }
  });
});

describe("parseAgentUpdate", () => {
  it("takes the few fields an admin changes", () => {
    const parsed = parseAgentUpdate({ status: "active", maxOutstanding: 20, note: " ok " });
    assert.ok(parsed.ok);
    if (parsed.ok) {
      assert.deepEqual(parsed.value, { status: "active", maxOutstanding: 20, note: "ok" });
    }
  });

  it("refuses an unknown status, a limit out of range or not whole, and an empty change", () => {
    assert.equal(parseAgentUpdate({ status: "boss" }).ok, false);
    assert.equal(parseAgentUpdate({ status: 3 }).ok, false);
    for (const maxOutstanding of [-1, 1001, 2.5, "20", null]) {
      assert.equal(parseAgentUpdate({ maxOutstanding }).ok, false, String(maxOutstanding));
    }
    assert.equal(parseAgentUpdate({ maxOutstanding: 0 }).ok, true);
    assert.equal(parseAgentUpdate({ maxOutstanding: 1000 }).ok, true);
    assert.equal(parseAgentUpdate({}).ok, false);
    assert.equal(parseAgentUpdate("x").ok, false);
  });
});
