import { createServiceRoleClient } from "@/lib/supabase/service-role";

import type { AgentForBatch } from "./batch";
import type { RedeemCalls } from "./service";

/**
 * The database side of redeem codes: the two functions of 20250349000000_redeem_codes.sql, called with
 * the service role (the tables and functions are closed to everyone else), and the one read the
 * dealing rules need. Server only. Until the migration is applied every call fails with "does not
 * exist", which the service turns into "unavailable".
 */
export function createRedeemCalls(): RedeemCalls {
  const supabase = createServiceRoleClient();
  return {
    async redeemCode({ userId, codeHash, country, ipHash }) {
      const { data, error } = await supabase.rpc("redeem_code", {
        p_user_id: userId,
        p_code_hash: codeHash,
        p_country: country,
        p_ip_hash: ipHash,
      });
      if (error) throw error;
      return data;
    },
    async createBatch(args) {
      const { data, error } = await supabase.rpc("create_redeem_batch", args);
      if (error) throw error;
      return data;
    },
  };
}

/** What the dealing rules need to know about one agent, or null when there is no such agent. */
export async function loadAgentForBatch(agentId: string, now: Date): Promise<AgentForBatch | null> {
  const supabase = createServiceRoleClient();
  const { data: agent, error } = await supabase
    .from("redeem_agents")
    .select("status, max_outstanding")
    .eq("id", agentId)
    .maybeSingle();
  if (error) throw error;
  if (!agent) return null;

  const { data: batches, error: batchError } = await supabase
    .from("redeem_batches")
    .select("id, status, valid_until")
    .eq("agent_id", agentId);
  if (batchError) throw batchError;

  const live = (batches ?? [])
    .filter((batch) => batch.status === "active" && Date.parse(batch.valid_until) > now.getTime())
    .map((batch) => batch.id);
  let outstanding = 0;
  if (live.length > 0) {
    const { count, error: countError } = await supabase
      .from("redeem_codes")
      .select("id", { count: "exact", head: true })
      .in("batch_id", live)
      .eq("status", "unused");
    if (countError) throw countError;
    outstanding = count ?? 0;
  }

  return {
    status: agent.status,
    maxOutstanding: agent.max_outstanding,
    outstanding,
    batchesBought: (batches ?? []).length,
  };
}
