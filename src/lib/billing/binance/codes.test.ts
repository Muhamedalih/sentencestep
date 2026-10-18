// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { generateOrderCode, extractOrderCodes } from "./codes";
import { ORDER_CODE_ALPHABET } from "./constants";

test("generateOrderCode: SS- then five symbols of the unambiguous alphabet", () => {
  for (let run = 0; run < 200; run += 1) {
    const code = generateOrderCode();
    assert.match(code, new RegExp(`^SS-[${ORDER_CODE_ALPHABET}]{5}$`));
  }
});

test("generateOrderCode: the alphabet has no 0, O, 1, I or L", () => {
  for (const symbol of ["0", "O", "1", "I", "L"]) {
    assert.equal(ORDER_CODE_ALPHABET.includes(symbol), false, symbol);
  }
});

test("generateOrderCode: uses the injected generator, one draw per symbol", () => {
  const draws: number[] = [];
  const code = generateOrderCode((max) => {
    draws.push(max);
    return 0;
  });
  assert.equal(code, "SS-22222");
  assert.deepEqual(draws, [31, 31, 31, 31, 31]);
});

test("extractOrderCodes: finds the code however it is typed", () => {
  for (const note of [
    "SS-7K3Q2",
    "ss-7k3q2",
    "SS 7K3Q2",
    "ss7k3q2",
    "SS_7K3Q2",
    "code: SS-7K3Q2 thanks",
    "SS#7K3Q2",
    "  SS - 7K3Q2  ",
  ]) {
    assert.deepEqual(extractOrderCodes(note), ["SS-7K3Q2"], note);
  }
});

test("extractOrderCodes: nothing in an empty, missing or unrelated note", () => {
  assert.deepEqual(extractOrderCodes(null), []);
  assert.deepEqual(extractOrderCodes(undefined), []);
  assert.deepEqual(extractOrderCodes(""), []);
  assert.deepEqual(extractOrderCodes("for the premium plan"), []);
  assert.deepEqual(extractOrderCodes("thanks"), []);
});

test("extractOrderCodes: not inside another word, and not the start of a longer one", () => {
  assert.deepEqual(extractOrderCodes("CLASS ABCDE"), []);
  assert.deepEqual(extractOrderCodes("BOSS 7K3Q2"), []);
  assert.deepEqual(extractOrderCodes("SS-7K3Q2X"), []);
  assert.deepEqual(extractOrderCodes("SS-7K3Q"), []);
});

test("extractOrderCodes: symbols outside the alphabet never match", () => {
  assert.deepEqual(extractOrderCodes("SS-0K3Q2"), []);
  assert.deepEqual(extractOrderCodes("SS-7K3QO"), []);
  assert.deepEqual(extractOrderCodes("SS-1K3Q2"), []);
});

test("extractOrderCodes: several different codes are all returned once", () => {
  assert.deepEqual(extractOrderCodes("SS-7K3Q2 and SS-ABCDE and ss-7k3q2"), [
    "SS-7K3Q2",
    "SS-ABCDE",
  ]);
});
