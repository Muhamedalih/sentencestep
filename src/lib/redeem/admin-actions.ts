"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/service-role";

import { normalizeCode } from "./code";
import { hashCode } from "./generate";
import { parseAgentInput, parseAgentUpdate, parseBatchInput } from "./input";
import { displayStatus } from "./redemption";
import type { CodeDisplayStatus } from "./redemption";
import { issueBatch } from "./service";
import type { IssueBatchResult } from "./service";
import { createRedeemCalls, loadAgentForBatch } from "./store";

/**
 * Everything an admin does with agents and codes. Each action checks the admin first, validates what
 * the browser sent (input.ts), and writes through the service role; the dealing rules are checked in
 * code (planBatch) and again by the database function under a lock. The audit log records who did
 * what and the batch's numbers, never a code. Not wired to any page yet.
 */

const NOT_SET_UP =
  "Codes are not set up yet: the migration 20250349000000 has not been applied, or the service role is missing.";

function isMissingRelation(error: { code?: string; message?: string } | null): boolean {
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    error?.code === "PGRST202" ||
    /does not exist|schema cache/i.test(error?.message ?? "")
  );
}

export async function createAgentAction(input: unknown): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };
  if (!isServiceRoleConfigured()) return { error: NOT_SET_UP };

  const parsed = parseAgentInput(input);
  if (!parsed.ok) return { error: parsed.error };

  const { data, error } = await createServiceRoleClient()
    .from("redeem_agents")
    .insert({
      name: parsed.value.name,
      contact: parsed.value.contact,
      country: parsed.value.country,
      note: parsed.value.note,
    })
    .select("id")
    .single();
  if (error) return { error: isMissingRelation(error) ? NOT_SET_UP : "Couldn't save the agent." };

  void logAdminAction("redeem.agent_created", "redeem_agent", data.id, {
    name: parsed.value.name,
    country: parsed.value.country,
  });
  revalidatePath("/admin/agents");
  return { success: `${parsed.value.name} was added as a candidate.`, id: data.id };
}

export async function updateAgentAction(agentId: string, input: unknown): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };
  if (!isServiceRoleConfigured()) return { error: NOT_SET_UP };
  if (typeof agentId !== "string" || agentId.length === 0) return { error: "Choose an agent." };

  const parsed = parseAgentUpdate(input);
  if (!parsed.ok) return { error: parsed.error };

  const { value } = parsed;
  const { data, error } = await createServiceRoleClient()
    .from("redeem_agents")
    .update({
      ...(value.status !== undefined && { status: value.status }),
      ...(value.maxOutstanding !== undefined && { max_outstanding: value.maxOutstanding }),
      ...(value.note !== undefined && { note: value.note }),
      ...(value.contact !== undefined && { contact: value.contact }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", agentId)
    .select("id");
  if (error) return { error: isMissingRelation(error) ? NOT_SET_UP : "Couldn't save that." };
  if (!data?.length) return { error: "That agent no longer exists." };

  void logAdminAction("redeem.agent_updated", "redeem_agent", agentId, {
    status: value.status ?? null,
    maxOutstanding: value.maxOutstanding ?? null,
  });
  revalidatePath("/admin/agents");
  return { success: "Saved." };
}

/**
 * Issues a batch for an agent who has already paid. On success the codes come back in this one answer
 * and are shown once; nothing keeps them. A failure returns no code.
 */
export async function issueBatchAction(input: unknown): Promise<IssueBatchResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { ok: false, error: forbidden };
  if (!isServiceRoleConfigured()) return { ok: false, error: NOT_SET_UP };

  const parsed = parseBatchInput(input);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const { value } = parsed;

  const now = new Date();
  let agent;
  try {
    agent = await loadAgentForBatch(value.agentId, now);
  } catch (error) {
    console.error("[redeem] could not read the agent", error);
    return { ok: false, error: NOT_SET_UP };
  }
  if (!agent) return { ok: false, error: "That agent no longer exists." };

  const user = await getCurrentUser();
  const result = await issueBatch(
    { ...value, agent, createdBy: user?.id ?? null },
    {
      pepper: process.env.REDEEM_CODE_PEPPER,
      calls: createRedeemCalls(),
      now,
      onError: (error) => console.error("[redeem] issuing a batch failed", error),
    },
  );

  if (result.ok) {
    void logAdminAction("redeem.batch_issued", "redeem_batch", result.batchId, {
      batchNumber: result.batchNumber,
      agentId: value.agentId,
      totalCodes: result.totalCodes,
      totalCents: result.totalCents,
      receivedCents: value.receivedCents,
      paymentMethod: value.paymentMethod,
    });
    revalidatePath("/admin/agents");
  }
  return result;
}

/** Voids a batch: its unredeemed codes stop working at once; redeemed ones stay redeemed. */
export async function voidBatchAction(batchId: string, reason: string): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };
  if (!isServiceRoleConfigured()) return { error: NOT_SET_UP };
  if (typeof batchId !== "string" || batchId.length === 0) return { error: "Choose a batch." };
  const why = typeof reason === "string" ? reason.trim().slice(0, 500) : "";
  if (why === "") return { error: "Write why the batch is being voided." };

  const { data, error } = await createServiceRoleClient()
    .from("redeem_batches")
    .update({ status: "voided", voided_at: new Date().toISOString(), void_reason: why })
    .eq("id", batchId)
    .eq("status", "active")
    .select("id, batch_number");
  if (error) return { error: isMissingRelation(error) ? NOT_SET_UP : "Couldn't void the batch." };
  if (!data?.length) return { error: "That batch is already voided, or does not exist." };

  void logAdminAction("redeem.batch_voided", "redeem_batch", batchId, {
    batchNumber: data[0]!.batch_number,
    reason: why,
  });
  revalidatePath("/admin/agents");
  return { success: `Batch ${data[0]!.batch_number} is voided.` };
}

