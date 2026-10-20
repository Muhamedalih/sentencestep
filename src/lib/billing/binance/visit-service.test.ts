// Run with `npm run test:billing`. No database and no session: every dependency of
// handleVisit is a recording stub.

import { test } from "node:test";
import assert from "node:assert/strict";

import { handleVisit } from "./visit-service";
import type { NewVisit, VisitDeps, VisitPatch, VisitRequest } from "./visit-service";
import { MAX_OPENS_PER_ORDER_PER_TEN_MINUTES } from "./visits";

const NOW = new Date("2026-10-20T09:08:00.000Z");
const VISIT_ID = "0f3c1d52-8a9b-4c6e-9d2a-1b7e4f6a8c10";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 13; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";

function headers(values: Record<string, string> = {}) {
  return { get: (name: string) => values[name.toLowerCase()] ?? null };
}

function setup(overrides: Partial<VisitDeps> = {}) {
  const inserted: NewVisit[] = [];
  const updated: { visitId: string; userId: string; patch: VisitPatch }[] = [];
  const looked: { reference: string; userId: string }[] = [];
  const deps: VisitDeps = {
    getUser: async () => ({ id: "user-1" }),
    findOrder: async (reference, userId) => {
      looked.push({ reference, userId });
      return reference === "ss_mine" ? { id: "order-1" } : null;
    },
    countRecentOpens: async () => 0,
    insertVisit: async (visit) => {
      inserted.push(visit);
      return VISIT_ID;
    },
    updateVisit: async (input) => {
      updated.push(input);
    },
    now: () => NOW,
    ...overrides,
  };
  return { deps, inserted, updated, looked };
}

function request(body: unknown, extra: Partial<VisitRequest> = {}): VisitRequest {
  return {
    body,
    headers: headers({ "user-agent": ANDROID_CHROME }),
    firstTouchCookie: "facebook~~",
    ...extra,
  };
}

test("handleVisit: opening a visit stores what the server reads and the browser's zone, and hands back the id", async () => {
  const { deps, inserted, looked } = setup();

  const result = await handleVisit(
    deps,
    request({ reference: "ss_mine", timeZone: "Asia/Baghdad", language: "ar" }),
  );

  assert.deepEqual(result, { status: 200, body: { visitId: VISIT_ID } });
  assert.deepEqual(looked, [{ reference: "ss_mine", userId: "user-1" }]);
  assert.deepEqual(inserted, [
    {
      orderId: "order-1",
      userId: "user-1",
      country: null,
      region: null,
      city: null,
      timeZone: "Asia/Baghdad",
      language: "ar",
      device: "mobile",
      os: "Android",
      browser: "Chrome",
      source: "facebook",
    },
  ]);
});

test("handleVisit: a signed-out request is refused before anything is read", async () => {
  const { deps, inserted } = setup({
    getUser: async () => null,
    findOrder: async () => {
      throw new Error("must not be reached");
    },
  });

  assert.deepEqual(await handleVisit(deps, request({ reference: "ss_mine" })), { status: 401 });
  assert.equal(inserted.length, 0);
});

test("handleVisit: an order that is not the learner's own gets nothing recorded", async () => {
  const { deps, inserted } = setup();

  assert.deepEqual(await handleVisit(deps, request({ reference: "ss_someone_elses" })), {
    status: 404,
  });
  assert.equal(inserted.length, 0);
});

test("handleVisit: junk in the time zone and language is dropped, the visit is still recorded", async () => {
  const { deps, inserted } = setup();

  await handleVisit(deps, request({ reference: "ss_mine", timeZone: "<b>x</b>", language: 7 }));

  assert.equal(inserted[0]!.timeZone, null);
  assert.equal(inserted[0]!.language, null);
});

test("handleVisit: a body with no reference or visit id, or a huge reference, is a bad request", async () => {
  const { deps } = setup();

  for (const body of [null, "x", [], {}, { reference: "" }, { reference: "r".repeat(300) }]) {
    assert.deepEqual(await handleVisit(deps, request(body)), { status: 400 }, JSON.stringify(body));
  }
});

test("handleVisit: a page reloaded in a loop stops being recorded", async () => {
  const { deps, inserted } = setup({
    countRecentOpens: async () => MAX_OPENS_PER_ORDER_PER_TEN_MINUTES,
  });

  assert.deepEqual(await handleVisit(deps, request({ reference: "ss_mine" })), { status: 429 });
  assert.equal(inserted.length, 0);
});

test("handleVisit: a write that fails answers 503 and never throws to the learner", async () => {
  const { deps } = setup({
    insertVisit: async () => {
      throw new Error("database down");
    },
  });
  const original = console.error;
  console.error = () => {};
  try {
    assert.deepEqual(await handleVisit(deps, request({ reference: "ss_mine" })), { status: 503 });
  } finally {
    console.error = original;
  }
  assert.deepEqual(
    await handleVisit(
      setup({ insertVisit: async () => null }).deps,
      request({ reference: "ss_mine" }),
    ),
    { status: 503 },
  );
});

test("handleVisit: a 'still here' report updates the learner's own visit with the clamped counters and the actions", async () => {
  const { deps, updated } = setup();

  const result = await handleVisit(
    deps,
    request({
      visitId: VISIT_ID,
      visibleSeconds: 95.6,
      leaves: 2,
      actions: ["copy_code", "bogus", "guide"],
    }),
  );

  assert.deepEqual(result, { status: 204 });
  assert.deepEqual(updated, [
    {
      visitId: VISIT_ID,
      userId: "user-1",
      patch: {
        lastSeenAt: "2026-10-20T09:08:00.000Z",
        visibleSeconds: 96,
        leaves: 2,
        copiedCode: true,
        openedGuide: true,
      },
    },
  ]);
});

test("handleVisit: a report with no counters only refreshes the last-seen time, and never turns an action off", async () => {
  const { deps, updated } = setup();

  await handleVisit(deps, request({ visitId: VISIT_ID }));

  assert.deepEqual(updated[0]!.patch, { lastSeenAt: "2026-10-20T09:08:00.000Z" });
});

test("handleVisit: a visit id that is not a uuid is refused", async () => {
  const { deps, updated } = setup();

  assert.deepEqual(await handleVisit(deps, request({ visitId: "1; drop table x" })), {
    status: 400,
  });
  assert.equal(updated.length, 0);
});
