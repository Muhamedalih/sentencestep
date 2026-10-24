import assert from "node:assert/strict";
import test from "node:test";

import { nudgeArm, nudgeShares, tallyNudges } from "@/lib/email/nudges/readout";
import type { NudgeRow } from "@/lib/email/nudges/readout";

function row(user: string, createdAt: string, overrides: Partial<NudgeRow> = {}): NudgeRow {
  return {
    user_id: user,
    type: "DAY_ONE_NUDGE",
    email_status: "sent",
    payload: { type: "DAY_ONE_NUDGE" },
    created_at: createdAt,
    ...overrides,
  };
}

test("a reminder is in the sent arm when it was sent, held out when marked so, and nothing when it never left", () => {
  assert.equal(nudgeArm(row("a", "2026-10-21T15:00:00Z")), "sent");
  assert.equal(
    nudgeArm(
      row("b", "2026-10-21T15:00:00Z", {
        email_status: "skipped",
        payload: { type: "DAY_ONE_NUDGE", holdout: true },
      }),
    ),
    "held out",
  );
  assert.equal(nudgeArm(row("c", "2026-10-21T15:00:00Z", { email_status: "queued" })), null);
  assert.equal(nudgeArm(row("d", "2026-10-21T15:00:00Z", { payload: null })), "sent");
});

test("coming back and opening the plans are counted only inside the window, and only once it is over", () => {
  const active = new Map([
    ["a", new Set(["2026-10-22"])], // came back the next day
    ["b", new Set(["2026-10-21"])], // active only on the reminder's own day: not a return
    ["c", new Set(["2026-10-25"])], // came back after the 3-day window
  ]);
  const views = new Map([["a", [Date.parse("2026-10-22T08:00:00Z")]]]);
  const held = (user: string, at: string) =>
    row(user, at, {
      email_status: "skipped",
      payload: { type: "DAY_ONE_NUDGE", holdout: true },
    });
  const result = tallyNudges({
    rows: [
      row("a", "2026-10-21T15:00:00Z"),
      row("b", "2026-10-21T15:00:00Z"),
      held("c", "2026-10-21T15:00:00Z"),
      row("late", "2026-10-23T15:00:00Z"), // its window is not over yet
    ],
    windowDays: 3,
    today: "2026-10-25",
    nowMs: Date.parse("2026-10-25T10:00:00Z"),
    activeDays: (id) => active.get(id),
    upgradeViews: (id) => views.get(id),
    eligible: () => true,
  });
  const tally = result.get("DAY_ONE_NUDGE");
  assert.deepEqual(tally?.sent, { n: 3, known: 2, returned: 1, upgraded: 1 });
  assert.deepEqual(tally?.["held out"], { n: 1, known: 1, returned: 0, upgraded: 0 });
});

test("an account the email could not have reached is left out of both arms", () => {
  const result = tallyNudges({
    rows: [
      row("ok", "2026-10-20T15:00:00Z"),
      row("pw", "2026-10-20T15:00:00Z", {
        email_status: "skipped",
        payload: { holdout: true },
      }),
    ],
    windowDays: 1,
    today: "2026-10-25",
    nowMs: Date.parse("2026-10-25T10:00:00Z"),
    activeDays: () => undefined,
    upgradeViews: () => undefined,
    eligible: (id) => id === "ok",
  });
  assert.equal(result.get("DAY_ONE_NUDGE")?.["held out"].n, 0);
  assert.equal(result.get("DAY_ONE_NUDGE")?.sent.n, 1);
});

test("the shares are dashes until some reminder has a finished window", () => {
  assert.equal(nudgeShares({ n: 4, known: 0, returned: 0, upgraded: 0 })["came back"], "- (0)");
  assert.equal(nudgeShares({ n: 4, known: 4, returned: 1, upgraded: 0 })["came back"], "25.0% (1)");
});
