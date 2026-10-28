import type { HybridMoment } from "./moments";
import { rolloutBucket } from "@/lib/rollouts/config";

/**
 * The before-and-after numbers for the hybrid offers, read by scripts/hybrid-offers-readout.ts:
 * the two arms of the share (the treatment and the control, the same split the Permissions page
 * makes), counted per active learner over one window. Pure: the script reads the rows, this counts.
 */

export type Arm = "treatment" | "control";

/** The arm an account is in: the same bucket the feature itself uses, so the readout cannot disagree with the app. */
export function armOf(userId: string, share: number): Arm {
  return rolloutBucket(userId, "hybridOffers") < share ? "treatment" : "control";
}

export interface ReadoutEvent {
  userId: string;
  name: string;
  /** The moment of an OFFER_* event; absent for every other event. */
  moment?: HybridMoment;
}

export interface ArmSummary {
  /** Signed-in learners in the arm who did anything in the window. */
  active: number;
  /** Distinct learners who saw a lock screen, opened the upgrade page, pressed the pay button, and paid. */
  paywallSeen: number;
  upgradeViewed: number;
  payPressed: number;
  paid: number;
  /** Moments shown, tapped and closed, and how many learners were shown at least one. */
  offersShown: number;
  offerClicks: number;
  offerDismissals: number;
  offerLearners: number;
}

export interface ArmReadout {
  treatment: ArmSummary;
  control: ArmSummary;
}

function emptySummary(): ArmSummary {
  return {
    active: 0,
    paywallSeen: 0,
    upgradeViewed: 0,
    payPressed: 0,
    paid: 0,
    offersShown: 0,
    offerClicks: 0,
    offerDismissals: 0,
    offerLearners: 0,
  };
}

/**
 * Counts each arm over one window. `events` are the window's events; `paidUserIds` the learners with
 * a fulfilled order in it (one entry per order); `excluded` the admins and anyone else not counted.
 */
export function summarizeArms(input: {
  events: readonly ReadoutEvent[];
  paidUserIds: readonly string[];
  share: number;
  excluded: ReadonlySet<string>;
}): ArmReadout {
  const sets = {
    treatment: {
      active: new Set<string>(),
      paywall: new Set<string>(),
      upgrade: new Set<string>(),
      pay: new Set<string>(),
      offers: new Set<string>(),
    },
    control: {
      active: new Set<string>(),
      paywall: new Set<string>(),
      upgrade: new Set<string>(),
      pay: new Set<string>(),
      offers: new Set<string>(),
    },
  };
  const summaries: ArmReadout = { treatment: emptySummary(), control: emptySummary() };
  const inArm = (userId: string) =>
    input.excluded.has(userId) ? null : armOf(userId, input.share);

  for (const event of input.events) {
    const arm = inArm(event.userId);
    if (!arm) continue;
    const group = sets[arm];
    const summary = summaries[arm];
    group.active.add(event.userId);
    if (event.name === "PAYWALL_VIEWED") group.paywall.add(event.userId);
    if (event.name === "UPGRADE_VIEWED") group.upgrade.add(event.userId);
    if (event.name === "UPGRADE_CTA_CLICKED") group.pay.add(event.userId);
    if (event.name === "OFFER_SHOWN") {
      summary.offersShown += 1;
      group.offers.add(event.userId);
    }
    if (event.name === "OFFER_CLICKED") summary.offerClicks += 1;
    if (event.name === "OFFER_DISMISSED") summary.offerDismissals += 1;
  }
  for (const userId of input.paidUserIds) {
    const arm = inArm(userId);
    if (arm) summaries[arm].paid += 1;
  }
  for (const arm of ["treatment", "control"] as const) {
    const group = sets[arm];
    const summary = summaries[arm];
    summary.active = group.active.size;
    summary.paywallSeen = group.paywall.size;
    summary.upgradeViewed = group.upgrade.size;
    summary.payPressed = group.pay.size;
    summary.offerLearners = group.offers.size;
  }
  return summaries;
}

/** A rate per 1,000 active learners, to one decimal place (0 when nobody was active). */
export function perThousand(count: number, active: number): number {
  return active === 0 ? 0 : Math.round((count / active) * 10_000) / 10;
}
