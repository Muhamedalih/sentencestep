// Run with `npm run test:admin`. No network, database or email provider: every
// dependency of alertAdmins is a recording stub.

import { test } from "node:test";
import assert from "node:assert/strict";

import { PushSubscriptionGoneError } from "@/lib/push/send";
import type { PushPayload } from "@/lib/push/send";
import type { PushSubscriptionRecord } from "@/lib/push/subscriptions";

import { alertAdmins, withinTime } from "./alert-admins";
import type { AdminAlertDeps } from "./alert-admins";

const CONTENT = { subject: "Subject", html: "<p>Hi</p>", text: "Hi" };
const PUSH: PushPayload = { title: "T", body: "B", url: "/admin/reports" };

function subscription(endpoint: string): PushSubscriptionRecord {
  return { endpoint, p256dh: "p", auth: "a" };
}

function setup(overrides: Partial<AdminAlertDeps> = {}) {
  const emails: string[] = [];
  const pushes: string[] = [];
  const deleted: string[] = [];
  const deps: AdminAlertDeps = {
    listAdmins: async () => [
      { id: "a1", email: "one@example.com" },
      { id: "a2", email: "two@example.com" },
    ],
    sendEmail: async (to) => {
      emails.push(to);
    },
    isPushConfigured: () => true,
    getSubscriptions: async () =>
      new Map([
        ["a1", [subscription("https://push/1")]],
        ["a2", [subscription("https://push/2")]],
      ]),
    sendPush: async (sub) => {
      pushes.push(sub.endpoint);
    },
    deleteSubscription: async (endpoint) => {
      deleted.push(endpoint);
    },
    ...overrides,
  };
  return { deps, emails, pushes, deleted };
}

test("alertAdmins: emails every admin and pushes to every subscribed device", async () => {
  const { deps, emails, pushes } = setup();

  await alertAdmins({ email: CONTENT, push: PUSH }, { logTag: "test", deps });

  assert.deepEqual(emails, ["one@example.com", "two@example.com"]);
  assert.deepEqual(pushes, ["https://push/1", "https://push/2"]);
});

test("alertAdmins: no admins means nothing is sent", async () => {
  const { deps, emails, pushes } = setup({ listAdmins: async () => [] });

  await alertAdmins({ email: CONTENT, push: PUSH }, { logTag: "test", deps });

  assert.deepEqual(emails, []);
  assert.deepEqual(pushes, []);
});

test("alertAdmins: an alert with no push body sends email only", async () => {
  const { deps, emails, pushes } = setup();

  await alertAdmins({ email: CONTENT, push: null }, { logTag: "test", deps });

  assert.equal(emails.length, 2);
  assert.deepEqual(pushes, []);
});

test("alertAdmins: push that isn't configured is skipped, email still goes out", async () => {
  const { deps, emails, pushes } = setup({ isPushConfigured: () => false });

  await alertAdmins({ email: CONTENT, push: PUSH }, { logTag: "test", deps });

  assert.equal(emails.length, 2);
  assert.deepEqual(pushes, []);
});

test("alertAdmins: one failing email never blocks the other admins or the push", async () => {
  const sent: string[] = [];
  const { deps, pushes } = setup({
    sendEmail: async (to) => {
      if (to === "one@example.com") throw new Error("provider down");
      sent.push(to);
    },
  });

  await alertAdmins({ email: CONTENT, push: PUSH }, { logTag: "test", deps });

  assert.deepEqual(sent, ["two@example.com"]);
  assert.equal(pushes.length, 2);
});

test("alertAdmins: a push endpoint the service reports gone is deleted, the rest still go out", async () => {
  const delivered: string[] = [];
  const { deps, deleted } = setup({
    sendPush: async (sub) => {
      if (sub.endpoint === "https://push/1") throw new PushSubscriptionGoneError("gone");
      delivered.push(sub.endpoint);
    },
  });

  await alertAdmins({ email: CONTENT, push: PUSH }, { logTag: "test", deps });

  assert.deepEqual(deleted, ["https://push/1"]);
  assert.deepEqual(delivered, ["https://push/2"]);
});

test("alertAdmins: never throws, even when looking up the admins fails", async () => {
  const { deps } = setup({
    listAdmins: async () => {
      throw new Error("database down");
    },
  });

  await assert.doesNotReject(alertAdmins({ email: CONTENT, push: PUSH }, { logTag: "test", deps }));
});

test("withinTime: returns as soon as the work finishes", async () => {
  const started = Date.now();
  await withinTime(Promise.resolve("done"), 5_000);
  assert.ok(Date.now() - started < 1_000);
});

test("withinTime: gives up on slow work after the limit", async () => {
  const started = Date.now();
  await withinTime(new Promise(() => undefined), 50);
  const elapsed = Date.now() - started;
  assert.ok(elapsed >= 40 && elapsed < 1_000, String(elapsed));
});

test("withinTime: never rejects when the work fails", async () => {
  await assert.doesNotReject(withinTime(Promise.reject(new Error("boom")), 1_000));
});
