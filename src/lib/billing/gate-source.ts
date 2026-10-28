import { firstParam } from "@/lib/billing/after-payment";

/**
 * Where a visitor was when they pressed the button on a lock card (see PremiumGate) and opened the
 * plans page. The button is a plain link, so the press is counted where it lands: the link carries
 * three short, fixed words and /upgrade writes them on its UPGRADE_VIEWED event. That counts every
 * visitor, signed in or not, and cannot be lost to a page change. Dependency-free so the card, the
 * plans page and the tests share it.
 *
 *   from  which lock the visitor met
 *   at    the button in the card ("gate") or the slim bar on a phone ("bar")
 *   v     which card they saw: the long one it always was ("classic") or the lean one ("lean")
 */
export const GATE_KINDS = ["lesson", "word_group", "passage"] as const;
export type GateKind = (typeof GATE_KINDS)[number];

export const GATE_PLACES = ["gate", "bar"] as const;
export type GatePlace = (typeof GATE_PLACES)[number];

export const GATE_VARIANTS = ["classic", "lean"] as const;
export type GateVariant = (typeof GATE_VARIANTS)[number];

export interface GateSource {
  from: GateKind;
  at: GatePlace;
  v: GateVariant;
}

/** `href` (already `/upgrade?next=...`) with the source words added. */
export function withGateSource(href: string, source: GateSource): string {
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}from=${source.from}&at=${source.at}&v=${source.v}`;
}

function oneOf<T extends string>(allowed: readonly T[], value: string | undefined): T | null {
  return allowed.find((candidate) => candidate === value) ?? null;
}

/** The source words in a plans-page address, or null unless all three are known ones (anything else is ignored, never stored). */
export function parseGateSource(params: {
  from?: string | string[];
  at?: string | string[];
  v?: string | string[];
}): GateSource | null {
  const from = oneOf(GATE_KINDS, firstParam(params.from));
  const at = oneOf(GATE_PLACES, firstParam(params.at));
  const v = oneOf(GATE_VARIANTS, firstParam(params.v));
  return from && at && v ? { from, at, v } : null;
}
