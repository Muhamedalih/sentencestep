import { ROLLOUT_IDS, ROLLOUTS } from "@/lib/rollouts/catalog";
import type { RolloutId } from "@/lib/rollouts/catalog";

/**
 * Who a feature in the Permissions page is open to. Pure and dependency-free of Supabase, so the
 * server queries, the admin form and the tests share the same types and rules.
 *
 *   admin     only admins (and a browser an admin switched preview on for) — where every feature starts
 *   emails    admins, plus the people whose email is on the list
 *   everyone  everybody; for a feature aimed at first-time visitors, `percent` of them
 */
export type RolloutMode = "admin" | "emails" | "everyone";

export const ROLLOUT_MODES: readonly RolloutMode[] = ["admin", "emails", "everyone"];

export function isRolloutMode(value: unknown): value is RolloutMode {
  return value === "admin" || value === "emails" || value === "everyone";
}

export interface RolloutEntry {
  mode: RolloutMode;
  /** Only for a feature aimed at first-time visitors, and only in "everyone": the share of them (1-100) it is given to. */
  percent: number;
  /** Lowercase, trimmed, unique. Only read in "emails" mode (the list is kept when the mode changes, so switching back loses nothing). */
  emails: string[];
}

export type RolloutConfig = Record<RolloutId, RolloutEntry>;

export const MAX_ROLLOUT_EMAILS = 300;
export const DEFAULT_VISITOR_PERCENT = 50;

export function defaultRolloutEntry(id: RolloutId): RolloutEntry {
  return {
    mode: "admin",
    percent: ROLLOUTS[id].audience === "visitor" ? DEFAULT_VISITOR_PERCENT : 100,
    emails: [],
  };
}

export function defaultRolloutConfig(): RolloutConfig {
  const config = {} as RolloutConfig;
  for (const id of ROLLOUT_IDS) config[id] = defaultRolloutEntry(id);
  return config;
}

const EMAIL_SHAPE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

/** An email as it is stored and compared (trimmed, lowercase), or null when it isn't one. */
export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  return email.length <= 254 && EMAIL_SHAPE.test(email) ? email : null;
}

/** Emails typed or pasted one per line, or separated by commas, semicolons or spaces: the valid ones (unique, in order) and the entries that are not emails. */
export function parseEmailList(text: string): { emails: string[]; invalid: string[] } {
  const emails: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  for (const part of text.split(/[\s,;]+/)) {
    if (!part) continue;
    const email = normalizeEmail(part);
    if (email === null) {
      invalid.push(part.slice(0, 80));
      continue;
    }
    if (seen.has(email)) continue;
    seen.add(email);
    emails.push(email);
  }
  return { emails, invalid };
}

function clampPercent(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(100, Math.max(1, Math.round(value)));
}

/** Coerces anything (a stored row, a form submission) into a valid entry: unknown modes fall back to "admin", a visitor-aimed feature cannot use a list of emails, and the list is cleaned and capped. */
export function sanitizeRolloutEntry(id: RolloutId, raw: unknown): RolloutEntry {
  const base = defaultRolloutEntry(id);
  if (typeof raw !== "object" || raw === null) return base;
  const row = raw as Record<string, unknown>;

  let mode = isRolloutMode(row.mode) ? row.mode : base.mode;
  if (ROLLOUTS[id].audience === "visitor" && mode === "emails") mode = "admin";

  const emails: string[] = [];
  if (Array.isArray(row.emails)) {
    const seen = new Set<string>();
    for (const value of row.emails) {
      if (typeof value !== "string") continue;
      const email = normalizeEmail(value);
      if (email === null || seen.has(email)) continue;
      seen.add(email);
      emails.push(email);
      if (emails.length >= MAX_ROLLOUT_EMAILS) break;
    }
  }

  return { mode, percent: clampPercent(row.percent, base.percent), emails };
}

/** The whole config from the stored rows (`feature`, `mode`, `percent`, `emails`); a feature with no row is "Admins only". */
export function sanitizeRolloutConfig(rows: unknown): RolloutConfig {
  const config = defaultRolloutConfig();
  if (!Array.isArray(rows)) return config;
  for (const row of rows) {
    if (typeof row !== "object" || row === null) continue;
    const feature = (row as Record<string, unknown>).feature;
    const id = ROLLOUT_IDS.find((candidate) => candidate === feature);
    if (id) config[id] = sanitizeRolloutEntry(id, row);
  }
  return config;
}

export interface RolloutViewer {
  isAdmin: boolean;
  /** The signed-in account's email, or null for a guest. */
  email: string | null;
  /** An admin switched preview on for this browser (see preview.ts): it sees everything, signed in or not. */
  preview: boolean;
}

/** Whether this viewer gets the feature. For a feature aimed at first-time visitors "everyone" is true here but the share is decided in their browser (see visitorShare). */
export function isRolloutOpen(entry: RolloutEntry, viewer: RolloutViewer): boolean {
  if (entry.mode === "everyone") return true;
  if (viewer.isAdmin || viewer.preview) return true;
  if (entry.mode === "emails" && viewer.email) {
    const email = normalizeEmail(viewer.email);
    return email !== null && entry.emails.includes(email);
  }
  return false;
}

/** The percentage of first-time visitors a visitor-aimed feature is given to: 0 unless it is open to everyone. */
export function visitorShare(entry: RolloutEntry): number {
  return entry.mode === "everyone" ? entry.percent : 0;
}

export function evaluateRollouts(
  config: RolloutConfig,
  viewer: RolloutViewer,
): Record<RolloutId, boolean> {
  const result = {} as Record<RolloutId, boolean>;
  for (const id of ROLLOUT_IDS) result[id] = isRolloutOpen(config[id], viewer);
  return result;
}

/** Everything closed — what a visitor gets when the settings can't be read. */
export function closedRollouts(): Record<RolloutId, boolean> {
  const result = {} as Record<RolloutId, boolean>;
  for (const id of ROLLOUT_IDS) result[id] = false;
  return result;
}
