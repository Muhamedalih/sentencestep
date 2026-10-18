// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_BINANCE_PAY_SETTINGS,
  sanitizeBinancePaySettings,
  validateBinancePaySettingsInput,
} from "./settings";

const GOOD = {
  binanceId: "1239354913",
  displayName: "User-f65e4",
  dailyOrderCap: 10,
  autoActivate: true,
  latePaymentHours: 24,
};

test("sanitizeBinancePaySettings: a stored row becomes usable settings", () => {
  assert.deepEqual(
    sanitizeBinancePaySettings({
      binance_id: "1239354913",
      display_name: "User-f65e4",
      daily_order_cap: 5,
      auto_activate: false,
      late_payment_hours: 48,
    }),
    {
      binanceId: "1239354913",
      displayName: "User-f65e4",
      dailyOrderCap: 5,
      autoActivate: false,
      latePaymentHours: 48,
    },
  );
});

test("sanitizeBinancePaySettings: anything missing or malformed falls back, numbers are clamped", () => {
  assert.deepEqual(sanitizeBinancePaySettings(null), DEFAULT_BINANCE_PAY_SETTINGS);
  assert.deepEqual(sanitizeBinancePaySettings("x"), DEFAULT_BINANCE_PAY_SETTINGS);
  const clamped = sanitizeBinancePaySettings({
    binance_id: "not a number",
    display_name: "x".repeat(100),
    daily_order_cap: 9999,
    auto_activate: "yes",
    late_payment_hours: 0,
  });
  assert.equal(clamped.binanceId, "");
  assert.equal(clamped.displayName, "");
  assert.equal(clamped.dailyOrderCap, 200);
  assert.equal(clamped.autoActivate, true);
  assert.equal(clamped.latePaymentHours, 1);
});

test("validateBinancePaySettingsInput: good input is accepted as given (trimmed)", () => {
  const result = validateBinancePaySettingsInput({
    ...GOOD,
    binanceId: " 1239354913 ",
    displayName: "  User-f65e4 ",
  });
  assert.deepEqual(result, { ok: true, settings: GOOD });
});

test("validateBinancePaySettingsInput: a bad value is an error, never silently corrected", () => {
  for (const bad of [
    { binanceId: "abc" },
    { binanceId: "12" },
    { binanceId: "1".repeat(21) },
    { displayName: "" },
    { displayName: "x".repeat(41) },
    { displayName: "bad\u0000name" },
    { dailyOrderCap: -1 },
    { dailyOrderCap: 201 },
    { dailyOrderCap: 1.5 },
    { latePaymentHours: 0 },
    { latePaymentHours: 169 },
    { latePaymentHours: 2.5 },
  ]) {
    const result = validateBinancePaySettingsInput({ ...GOOD, ...bad });
    assert.equal(result.ok, false, JSON.stringify(bad));
  }
});

test("validateBinancePaySettingsInput: zero orders per day is allowed (it pauses the button)", () => {
  assert.equal(validateBinancePaySettingsInput({ ...GOOD, dailyOrderCap: 0 }).ok, true);
});
