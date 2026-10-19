// Run with `npm run test:email`.

import { test } from "node:test";
import assert from "node:assert/strict";

import type { EmailProvider, SendEmailInput } from "@/lib/email/provider";
import type { EmailUsageStore } from "@/lib/email/usage";
import { NoEmailRouteError, createRoutedProvider } from "./routed";

const NOW = new Date("2026-11-10T12:00:00.000Z");
const MAIL: SendEmailInput = { to: "a@b.co", subject: "s", html: "h", text: "t" };

function fakeStore(options: { broken?: boolean } = {}) {
  const counts = new Map<string, number>();
  const key = (provider: string, period: string) => `${provider}|${period}`;
  const store: EmailUsageStore = {
    async reserve(provider, period, limit) {
      if (options.broken) throw new Error("counter down");
      const used = counts.get(key(provider, period)) ?? 0;
      if (used >= limit) return false;
      counts.set(key(provider, period), used + 1);
      return true;
    },
    async release(provider, period) {
      counts.set(key(provider, period), Math.max((counts.get(key(provider, period)) ?? 0) - 1, 0));
    },
    async sentSince(provider, since) {
      let total = 0;
      for (const [k, v] of counts) {
        const [p, period] = k.split("|");
        if (p === provider && period! >= since) total += v;
      }
      return total;
    },
    async firstPeriod() {
      return null;
    },
  };
  return { store, counts };
}

function fakeProvider(name: string, fail = false) {
  const sent: SendEmailInput[] = [];
  const provider: EmailProvider = {
    name,
    async sendEmail(input) {
      if (fail) throw new Error(`${name} refused`);
      sent.push(input);
      return { status: "sent", providerMessageId: `${name}-${sent.length}` };
    },
  };
  return { provider, sent };
}

function setup(overrides: Partial<Parameters<typeof createRoutedProvider>[0]> = {}) {
  const resend = fakeProvider("resend");
  const ses = fakeProvider("ses");
  const { store, counts } = fakeStore();
  const routed = createRoutedProvider({
    resend: resend.provider,
    ses: ses.provider,
    store,
    resendDailyBudget: 3,
    resendBulkCeiling: 1,
    sesMonthlyBudget: 2,
    now: () => NOW,
    ...overrides,
  });
  return { routed, resend, ses, counts };
}

test("routed: an important message goes to Resend, a bulk one to SES", async () => {
  const { routed, resend, ses } = setup();
  await routed.sendEmail({ ...MAIL, priority: "important" });
  await routed.sendEmail({ ...MAIL, priority: "bulk" });
  assert.equal(resend.sent.length, 1);
  assert.equal(ses.sent.length, 1);
});

test("routed: a message with no priority is important", async () => {
  const { routed, resend, ses } = setup();
  await routed.sendEmail(MAIL);
  assert.equal(resend.sent.length, 1);
  assert.equal(ses.sent.length, 0);
});

test("routed: when Resend's daily budget is used up, an important message goes to SES", async () => {
  const { routed, resend, ses } = setup();
  for (let i = 0; i < 3; i += 1) await routed.sendEmail({ ...MAIL, priority: "important" });
  await routed.sendEmail({ ...MAIL, priority: "important" });
  assert.equal(resend.sent.length, 3);
  assert.equal(ses.sent.length, 1);
});

test("routed: an important message that Resend refuses falls back to SES and gives the Resend slot back", async () => {
  const { routed, ses, counts } = setup({ resend: fakeProvider("resend", true).provider });
  const result = await routed.sendEmail({ ...MAIL, priority: "important" });
  assert.equal(result.providerMessageId, "ses-1");
  assert.equal(ses.sent.length, 1);
  assert.equal(counts.get("resend|2026-11-10"), 0);
});

test("routed: bulk uses SES until its monthly budget, then only borrows Resend up to its ceiling", async () => {
  const { routed, resend, ses } = setup();
  for (let i = 0; i < 5; i += 1) {
    await routed.sendEmail({ ...MAIL, priority: "bulk" }).catch(() => undefined);
  }
  assert.equal(ses.sent.length, 2);
  assert.equal(resend.sent.length, 1);
});

test("routed: bulk never eats the room the important ones need", async () => {
  const { routed, resend } = setup();
  for (let i = 0; i < 6; i += 1)
    await routed.sendEmail({ ...MAIL, priority: "bulk" }).catch(() => undefined);
  // Resend's budget is 3 and the bulk ceiling 1: two slots are still free for important mail.
  await routed.sendEmail({ ...MAIL, priority: "important" });
  await routed.sendEmail({ ...MAIL, priority: "important" });
  assert.equal(resend.sent.length, 3);
});

test("routed: when the counter is down, important mail still goes out and bulk is held back", async () => {
  const resend = fakeProvider("resend");
  const ses = fakeProvider("ses");
  const routed = createRoutedProvider({
    resend: resend.provider,
    ses: ses.provider,
    store: fakeStore({ broken: true }).store,
    resendDailyBudget: 3,
    resendBulkCeiling: 1,
    sesMonthlyBudget: 2,
    now: () => NOW,
  });
  await routed.sendEmail({ ...MAIL, priority: "important" });
  assert.equal(resend.sent.length, 1);
  await assert.rejects(routed.sendEmail({ ...MAIL, priority: "bulk" }), /No email route/);
  assert.equal(ses.sent.length, 0);
});

test("routed: when no route has room, it says so instead of claiming a send", async () => {
  const { routed } = setup({ resendDailyBudget: 0, resendBulkCeiling: 0, sesMonthlyBudget: 0 });
  await assert.rejects(routed.sendEmail({ ...MAIL, priority: "bulk" }), /No email route/);
});

test("routed: the warm-up limit caps bulk through SES for the day, and the rest waits", async () => {
  const { routed, resend, ses } = setup({
    sesMonthlyBudget: 100,
    resendBulkCeiling: 0,
    sesBulkDailyBudget: async () => 2,
  });
  for (let i = 0; i < 4; i += 1) {
    await routed.sendEmail({ ...MAIL, priority: "bulk" }).catch(() => undefined);
  }
  assert.equal(ses.sent.length, 2);
  assert.equal(resend.sent.length, 0);
});

test("routed: the warm-up limit does not hold back an important message that fell back to SES", async () => {
  const { routed, ses } = setup({
    resendDailyBudget: 0,
    sesBulkDailyBudget: async () => 0,
  });
  await routed.sendEmail({ ...MAIL, priority: "important" });
  assert.equal(ses.sent.length, 1);
});

test("routed: when the warm-up limit cannot be read, bulk is held back", async () => {
  const { routed, ses } = setup({
    resendBulkCeiling: 0,
    sesBulkDailyBudget: async () => {
      throw new Error("unreadable");
    },
  });
  await assert.rejects(routed.sendEmail({ ...MAIL, priority: "bulk" }), NoEmailRouteError);
  assert.equal(ses.sent.length, 0);
});
