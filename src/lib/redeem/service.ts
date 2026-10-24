import type { Database } from "@/types/database";

import { planBatch } from "./batch";
import type { AgentForBatch, BatchItem } from "./batch";
import { formatCode, normalizeCode } from "./code";
import type { NormalizedCode } from "./code";
import { MIN_PEPPER_LENGTH, generateCodes, hashAddress, hashCode } from "./generate";

/**
 * What typing a code, and issuing a batch, do: the steps around the database functions (the rules of
 * those are in redemption.ts / batch.ts and in 20250349000000_redeem_codes.sql). The database is
 * reached through `RedeemCalls`, so every branch here is tested against a fake; the real calls are in
 * store.ts. Server only.
 */

type Fn = Database["public"]["Functions"];
export type RedeemRpcResult = Fn["redeem_code"]["Returns"];
export type CreateBatchArgs = Fn["create_redeem_batch"]["Args"];
export type CreateBatchRpcResult = Fn["create_redeem_batch"]["Returns"];

export interface RedeemCalls {
  redeemCode(args: {
    userId: string;
    codeHash: string;
    country: string | null;
    ipHash: string | null;
  }): Promise<RedeemRpcResult>;
  createBatch(args: CreateBatchArgs): Promise<CreateBatchRpcResult>;
}

export type RedeemOutcome =
  | { status: "redeemed"; days: number; premiumUntil: string; extendedExisting: boolean }
  /** The same learner typed a code they already used: nothing more is added. */
  | { status: "already_yours"; premiumUntil: string | null }
  /** The account has Premium with no end date; the code was left unused. */
  | { status: "unlimited" }
  /** Not a code (wrong letters, length or check symbol): no attempt was counted. */
  | { status: "bad_format"; reason: Exclude<NormalizedCode, { ok: true }>["reason"] }
  | { status: "unknown" }
  | { status: "used" }
  | { status: "voided" }
  | { status: "expired" }
  | { status: "throttled"; retryAfterSeconds: number }
  /** Not set up (no secret, tables not applied), the account is gone, or the database failed. */
  | { status: "unavailable" };

function validPepper(pepper: string | undefined): pepper is string {
  return typeof pepper === "string" && pepper.length >= MIN_PEPPER_LENGTH;
}

/**
 * Types a code for a signed-in learner. `userId` must be the session's, never a value the browser
 * sent. The address is hashed before it goes anywhere; the code never is stored or logged.
 */
export async function redeemForLearner(
  input: { userId: string; rawCode: string; country: string | null; address: string },
  deps: { pepper: string | undefined; calls: RedeemCalls; onError?: (error: unknown) => void },
): Promise<RedeemOutcome> {
  const normalized = normalizeCode(input.rawCode);
  if (!normalized.ok) return { status: "bad_format", reason: normalized.reason };
  if (!validPepper(deps.pepper)) return { status: "unavailable" };

  try {
    const result = await deps.calls.redeemCode({
      userId: input.userId,
      codeHash: hashCode(normalized.code, deps.pepper),
      country: input.country,
      ipHash: hashAddress(input.address, deps.pepper),
    });
    switch (result.result) {
      case "redeemed":
        return result.premium_period_end
          ? {
              status: "redeemed",
              days: result.days ?? 0,
              premiumUntil: result.premium_period_end,
              extendedExisting: result.extended_existing === true,
            }
          : { status: "unavailable" };
      case "used_by_you":
        return { status: "already_yours", premiumUntil: result.premium_period_end ?? null };
      case "unlimited":
        return { status: "unlimited" };
      case "unknown":
      case "used":
      case "voided":
      case "expired":
        return { status: result.result };
      case "throttled":
        return { status: "throttled", retryAfterSeconds: result.retry_after_seconds ?? 60 };
      case "user_not_found":
      case "bad_request":
      default:
        return { status: "unavailable" };
    }
  } catch (error) {
    deps.onError?.(error);
    return { status: "unavailable" };
  }
}

