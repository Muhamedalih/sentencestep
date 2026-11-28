"use server";

import { headers } from "next/headers";
import { after } from "next/server";

import { isAdmin } from "@/lib/admin/access";
import { track } from "@/lib/analytics/track";
import { getAccessState } from "@/lib/billing/access";
import { safeLessonPath } from "@/lib/billing/after-payment";
import { EGYPT_COUNTRY } from "@/lib/billing/egypt-wallet/constants";
import { effectiveRate } from "@/lib/billing/egypt-wallet/rate";
import { createEgyptWalletStore } from "@/lib/billing/egypt-wallet/store";
import { GATE_KINDS, GATE_PLACES, GATE_VARIANTS } from "@/lib/billing/gate-source";
import type { GateSource } from "@/lib/billing/gate-source";
import { getGateProgress } from "@/lib/billing/gate-progress";
import { isOfferActive, offerBonusDaysByPlan } from "@/lib/billing/launch-offer";
import { getLaunchOffer } from "@/lib/billing/launch-offer-queries";
import { buildPlanViews } from "@/lib/billing/plan-views";
import type { PlanView } from "@/lib/billing/plan-views";
import { tierForCountry } from "@/lib/billing/pricing";
import { resolveViewerCountry } from "@/lib/billing/viewer-country";
import { isBinancePayConfigured, isEgyptWalletConfigured } from "@/lib/billing/provider-registry";
import { getEffectiveFeatures, isFeaturePublished } from "@/lib/features/queries";
import { formatCount } from "@/lib/i18n/format-count";
import { getLocale } from "@/lib/i18n/get-locale";
import { decidePayStrip } from "@/lib/in-app-strip/strip";
import type { StripDecision } from "@/lib/in-app-strip/strip";
import type { GateProgress } from "@/lib/progress/honest-numbers";
import { getCombinedRatingsProof } from "@/lib/stats/public-ratings";
import { getCurrentUser } from "@/lib/supabase/auth";

/** Everything the upgrade pop-up draws, prepared on the server for this visitor: the figures are already formatted. */
export interface UpgradeModalData {
  signedIn: boolean;
  plans: PlanView[];
  /** The real rating over every section; null when too small to quote or switched off. */
  rating: { average: string; count: string } | null;
  /** True once the Passages section is open to everyone: the benefit list then names it. */
  passagesOpen: boolean;
  binancePayOpen: boolean;
  egyptWalletOpen: boolean;
  /** True for a visitor whose country is Egypt: Vodafone Cash starts chosen (still free to change). */
  preferEgyptWallet: boolean;
  /** True for a visitor in Iraq, who is shown the Iraqi wallets beside cards. */
  showIraqiWallets: boolean;
  payStrip: StripDecision | null;
  /** The lesson page the learner was stopped at (already checked), so the page after paying can lead back. */
  next: string | null;
}

function paramsOf(search: string): URLSearchParams {
  try {
    return new URLSearchParams(search.slice(0, 300));
  } catch {
    return new URLSearchParams();
  }
}

/** The lock words of a plans-page address, each only when it is a known one (see gate-source.ts). */
function partialSource(params: URLSearchParams): Partial<GateSource> {
  const from = params.get("from");
  const at = params.get("at");
  const v = params.get("v");
  return {
    ...(GATE_KINDS.find((kind) => kind === from) ? { from: from as GateSource["from"] } : {}),
    ...(GATE_PLACES.find((place) => place === at) ? { at: at as GateSource["at"] } : {}),
    ...(GATE_VARIANTS.find((variant) => variant === v) ? { v: v as GateSource["v"] } : {}),
  };
}

/** The day's pound rate of the Vodafone Cash tile (one stored row); undefined when it cannot be read. */
async function readEgpRate(): Promise<number | undefined> {
  try {
    return effectiveRate(await createEgyptWalletStore().getSettings()).rate;
  } catch (error) {
    console.error("[egypt-wallet] upgrade pop-up: could not read the day's rate", error);
    return undefined;
  }
}