export type CodeLookup =
  | { found: false; error?: string }
  | {
      found: true;
      status: CodeDisplayStatus;
      serial: number;
      batchNumber: number;
      agentName: string;
      planId: string;
      days: number;
      validUntil: string;
      redeemedAt: string | null;
      redeemedCountry: string | null;
      redeemedByEmail: string | null;
      premiumUntil: string | null;
    };

/** "Is this code good, and who has it?" for a dispute: paste the code, see where it stands. Admin only. */
export async function lookupCodeAction(rawCode: string): Promise<CodeLookup> {
  const forbidden = await requireAdmin();
  if (forbidden) return { found: false, error: forbidden };
  if (!isServiceRoleConfigured()) return { found: false, error: NOT_SET_UP };

  const normalized = normalizeCode(typeof rawCode === "string" ? rawCode.slice(0, 200) : "");
  if (!normalized.ok) return { found: false, error: "That is not a code (check the letters)." };
  const pepper = process.env.REDEEM_CODE_PEPPER;
  if (!pepper || pepper.length < 32) {
    return { found: false, error: "REDEEM_CODE_PEPPER is not set on the server." };
  }

  const supabase = createServiceRoleClient();
  const { data: code, error } = await supabase
    .from("redeem_codes")
    .select("*")
    .eq("code_hash", hashCode(normalized.code, pepper))
    .maybeSingle();
  if (error)
    return { found: false, error: isMissingRelation(error) ? NOT_SET_UP : "Couldn't look." };
  if (!code) return { found: false };

  const { data: batch } = await supabase
    .from("redeem_batches")
    .select("batch_number, agent_id, status, valid_until")
    .eq("id", code.batch_id)
    .maybeSingle();
  const { data: agent } = batch
    ? await supabase.from("redeem_agents").select("name").eq("id", batch.agent_id).maybeSingle()
    : { data: null };
  let redeemedByEmail: string | null = null;
  if (code.redeemed_by) {
    const { data } = await supabase.auth.admin.getUserById(code.redeemed_by);
    redeemedByEmail = data.user?.email ?? null;
  }

  return {
    found: true,
    status: displayStatus(
      {
        status: code.status,
        batchStatus: batch?.status ?? "active",
        validUntil: batch?.valid_until ?? new Date(0).toISOString(),
      },
      new Date(),
    ),
    serial: code.serial,
    batchNumber: batch?.batch_number ?? 0,
    agentName: agent?.name ?? "?",
    planId: code.plan_id,
    days: code.days,
    validUntil: batch?.valid_until ?? "",
    redeemedAt: code.redeemed_at,
    redeemedCountry: code.redeemed_country,
    redeemedByEmail,
    premiumUntil: code.premium_period_end,
  };
}