export interface IssuedCode {
  serial: number;
  planId: BatchItem["planId"];
  days: number;
  /** The code in its shown form. The only time it exists in plain text. */
  code: string;
}

export type IssueBatchResult =
  | {
      ok: true;
      batchId: string;
      batchNumber: number;
      totalCodes: number;
      totalCents: number;
      excessCents: number;
      validUntil: string;
      codes: IssuedCode[];
    }
  | { ok: false; error: string };

const BATCH_ERRORS: Record<string, string> = {
  agent_not_found: "That agent no longer exists.",
  agent_not_active: "Only an active agent can buy codes. Finish the vetting first.",
  first_batch_too_big: "A first order is at most 5 codes.",
  too_many_outstanding: "That would put more unsold codes in this agent's hands than allowed.",
  underpaid: "The agent pays first: what was received must cover the whole price.",
  bad_validity: "Codes stay valid for 30 to 365 days.",
  bad_size: "A batch holds 1 to 200 codes.",
  bad_request: "The batch could not be built.",
};

/**
 * Issues a batch: checks the dealing rules, draws the codes, hands only their hashes to the database
 * (which checks the rules again under a lock) and, once it says "created", returns the codes in plain
 * text, for the admin to copy once. A failure returns no code at all.
 */
export async function issueBatch(
  input: {
    agentId: string;
    agent: AgentForBatch;
    items: readonly BatchItem[];
    receivedCents: number;
    validDays: number;
    paymentMethod: string;
    paymentReference: string;
    note: string;
    createdBy: string | null;
  },
  deps: {
    pepper: string | undefined;
    calls: RedeemCalls;
    now: Date;
    onError?: (error: unknown) => void;
    /** Only for tests: how the codes are drawn. */
    draw?: (max: number) => number;
  },
): Promise<IssueBatchResult> {
  if (!validPepper(deps.pepper)) {
    return {
      ok: false,
      error: "REDEEM_CODE_PEPPER is not set on the server (32 characters at least).",
    };
  }
  const paymentMethod = input.paymentMethod.trim();
  if (paymentMethod === "" || paymentMethod.length > 80) {
    return { ok: false, error: "Write how the agent paid (for example USDT, Binance Pay)." };
  }
  const plan = planBatch(input.agent, input, deps.now);
  if (!plan.ok) return { ok: false, error: plan.error };

  const plain = generateCodes(plan.totalCodes, deps.draw);
  const codes: IssuedCode[] = [];
  const rows: CreateBatchArgs["p_codes"] = [];
  let serial = 0;
  for (const line of plan.lines) {
    for (let index = 0; index < line.quantity; index += 1) {
      const code = plain[serial]!;
      serial += 1;
      codes.push({ serial, planId: line.planId, days: line.days, code: formatCode(code) });
      rows.push({
        serial,
        code_hash: hashCode(code, deps.pepper),
        plan_id: line.planId,
        days: line.days,
        wholesale_cents: line.wholesaleCentsEach,
      });
    }
  }

  try {
    const result = await deps.calls.createBatch({
      p_agent_id: input.agentId,
      p_valid_until: plan.validUntil,
      p_received_cents: input.receivedCents,
      p_payment_method: paymentMethod,
      p_payment_reference: input.paymentReference.trim().slice(0, 200),
      p_note: input.note.trim().slice(0, 2000),
      p_created_by: input.createdBy,
      p_codes: rows,
    });
    if (result.result !== "created" || !result.batch_id || result.batch_number === undefined) {
      return {
        ok: false,
        error: BATCH_ERRORS[result.result] ?? "The batch could not be saved. Nothing was issued.",
      };
    }
    return {
      ok: true,
      batchId: result.batch_id,
      batchNumber: result.batch_number,
      totalCodes: plan.totalCodes,
      totalCents: plan.totalCents,
      excessCents: plan.excessCents,
      validUntil: plan.validUntil,
      codes,
    };
  } catch (error) {
    deps.onError?.(error);
    return { ok: false, error: "The batch could not be saved. Nothing was issued." };
  }
}
