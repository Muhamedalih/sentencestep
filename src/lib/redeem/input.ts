import { PLAN_IDS } from "@/lib/billing/plans";
import type { PlanId } from "@/lib/billing/plans";

import type { BatchItem } from "./batch";
import { DEFAULT_VALID_DAYS } from "./constants";

/**
 * What an admin form sends to "issue a batch", checked before anything is looked up. A server action
 * receives whatever a browser posts, so nothing here trusts a type: numbers must be numbers, text is
 * trimmed and bounded. The business rules (price sanity, the agent's limits) are planBatch's.
 */

export interface BatchInput {
  agentId: string;
  items: BatchItem[];
  receivedCents: number;
  validDays: number;
  paymentMethod: string;
  paymentReference: string;
  note: string;
}

export type ParsedBatchInput = { ok: true; value: BatchInput } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function parseBatchInput(raw: unknown): ParsedBatchInput {
  if (!isRecord(raw)) return { ok: false, error: "The form was not understood." };
  const agentId = typeof raw.agentId === "string" ? raw.agentId.trim() : "";
  if (!UUID.test(agentId)) return { ok: false, error: "Choose an agent." };

  if (!Array.isArray(raw.items) || raw.items.length === 0 || raw.items.length > PLAN_IDS.length) {
    return { ok: false, error: "Add at least one plan." };
  }
  const items: BatchItem[] = [];
  for (const entry of raw.items) {
    if (!isRecord(entry)) return { ok: false, error: "A plan line was not understood." };
    const planId = entry.planId;
    if (typeof planId !== "string" || !PLAN_IDS.includes(planId as PlanId)) {
      return { ok: false, error: "Unknown plan." };
    }
    const { quantity, wholesaleCentsEach } = entry;
    if (typeof quantity !== "number" || typeof wholesaleCentsEach !== "number") {
      return { ok: false, error: "Quantities and prices are numbers." };
    }
    items.push({ planId: planId as PlanId, quantity, wholesaleCentsEach });
  }

  const { receivedCents } = raw;
  if (typeof receivedCents !== "number") {
    return { ok: false, error: "Write how much was received, in cents." };
  }
  const validDays = raw.validDays === undefined ? DEFAULT_VALID_DAYS : raw.validDays;
  if (typeof validDays !== "number") return { ok: false, error: "Validity is a number of days." };

  return {
    ok: true,
    value: {
      agentId,
      items,
      receivedCents,
      validDays,
      paymentMethod: text(raw.paymentMethod, 80),
      paymentReference: text(raw.paymentReference, 200),
      note: text(raw.note, 2000),
    },
  };
}

export interface AgentInput {
  name: string;
  contact: string;
  /** Two lowercase letters, or null. */
  country: string | null;
  note: string;
}

export type ParsedAgentInput = { ok: true; value: AgentInput } | { ok: false; error: string };

function countryCode(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return undefined;
  const code = value.trim().toLowerCase();
  return /^[a-z]{2}$/.test(code) ? code : undefined;
}

/** A new agent: a name is required; everything else is optional. */
export function parseAgentInput(raw: unknown): ParsedAgentInput {
  if (!isRecord(raw)) return { ok: false, error: "The form was not understood." };
  const name = text(raw.name, 80);
  if (name === "") return { ok: false, error: "Write the agent's name." };
  const country = countryCode(raw.country);
  if (country === undefined) return { ok: false, error: "A country is two letters, like eg." };
  return {
    ok: true,
    value: { name, contact: text(raw.contact, 200), country, note: text(raw.note, 2000) },
  };
}

export const AGENT_STATUSES = ["candidate", "active", "paused", "ended"] as const;
export type AgentStatus = (typeof AGENT_STATUSES)[number];

export interface AgentUpdate {
  status?: AgentStatus;
  /** Most unsold codes the agent may hold, 0 to 1000. */
  maxOutstanding?: number;
  note?: string;
  contact?: string;
}

export type ParsedAgentUpdate = { ok: true; value: AgentUpdate } | { ok: false; error: string };

/** The few things an admin changes on an existing agent; at least one must be present. */
export function parseAgentUpdate(raw: unknown): ParsedAgentUpdate {
  if (!isRecord(raw)) return { ok: false, error: "The form was not understood." };
  const value: AgentUpdate = {};
  if (raw.status !== undefined) {
    if (typeof raw.status !== "string" || !AGENT_STATUSES.includes(raw.status as AgentStatus)) {
      return { ok: false, error: "Unknown status." };
    }
    value.status = raw.status as AgentStatus;
  }
  if (raw.maxOutstanding !== undefined) {
    const max = raw.maxOutstanding;
    if (typeof max !== "number" || !Number.isInteger(max) || max < 0 || max > 1000) {
      return { ok: false, error: "The limit is a whole number from 0 to 1000." };
    }
    value.maxOutstanding = max;
  }
  if (raw.note !== undefined) value.note = text(raw.note, 2000);
  if (raw.contact !== undefined) value.contact = text(raw.contact, 200);
  if (Object.keys(value).length === 0) return { ok: false, error: "Nothing to change." };
  return { ok: true, value };
}
