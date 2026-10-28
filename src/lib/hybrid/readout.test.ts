import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { armOf, perThousand, summarizeArms } from "./readout";

/** The first ids of each arm for a share, so a test can name a treatment and a control learner. */
function idsByArm(share: number, count: number): { treatment: string[]; control: string[] } {
  const treatment: string[] = [];
  const control: string[] = [];
  for (let index = 0; treatment.length < count || control.length < count; index++) {
    const id = `learner-${index}`;
    if (armOf(id, share) === "treatment") {
      if (treatment.length < count) treatment.push(id);
    } else if (control.length < count) {
      control.push(id);
    }
  }
  return { treatment, control };
}

describe("armOf", () => {
  it("puts everyone in the treatment at 100% and nobody at 0%", () => {
    assert.equal(armOf("learner-1", 100), "treatment");
    assert.equal(armOf("learner-1", 0), "control");
  });

  it("splits a share roughly as it says, and the same learner always lands in the same arm", () => {
    const ids = Array.from({ length: 2000 }, (_, index) => `learner-${index}`);
    const treatment = ids.filter((id) => armOf(id, 90) === "treatment").length;
    assert.ok(treatment > 1700 && treatment < 1900, `about 90% expected, got ${treatment}`);
    assert.equal(armOf("learner-7", 90), armOf("learner-7", 90));
  });
});

describe("summarizeArms", () => {
  it("counts each arm per active learner, and leaves admins and anyone excluded out", () => {
    const { treatment, control } = idsByArm(50, 2);
    const [t1, t2] = treatment as [string, string];
    const [c1, c2] = control as [string, string];
    const admin = "admin-1";
    const events = [
      { userId: t1, name: "PAYWALL_VIEWED" },
      { userId: t1, name: "UPGRADE_VIEWED" },
      { userId: t1, name: "UPGRADE_CTA_CLICKED" },
      { userId: t1, name: "OFFER_SHOWN", moment: "B" as const },
      { userId: t1, name: "OFFER_CLICKED", moment: "B" as const },
      { userId: t2, name: "OFFER_SHOWN", moment: "D" as const },
      { userId: t2, name: "OFFER_DISMISSED", moment: "D" as const },
      { userId: c1, name: "PAYWALL_VIEWED" },
      { userId: c2, name: "LESSON_STARTED" },
      { userId: admin, name: "UPGRADE_VIEWED" },
    ];
    const result = summarizeArms({
      events,
      paidUserIds: [t1, c2],
      share: 50,
      excluded: new Set([admin]),
    });
    assert.deepEqual(
      {
        active: result.treatment.active,
        paywallSeen: result.treatment.paywallSeen,
        upgradeViewed: result.treatment.upgradeViewed,
        payPressed: result.treatment.payPressed,
        paid: result.treatment.paid,
        offersShown: result.treatment.offersShown,
        offerClicks: result.treatment.offerClicks,
        offerDismissals: result.treatment.offerDismissals,
        offerLearners: result.treatment.offerLearners,
      },
      {
        active: 2,
        paywallSeen: 1,
        upgradeViewed: 1,
        payPressed: 1,
        paid: 1,
        offersShown: 2,
        offerClicks: 1,
        offerDismissals: 1,
        offerLearners: 2,
      },
    );
    assert.equal(result.control.active, 2);
    assert.equal(result.control.upgradeViewed, 0, "the admin's view is not counted");
    assert.equal(result.control.paid, 1);
    assert.equal(result.control.offersShown, 0);
  });
});

describe("perThousand", () => {
  it("is a rate per thousand to one decimal, and zero when nobody was active", () => {
    assert.equal(perThousand(24, 1000), 24);
    assert.equal(perThousand(1, 3), 333.3);
    assert.equal(perThousand(5, 0), 0);
  });
});