/**
 * The figures of the upgrade pop-up (permission upgradeModal), read only when the pop-up opens, so no
 * page gets heavier. Every read starts at the same moment (the pop-up used to wait for four reads
 * one after the other, then for the record of the view, before its button appeared), and the record
 * of the view is written after the answer has gone. It returns null whenever the pop-up should not be
 * shown, and the page then goes to the plans page as it always did: the permission is closed for this
 * visitor, the visitor already has Premium (the extend flow lives on the page), or the whole site is
 * free for now. Prices, plan ids and the ways to pay are the ones the plans page builds; paying goes
 * through the same checkout action.
 */
export async function loadUpgradeModal(
  search: string,
  nextCandidate: string | null,
): Promise<UpgradeModalData | null> {
  const requestHeaders = await headers();
  const { country } = await resolveViewerCountry(requestHeaders);
  // A visitor in Egypt is shown Vodafone Cash, so its rate is read together with everything else;
  // anyone else only reads it when an admin previews that tile from another country (below).
  const earlyRate = country === EGYPT_COUNTRY && isEgyptWalletConfigured() ? readEgpRate() : null;

  const [user, access, locale, features, storedOffer, passagesOpen, ratings] = await Promise.all([
    getCurrentUser(),
    getAccessState(),
    getLocale(),
    getEffectiveFeatures(),
    getLaunchOffer(),
    isFeaturePublished("passages"),
    getCombinedRatingsProof(),
  ]);
  if (!features.rollouts.upgradeModal) return null;
  // Already subscribed (the page offers to extend), or free for everyone right now: nothing to buy here.
  if (access.isPremium) return null;

  const params = paramsOf(search);
  const next = safeLessonPath(nextCandidate ?? params.get("next"));

  const binancePayOpen = features.binancePay.enabled && isBinancePayConfigured();
  const egyptWalletOpen =
    features.rollouts.egyptWallet &&
    isEgyptWalletConfigured() &&
    (country === EGYPT_COUNTRY || (await isAdmin()));
  const payStrip = user
    ? decidePayStrip({
        userAgent: requestHeaders.get("user-agent"),
        forcedParam: null,
        open: features.rollouts.inAppPayStrip,
      })
    : null;

  const offer = isOfferActive(storedOffer, new Date()) ? storedOffer : null;
  const egpRatePerUsd = egyptWalletOpen ? await (earlyRate ?? readEgpRate()) : undefined;
  const plans = buildPlanViews(tierForCountry(country), offer ? offerBonusDaysByPlan(offer) : 0, {
    egpRatePerUsd,
  });

  // Counted like a view of the plans page, with `surface` telling the pop-up apart from the page;
  // written after the answer has been sent, so it never makes the pop-up wait.
  const properties = { surface: "modal" as const, ...partialSource(params) };
  after(() => track({ name: "UPGRADE_VIEWED", category: "PREMIUM", properties }, user?.id ?? null));

  return {
    signedIn: Boolean(user),
    plans,
    rating: ratings
      ? { average: ratings.average.toFixed(1), count: formatCount(ratings.count, locale) }
      : null,
    passagesOpen,
    binancePayOpen,
    egyptWalletOpen,
    preferEgyptWallet: country === EGYPT_COUNTRY,
    showIraqiWallets: country === "iq",
    payStrip,
    next,
  };
}

/**
 * What the pop-up says about the signed-in learner («you wrote 127 sentences in 6 days»): the same
 * honest figures the lock cards quote (getGateProgress), asked apart from the pop-up's own figures
 * so the pop-up never waits for them; it shows the line only if it arrives. Null for a visitor, a
 * learner who has barely started, a closed permission, or any failure.
 */
export async function loadUpgradeProgress(): Promise<GateProgress | null> {
  try {
    if (!(await getEffectiveFeatures()).rollouts.upgradeModal) return null;
    return await getGateProgress();
  } catch {
    return null;
  }
}
